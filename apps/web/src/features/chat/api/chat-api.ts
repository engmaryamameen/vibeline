import { assistantEnableResponseSchema,assistantResponseResponseSchema,assistantStateResponseSchema,connectionRequestsResponseSchema,conversationDetailResponseSchema,conversationResponseSchema,conversationsResponseSchema,messageResponseSchema,messagesResponseSchema,userSearchResponseSchema } from '@vibeline/contracts';
import type { ConversationSummary,Message,MessageReaction,UserSearchResult } from '@vibeline/contracts';
export type AuthorizedRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;rawBody?:BodyInit;headers?:Record<string,string>;responseType?:'json'|'blob';responseSchema?:{parse:(value:unknown)=>T}})=>Promise<T>;
export const chatApi=(request:AuthorizedRequest)=>({
 listConversations:()=>request('/chat/conversations',{responseSchema:conversationsResponseSchema}),
 getConversation:(id:string)=>request(`/chat/conversations/${id}`,{responseSchema:conversationDetailResponseSchema}),
 listMessages:(id:string,params:{before?:number;after?:number;limit?:number}={})=>{const q=new URLSearchParams();if(params.before!==undefined)q.set('beforeSequence',String(params.before));if(params.after!==undefined)q.set('afterSequence',String(params.after));q.set('limit',String(params.limit??50));return request(`/chat/conversations/${id}/messages?${q}`,{responseSchema:messagesResponseSchema});},
 listReactions:(id:string)=>request<{reactions:MessageReaction[]}>(`/chat/conversations/${id}/reactions`),
 addReaction:(id:string,messageId:string,emoji:string)=>request(`/chat/conversations/${id}/messages/${messageId}/reactions`,{method:'PUT',body:{emoji}}),
 removeReaction:(id:string,messageId:string,emoji:string)=>request<void>(`/chat/conversations/${id}/messages/${messageId}/reactions`,{method:'DELETE',body:{emoji}}),
 getQuickEmoji:(id:string)=>request<{quickEmoji:string}>(`/chat/conversations/${id}/quick-emoji`),
 setQuickEmoji:(id:string,emoji:string)=>request<{quickEmoji:string}>(`/chat/conversations/${id}/quick-emoji`,{method:'PUT',body:{emoji}}),
 loadMedia:(url:string)=>request<Blob>(url,{responseType:'blob'}),
 uploadImage:(file:File)=>request<{asset:{id:string;url:string;mimeType:string;sizeBytes:number;originalFilename?:string}}>('/media/assets',{method:'POST',rawBody:file,headers:{'content-type':file.type||'application/octet-stream','x-file-name':encodeURIComponent(file.name)}}),
 sendMessage:(id:string,body:string,mediaAssetIds:string[]=[],clientMessageId=crypto.randomUUID())=>request(`/chat/conversations/${id}/messages`,{method:'POST',body:{clientMessageId,body,mediaAssetIds},responseSchema:messageResponseSchema}),
 editMessage:(id:string,messageId:string,body:string)=>request(`/chat/conversations/${id}/messages/${messageId}`,{method:'PATCH',body:{body},responseSchema:messageResponseSchema}),
 deleteMessage:(id:string,messageId:string,scope:'me'|'everyone')=>request(`/chat/conversations/${id}/messages/${messageId}?scope=${scope}`,{method:'DELETE',responseSchema:messageResponseSchema}),
 getAssistantState:(id:string)=>request(`/chat/conversations/${id}/assistant`,{responseSchema:assistantStateResponseSchema}),
 enableAssistant:(id:string,displayName='Assistant')=>request(`/chat/conversations/${id}/assistant`,{method:'POST',body:{displayName},responseSchema:assistantEnableResponseSchema}),
 requestAssistantResponse:(id:string,clientRequestId:string)=>request(`/chat/conversations/${id}/assistant/responses`,{method:'POST',body:{clientRequestId},responseSchema:assistantResponseResponseSchema}),
 createConversation:(participantUserIds:string[],type:'direct'|'group',title?:string)=>request(`/chat/conversations`,{method:'POST',body:{participantUserIds,type,...(title?{title}:{})},responseSchema:conversationResponseSchema}),
 updateConversation:(id:string,title:string)=>request(`/chat/conversations/${id}`,{method:'PATCH',body:{title},responseSchema:conversationResponseSchema}),
 addMember:(id:string,userId:string)=>request(`/chat/conversations/${id}/members`,{method:'POST',body:{userId},responseSchema:conversationDetailResponseSchema}),
 updateReceipt:(id:string,deliveredSequence:number,readSequence:number)=>request(`/chat/conversations/${id}/receipt`,{method:'POST',body:{deliveredSequence,readSequence}}),
 touchPresence:()=>request(`/chat/presence`,{method:'POST'}),
 removeMember:(id:string,userId:string)=>request<void>(`/chat/conversations/${id}/members/${userId}`,{method:'DELETE'}),
 searchUsers:(q:string)=>request(`/users/search?q=${encodeURIComponent(q)}`,{responseSchema:userSearchResponseSchema}),
 listConnectionRequests:()=>request('/users/connections/requests',{responseSchema:connectionRequestsResponseSchema}),
 requestConnection:(userId:string)=>request(`/users/connections/${userId}`,{method:'POST'}),
 acceptConnection:(requestId:string)=>request(`/users/connections/requests/${requestId}/accept`,{method:'POST'}),
 rejectConnection:(requestId:string)=>request(`/users/connections/requests/${requestId}/reject`,{method:'POST'})
});
export type {ConversationSummary,Message,UserSearchResult};
