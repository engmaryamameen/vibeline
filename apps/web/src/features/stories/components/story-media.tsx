'use client';

import { useEffect, useRef } from 'react';
import { isVideoMedia, type Story } from '@vibeline/contracts';
import { useMediaBlob } from '@/src/features/media/hooks/use-media-blob';

type Props = {
  story: Story;
  paused: boolean;
  onReady: (durationMs: number) => void;
  onFailed: () => void;
};

export function StoryMedia({ story, paused, onReady, onFailed }: Props) {
  const { src, failed } = useMediaBlob(story.url, story.mimeType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoMedia(story.mimeType);

  useEffect(() => {
    if (failed) onFailed();
  }, [failed, onFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
  }, [paused, src]);

  if (failed) {
    return (
      <p role="alert" className="px-8 text-center text-sm text-white/75">
        This story could not be loaded.
      </p>
    );
  }

  if (!src) return <p className="text-sm text-white/60">Loading story…</p>;

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={src}
        playsInline
        autoPlay
        className="max-h-full max-w-full object-contain"
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          onReady(Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) : story.durationMs);
        }}
        onError={onFailed}
      />
    );
  }

  return (
    <img src={src} alt={story.caption || 'Story'} className="max-h-full max-w-full object-contain" onLoad={() => onReady(story.durationMs)} onError={onFailed} />
  );
}
