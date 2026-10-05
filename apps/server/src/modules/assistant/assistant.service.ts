import type { FastifyBaseLogger } from 'fastify';
import { AppError } from '@/common/errors/app-error';
import { chatService } from '@/modules/chat/chat.service';
import { assistantRepository,type GenerationFailureCode } from './assistant.repository';
import { OpenAiModelGateway } from './openai-model.gateway';
import type { ModelGateway,ModelContextMessage,ModelProviderDescriptor } from './model.gateway';
import { assistantSystemInstruction } from './assistant.prompt';

const classifyProviderFailure=(error:unknown):GenerationFailureCode=>{
  if(error instanceof Error&&error.name==='AbortError')return 'PROVIDER_TIMEOUT';
  if(!(error instanceof Error))return 'INTERNAL_FAILURE';
  if(error.message==='OPENAI_PROVIDER_NOT_CONFIGURED')return 'PROVIDER_UNAVAILABLE';
  if(error.message==='MODEL_PROVIDER_INVALID_RESPONSE'||error.message==='MODEL_PROVIDER_EMPTY_RESPONSE')return 'INVALID_PROVIDER_RESPONSE';
  if(error.message==='MODEL_PROVIDER_HTTP_429')return 'PROVIDER_RATE_LIMIT';
  if(/^MODEL_PROVIDER_HTTP_5\d\d$/.test(error.message))return 'PROVIDER_SERVER_FAILURE';
  return 'INTERNAL_FAILURE';
};

class AssistantService{
  private logger?:FastifyBaseLogger;
  private providerTimeoutMs=30_000;
  constructor(private gateway:ModelGateway=new OpenAiModelGateway()){}
  setLogger(logger:FastifyBaseLogger){this.logger=logger;}
  setGatewayForTests(gateway:ModelGateway,timeoutMs=30_000){this.gateway=gateway;this.providerTimeoutMs=timeoutMs;}
  async getState(userId:string,conversationId:string){
    const state=await assistantRepository.getState(conversationId,userId);
    if(!state)throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    return state;
  }
  async enable(userId:string,conversationId:string,displayName:string){
    const result=await assistantRepository.enableAssistant(conversationId,userId,displayName);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='direct')throw new AppError(400,'DIRECT_CONVERSATION_IMMUTABLE','Assistants can only be enabled for group conversations');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only conversation owners or admins can enable the assistant');
    return result.assistant;
  }
  async requestResponse(userId:string,conversationId:string,clientRequestId:string){
    const started=Date.now();
    let descriptor:ModelProviderDescriptor;
    try{descriptor=this.gateway.describe();}catch{descriptor={provider:'unknown',model:'unknown'};}
    const result=await assistantRepository.claimGeneration(conversationId,userId,clientRequestId,descriptor);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='not-configured')throw new AppError(409,'ASSISTANT_NOT_CONFIGURED','Assistant is not enabled for this conversation');
    if(result.kind==='existing'){
      if(result.generation.status==='completed'&&result.generation.finalMessageId){const message=await assistantRepository.getFinalMessage(result.generation.finalMessageId);return {generation:result.generation,message,duplicate:true};}
      return {generation:result.generation,duplicate:true};
    }

    const prepared=await assistantRepository.prepareProviderInvocation(conversationId,result.generation.id,result.ownerToken);
    if(prepared.kind!=='authorized'){
      const failure:GenerationFailureCode=prepared.kind==='conversation-unavailable'?'CONVERSATION_UNAVAILABLE':prepared.kind==='authorization-revoked'?'AUTHORIZATION_REVOKED':'GENERATION_OWNERSHIP_LOST';
      await assistantRepository.failOwned(result.generation.id,result.ownerToken,failure,Date.now()-started,descriptor);
      throw new AppError(failure==='CONVERSATION_UNAVAILABLE'?404:409,failure==='CONVERSATION_UNAVAILABLE'?'CONVERSATION_NOT_FOUND':'ASSISTANT_GENERATION_FAILED',failure==='CONVERSATION_UNAVAILABLE'?'Conversation not found':'Assistant response is no longer valid for this conversation');
    }
    const messages:ModelContextMessage[]=[{role:'developer',content:assistantSystemInstruction},...prepared.context.map(message=>({role:message.assistantId?'assistant' as const:'user' as const,content:message.body}))];
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),this.providerTimeoutMs);
    let generated;
    try{
      generated=await this.gateway.generate({messages,signal:controller.signal});
    }catch(error){
      const failure=classifyProviderFailure(error);
      await assistantRepository.failOwned(result.generation.id,result.ownerToken,failure,Date.now()-started,descriptor);
      this.logger?.error({errorCode:failure,operation:'assistant.generate',conversationId,generationId:result.generation.id},'assistant generation failed');
      const unavailable=failure==='PROVIDER_UNAVAILABLE';
      throw new AppError(unavailable?503:502,unavailable?'ASSISTANT_UNAVAILABLE':'ASSISTANT_GENERATION_FAILED',unavailable?'Assistant provider is not configured':'Assistant response could not be generated');
    }finally{clearTimeout(timeout);}

    let finalized;
    try{finalized=await assistantRepository.completeGeneration(conversationId,result.generation.id,result.ownerToken,generated.text,{...generated,latencyMs:Date.now()-started});}
    catch{
      await assistantRepository.failOwned(result.generation.id,result.ownerToken,'FINALIZATION_FAILURE',Date.now()-started,{provider:generated.provider,model:generated.model});
      this.logger?.error({errorCode:'FINALIZATION_FAILURE',operation:'assistant.finalize',conversationId,generationId:result.generation.id},'assistant finalization failed');
      throw new AppError(502,'ASSISTANT_GENERATION_FAILED','Assistant response could not be saved');
    }
    if(finalized.kind!=='completed'){
      const failure:GenerationFailureCode=finalized.kind==='authorization-revoked'?'AUTHORIZATION_REVOKED':finalized.kind==='conversation-unavailable'?'CONVERSATION_UNAVAILABLE':'GENERATION_OWNERSHIP_LOST';
      if(failure==='GENERATION_OWNERSHIP_LOST')await assistantRepository.failOwned(result.generation.id,result.ownerToken,failure,Date.now()-started,{provider:generated.provider,model:generated.model});
      this.logger?.warn({errorCode:failure,operation:'assistant.finalize',conversationId,generationId:result.generation.id},'assistant result was not finalized');
      throw new AppError(failure==='CONVERSATION_UNAVAILABLE'?404:409,failure==='CONVERSATION_UNAVAILABLE'?'CONVERSATION_NOT_FOUND':'ASSISTANT_GENERATION_FAILED',failure==='CONVERSATION_UNAVAILABLE'?'Conversation not found':'Assistant response is no longer valid for this conversation');
    }
    await chatService.publishPersistedMessage(conversationId,finalized.message);
    return {generation:{...result.generation,status:'completed' as const,finalMessageId:finalized.message.id,completedAt:new Date().toISOString()},message:finalized.message,duplicate:false};
  }
}
export const assistantService=new AssistantService();
