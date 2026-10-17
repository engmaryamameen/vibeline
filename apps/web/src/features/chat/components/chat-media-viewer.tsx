'use client';

import { useEffect } from 'react';
import { isVideoMedia, type MessageAttachment } from '@vibeline/contracts';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMediaBlob } from '@/src/features/media/hooks/use-media-blob';
import { useBodyScrollLock } from '@/src/shared/hooks/use-body-scroll-lock';

type Props = {
  attachments: MessageAttachment[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function ChatMediaViewer({ attachments, selectedId, onClose, onSelect }: Props) {
  const index = attachments.findIndex((item) => item.id === selectedId);
  const current = index >= 0 ? attachments[index] : undefined;
  const { src, failed } = useMediaBlob(current?.url, current?.mimeType);

  useBodyScrollLock(Boolean(current));

  const previous = index > 0 ? attachments[index - 1] : undefined;
  const next = index < attachments.length - 1 ? attachments[index + 1] : undefined;

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && previous) onSelect(previous.id);
      if (event.key === 'ArrowRight' && next) onSelect(next.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, previous, next, onClose, onSelect]);

  if (!current) return null;

  const isVideo = isVideoMedia(current.mimeType, current.originalFilename);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat media viewer"
      className="fixed inset-0 z-[150] flex flex-col bg-black/95 text-white motion-safe:animate-fade-in"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
        <span className="min-w-0 truncate text-sm text-white/75">
          {current.originalFilename || (isVideo ? 'Video' : 'Photo')}
          <span className="ml-2 text-white/40">
            {index + 1} / {attachments.length}
          </span>
        </span>
        <button type="button" onClick={onClose} aria-label="Close media viewer" className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
          <X size={22} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4 sm:px-20"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {failed ? (
          <p role="alert">Unable to load this media.</p>
        ) : !src ? (
          <p className="text-white/70">Loading media…</p>
        ) : isVideo ? (
          <video key={current.id} src={src} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <img src={src} alt={current.originalFilename || 'Chat image'} className="max-h-full max-w-full select-none object-contain" />
        )}

        {previous && (
          <button
            type="button"
            onClick={() => onSelect(previous.id)}
            aria-label="Previous media"
            className="absolute left-2 rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25 sm:left-5"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {next && (
          <button
            type="button"
            onClick={() => onSelect(next.id)}
            aria-label="Next media"
            className="absolute right-2 rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25 sm:right-5"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
