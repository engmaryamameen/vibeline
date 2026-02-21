'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { apiClient } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';

const HomePage = () => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors and clear local auth state anyway.
    } finally {
      clearSession();
      router.replace('/login');
      setLoggingOut(false);
    }
  };

  return (
    <AuthGuard mode="protected">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <VibeLineLogo size="md" />
          <div>
            <p className="text-sm text-content-secondary">Authentication Starter</p>
            <h1 className="text-2xl font-semibold text-content-primary">Portfolio-Ready Auth Base</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-sm text-content-secondary">Signed in as</p>
            <p className="mt-1 text-lg font-semibold text-content-primary">
              {currentUser?.displayName ?? 'Authenticated user'}
            </p>
            <p className="mt-1 text-sm text-content-secondary">{currentUser?.email ?? ''}</p>
            <p className="mt-3 text-xs text-content-muted">
              Email verified: {currentUser?.emailVerified ? 'yes' : 'no'}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-content-secondary">What is included</p>
            <p className="mt-2 text-sm text-content-primary">
              Login, registration, email verification, refresh token rotation, password reset, OAuth callbacks,
              protected route guard, and `/users/me`.
            </p>
            <Button className="mt-6 w-full" variant="secondary" onClick={onLogout} disabled={loggingOut}>
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
};

export default HomePage;
