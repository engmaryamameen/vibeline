import { env } from '@/config/env';
import type { ModelGateway,ModelGeneration,ModelProviderDescriptor } from './model.gateway';

export class OpenAiModelGateway implements ModelGateway{
  describe():ModelProviderDescriptor{
    return {provider:env.OPENAI_RESPONSES_URL?new URL(env.OPENAI_RESPONSES_URL).hostname:'openai',model:env.OPENAI_MODEL??'unconfigured'};
  }
  async generate(input:Parameters<ModelGateway['generate']>[0]):Promise<ModelGeneration>{
    if(!env.OPENAI_API_KEY||!env.OPENAI_MODEL||!env.OPENAI_RESPONSES_URL)throw new Error('OPENAI_PROVIDER_NOT_CONFIGURED');
    const response=await fetch(env.OPENAI_RESPONSES_URL,{method:'POST',headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL,input:input.messages.map(message=>({role:message.role,content:message.content}))}),signal:input.signal});
    if(!response.ok)throw new Error(`MODEL_PROVIDER_HTTP_${response.status}`);
    let data:{model?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>;usage?:{input_tokens?:number;output_tokens?:number;total_tokens?:number}};
    try{data=await response.json() as typeof data;}catch{throw new Error('MODEL_PROVIDER_INVALID_RESPONSE');}
    const text=data.output?.flatMap(item=>item.content??[]).filter(item=>item.type==='output_text').map(item=>item.text??'').join('').trim();
    if(!text)throw new Error('MODEL_PROVIDER_INVALID_RESPONSE');
    return {text,provider:new URL(env.OPENAI_RESPONSES_URL).hostname,model:data.model??env.OPENAI_MODEL,inputTokens:data.usage?.input_tokens,outputTokens:data.usage?.output_tokens,totalTokens:data.usage?.total_tokens};
  }
}
