'use client';

import type { ReactNode } from 'react';

import { AuthLoadingScreen, useAuthGuard } from '@/src/features/auth';

type AuthGuardMode = 'protected' | 'guest';

type AuthGuardProps = {
  mode: AuthGuardMode;
  children: ReactNode;
};

export const AuthGuard = ({ mode, children }: AuthGuardProps) => {
  const { showProtectedLoader, shouldRenderGuestContent, shouldRenderProtectedContent } =
    useAuthGuard(mode);

  if (mode === 'guest') {
    if (!shouldRenderGuestContent) return null;
    return <>{children}</>;
  }

  if (showProtectedLoader) {
    return <AuthLoadingScreen />;
  }

  if (!shouldRenderProtectedContent) return null;
  return <>{children}</>;
};
