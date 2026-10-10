'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { baseMimeType, type MessageAttachment } from '@vibeline/contracts';

type Props = { attachment: MessageAttachment; onLoad: (url: string) => Promise<Blob>; onOpen: () => void };

const playableType = (blob: Blob, attachment: MessageAttachment) => {
  if (blob.type.startsWith('video/')) return blob.type;
  if (attachment.mimeType.startsWith('video/')) return baseMimeType(attachment.mimeType);
  return 'video/webm';
};

export function VideoMessage({ attachment, onLoad, onOpen }: Props) {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setSource(undefined);
    setFailed(false);
    void onLoad(attachment.url)
      .then(async (blob) => {
        if (!active) return;
        const type = playableType(blob, attachment);
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
  }, [attachment, onLoad]);

  if (failed) {
    return (
      <p role="alert" className="flex h-40 w-64 items-center justify-center rounded-xl bg-black/10 text-sm">
        Video unavailable
      </p>
    );
  }

  if (!source) {
    return <div className="flex h-40 w-64 animate-pulse items-center justify-center rounded-xl bg-black/10 text-sm text-black/50">Loading video…</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Play ${attachment.originalFilename || 'video'}`}
      className="group relative block overflow-hidden rounded-xl bg-black"
    >
      <video src={source} muted playsInline preload="metadata" className="max-h-[420px] w-full max-w-[320px]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black/55 text-white transition-transform group-hover:scale-105">
          <Play size={24} fill="currentColor" className="ml-0.5" />
        </span>
      </span>
    </button>
  );
}
