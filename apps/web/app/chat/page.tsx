'use client';
import { AuthGuard } from '@/src/components/auth/auth-guard';
import { ConversationSidebar } from '@/src/features/chat/components/conversation-sidebar';
import { ConversationThread } from '@/src/features/chat/components/conversation-thread';
import { useChatWorkspace } from '@/src/features/chat/hooks/use-chat-workspace';

function ChatApp(){
 const chat=useChatWorkspace();
 const report=(action:Promise<unknown>)=>void action.catch(error=>chat.setError(error instanceof Error?error.message:'Request failed'));
 return <main className="flex h-screen bg-slate-50 text-slate-900">
  <ConversationSidebar conversations={chat.conversations} selectedId={chat.selectedId} loading={chat.loading} displayName={chat.currentUser?.displayName} search={chat.search} results={chat.searchResults} onSelect={chat.setSelectedId} onSearch={q=>report(chat.searchUsers(q))} onCreate={(user,type,title)=>report(chat.createConversation(user,type,title))} onLogout={()=>report(chat.logout())}/>
  <ConversationThread conversation={chat.selectedConversation} currentUserId={chat.currentUser?.id} messages={chat.messages} members={chat.members} cursor={chat.cursor} sending={chat.sending} onBack={()=>chat.setSelectedId(null)} onLoadOlder={()=>report(chat.loadOlder())} onSend={chat.send} onEdit={chat.editMessage} onDelete={chat.deleteMessage} onRemoveMember={chat.removeMember} onRename={chat.rename} onAddMember={async()=>{const query=window.prompt('Search member by email or name');if(!query)return;const added=await chat.findAndAddMember(query);if(!added)chat.setError('No matching user');}}/>
  {chat.error&&<div role="alert" className="absolute bottom-20 right-6 rounded-lg bg-red-600 px-4 py-2 text-sm text-white">{chat.error}<button onClick={()=>chat.setError('')} className="ml-3">×</button></div>}
 </main>;
}
export default function ChatPage(){return <AuthGuard mode="protected"><ChatApp/></AuthGuard>}
