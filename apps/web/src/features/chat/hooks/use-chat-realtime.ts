'use client';
import { useEffect } from 'react';
import { messageChatEventSchema } from '@vibeline/contracts';
import type { ChatEvent,Message } from '@vibeline/contracts';
import { env } from '@/src/lib/env';
import { useAuthStore } from '@/src/store/auth.store';
import { apiClient } from '@/src/lib/api-client';
import type { AuthSessionResponse } from '@vibeline/contracts';

type MessageEvent=ChatEvent & {payload:Message};
export function useChatRealtime(selectedId:string|null,onMessage:(event:MessageEvent)=>void,onConnected:()=>void){
  const token=useAuthStore(s=>s.token);
  useEffect(()=>{if(!token)return;const controller=new AbortController();let retry:number|undefined;
    const connect=async()=>{while(!controller.signal.aborted){try{let accessToken=useAuthStore.getState().token;if(!accessToken)return;let response=await fetch(`${env.apiBaseUrl}/chat/events`,{headers:{authorization:`Bearer ${accessToken}`},credentials:'include',signal:controller.signal});if(response.status===401){const refreshed=await apiClient<AuthSessionResponse>('/auth/refresh',{method:'POST'});useAuthStore.getState().setSession({token:refreshed.tokens.accessToken,currentUser:refreshed.user});accessToken=refreshed.tokens.accessToken;response=await fetch(`${env.apiBaseUrl}/chat/events`,{headers:{authorization:`Bearer ${accessToken}`},credentials:'include',signal:controller.signal});}if(!response.ok||!response.body)throw new Error('Realtime connection failed');const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';while(!controller.signal.aborted){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let boundary=-1;while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);const eventName=frame.split('\n').find(line=>line.startsWith('event: '))?.slice(7);const data=frame.split('\n').find(line=>line.startsWith('data: '))?.slice(6);if(eventName==='connected'){onConnected();continue;}if(!data)continue;const parsed=messageChatEventSchema.safeParse(JSON.parse(data));if(parsed.success&&parsed.data.conversationId===selectedId)onMessage(parsed.data);}}}catch{if(controller.signal.aborted)return;}await new Promise<void>(resolve=>{retry=window.setTimeout(resolve,1000);});}};void connect();return()=>{controller.abort();if(retry)window.clearTimeout(retry);};
  },[token,selectedId,onMessage,onConnected]);
}
