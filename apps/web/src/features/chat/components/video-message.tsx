'use client';

import { useEffect, useState } from 'react';
import type { Message } from '@vibeline/contracts';

type Attachment = Message['attachments'][number];

export function VideoMessage({ attachment, onLoad, onOpen }: { attachment: Attachment; onLoad: (url: string) => Promise<Blob>; onOpen: () => void }) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    setUrl(undefined);
    setError(false);
    void onLoad(attachment.url).then(blob => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(new Blob([blob], { type: blob.type.startsWith('video/') ? blob.type : attachment.mimeType.startsWith('video/') ? attachment.mimeType : 'video/webm' }));
      setUrl(objectUrl);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [attachment.url, attachment.mimeType, onLoad]);
  if (error) return <p role="alert" className="text-sm">Video unavailable</p>;
  if (!url) return <div className="flex h-40 w-64 items-center justify-center rounded-xl bg-black/10 text-sm">Loading video…</div>;
  return <button type="button" onClick={onOpen} aria-label="Open video in chat" className="relative block overflow-hidden rounded-xl bg-black"><video src={url} muted playsInline preload="metadata" className="max-h-[420px] w-full max-w-[320px]" /><span className="absolute inset-0 flex items-center justify-center bg-black/15 text-4xl text-white" aria-hidden="true">▶</span></button>;
}
