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
 const [conversations,setConversations]=useState<ConversationSummary[]>([]);const [selectedId,setSelectedId]=useState<string|null>(null);const [messages,setMessages]=useState<Message[]>([]);const [members,setMembers]=useState<ConversationMember[]>([]);const [cursor,setCursor]=useState<number>();const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [sending,setSending]=useState(false);const [search,setSearch]=useState('');const [searchResults,setSearchResults]=useState<UserSearchResult[]>([]);const selectedRef=useRef<string|null>(null);selectedRef.current=selectedId;
 const mergeMessages=useCallback((incoming:Message[])=>setMessages(existing=>{const byId=new Map(existing.map(message=>[message.id,message]));for(const message of incoming)byId.set(message.id,message);return [...byId.values()].sort((a,b)=>a.sequence-b.sequence);}),[]);
 const loadConversations=useCallback(async()=>{const result=await api.listConversations();setConversations(result.conversations);if(!selectedRef.current&&result.conversations[0])setSelectedId(result.conversations[0].id);setLoading(false);},[api]);
 const loadMessages=useCallback(async(id:string,before?:number)=>{const result=await api.listMessages(id,{before});if(before)mergeMessages(result.messages);else setMessages(result.messages);setCursor(result.nextCursor);},[api,mergeMessages]);
 const refreshMembers=useCallback(async(id:string)=>{const detail=await api.getConversation(id);setMembers(detail.members);},[api]);
 useEffect(()=>{void loadConversations().catch(e=>setError(e instanceof Error?e.message:'Unable to load conversations'));},[loadConversations]);
 useEffect(()=>{if(!selectedId)return;setMessages([]);setCursor(undefined);void Promise.all([loadMessages(selectedId),refreshMembers(selectedId)]).catch(e=>setError(e instanceof Error?e.message:'Unable to load conversation'));},[selectedId,loadMessages,refreshMembers]);
 const onRealtime=useCallback((event:ChatEvent&{payload:Message})=>{if(event.type==='message.created')mergeMessages([event.payload]);else if(event.type==='message.updated'||event.type==='message.deleted')setMessages(items=>items.map(item=>item.id===event.payload.id?event.payload:item));},[mergeMessages]);
 useChatRealtime(selectedId,onRealtime);
 useEffect(()=>{if(!selectedId)return;const timer=window.setInterval(()=>{const last=messages.at(-1)?.sequence??0;void api.listMessages(selectedId,{after:last,limit:100}).then(r=>mergeMessages(r.messages)).catch(()=>undefined);},5000);return()=>window.clearInterval(timer);},[selectedId,messages,api,mergeMessages]);
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
