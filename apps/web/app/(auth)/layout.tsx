import type { ReactNode } from 'react';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { AuthShell } from '@/src/components/auth/auth-surface';

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
