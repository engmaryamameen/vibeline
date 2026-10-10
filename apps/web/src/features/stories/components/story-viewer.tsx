'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { storyAgeLabel, type Story, type StoryAuthor } from '@vibeline/contracts';
import { ChevronLeft, ChevronRight, Eye, Trash2, X } from 'lucide-react';
import { ChatAvatar } from '@/src/features/chat/components/chat-avatar';
import { useStoryPlayback } from '../hooks/use-story-playback';
import { StoryMedia } from './story-media';
import { StoryProgressBar } from './story-progress-bar';
import { StoryViewersSheet } from './story-viewers-sheet';

type Props = {
  author: StoryAuthor;
  stories: Story[];
  loading: boolean;
  error: string;
  isSelf: boolean;
  onClose: () => void;
  onViewed: (storyId: string) => void;
  onDelete: (storyId: string) => Promise<void>;
};

export function StoryViewer({ author, stories, loading, error, isSelf, onClose, onViewed, onDelete }: Props) {
  const [durationMs, setDurationMs] = useState(5_000);
  const [mediaReady, setMediaReady] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const viewedRef = useRef(new Set<string>());

  const playback = useStoryPlayback({ count: stories.length, durationMs, ready: mediaReady && !viewersOpen, onComplete: onClose });
  const story = stories[playback.index];

  useEffect(() => {
    setMediaReady(false);
  }, [story?.id]);

  useEffect(() => {
    if (!story || isSelf || viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    onViewed(story.id);
  }, [story, isSelf, onViewed]);

  const { next, previous, pause, resume, paused } = playback;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === ' ') {
        event.preventDefault();
        if (paused) resume();
        else pause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, next, previous, pause, resume, paused]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onMediaReady = useCallback((value: number) => {
    setDurationMs(value);
    setMediaReady(true);
  }, []);

  const onMediaFailed = useCallback(() => setMediaReady(false), []);

  const remove = async () => {
    if (!story || deleting) return;
    setDeleting(true);
    try {
      await onDelete(story.id);
      if (stories.length <= 1) onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Stories from ${author.displayName}`} className="fixed inset-0 z-[170] flex flex-col bg-black text-white motion-safe:animate-fade-in">
      <div className="shrink-0 px-4 pt-4">
        {stories.length > 0 && <StoryProgressBar count={stories.length} index={playback.index} progress={playback.progress} />}
        <div className="mt-3 flex items-center gap-3">
          <ChatAvatar name={author.displayName} src={author.avatarUrl} />
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[15px] font-semibold">{isSelf ? 'Your story' : author.displayName}</strong>
            {story && <span className="block text-[12px] text-white/55">{storyAgeLabel(story.createdAt)}</span>}
          </span>
          {isSelf && story && (
            <>
              <button
                type="button"
                onClick={() => {
                  setViewersOpen(true);
                  playback.pause();
                }}
                aria-label="See who viewed this story"
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/25"
              >
                <Eye size={14} /> {story.viewCount}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void remove()}
                aria-label="Delete this story"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button type="button" onClick={onClose} aria-label="Close stories" className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {loading ? (
          <p className="text-sm text-white/60">Loading stories…</p>
        ) : error ? (
          <p role="alert" className="px-8 text-center text-sm text-white/75">
            {error}
          </p>
        ) : !story ? (
          <p className="px-8 text-center text-sm text-white/75">These stories are no longer available.</p>
        ) : (
          <StoryMedia story={story} paused={playback.paused || viewersOpen} onReady={onMediaReady} onFailed={onMediaFailed} />
        )}

        {story && (
          <>
            <button
              type="button"
              aria-label="Previous story"
              onClick={playback.previous}
              onPointerDown={playback.pause}
              onPointerUp={playback.resume}
              className="absolute inset-y-0 left-0 w-1/3 cursor-default focus-visible:outline-none"
            />
            <button
              type="button"
              aria-label="Next story"
              onClick={playback.next}
              onPointerDown={playback.pause}
              onPointerUp={playback.resume}
              className="absolute inset-y-0 right-0 w-1/3 cursor-default focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={playback.previous}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute left-2 hidden h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:grid"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={playback.next}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute right-2 hidden h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:grid"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {playback.paused && story && !viewersOpen && (
          <span className="pointer-events-none absolute bottom-24 rounded-full bg-black/55 px-3 py-1 text-xs text-white/80">Paused</span>
        )}

        {viewersOpen && story && (
          <StoryViewersSheet
            storyId={story.id}
            onClose={() => {
              setViewersOpen(false);
              playback.resume();
            }}
          />
        )}
      </div>

      {story?.caption && (
        <p className="shrink-0 px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-center text-[15px] leading-5">{story.caption}</p>
      )}
    </div>
  );
}
