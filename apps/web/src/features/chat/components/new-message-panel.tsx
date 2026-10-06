'use client';

import { useMemo } from 'react';
import type { UserSearchResult } from '@vibeline/contracts';
import { ChatAvatar } from './chat-avatar';

const RECENT_MS = 24 * 60 * 60 * 1000;

const lastActive = (value?: string) => {
  if (!value) return '';
  const ms = Date.now() - new Date(value).getTime();
  if (ms < 45_000) return 'Active now';
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  if (minutes < 60) return `${minutes} min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr.`;
  return '';
};

type Props = {
  people: UserSearchResult[];
  query: string;
  onQuery: (value: string) => void;
  onCancel: () => void;
  onStart: (user: UserSearchResult) => void;
  onCreateGroup: () => void;
};

export function NewMessagePanel({ people, query, onQuery, onCancel, onStart, onCreateGroup }: Props) {
  const { recent, other } = useMemo(() => {
    const now = Date.now();
    const recent: UserSearchResult[] = [];
    const other: UserSearchResult[] = [];

    for (const user of people) {
      if (user.lastSeenAt && now - new Date(user.lastSeenAt).getTime() < RECENT_MS) recent.push(user);
      else other.push(user);
    }

    return { recent, other };
  }, [people]);

  const row = (user: UserSearchResult) => {
    const activity = lastActive(user.lastSeenAt);
    const online = activity === 'Active now';

    return (
      <button
        key={user.id}
        type="button"
        onClick={() => onStart(user)}
        className="group flex h-[61px] w-full shrink-0 items-center px-4 text-left transition-colors hover:bg-black/[.025] focus-visible:bg-black/[.035] focus-visible:outline-none"
      >
        <span className="relative shrink-0">
          <ChatAvatar name={user.displayName} src={user.avatarUrl} online={online} />
          {!online && activity && (
            <span className="absolute -bottom-1 -left-0.5 min-w-[38px] rounded-[5px] border-[3px] border-white bg-[#C7F0BB] px-1 text-center text-[8px] font-medium leading-[14px] tracking-[.3px] text-black">
              {activity}
            </span>
          )}
        </span>
        <span className="ml-3 min-w-0 flex-1 border-b border-black/[.08] py-[19px] text-[17px] font-semibold leading-[22px] tracking-[-.41px] text-black group-last:border-b-0">
          <span className="block truncate">{user.displayName}</span>
        </span>
      </button>
    );
  };

  return (
    <section className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-white md:static md:z-auto md:h-full md:w-full">
      <header className="relative flex h-[64px] shrink-0 items-center border-b border-black/[.08] px-4">
        <button type="button" onClick={onCancel} className="z-10 text-[17px] font-normal leading-5 tracking-[-.41px] text-black">
          Cancel
        </button>
        <h2 className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold leading-5 tracking-[-.41px] text-black">
          New message
        </h2>
      </header>

      <label className="flex h-11 shrink-0 items-center bg-[#F9F8F9] px-4">
        <span className="shrink-0 text-[15px] leading-[18px] tracking-[-.33px] text-black/40">To:</span>
        <input
          autoFocus
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          aria-label="Search people"
          className="ml-2 min-w-0 flex-1 bg-transparent text-[15px] leading-[18px] tracking-[-.33px] text-black outline-none"
        />
      </label>

      <button type="button" onClick={onCreateGroup} className="flex h-[62px] shrink-0 items-center px-[15px] text-left transition-colors hover:bg-black/[.025]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/[.04]">
          <img src="/assets/chat/create-group.svg" alt="" width={22} height={13} />
        </span>
        <strong className="ml-3 min-w-0 flex-1 truncate text-[17px] font-semibold leading-5 tracking-[-.41px] text-black">Create a New Group</strong>
        <img src="/assets/chat/chevron-right.svg" alt="" width={8} height={13} className="ml-3 shrink-0" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(16px,env(safe-area-inset-bottom))] [scrollbar-gutter:stable]">
        {recent.length > 0 && (
          <section>
            <h3 className="px-4 pb-1 pt-4 text-[13px] font-semibold uppercase leading-4 tracking-[-.15px] text-black/35">Recently active</h3>
            {recent.map(row)}
          </section>
        )}
        {other.length > 0 && (
          <section>
            <h3 className="px-4 pb-1 pt-4 text-[13px] font-semibold uppercase leading-4 tracking-[-.15px] text-black/35">People</h3>
            {other.map(row)}
          </section>
        )}
        {!people.length && <p className="px-4 py-12 text-center text-sm text-black/45">No people found.</p>}
      </div>
    </section>
  );
}
