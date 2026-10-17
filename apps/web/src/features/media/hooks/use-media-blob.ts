'use client';

import { useEffect, useState } from 'react';
import { baseMimeType } from '@vibeline/contracts';
import { useMediaApi } from './use-media-api';

export type MediaBlobState = { src: string | undefined; loading: boolean; failed: boolean };

const resolveType = (blob: Blob, declared: string | undefined) => {
  if (blob.type && blob.type !== 'application/octet-stream') return blob.type;
  return declared ? baseMimeType(declared) : blob.type;
};

export const useMediaBlob = (url: string | undefined, declaredMimeType?: string): MediaBlobState => {
  const media = useMediaApi();
  const [src, setSrc] = useState<string>();
  const [loading, setLoading] = useState(Boolean(url));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) {
      setSrc(undefined);
      setLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | undefined;
    setSrc(undefined);
    setLoading(true);
    setFailed(false);

    void media
      .load(url, controller.signal)
      .then(async (blob) => {
        if (controller.signal.aborted) return;
        const type = resolveType(blob, declaredMimeType);
        const usable = !type || blob.type === type ? blob : new Blob([await blob.arrayBuffer()], { type });
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(usable);
        setSrc(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
        setLoading(false);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, declaredMimeType, media]);

  return { src, loading, failed };
};
