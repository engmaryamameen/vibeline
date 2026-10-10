'use client';

import { useEffect, useRef } from 'react';

type Props = {
  stream: MediaStream | null;
  muted: boolean;
  mirrored?: boolean;
  className?: string;
  label: string;
};

export function CallVideoSurface({ stream, muted, mirrored = false, className, label }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.srcObject = stream;
    if (stream) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      aria-label={label}
      className={className}
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}
