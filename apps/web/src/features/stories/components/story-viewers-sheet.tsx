'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StoryViewer } from '@vibeline/contracts';
import { X } from 'lucide-react';
import { useAuthorizedRequest } from '@/src/features/chat/hooks/use-authorized-request';
import { ChatAvatar } from '@/src/features/chat/components/chat-avatar';
import { storyApi } from '../api/story-api';

type Props = { storyId: string; onClose: () => void };

export function StoryViewersSheet({ storyId, onClose }: Props) {
  const request = useAuthorizedRequest();
  const api = useMemo(() => storyApi(request), [request]);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .viewers(storyId)
      .then((result) => {
        if (!cancelled) setViewers(result.viewers);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Viewers could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, storyId]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-hidden rounded-t-[24px] bg-[#16181B] text-white motion-safe:animate-slide-up">
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <h3 className="text-[15px] font-semibold">
          Viewed by {viewers.length > 0 && <span className="text-white/55">{viewers.length}</span>}
        </h3>
        <button type="button" onClick={onClose} aria-label="Close viewers" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
          <X size={18} />
        </button>
      </header>
      <div className="max-h-[calc(60vh-56px)] overflow-y-auto overscroll-contain p-3">
        {loading ? (
          <p className="py-6 text-center text-sm text-white/55">Loading viewers…</p>
        ) : error ? (
          <p role="alert" className="py-6 text-center text-sm text-status-error">
            {error}
          </p>
        ) : !viewers.length ? (
          <p className="py-6 text-center text-sm text-white/55">No one has viewed this story yet.</p>
        ) : (
          <ul className="space-y-1">
            {viewers.map((viewer) => (
              <li key={viewer.userId} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <ChatAvatar name={viewer.displayName} src={viewer.avatarUrl} />
                <span className="min-w-0 flex-1 truncate text-[15px]">{viewer.displayName}</span>
                <time className="shrink-0 text-[12px] text-white/45">
                  {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
