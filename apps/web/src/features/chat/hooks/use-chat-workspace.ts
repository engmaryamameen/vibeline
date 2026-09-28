'use client';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import type { ChatEvent,ConversationMember,ConversationSummary,Message,UserSearchResult } from '@vibeline/contracts';
import { apiClient } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';
import { chatApi } from '../api/chat-api';
import { useAuthorizedRequest } from './use-authorized-request';
import { useChatRealtime } from './use-chat-realtime';

export function useChatWorkspace(){
 const request=useAuthorizedRequest();const api=useMemo(()=>chatApi(request),[request]);const currentUser=useAuthStore(s=>s.currentUser);const clearSession=useAuthStore(s=>s.clearSession);
 const [conversations,setConversations]=useState<ConversationSummary[]>([]);const [selectedId,setSelectedId]=useState<string|null>(null);const [messages,setMessages]=useState<Message[]>([]);const [members,setMembers]=useState<ConversationMember[]>([]);const [cursor,setCursor]=useState<number>();const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [sending,setSending]=useState(false);const [search,setSearch]=useState('');const [searchResults,setSearchResults]=useState<UserSearchResult[]>([]);const selectedRef=useRef<string|null>(null);const lastSequenceRef=useRef(0);const readyConversationRef=useRef<string|null>(null);selectedRef.current=selectedId;
 const mergeMessages=useCallback((incoming:Message[])=>{for(const message of incoming)lastSequenceRef.current=Math.max(lastSequenceRef.current,message.sequence);setMessages(existing=>{const byId=new Map(existing.map(message=>[message.id,message]));for(const message of incoming)byId.set(message.id,message);return [...byId.values()].sort((a,b)=>a.sequence-b.sequence);});},[]);
 const loadConversations=useCallback(async()=>{const result=await api.listConversations();setConversations(result.conversations);if(!selectedRef.current&&result.conversations[0])setSelectedId(result.conversations[0].id);setLoading(false);},[api]);
 const loadMessages=useCallback(async(id:string,before?:number)=>{const result=await api.listMessages(id,{before});if(before)mergeMessages(result.messages);else{lastSequenceRef.current=result.messages.at(-1)?.sequence??0;setMessages(result.messages);}setCursor(result.nextCursor);},[api,mergeMessages]);
 const refreshMembers=useCallback(async(id:string)=>{const detail=await api.getConversation(id);setMembers(detail.members);},[api]);
 useEffect(()=>{void loadConversations().catch(e=>setError(e instanceof Error?e.message:'Unable to load conversations'));},[loadConversations]);
 useEffect(()=>{if(!selectedId)return;readyConversationRef.current=null;lastSequenceRef.current=0;setMessages([]);setCursor(undefined);void Promise.all([loadMessages(selectedId),refreshMembers(selectedId)]).then(()=>{if(selectedRef.current===selectedId)readyConversationRef.current=selectedId;}).catch(e=>setError(e instanceof Error?e.message:'Unable to load conversation'));},[selectedId,loadMessages,refreshMembers]);
 const catchUp=useCallback(async()=>{const id=selectedRef.current;if(!id||readyConversationRef.current!==id)return;let after=lastSequenceRef.current;for(;;){const result=await api.listMessages(id,{after,limit:100});if(selectedRef.current!==id)return;if(!result.messages.length)return;mergeMessages(result.messages);const next=result.messages.at(-1)!.sequence;if(next<=after||result.messages.length<100)return;after=next;}},[api,mergeMessages]);
 const onRealtime=useCallback((event:ChatEvent&{payload:Message})=>{if(event.payload.sequence>lastSequenceRef.current+1){void catchUp().catch(()=>undefined);return;}mergeMessages([event.payload]);},[mergeMessages,catchUp]);
 const onRealtimeConnected=useCallback(()=>{void catchUp().catch(()=>undefined);},[catchUp]);
 useChatRealtime(selectedId,onRealtime,onRealtimeConnected);
 useEffect(()=>{if(!selectedId)return;const timer=window.setInterval(()=>{void catchUp().catch(()=>undefined);},60_000);return()=>window.clearInterval(timer);},[selectedId,catchUp]);
 const send=useCallback(async(body:string)=>{if(!selectedId)return;setSending(true);try{const result=await api.sendMessage(selectedId,body);mergeMessages([result.message]);await loadConversations();}finally{setSending(false);}},[selectedId,api,mergeMessages,loadConversations]);
 const searchUsers=useCallback(async(q:string)=>{setSearch(q);if(q.trim().length<2){setSearchResults([]);return;}setSearchResults((await api.searchUsers(q)).users);},[api]);
 const createConversation=useCallback(async(user:UserSearchResult,type:'direct'|'group',title?:string)=>{const result=await api.createConversation([user.id],type,title);setSearch('');setSearchResults([]);await loadConversations();setSelectedId(result.conversation.id);},[api,loadConversations]);
 const removeMember=useCallback(async(userId:string)=>{if(!selectedId)return;await api.removeMember(selectedId,userId);await refreshMembers(selectedId);},[api,selectedId,refreshMembers]);
 const addMember=useCallback(async(userId:string)=>{if(!selectedId)return;await api.addMember(selectedId,userId);await refreshMembers(selectedId);},[api,selectedId,refreshMembers]);
 const findAndAddMember=useCallback(async(q:string)=>{if(!selectedId)return false;const found=await api.searchUsers(q);const user=found.users[0];if(!user)return false;await api.addMember(selectedId,user.id);await refreshMembers(selectedId);return true;},[api,selectedId,refreshMembers]);
 const rename=useCallback(async(title:string)=>{if(!selectedId)return;await api.updateConversation(selectedId,title);await loadConversations();},[api,selectedId,loadConversations]);
 const editMessage=useCallback(async(messageId:string,body:string)=>{if(!selectedId)return;const result=await api.editMessage(selectedId,messageId,body);mergeMessages([result.message]);},[api,selectedId,mergeMessages]);
 const deleteMessage=useCallback(async(messageId:string)=>{if(!selectedId)return;const result=await api.deleteMessage(selectedId,messageId);mergeMessages([result.message]);},[api,selectedId,mergeMessages]);
 const logout=useCallback(async()=>{try{await apiClient('/auth/logout',{method:'POST'});}finally{clearSession();location.href='/login';}},[clearSession]);
 return {currentUser,conversations,selectedId,setSelectedId,selectedConversation:conversations.find(c=>c.id===selectedId),messages,members,cursor,error,setError,loading,sending,search,searchResults,loadOlder:()=>selectedId&&cursor?loadMessages(selectedId,cursor):Promise.resolve(),send,searchUsers,createConversation,removeMember,addMember,findAndAddMember,rename,editMessage,deleteMessage,logout,api};
}
