'use client';

import type { ConversationSummary, UserSearchResult } from '@vibeline/contracts';
import { Button, Input } from '@vibeline/ui';
import { cn } from '@vibeline/utils';

type ConversationSidebarProps = {
  className?: string;
  conversations: ConversationSummary[];
  selectedId: string | null;
  loading: boolean;
  displayName?: string;
  search: string;
  results: UserSearchResult[];
  onSelect: (id: string | null) => void;
  onSearch: (query: string) => void;
  onCreate: (user: UserSearchResult, type: 'direct' | 'group', title?: string) => void;
  onLogout: () => void;
};

export function ConversationSidebar({
  className,
  conversations,
  selectedId,
  loading,
  displayName,
  search,
  results,
  onSelect,
  onSearch,
  onCreate,
  onLogout
}: ConversationSidebarProps) {
  return (
    <aside
      className={cn(
        selectedId ? 'hidden md:flex' : 'flex',
        'h-full min-w-0 flex-col border-r border-border bg-surface-panel',
        className
      )}
    >
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-content-primary">VibeLine</h1>
            <p className="truncate text-sm text-content-muted">{displayName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </div>

        <div className="relative mt-4">
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Find people by name or email"
            className="h-10 rounded-xl bg-surface-bg"
          />
          {results.length > 0 && (
            <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-elevated">
              {results.map((user) => (
                <div key={user.id} className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 last:border-b-0 hover:bg-surface-soft">
                  <button
                    type="button"
                    onClick={() => onCreate(user, 'direct')}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-content-primary">{user.displayName}</span>
                    <span className="block truncate text-xs text-content-muted">{user.email}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const title = window.prompt('Group name');
                      if (title) onCreate(user, 'group', title);
                    }}
                    className="shrink-0 text-xs font-semibold text-accent hover:text-accent-hover"
                  >
                    New group
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-content-muted">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm leading-6 text-content-muted">
            No conversations yet. Search for someone to start one.
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                'block w-full border-b border-border-subtle px-4 py-3 text-left transition-colors sm:px-5',
                selectedId === conversation.id ? 'bg-accent-subtle' : 'hover:bg-surface-soft'
              )}
            >
              <span className="block truncate text-sm font-medium text-content-primary">
                {conversation.title || (conversation.type === 'direct' ? 'Direct conversation' : 'Group conversation')}
              </span>
              <span className="mt-1 block text-xs text-content-muted">
                Updated {new Date(conversation.updatedAt).toLocaleString()}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
