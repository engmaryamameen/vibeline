'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/src/store/auth.store';

import { authApi, userApi } from '../api';

type AuthGuardMode = 'protected' | 'guest';

export const useAuthGuard = (mode: AuthGuardMode) => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || currentUser) {
      setChecked(true);
      return;
    }

    let isActive = true;

    const hydrateSession = async () => {
      try {
        const { user } = await userApi.getProfile(token);
        if (!isActive) return;
        setSession({ token, currentUser: user });
      } catch {
        try {
          const refreshResponse = await authApi.refresh();
          const nextToken = refreshResponse.tokens.accessToken;
          const { user } = await userApi.getProfile(nextToken);
          if (!isActive) return;
          setSession({ token: nextToken, currentUser: user });
        } catch {
          if (!isActive) return;
          clearSession();
        }
      } finally {
        if (!isActive) return;
        setChecked(true);
      }
    };

    hydrateSession();

    return () => {
      isActive = false;
    };
  }, [clearSession, currentUser, hasHydrated, setSession, token]);

  useEffect(() => {
    if (!hasHydrated || !checked) return;

    if (mode === 'protected' && !token) {
      router.replace('/login');
      return;
    }

    if (mode === 'guest' && token) {
      router.replace('/');
    }
  }, [checked, hasHydrated, mode, router, token]);

  return {
    showProtectedLoader: mode === 'protected' && (!hasHydrated || !checked),
    shouldRenderGuestContent: mode === 'guest' && (!hasHydrated || !token),
    shouldRenderProtectedContent: mode === 'protected' && hasHydrated && checked && Boolean(token)
  };
};
