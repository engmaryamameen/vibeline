'use client';

import { useEffect, useState } from 'react';
import { baseMimeType, isVideoMedia, type MessageAttachment } from '@vibeline/contracts';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  attachments: MessageAttachment[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onLoad: (url: string) => Promise<Blob>;
};

export function ChatMediaViewer({ attachments, selectedId, onClose, onSelect, onLoad }: Props) {
  const index = attachments.findIndex((item) => item.id === selectedId);
  const current = index >= 0 ? attachments[index] : undefined;
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);

  const currentId = current?.id;
  const currentUrl = current?.url;
  const currentMimeType = current?.mimeType;

  useEffect(() => {
    if (!currentUrl || !currentMimeType) return;
    let active = true;
    let objectUrl: string | undefined;
    setSource(undefined);
    setFailed(false);
    void onLoad(currentUrl)
      .then(async (blob) => {
        if (!active) return;
        const declared = baseMimeType(currentMimeType);
        const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : declared;
        const playable = blob.type === type ? blob : new Blob([await blob.arrayBuffer()], { type });
        if (!active) return;
        objectUrl = URL.createObjectURL(playable);
        setSource(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentId, currentUrl, currentMimeType, onLoad]);

  useEffect(() => {
    if (!currentId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && index > 0) onSelect(attachments[index - 1]!.id);
      if (event.key === 'ArrowRight' && index < attachments.length - 1) onSelect(attachments[index + 1]!.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [currentId, index, attachments, onClose, onSelect]);

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
        ) : !source ? (
          <p className="text-white/70">Loading media…</p>
        ) : isVideo ? (
          <video key={current.id} src={source} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <img src={source} alt={current.originalFilename || 'Chat image'} className="max-h-full max-w-full select-none object-contain" />
        )}

        {index > 0 && (
          <button
            type="button"
            onClick={() => onSelect(attachments[index - 1]!.id)}
            aria-label="Previous media"
            className="absolute left-2 rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25 sm:left-5"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {index < attachments.length - 1 && (
          <button
            type="button"
            onClick={() => onSelect(attachments[index + 1]!.id)}
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
