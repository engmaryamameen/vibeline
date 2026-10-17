'use client';

import { Play } from 'lucide-react';
import type { MessageAttachment } from '@vibeline/contracts';
import { useMediaBlob } from '@/src/features/media/hooks/use-media-blob';

type Props = { attachment: MessageAttachment; onOpen: () => void };

export function VideoMessage({ attachment, onOpen }: Props) {
  const { src, failed } = useMediaBlob(attachment.url, attachment.mimeType.startsWith('video/') ? attachment.mimeType : 'video/webm');

  if (failed) {
    return (
      <p role="alert" className="flex h-40 w-64 items-center justify-center rounded-xl bg-black/[.06] text-sm text-black/55">
        Video unavailable
      </p>
    );
  }

  if (!src) {
    return <div className="flex h-40 w-64 animate-pulse items-center justify-center rounded-xl bg-black/10 text-sm text-black/50">Loading video…</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Play ${attachment.originalFilename || 'video'}`}
      className="group relative block overflow-hidden rounded-xl bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <video src={src} muted playsInline preload="metadata" className="max-h-[420px] w-full max-w-[320px]" />
      <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black/55 text-white transition-transform group-hover:scale-105">
          <Play size={24} fill="currentColor" className="ml-0.5" />
        </span>
      </span>
    </button>
  );
}
