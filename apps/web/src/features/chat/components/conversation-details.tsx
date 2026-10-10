'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { CallMedia } from '@vibeline/contracts';
import { CallHistoryList } from '@/src/features/calls/components/call-history-list';
import { useCallHistory } from '@/src/features/calls/hooks/use-call-history';
import { useAuthorizedRequest } from '@/src/lib/authorized-request';
import { useDismiss } from '@/src/shared/hooks/use-dismiss';
import { chatIcons } from '@/src/shared/assets/svg/chat';
import { ChatAvatar } from './chat-avatar';
import { ConversationDetailsSection } from './conversation-details-section';
import { EmojiPicker } from './emoji-picker';

type Props = {
  open: boolean;
  conversationId: string;
  name: string;
  avatarUrl?: string;
  quickEmoji: string;
  currentUserId?: string;
  callsSupported: boolean;
  callBusy: boolean;
  onStartCall: (media: CallMedia) => void;
  onSetQuickEmoji: (emoji: string) => Promise<void>;
  onClose: () => void;
};

type ConversationPreference = { preference: { muted: boolean } };

const iconButton = 'grid h-10 w-10 place-items-center rounded-full bg-black/[.04] transition-colors group-hover:bg-black/[.08]';
const row = 'flex h-[52px] w-full items-center border-b border-black/[.12] text-left text-[17px] leading-5 tracking-[-.41px]';

const CALL_ACTIONS = [
  { media: 'audio', label: 'Audio', icon: chatIcons.profileAudio },
  { media: 'video', label: 'Video', icon: chatIcons.profileVideo }
] as const satisfies ReadonlyArray<{ media: CallMedia; label: string; icon: string }>;

export function ConversationDetails({
  open,
  conversationId,
  name,
  avatarUrl,
  quickEmoji,
  currentUserId,
  callsSupported,
  callBusy,
  onStartCall,
  onSetQuickEmoji,
  onClose
}: Props) {
  const request = useAuthorizedRequest();
  const [muted, setMuted] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [savingMute, setSavingMute] = useState(false);
  const [muteError, setMuteError] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const history = useCallHistory(conversationId, open);

  useDismiss({ active: open && !emojiOpen, onDismiss: onClose, closeOnOutside: false });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void request<ConversationPreference>(`/notifications/conversations/${conversationId}`)
      .then(({ preference }) => {
        if (!cancelled) setMuted(preference.muted);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, request]);

  const toggleMute = async () => {
    if (savingMute) return;
    setSavingMute(true);
    setMuteError('');
    try {
      const { preference } = await request<ConversationPreference>(`/notifications/conversations/${conversationId}`, {
        method: 'PUT',
        body: { muted: !muted }
      });
      setMuted(preference.muted);
    } catch (error) {
      setMuteError(error instanceof Error ? error.message : 'Could not update notifications.');
    } finally {
      setSavingMute(false);
    }
  };

  if (!open) return null;

  return (
    <aside
      ref={panelRef}
      aria-label={`Details for ${name}`}
      className="absolute inset-0 z-50 flex min-h-0 flex-col overflow-y-auto bg-white motion-safe:animate-slide-up lg:static lg:inset-auto lg:z-auto lg:w-[380px] lg:shrink-0 lg:border-l lg:border-black/[.12] lg:motion-safe:animate-fade-in"
    >
      <div className="relative flex min-h-full flex-col px-4 pb-8 pt-5 xl:pt-8">
        <button onClick={onClose} aria-label="Back to conversation" className="absolute left-4 top-5 grid h-10 w-10 place-items-center lg:hidden">
          <img src={chatIcons.backBlue} alt="" width={13} height={23} className="brightness-0" />
        </button>
        <button
          onClick={onClose}
          aria-label="Close conversation details"
          className="absolute right-4 top-5 hidden h-10 w-10 place-items-center rounded-full transition-colors hover:bg-black/[.04] lg:grid"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center pt-5">
          <ChatAvatar name={name} src={avatarUrl} size="xl" className="!h-[88px] !w-[88px]" />
          <h2 className="mt-2 text-center text-[24px] font-bold leading-[29px] tracking-[.33px] text-black">{name}</h2>
          <p className="mt-0.5 text-[14px] text-black/45">Vibeline</p>
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-[210px] grid-cols-3 gap-4">
          {CALL_ACTIONS.map(({ media, label, icon }) => (
            <button
              key={media}
              type="button"
              disabled={!callsSupported || callBusy}
              onClick={() => onStartCall(media)}
              title={callsSupported ? `${label} call` : 'Calling needs a modern browser served over HTTPS'}
              aria-label={`${label} call with ${name}`}
              className="group flex flex-col items-center transition-opacity disabled:opacity-40"
            >
              <span className={iconButton}>
                <img src={icon} alt="" className="max-h-5 max-w-[21px]" />
              </span>
              <span className="mt-1.5 text-[12px] leading-[14px] tracking-[-.01px] text-black/50">{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => void toggleMute()}
            disabled={savingMute}
            aria-pressed={muted}
            className="group flex flex-col items-center disabled:opacity-50"
          >
            <span className={iconButton}>
              <img src={chatIcons.profileBell} alt="" className="max-h-5 max-w-[21px]" />
            </span>
            <span className="mt-1.5 text-[12px] leading-[14px] tracking-[-.01px] text-black/50">{muted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        {muteError && (
          <p role="alert" className="mt-3 text-center text-[12px] text-status-error">
            {muteError}
          </p>
        )}

        <ConversationDetailsSection title="Quick reaction">
          <div className="relative">
            <button type="button" onClick={() => setEmojiOpen((value) => !value)} aria-expanded={emojiOpen} className={`${row} border-b-0`}>
              <span>Emoji</span>
              <span className="ml-auto text-[22px]">{quickEmoji}</span>
            </button>
            {emojiOpen && (
              <EmojiPicker
                className="md:right-0 md:top-[48px]"
                title="Choose quick emoji"
                onClose={() => setEmojiOpen(false)}
                onSelect={(emoji) => {
                  void onSetQuickEmoji(emoji);
                  setEmojiOpen(false);
                }}
              />
            )}
          </div>
        </ConversationDetailsSection>

        <ConversationDetailsSection title="Calls">
          <CallHistoryList calls={history.calls} loading={history.loading} error={history.error} currentUserId={currentUserId} />
        </ConversationDetailsSection>
      </div>
    </aside>
  );
}
