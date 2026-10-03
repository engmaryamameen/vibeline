'use client';

import { PageShell } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { ConversationSidebar } from '@/src/features/chat/components/conversation-sidebar';
import { ConversationThread } from '@/src/features/chat/components/conversation-thread';
import { useChatWorkspace } from '@/src/features/chat/hooks/use-chat-workspace';

function ChatApp() {
  const chat = useChatWorkspace();

  const report = (action: Promise<unknown>) => {
    void action.catch((error) => {
      chat.setError(error instanceof Error ? error.message : 'Request failed');
    });
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-white text-content-primary">
      <PageShell
        className="h-full min-h-0 overflow-hidden"
        containerClassName="h-full"
        gridClassName="h-full gap-0"
      >
        <ConversationSidebar
          className="col-span-4 md:col-span-3 lg:col-span-3"
          conversations={chat.conversations}
          selectedId={chat.selectedId}
          loading={chat.loading}
          displayName={chat.currentUser?.displayName}
          search={chat.search}
          results={chat.searchResults}
          onSelect={chat.setSelectedId}
          onSearch={(query) => report(chat.searchUsers(query))}
          onCreate={(user, type, title) => report(chat.createConversation(user, type, title))}
          onLogout={() => report(chat.logout())}
        />
        <ConversationThread
          className="col-span-4 md:col-span-5 lg:col-span-9"
          conversation={chat.selectedConversation}
          currentUserId={chat.currentUser?.id}
          messages={chat.messages}
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
          onEdit={chat.editMessage}
          onDelete={chat.deleteMessage}
          onRemoveMember={chat.removeMember}
          onRename={chat.rename}
          onEnableAssistant={chat.enableAssistant}
          onRequestAssistant={chat.requestAssistant}
          onAddMember={async () => {
            const query = window.prompt('Search member by email or name');
            if (!query) return;
            const added = await chat.findAndAddMember(query);
            if (!added) chat.setError('No matching user');
          }}
        />
      </PageShell>

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
