'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const useDelayedRedirect = () => {
  const router = useRouter();
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      for (const timerId of timerIdsRef.current) {
        clearTimeout(timerId);
      }
      timerIdsRef.current = [];
    };
  }, []);

  const scheduleReplace = useCallback(
    (href: string, delayMs: number) => {
      const timerId = setTimeout(() => {
        router.replace(href);
      }, delayMs);

      timerIdsRef.current.push(timerId);
      return timerId;
    },
    [router]
  );

  return { scheduleReplace };
};
