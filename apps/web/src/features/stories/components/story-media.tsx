'use client';

import { useEffect, useRef, useState } from 'react';
import { isVideoMedia, type Story } from '@vibeline/contracts';

type Props = {
  story: Story;
  paused: boolean;
  onLoad: (url: string) => Promise<Blob>;
  onReady: (durationMs: number) => void;
  onFailed: () => void;
};

export function StoryMedia({ story, paused, onLoad, onReady, onFailed }: Props) {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoMedia(story.mimeType);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setSource(undefined);
    setFailed(false);
    void onLoad(story.url)
      .then(async (blob) => {
        if (!active) return;
        const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : story.mimeType;
        const playable = blob.type === type ? blob : new Blob([await blob.arrayBuffer()], { type });
        if (!active) return;
        objectUrl = URL.createObjectURL(playable);
        setSource(objectUrl);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        onFailed();
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [story.url, story.mimeType, onLoad, onFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
  }, [paused, source]);

  if (failed) {
    return (
      <p role="alert" className="px-8 text-center text-sm text-white/75">
        This story could not be loaded.
      </p>
    );
  }

  if (!source) return <p className="text-sm text-white/60">Loading story…</p>;

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={source}
        playsInline
        autoPlay
        className="max-h-full max-w-full object-contain"
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          if (Number.isFinite(duration) && duration > 0) onReady(Math.round(duration * 1000));
          else onReady(story.durationMs);
        }}
        onError={() => {
          setFailed(true);
          onFailed();
        }}
      />
    );
  }

  return (
    <img
      src={source}
      alt={story.caption || 'Story'}
      className="max-h-full max-w-full object-contain"
      onLoad={() => onReady(story.durationMs)}
      onError={() => {
        setFailed(true);
        onFailed();
      }}
    />
  );
}
