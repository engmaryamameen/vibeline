import type { FastifyBaseLogger } from 'fastify';
import { AppError } from '@/common/errors/app-error';
import { chatService } from '@/modules/chat/chat.service';
import { assistantRepository } from './assistant.repository';
import { OpenAiModelGateway } from './openai-model.gateway';
import type { ModelGateway,ModelContextMessage } from './model.gateway';
import { assistantSystemInstruction } from './assistant.prompt';

class AssistantService{
  private logger?:FastifyBaseLogger;
  constructor(private gateway:ModelGateway=new OpenAiModelGateway()){}
  setLogger(logger:FastifyBaseLogger){this.logger=logger;}
  setGatewayForTests(gateway:ModelGateway){this.gateway=gateway;}
  async enable(userId:string,conversationId:string,displayName:string){
    const result=await assistantRepository.enableAssistant(conversationId,userId,displayName);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='direct')throw new AppError(400,'DIRECT_CONVERSATION_IMMUTABLE','Assistants can only be enabled for group conversations');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only conversation owners or admins can enable the assistant');
    return result.assistant;
  }
  async requestResponse(userId:string,conversationId:string,clientRequestId:string){
    const started=Date.now();
    const result=await assistantRepository.beginGeneration(conversationId,userId,clientRequestId);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='not-configured')throw new AppError(409,'ASSISTANT_NOT_CONFIGURED','Assistant is not enabled for this conversation');
    if(!result.created){
      if(result.generation.status==='completed'&&result.generation.finalMessageId){const message=await assistantRepository.getFinalMessage(result.generation.finalMessageId);return {generation:result.generation,message,duplicate:true};}
      return {generation:result.generation,duplicate:true};
    }
    const context=await assistantRepository.listContext(conversationId,Math.max(result.joinedSequence,result.assistant.joinedSequence));
    const messages:ModelContextMessage[]=[{role:'developer',content:assistantSystemInstruction},...context.map(message=>({role:message.assistantId?'assistant' as const:'user' as const,content:message.body}))];
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30_000);
    try{
      const generated=await this.gateway.generate({messages,signal:controller.signal});
      const message=await assistantRepository.completeGeneration(result.generation.id,generated.text,{...generated,latencyMs:Date.now()-started});
      if(!message)throw new Error('GENERATION_FINALIZATION_FAILED');
      await chatService.publishPersistedMessage(conversationId,message);
      return {generation:{...result.generation,status:'completed' as const,finalMessageId:message.id,completedAt:new Date().toISOString()},message,duplicate:false};
    }catch(error){
      const unavailable=error instanceof Error&&error.message==='OPENAI_PROVIDER_NOT_CONFIGURED';
      const code:'ASSISTANT_UNAVAILABLE'|'ASSISTANT_GENERATION_FAILED'=unavailable?'ASSISTANT_UNAVAILABLE':'ASSISTANT_GENERATION_FAILED';
      await assistantRepository.failGeneration(result.generation.id,code,Date.now()-started);
      this.logger?.error({error,operation:'assistant.generate',conversationId,generationId:result.generation.id},'assistant generation failed');
      throw new AppError(unavailable?503:502,code,unavailable?'Assistant provider is not configured':'Assistant response could not be generated');
    }finally{clearTimeout(timeout);}
  }
}
export const assistantService=new AssistantService();
