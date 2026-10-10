'use client';

import { useEffect, useRef } from 'react';
import { EFFECTS, type EffectName } from '../lib/editor-model';

type Props = { value: EffectName; disabled?: boolean; onChange: (effect: EffectName) => void };

const SWIPE_THRESHOLD = 55;

export function EffectsRail({ value, disabled = false, onChange }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Partial<Record<EffectName, HTMLButtonElement | null>>>({});
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const button = buttonsRef.current[value];
    if (!rail || !button) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    rail.scrollTo({ left: button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2, behavior: motion });
  }, [value]);

  const step = (direction: 1 | -1) => {
    const index = EFFECTS.findIndex((item) => item.name === value);
    const next = EFFECTS[Math.min(EFFECTS.length - 1, Math.max(0, index + direction))];
    if (next) onChange(next.name);
  };

  return (
    <div
      ref={railRef}
      role="radiogroup"
      aria-label="Effects"
      onTouchStart={(event) => {
        touchStartRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartRef.current = null;
        if (start === null || end === undefined || disabled) return;
        if (Math.abs(end - start) > SWIPE_THRESHOLD) step(end < start ? 1 : -1);
      }}
      className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-44px)] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {EFFECTS.map((item) => (
        <button
          key={item.name}
          ref={(node) => {
            buttonsRef.current[item.name] = node;
          }}
          type="button"
          role="radio"
          aria-checked={value === item.name}
          disabled={disabled}
          onClick={() => onChange(item.name)}
          className={`shrink-0 snap-center rounded-full px-4 py-3 text-xs font-semibold transition-colors disabled:opacity-40 ${
            value === item.name ? 'bg-white text-black' : 'bg-white/25 text-white hover:bg-white/35'
          }`}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
