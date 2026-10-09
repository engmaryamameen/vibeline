'use client';

import { useEffect, useState } from 'react';
import type { Message } from '@vibeline/contracts';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Attachment = Message['attachments'][number];
type Props = { attachments: Attachment[]; selectedId: string | null; onClose: () => void; onSelect: (id: string) => void; onLoad: (url: string) => Promise<Blob> };

export function ChatMediaViewer({ attachments, selectedId, onClose, onSelect, onLoad }: Props) {
  const index = attachments.findIndex(item => item.id === selectedId);
  const current = index >= 0 ? attachments[index] : undefined;
  const [source, setSource] = useState<string>();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!current) return;
    let active = true;
    let objectUrl: string | undefined;
    setSource(undefined);
    setError(false);
    void onLoad(current.url).then(blob => {
      if (!active) return;
      const type = current.mimeType.startsWith('video/') ? current.mimeType : current.mimeType.startsWith('image/') ? current.mimeType : blob.type;
      objectUrl = URL.createObjectURL(new Blob([blob], { type }));
      setSource(objectUrl);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [current?.id, current?.url, current?.mimeType, onLoad]);
  useEffect(() => {
    if (!current) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && index > 0) onSelect(attachments[index - 1]!.id);
      if (event.key === 'ArrowRight' && index < attachments.length - 1) onSelect(attachments[index + 1]!.id);
    };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKey); };
  }, [current?.id, index, attachments, onClose, onSelect]);
  if (!current) return null;
  const isVideo = current.mimeType.startsWith('video/') || /\.(?:mp4|mov|m4v)$/i.test(current.originalFilename ?? '') || (/\.webm$/i.test(current.originalFilename ?? '') && current.mimeType.startsWith('video/'));
  return <div role="dialog" aria-modal="true" aria-label="Chat media viewer" className="fixed inset-0 z-[150] flex flex-col bg-black/95 text-white" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
      <span className="min-w-0 truncate text-sm text-white/75">{current.originalFilename || (isVideo ? 'Video' : 'Photo')} <span className="ml-2 text-white/40">{index + 1} / {attachments.length}</span></span>
      <button type="button" onClick={onClose} aria-label="Close media viewer" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={22}/></button>
    </div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4 sm:px-20" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      {error ? <p role="alert">Unable to load this media.</p> : !source ? <p className="text-white/70">Loading media…</p> : isVideo ? <video key={current.id} src={source} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain" /> : <img src={source} alt={current.originalFilename || 'Chat image'} className="max-h-full max-w-full select-none object-contain" />}
      {index > 0 && <button type="button" onClick={() => onSelect(attachments[index - 1]!.id)} aria-label="Previous media" className="absolute left-2 rounded-full bg-white/15 p-2 hover:bg-white/25 sm:left-5"><ChevronLeft size={24}/></button>}
      {index < attachments.length - 1 && <button type="button" onClick={() => onSelect(attachments[index + 1]!.id)} aria-label="Next media" className="absolute right-2 rounded-full bg-white/15 p-2 hover:bg-white/25 sm:right-5"><ChevronRight size={24}/></button>}
    </div>
  </div>;
}
