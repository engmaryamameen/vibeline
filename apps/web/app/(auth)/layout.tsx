import type { ReactNode } from 'react';

import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { AuthShell } from '@/src/features/auth/components/auth-surface';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthGuard mode="guest">
      <AuthShell>{children}</AuthShell>
    </AuthGuard>
  );
}
