'use client';

import { callEndReasonLabel, type Call } from '@vibeline/contracts';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from 'lucide-react';
import { formatCallDuration } from '../hooks/use-call-duration';

type Props = { calls: Call[]; loading: boolean; error: string; currentUserId: string | undefined };

const MISSED_REASONS = new Set(['missed', 'rejected', 'canceled', 'busy', 'failed']);

const when = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const duration = (call: Call) => {
  if (!call.connectedAt || !call.endedAt) return undefined;
  const seconds = (new Date(call.endedAt).getTime() - new Date(call.connectedAt).getTime()) / 1000;
  return seconds >= 1 ? formatCallDuration(seconds) : undefined;
};

export function CallHistoryList({ calls, loading, error, currentUserId }: Props) {
  if (loading && !calls.length) return <p className="px-1 py-3 text-[13px] text-black/45">Loading calls…</p>;
  if (error) return <p role="alert" className="px-1 py-3 text-[13px] text-status-error">{error}</p>;
  if (!calls.length) return <p className="px-1 py-3 text-[13px] text-black/45">No calls yet.</p>;

  return (
    <ul className="divide-y divide-black/[.08]">
      {calls.map((call) => {
        const outgoing = call.callerId === currentUserId;
        const missed = MISSED_REASONS.has(call.endReason ?? '');
        const length = duration(call);
        const Icon = missed ? PhoneMissed : call.media === 'video' ? Video : outgoing ? PhoneOutgoing : PhoneIncoming;
        return (
          <li key={call.id} className="flex items-center gap-3 py-2.5">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${missed ? 'bg-status-error/10 text-status-error' : 'bg-black/[.05] text-black/55'}`}>
              <Icon size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] leading-5">
                {call.media === 'video' ? 'Video call' : 'Audio call'}
                <span className="ml-1.5 text-black/40">{outgoing ? 'out' : 'in'}</span>
              </span>
              <span className="block truncate text-[12px] text-black/45">
                {length ?? callEndReasonLabel(call.endReason, outgoing)}
              </span>
            </span>
            <time className="shrink-0 text-[12px] text-black/40">{when(call.createdAt)}</time>
          </li>
        );
      })}
    </ul>
  );
}
