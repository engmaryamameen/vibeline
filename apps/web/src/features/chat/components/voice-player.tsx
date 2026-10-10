'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@vibeline/utils';
import { decodeWaveform, fallbackWaveform, formatDuration, VoiceWaveform } from './voice-waveform';

type Props = { src: string; own?: boolean; compact?: boolean };

export function VoicePlayer({ src, own = false, compact = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [bars, setBars] = useState<number[]>(fallbackWaveform);

  useEffect(() => {
    if (!src) return;
    let active = true;
    void fetch(src)
      .then((response) => response.blob())
      .then((blob) => decodeWaveform(blob))
      .then((values) => {
        if (active) setBars(values);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [src]);

  const syncDuration = (element: HTMLAudioElement) => {
    if (Number.isFinite(element.duration) && element.duration > 0) setDuration(element.duration);
  };

  const toggle = () => {
    const element = audioRef.current;
    if (!element || !src) return;
    if (element.paused) {
      document.querySelectorAll('audio[data-voice-message]').forEach((node) => {
        if (node !== element) (node as HTMLAudioElement).pause();
      });
      void element.play().catch(() => undefined);
    } else {
      element.pause();
    }
  };

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const element = audioRef.current;
    if (!element || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration));
    element.currentTime = next;
    setCurrent(next);
  };

  const progress = duration ? Math.min(1, current / duration) : 0;

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', compact ? 'w-full' : 'min-w-[245px] max-w-[330px]')}>
      <button
        type="button"
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95 disabled:opacity-50',
          own ? 'bg-white/20 text-white' : 'bg-[#0584FE] text-white'
        )}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex min-h-12 min-w-0 flex-1 flex-col justify-center">
        <div onClick={seek} className="flex h-9 cursor-pointer items-center">
          <VoiceWaveform bars={bars} progress={progress} own={own} />
        </div>
        <div className={cn('-mt-0.5 flex items-center justify-between text-[11px] tabular-nums', own ? 'text-white/75' : 'text-black/45')}>
          <span>{playing || current > 0 ? formatDuration(current) : formatDuration(duration)}</span>
          {playing && <span className="text-[10px]">1×</span>}
        </div>
      </div>

      <audio
        ref={audioRef}
        data-voice-message
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => syncDuration(event.currentTarget)}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          setCurrent(event.currentTarget.currentTime);
          syncDuration(event.currentTarget);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
    </div>
  );
}
