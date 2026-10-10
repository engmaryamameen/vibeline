'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  count: number;
  durationMs: number;
  ready: boolean;
  onComplete: () => void;
};

export type StoryPlayback = {
  index: number;
  progress: number;
  paused: boolean;
  setIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  pause: () => void;
  resume: () => void;
};

export const useStoryPlayback = ({ count, durationMs, ready, onComplete }: Options): StoryPlayback => {
  const [index, setIndexState] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const setIndex = useCallback((value: number) => {
    elapsedRef.current = 0;
    setProgress(0);
    setIndexState(value);
  }, []);

  const next = useCallback(() => {
    if (index + 1 >= count) {
      onCompleteRef.current();
      return;
    }
    setIndex(index + 1);
  }, [count, index, setIndex]);

  const previous = useCallback(() => {
    if (index === 0) {
      elapsedRef.current = 0;
      setProgress(0);
      return;
    }
    setIndex(index - 1);
  }, [index, setIndex]);

  useEffect(() => {
    if (index > 0 && index >= count) setIndex(Math.max(0, count - 1));
  }, [count, index, setIndex]);

  useEffect(() => {
    if (!ready || paused || !count || durationMs <= 0) return;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      elapsedRef.current += now - lastTickRef.current;
      lastTickRef.current = now;
      const ratio = Math.min(1, elapsedRef.current / durationMs);
      setProgress(ratio);
      if (ratio >= 1) {
        next();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [count, durationMs, index, next, paused, ready]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState !== 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return { index, progress, paused, setIndex, next, previous, pause, resume };
};
