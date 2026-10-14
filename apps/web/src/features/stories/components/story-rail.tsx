'use client';

import type { StoryGroup } from '@vibeline/contracts';
import { cn } from '@vibeline/utils';
import { ChatAvatar } from '@/src/features/chat/components/chat-avatar';
import { chatIcons } from '@/src/shared/assets/svg/chat';

type Props = {
  groups: StoryGroup[];
  loading: boolean;
  error: string;
  onOpen: (authorUserId: string) => void;
  onCreate: () => void;
};

export function StoryRail({ groups, loading, error, onOpen, onCreate }: Props) {
  const own = groups.find((group) => group.isSelf);
  const others = groups.filter((group) => !group.isSelf);

  return (
    <section aria-label="Stories" className="shrink-0 border-b border-black/[.06] px-4 py-3">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-[13px] font-semibold uppercase leading-4 tracking-[-.15px] text-black/35">Stories</h2>
        {error && (
          <span role="alert" className="text-[11px] text-status-error">
            {error}
          </span>
        )}
      </div>

      <div className="flex gap-[15px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={onCreate} className="w-[65px] shrink-0 text-center" aria-label={own ? 'Add to your story' : 'Create a story'}>
          <span className="relative mx-auto grid h-[52px] w-[52px] place-items-center">
            {own ? (
              <ChatAvatar name="Your story" size="lg" className="!h-[52px] !w-[52px]" />
            ) : (
              <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-black/[.04]">
                <img src={chatIcons.navTimeline} alt="" width={22} height={22} />
              </span>
            )}
            <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-accent text-white">
              <img src={chatIcons.plus} alt="" width={9} height={9} className="brightness-0 invert" />
            </span>
          </span>
          <span className="mt-[7px] block truncate text-[13px] leading-[18px] tracking-[-.08px] text-black/35">Your story</span>
        </button>

        {own && (
          <button type="button" onClick={() => onOpen(own.author.userId)} className="w-[65px] shrink-0 text-center" aria-label={`View your ${own.storyCount} stories`}>
            <span className="mx-auto block w-[52px] rounded-full p-[2px] ring-2 ring-accent/40">
              <ChatAvatar name={own.author.displayName} src={own.author.avatarUrl} size="lg" className="!h-[48px] !w-[48px]" />
            </span>
            <span className="mt-[7px] block truncate text-[13px] leading-[18px] tracking-[-.08px] text-black/55">{own.storyCount} live</span>
          </button>
        )}

        {others.map((group) => (
          <button
            type="button"
            key={group.author.userId}
            onClick={() => onOpen(group.author.userId)}
            className="w-[65px] shrink-0 text-center"
            aria-label={`View stories from ${group.author.displayName}${group.unseenCount ? `, ${group.unseenCount} unseen` : ''}`}
          >
            <span className={cn('mx-auto block w-[52px] rounded-full p-[2px] ring-2', group.unseenCount > 0 ? 'ring-accent' : 'ring-black/[.12]')}>
              <ChatAvatar name={group.author.displayName} src={group.author.avatarUrl} size="lg" className="!h-[48px] !w-[48px]" />
            </span>
            <span className={cn('mt-[7px] block truncate text-[13px] leading-[18px] tracking-[-.08px]', group.unseenCount > 0 ? 'font-medium text-black/70' : 'text-black/35')}>
              {group.author.displayName.split(' ')[0]}
            </span>
          </button>
        ))}

        {loading && !groups.length && <p className="self-center px-2 text-[13px] text-black/35">Loading stories…</p>}
        {!loading && !others.length && !own && <p className="self-center px-2 text-[13px] text-black/35"></p>}
      </div>
    </section>
  );
}
