'use client';

import { Phone, PhoneOff, Video } from 'lucide-react';
import type { Call } from '@vibeline/contracts';
import { ChatAvatar } from '@/src/features/chat/components/chat-avatar';

type Props = { call: Call; busy: boolean; onAccept: () => void; onDecline: () => void };

export function IncomingCallCard({ call, busy, onAccept, onDecline }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Incoming ${call.media} call from ${call.peer.displayName}`}
      className="fixed inset-x-0 top-0 z-[190] flex justify-center p-4 motion-safe:animate-slide-down sm:p-6"
    >
      <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#111214]/95 p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="relative">
            <ChatAvatar name={call.peer.displayName} src={call.peer.avatarUrl} size="lg" />
            <span aria-hidden="true" className="absolute inset-0 rounded-full ring-2 ring-accent motion-safe:animate-ping" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[17px] font-semibold">{call.peer.displayName}</strong>
            <span className="flex items-center gap-1.5 text-[13px] text-white/60">
              {call.media === 'video' ? <Video size={14} /> : <Phone size={14} />}
              Incoming {call.media === 'video' ? 'video' : 'audio'} call
            </span>
          </span>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/25 disabled:opacity-50"
          >
            <PhoneOff size={18} /> Decline
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-50"
          >
            {call.media === 'video' ? <Video size={18} /> : <Phone size={18} />} Accept
          </button>
        </div>
      </div>
    </div>
  );
}
