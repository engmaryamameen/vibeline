'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { restoreAuthSession } from '@/src/lib/auth-session';
import { useAuthStore } from '@/src/store/auth.store';

export type AuthGuardMode = 'guest' | 'protected';

export function useAuthGuard(mode: AuthGuardMode) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      if (token && currentUser) {
        if (active) setReady(true);
        return;
      }

      try {
        await restoreAuthSession();
      } catch {
        // Redirect logic below handles the unauthenticated state.
      } finally {
        if (active) setReady(true);
      }
    };

    void restore();

    return () => {
      active = false;
    };
  }, [currentUser, token]);

  useEffect(() => {
    if (!ready) return;

    const hasSession = Boolean(useAuthStore.getState().token);

    if (mode === 'protected' && !hasSession) {
      router.replace('/login');
      return;
    }

    if (mode === 'guest' && hasSession) {
      router.replace('/');
    }
  }, [mode, ready, router, token]);

  const isAllowed = mode === 'protected' ? Boolean(token) : !token;

  return {
    ready,
    isAllowed
  };
}
