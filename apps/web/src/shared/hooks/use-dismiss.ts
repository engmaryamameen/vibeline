'use client';

import { useEffect, type RefObject } from 'react';

type Options = {
  active: boolean;
  onDismiss: () => void;
  ref?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
};

export const useDismiss = ({ active, onDismiss, ref, closeOnEscape = true, closeOnOutside = true }: Options) => {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!closeOnOutside || !ref?.current) return;
      if (!ref.current.contains(event.target as Node)) onDismiss();
    };

    document.addEventListener('keydown', onKeyDown);
    if (closeOnOutside && ref) document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [active, onDismiss, ref, closeOnEscape, closeOnOutside]);
};
