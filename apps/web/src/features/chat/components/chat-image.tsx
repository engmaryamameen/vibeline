'use client';

import type { MessageAttachment } from '@vibeline/contracts';
import { useMediaBlob } from '@/src/features/media/hooks/use-media-blob';

type Props = { attachment: MessageAttachment; onOpen: () => void };

export function ChatImage({ attachment, onOpen }: Props) {
  const { src, failed } = useMediaBlob(attachment.url, attachment.mimeType);

  if (failed) {
    return (
      <p role="alert" className="flex h-40 min-w-[180px] items-center justify-center rounded-xl bg-black/[.06] px-3 text-center text-xs text-black/55">
        Image unavailable
      </p>
    );
  }

  if (!src) return <div className="h-40 min-w-[180px] animate-pulse rounded-xl bg-black/10" />;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${attachment.originalFilename || 'image'}`}
      className="block overflow-hidden rounded-xl transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <img src={src} alt={attachment.originalFilename || 'Chat image'} className="max-h-[360px] w-full object-cover" loading="lazy" />
    </button>
  );
}
