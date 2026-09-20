'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { User } from '@vibeline/types';

import { VibeLineLogo } from '@vibeline/ui';

import { apiClient } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';

type AuthGuardMode = 'protected' | 'guest';

type AuthGuardProps = {
  mode: AuthGuardMode;
  children: ReactNode;
};

export const AuthGuard = ({ mode, children }: AuthGuardProps) => {
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

    let active = true;
    const hydrateSession = async () => {
      try {
        const { user } = await apiClient<{ user: User }>('/users/me', { token });
        if (!active) return;
        setSession({ token, currentUser: user });
      } catch {
        try {
          const refreshResponse = await apiClient<{ tokens: { accessToken: string } }>('/auth/refresh', {
            method: 'POST'
          });
          const nextToken = refreshResponse.tokens.accessToken;
          const { user } = await apiClient<{ user: User }>('/users/me', { token: nextToken });

          if (!active) return;
          setSession({ token: nextToken, currentUser: user });
        } catch {
          if (!active) return;
          clearSession();
        }
      } finally {
        if (!active) return;
        setChecked(true);
      }
    };

    hydrateSession();

    return () => {
      active = false;
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

  // For guest pages (login/register): show content immediately if no token
  // No need to wait for hydration check when user isn't logged in
  if (mode === 'guest') {
    if (!hasHydrated) {
      // Brief wait for hydration, but render children immediately after
      return <>{children}</>;
    }
    if (token) {
      // User is logged in, redirect to home
      return null;
    }
    return <>{children}</>;
  }

  // For protected pages: show loading while checking auth
  if (!hasHydrated || !checked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Animated Logo */}
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 animate-ping rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30" />
          {/* Glow effect */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-xl" />
          {/* Logo container */}
          <VibeLineLogo size="lg" className="relative" />
        </div>

        {/* Brand name */}
        <h1 className="mt-6 text-xl font-bold text-slate-900">VibeLine</h1>

        {/* Loading indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
          </div>
        </div>

        {/* Subtle text */}
        <p className="mt-3 text-sm text-slate-500">Loading your workspace...</p>
      </main>
    );
  }

  if (!token) return null;

  return <>{children}</>;
};
