'use client';

import { useState, type FormEvent } from 'react';
import type {
  AssistantGeneration,
  AssistantParticipant,
  ConversationMember,
  ConversationSummary,
  Message
} from '@vibeline/contracts';
import { Button, Input } from '@vibeline/ui';
import { cn } from '@vibeline/utils';

type ConversationThreadProps = {
  className?: string;
  conversation?: ConversationSummary;
  currentUserId?: string;
  messages: Message[];
  members: ConversationMember[];
  assistant?: AssistantParticipant;
  assistantGeneration?: AssistantGeneration;
  assistantBusy: boolean;
  assistantError: string;
  cursor?: number;
  sending: boolean;
  onBack: () => void;
  onLoadOlder: () => void;
  onSend: (body: string) => Promise<void>;
  onEdit: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
  onAddMember: () => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onEnableAssistant: () => Promise<void>;
  onRequestAssistant: () => Promise<void>;
};

export function ConversationThread({ className, ...props }: ConversationThreadProps) {
  const [body, setBody] = useState('');

  if (!props.conversation) {
    return (
      <section className={cn('hidden h-full min-w-0 items-center justify-center bg-surface-bg md:flex', className)}>
        <p className="text-sm text-content-muted">Select or create a conversation</p>
      </section>
    );
  }

  const isGroup = props.conversation.type === 'group';
  const currentRole = props.members.find((member) => member.userId === props.currentUserId)?.role;
  const canEnableAssistant = isGroup && (currentRole === 'owner' || currentRole === 'admin');
  const assistantPending = props.assistantBusy || props.assistantGeneration?.status === 'running';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = body.trim();
    if (!value) return;
    setBody('');
    await props.onSend(value);
  };

  return (
    <section className={cn('flex h-full min-w-0 flex-col bg-surface-bg', className)}>
      <header className="border-b border-border bg-surface-panel px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={props.onBack}
          className="mb-2 text-sm font-medium text-accent md:hidden"
        >
          ← Conversations
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 truncate font-semibold text-content-primary">
            {props.conversation.title || 'Conversation'}
          </h2>
          {isGroup && (
            <div className="flex items-center gap-2 text-xs">
              {props.assistant ? (
                <>
                  <span className="rounded-lg bg-accent-subtle px-2 py-1 text-accent">
                    {props.assistant.displayName}
                  </span>
                  <Button
                    size="sm"
                    disabled={assistantPending}
                    onClick={() => void props.onRequestAssistant()}
                  >
                    {assistantPending ? 'Assistant working…' : 'Ask assistant'}
                  </Button>
                </>
              ) : (
                canEnableAssistant && (
                  <Button size="sm" variant="secondary" onClick={() => void props.onEnableAssistant()}>
                    Enable assistant
                  </Button>
                )
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-content-muted">
          {props.members.map((member) => (
            <span key={member.userId} className="rounded-lg bg-surface-soft px-2 py-1">
              {member.displayName} ({member.role})
              {isGroup && member.userId !== props.currentUserId && (
                <button
                  type="button"
                  onClick={() => void props.onRemoveMember(member.userId)}
                  className="ml-1 text-status-error"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        {isGroup && (
          <div className="mt-2 flex gap-3 text-xs font-medium text-accent">
            <button
              type="button"
              onClick={() => {
                const title = window.prompt('New group name');
                if (title) void props.onRename(title);
              }}
            >
              Rename
            </button>
            <button type="button" onClick={() => void props.onAddMember()}>
              Add member
            </button>
          </div>
        )}

        {props.assistantGeneration?.status === 'failed' && (
          <div className="mt-2 text-xs text-status-error">
            Assistant response failed.{' '}
            <button
              type="button"
              disabled={props.assistantBusy}
              onClick={() => void props.onRequestAssistant()}
              className="underline"
            >
              Try again
            </button>
          </div>
        )}
        {props.assistantError && <div className="mt-1 text-xs text-status-error">{props.assistantError}</div>}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {props.cursor && (
          <button
            type="button"
            onClick={props.onLoadOlder}
            className="mx-auto mb-4 block text-sm font-medium text-accent"
          >
            Load older messages
          </button>
        )}

        {props.messages.length === 0 ? (
          <p className="text-center text-sm text-content-muted">No messages yet.</p>
        ) : (
          props.messages.map((message) => {
            const isCurrentUser = message.senderId === props.currentUserId;

            return (
              <div key={message.id} className={cn('mb-3 flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[min(42rem,85%)] rounded-2xl px-4 py-2 shadow-sm',
                    isCurrentUser ? 'bg-accent text-white' : 'border border-border-subtle bg-surface-panel text-content-primary'
                  )}
                >
                  {message.assistantId && (
                    <div className={cn('mb-1 text-[11px] font-medium', isCurrentUser ? 'text-white/75' : 'text-accent')}>
                      {props.assistant?.displayName ?? 'Assistant'}
                    </div>
                  )}
                  <p className={message.deletedAt ? 'italic opacity-60' : ''}>
                    {message.deletedAt ? 'Message deleted' : message.body}
                  </p>
                  <div className={cn('mt-1 flex gap-2 text-[11px]', isCurrentUser ? 'text-white/65' : 'text-content-muted')}>
                    <span>#{message.sequence}</span>
                    {message.editedAt && <span>edited</span>}
                    {isCurrentUser && !message.deletedAt && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const next = window.prompt('Edit message', message.body);
                            if (next) void props.onEdit(message.id, next);
                          }}
                          className="hover:underline"
                        >
                          edit
                        </button>
                        <button type="button" onClick={() => void props.onDelete(message.id)} className="hover:underline">
                          delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-border bg-surface-panel p-3 sm:p-4">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={10000}
          required
          placeholder="Write a message"
          className="h-11 flex-1 rounded-xl bg-surface-bg px-4"
        />
        <Button type="submit" size="lg" disabled={props.sending} className="h-11 rounded-xl px-5">
          {props.sending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </section>
  );
}
