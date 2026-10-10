'use client';

import { useEffect, useRef } from 'react';

export function CallAudioSink({ stream }: { stream: MediaStream | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.srcObject = stream;
    if (stream) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay aria-hidden="true" className="hidden" />;
}
