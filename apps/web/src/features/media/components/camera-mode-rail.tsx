'use client';

import { useRef } from 'react';

export type CameraMode = 'photo' | 'video';

const MODES: CameraMode[] = ['photo', 'video'];
const SWIPE_THRESHOLD = 45;

type Props = { value: CameraMode; disabled?: boolean; onChange: (mode: CameraMode) => void };

export function CameraModeRail({ value, disabled = false, onChange }: Props) {
  const touchStartRef = useRef<number | null>(null);

  return (
    <div
      role="radiogroup"
      aria-label="Camera mode"
      onTouchStart={(event) => {
        touchStartRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartRef.current = null;
        if (start === null || end === undefined || disabled) return;
        if (Math.abs(end - start) > SWIPE_THRESHOLD) onChange(end < start ? 'video' : 'photo');
      }}
      className="flex justify-center gap-3"
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          disabled={disabled}
          onClick={() => onChange(mode)}
          className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest transition-colors disabled:opacity-40 ${
            value === mode ? 'bg-white text-black' : 'bg-white/20 text-white/75 hover:bg-white/30'
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
