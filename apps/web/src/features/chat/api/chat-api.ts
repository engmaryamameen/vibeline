import { conversationDetailResponseSchema,conversationResponseSchema,conversationsResponseSchema,messageResponseSchema,messagesResponseSchema,userSearchResponseSchema } from '@vibeline/contracts';
import type { ConversationSummary,Message,UserSearchResult } from '@vibeline/contracts';
export type AuthorizedRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PATCH'|'DELETE';body?:unknown;responseSchema?:{parse:(value:unknown)=>T}})=>Promise<T>;
export const chatApi=(request:AuthorizedRequest)=>({
 listConversations:()=>request('/chat/conversations',{responseSchema:conversationsResponseSchema}),
 getConversation:(id:string)=>request(`/chat/conversations/${id}`,{responseSchema:conversationDetailResponseSchema}),
 listMessages:(id:string,params:{before?:number;after?:number;limit?:number}={})=>{const q=new URLSearchParams();if(params.before!==undefined)q.set('beforeSequence',String(params.before));if(params.after!==undefined)q.set('afterSequence',String(params.after));q.set('limit',String(params.limit??50));return request(`/chat/conversations/${id}/messages?${q}`,{responseSchema:messagesResponseSchema});},
 sendMessage:(id:string,body:string,clientMessageId=crypto.randomUUID())=>request(`/chat/conversations/${id}/messages`,{method:'POST',body:{clientMessageId,body},responseSchema:messageResponseSchema}),
 editMessage:(id:string,messageId:string,body:string)=>request(`/chat/conversations/${id}/messages/${messageId}`,{method:'PATCH',body:{body},responseSchema:messageResponseSchema}),
 deleteMessage:(id:string,messageId:string)=>request(`/chat/conversations/${id}/messages/${messageId}`,{method:'DELETE',responseSchema:messageResponseSchema}),
 createConversation:(participantUserIds:string[],type:'direct'|'group',title?:string)=>request(`/chat/conversations`,{method:'POST',body:{participantUserIds,type,...(title?{title}:{})},responseSchema:conversationResponseSchema}),
 updateConversation:(id:string,title:string)=>request(`/chat/conversations/${id}`,{method:'PATCH',body:{title},responseSchema:conversationResponseSchema}),
 addMember:(id:string,userId:string)=>request(`/chat/conversations/${id}/members`,{method:'POST',body:{userId},responseSchema:conversationDetailResponseSchema}),
 removeMember:(id:string,userId:string)=>request<void>(`/chat/conversations/${id}/members/${userId}`,{method:'DELETE'}),
 searchUsers:(q:string)=>request(`/users/search?q=${encodeURIComponent(q)}`,{responseSchema:userSearchResponseSchema})
});
export type {ConversationSummary,Message,UserSearchResult};
