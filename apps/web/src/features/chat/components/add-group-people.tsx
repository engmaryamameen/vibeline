'use client';

import { useMemo, useState } from 'react';
import type { ConversationMember, UserSearchResult } from '@vibeline/contracts';
import { Search } from 'lucide-react';
import { ChatAvatar } from './chat-avatar';

type Props = {
  people: UserSearchResult[];
  members: ConversationMember[];
  query: string;
  onQuery: (value: string) => void;
  onAdd: (userId: string) => Promise<void>;
  onClose: () => void;
};

export function AddGroupPeople({ people, members, query, onQuery, onAdd, onClose }: Props) {
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState('');
  const candidates = useMemo(() => {
    const memberIds = new Set(members.map(member => member.userId));
    return people.filter(person => !memberIds.has(person.id));
  }, [people, members]);

  const add = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError('');
    try {
      await onAdd(id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this person.');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="flex max-h-[min(65dvh,560px)] min-h-0 flex-col px-5 pb-4 pt-4">
      <label className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-black/10 px-3 focus-within:border-black/30">
        <Search size={18} className="text-black/40" aria-hidden="true" />
        <input value={query} onChange={event => onQuery(event.target.value)} aria-label="Search people" placeholder="Search people by name or email" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/40" />
      </label>
      <p className="mt-4 mb-2 text-xs text-black/45">People not in this group</p>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {candidates.map(person => (
          <div key={person.id} className="flex min-h-16 items-center gap-3 border-b border-black/[.05] py-2 last:border-b-0">
            <ChatAvatar name={person.displayName} src={person.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{person.displayName}</p>
              {query && <p className="truncate text-xs text-black/45">{person.email}</p>}
            </div>
            <button type="button" disabled={!!busy} onClick={() => void add(person.id)} className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/75 hover:bg-black/[.04] disabled:opacity-40">
              {busy === person.id ? 'Adding…' : 'Add'}
            </button>
          </div>
        ))}
        {candidates.length === 0 && <p className="py-10 text-center text-sm text-black/45">{query ? 'No matching people outside this group.' : 'No other people available.'}</p>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
