'use client';

import type { UserSearchResult } from '@vibeline/contracts';
import { X } from 'lucide-react';
import { ChatDialog } from './chat-dialog';
import { PeoplePanel } from './people-panel';

type Props = {
  open: boolean;
  onClose: () => void;
  people: UserSearchResult[];
  query: string;
  onQuery: (value: string) => void;
  picked: UserSearchResult[];
  onToggle: (user: UserSearchResult) => void;
  groupName: string;
  onGroupName: (value: string) => void;
  onRequestConnection: (userId: string) => Promise<void>;
  onRespondConnection: (id: string, accept: boolean) => Promise<void>;
  onSubmit: () => void;
};

export function CreateConversationDialog({ open, onClose, people, query, onQuery, picked, onToggle, groupName, onGroupName, onRequestConnection, onRespondConnection, onSubmit }: Props) {
  const isGroup = picked.length > 1;
  const canSubmit = picked.length > 0 && (!isGroup || !!groupName.trim());

  return (
    <ChatDialog open={open} title="New message" onClose={onClose} size="wide">
      <div className="flex h-[min(640px,calc(86dvh-56px))] min-h-0 flex-col">
        <div className="shrink-0 border-b border-black/[.06] px-4 pb-3 pt-4 sm:px-5">
          <p className="mb-3 text-[13px] text-black/50">Select people to start a chat or create a group.</p>
          <label htmlFor="new-conversation-group-name" className="mb-1.5 block text-xs font-semibold text-black/65">Group name <span className="font-normal text-black/40">(required for groups)</span></label>
          <input
            id="new-conversation-group-name"
            value={groupName}
            onChange={event => onGroupName(event.target.value)}
            maxLength={100}
            placeholder="Enter a group name"
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col pt-3">
          <PeoplePanel
            people={people}
            query={query}
            onQuery={onQuery}
            onRequestConnection={onRequestConnection}
            onRespondConnection={onRespondConnection}
            onAddContact={() => onQuery('')}
            onStart={onToggle}
            selectionMode
            selectedIds={picked.map(user => user.id)}
          />
        </div>
        <div className="z-10 shrink-0 border-t border-black/[.08] bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-black/60">Selected people</span>
            <span className="text-xs text-black/45">{picked.length} selected</span>
          </div>
          <div className="mb-3 flex max-h-[76px] min-h-8 flex-wrap content-start gap-1.5 overflow-y-auto" aria-label="Selected people">
            {picked.length === 0 ? <span className="text-xs text-black/40">Choose at least one person</span> : picked.map(user => (
              <button key={user.id} type="button" onClick={() => onToggle(user)} aria-label={`Remove ${user.displayName}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-3 py-1.5 text-xs font-medium text-accent hover:opacity-80">
                <span className="max-w-[170px] truncate">{user.displayName}</span><X size={13}/>
              </button>
            ))}
          </div>
          {isGroup && !groupName.trim() && <p className="mb-2 text-xs text-black/50">Enter a group name to continue.</p>}
          <button type="button" disabled={!canSubmit} onClick={onSubmit} className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40">
            {isGroup ? `Create group (${picked.length})` : 'Start chat'}
          </button>
        </div>
      </div>
    </ChatDialog>
  );
}
