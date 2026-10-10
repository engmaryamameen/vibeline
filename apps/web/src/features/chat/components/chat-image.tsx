'use client';

import { useEffect, useState } from 'react';
import type { MessageAttachment } from '@vibeline/contracts';

type Props = { attachment: MessageAttachment; onLoad: (url: string) => Promise<Blob>; onOpen: () => void };

export function ChatImage({ attachment, onLoad, onOpen }: Props) {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setSource(undefined);
    setFailed(false);
    void onLoad(attachment.url)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url, onLoad]);

  if (failed) {
    return (
      <p role="alert" className="flex h-40 min-w-[180px] items-center justify-center rounded-xl bg-black/10 px-3 text-center text-xs">
        Image unavailable
      </p>
    );
  }

  if (!source) return <div className="h-40 min-w-[180px] animate-pulse rounded-xl bg-black/10" />;

  return (
    <button type="button" onClick={onOpen} aria-label={`View ${attachment.originalFilename || 'image'}`} className="block overflow-hidden rounded-xl">
      <img src={source} alt={attachment.originalFilename || 'Chat image'} className="max-h-[360px] w-full object-cover" loading="lazy" />
    </button>
  );
}
