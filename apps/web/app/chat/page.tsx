'use client';

import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { ConversationSidebar } from '@/src/features/chat/components/conversation-sidebar';
import { ConversationThread } from '@/src/features/chat/components/conversation-thread';
import { useChatWorkspace } from '@/src/features/chat/hooks/use-chat-workspace';
import { NotificationControl } from '@/src/features/notifications/notification-control';

function ChatApp() {
  const chat = useChatWorkspace();

  const report = (action: Promise<unknown>) => {
    void action.catch((error) => {
      chat.setError(error instanceof Error ? error.message : 'Request failed');
    });
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-surface-bg text-content-primary">
      <main className="grid h-full min-h-0 grid-cols-4 gap-0 md:grid-cols-8 lg:grid-cols-12">
        <ConversationSidebar
          className="col-span-4 md:col-span-3 lg:col-span-3"
          conversations={chat.conversations}
          connectionRequests={chat.connectionRequests}
          selectedId={chat.selectedId}
          loading={chat.loading}
          displayName={chat.currentUser?.displayName}
          currentUserId={chat.currentUser?.id}
          search={chat.search}
          results={chat.searchResults}
          onSelect={chat.setSelectedId}
          onSearch={(query) => report(chat.searchUsers(query))}
          onCreate={(user, type, title) => report(chat.createConversation(user, type, title))}
          onCreateGroup={(users, title) => report(chat.createGroup(users, title))}
          onRequestConnection={chat.requestConnection}
          onRespondConnection={chat.respondConnection}
          onRefreshRequests={chat.loadConnectionRequests}
        />
        <ConversationThread
          className="col-span-4 md:col-span-5 lg:col-span-9"
          conversation={chat.selectedConversation}
          currentUserId={chat.currentUser?.id}
          messages={chat.messages}
          reactions={chat.reactions}
          quickEmoji={chat.quickEmoji}
          members={chat.members}
          assistant={chat.assistant}
          assistantGeneration={chat.assistantGeneration}
          assistantBusy={chat.assistantBusy}
          assistantError={chat.assistantError}
          cursor={chat.cursor}
          sending={chat.sending}
          onBack={() => chat.setSelectedId(null)}
          onLoadOlder={() => report(chat.loadOlder())}
          onSend={chat.send}
          onAddReaction={chat.addReaction}
          onRemoveReaction={chat.removeReaction}
          onSetQuickEmoji={chat.setQuickEmoji}
          onEdit={chat.editMessage}
          onDelete={chat.deleteMessage}
          memberSearch={chat.search}
          memberResults={chat.searchResults}
          onSearchMembers={(query) => report(chat.searchUsers(query))}
          onRemoveMember={chat.removeMember}
          onRename={chat.rename}
          onEnableAssistant={chat.enableAssistant}
          onRequestAssistant={chat.requestAssistant}
          onAddMember={chat.addMember}
        />
      </main>

      <NotificationControl />

      {chat.error && (
        <div
          role="alert"
          className="absolute bottom-20 right-4 rounded-xl bg-status-error px-4 py-3 text-sm text-white shadow-lg md:right-6 lg:right-8 2xl:right-10"
        >
          {chat.error}
          <button type="button" onClick={() => chat.setError('')} className="ml-3 font-semibold">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard mode="protected">
      <ChatApp />
    </AuthGuard>
  );
}
