'use client';

import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { CallOverlay } from '@/src/features/calls/components/call-overlay';
import { useCallSession } from '@/src/features/calls/hooks/use-call-session';
import { ConversationSidebar } from '@/src/features/chat/components/conversation-sidebar';
import { ConversationThread } from '@/src/features/chat/components/conversation-thread';
import { useChatWorkspace } from '@/src/features/chat/hooks/use-chat-workspace';
import { MediaCaptureDialog } from '@/src/features/media/components/media-capture-dialog';
import { RealtimeProvider } from '@/src/features/realtime/realtime-provider';
import { StoryViewer } from '@/src/features/stories/components/story-viewer';
import { useStories } from '@/src/features/stories/hooks/use-stories';

function ChatApp() {
  const chat = useChatWorkspace();
  const call = useCallSession();
  const stories = useStories();

  const callActive = call.phase !== 'idle';
  const openStoryGroup = stories.groups.find((group) => group.author.userId === stories.openAuthorId);

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
          onAddStory={stories.openComposer}
          onLogout={chat.logout}
          stories={stories}
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
          callsSupported={call.supported}
          callBusy={callActive}
          onStartCall={(media) => {
            if (chat.selectedId) void call.start(chat.selectedId, media);
          }}
        />
      </main>

      <CallOverlay session={call} />

      {openStoryGroup && (
        <StoryViewer
          author={openStoryGroup.author}
          stories={stories.stories}
          loading={stories.storiesLoading}
          error={stories.storiesError}
          isSelf={openStoryGroup.isSelf}
          externalPause={callActive}
          onClose={stories.close}
          onViewed={stories.markViewed}
          onDelete={stories.remove}
        />
      )}

      <MediaCaptureDialog
        open={stories.composerOpen && !callActive}
        sending={stories.publishing}
        sendLabel="Share"
        title="Add to your story"
        allowCaption
        onClose={stories.closeComposer}
        onSend={async (file, caption) => {
          await stories.publish(file, chat.uploadMedia, caption);
          stories.closeComposer();
        }}
      />

      {chat.error && (
        <div
          role="alert"
          className="absolute bottom-20 right-4 rounded-xl bg-status-error px-4 py-3 text-sm text-white shadow-lg motion-safe:animate-slide-up md:right-6 lg:right-8 2xl:right-10"
        >
          {chat.error}
          <button type="button" onClick={() => chat.setError('')} aria-label="Dismiss error" className="ml-3 font-semibold">
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
      <RealtimeProvider>
        <ChatApp />
      </RealtimeProvider>
    </AuthGuard>
  );
}
