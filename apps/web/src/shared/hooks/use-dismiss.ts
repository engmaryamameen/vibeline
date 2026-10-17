'use client';

import { useEffect, useId, type RefObject } from 'react';

const stack: string[] = [];

const isTopmost = (id: string) => stack[stack.length - 1] === id;

type Options = {
  active: boolean;
  onDismiss: () => void;
  ref?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
};

export const useDismiss = ({ active, onDismiss, ref, closeOnEscape = true, closeOnOutside = true }: Options) => {
  const id = useId();

  useEffect(() => {
    if (!active) return;
    stack.push(id);
    return () => {
      const index = stack.lastIndexOf(id);
      if (index >= 0) stack.splice(index, 1);
    };
  }, [active, id]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!closeOnEscape || event.key !== 'Escape' || !isTopmost(id)) return;
      event.preventDefault();
      onDismiss();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!closeOnOutside || !ref?.current || !isTopmost(id)) return;
      if (!ref.current.contains(event.target as Node)) onDismiss();
    };

    document.addEventListener('keydown', onKeyDown);
    if (closeOnOutside && ref) document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [active, onDismiss, ref, closeOnEscape, closeOnOutside, id]);
};
