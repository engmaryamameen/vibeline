'use client';

import type { ReactNode } from 'react';

import { useAuthGuard, type AuthGuardMode } from '@/src/features/auth/hooks/use-auth-guard';

type Props = {
  mode: AuthGuardMode;
  children: ReactNode;
};

export function AuthGuard({ mode, children }: Props) {
  const { ready, isAllowed } = useAuthGuard(mode);

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center">Loading…</main>;
  }

  if (!isAllowed) return null;

  return <>{children}</>;
}
