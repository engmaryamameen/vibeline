'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell, VibeLineLogo } from '@vibeline/ui';

import { refreshAuthSession } from '@/src/lib/auth-session';

type AuthCallbackStatusProps = {
  error?: string | null;
  message: string;
};

function AuthCallbackStatus({ error, message }: AuthCallbackStatusProps) {
  return (
    <PageShell
      containerClassName="min-h-[100dvh] py-6 sm:py-8"
      gridClassName="min-h-[calc(100dvh-3rem)] items-center sm:min-h-[calc(100dvh-4rem)]"
    >
      <section className="col-span-4 flex flex-col items-center justify-center text-center md:col-span-4 md:col-start-3 lg:col-span-4 lg:col-start-5">
        <div className="relative">
          {!error && (
            <div className="absolute inset-0 animate-ping rounded-2xl bg-accent/15 motion-reduce:animate-none" />
          )}
          <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-xl" />
          <VibeLineLogo size="lg" className="relative" />
        </div>

        <h1 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-content-primary">VibeLine</h1>

        {error ? (
          <div className="mt-4">
            <p className="text-sm text-status-error">{error}</p>
            <p className="mt-2 text-xs text-content-muted">Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s] motion-reduce:animate-none" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s] motion-reduce:animate-none" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent motion-reduce:animate-none" />
            </div>
            <p className="mt-3 text-sm text-content-muted">{message}</p>
          </>
        )}
      </section>
    </PageShell>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(
        errorParam === 'account_link_required'
          ? 'An account with this email already exists. Sign in with its existing method before linking this provider.'
          : 'Authentication failed. Please try again.'
      );
      const timeout = window.setTimeout(() => router.replace('/login'), 3000);
      return () => window.clearTimeout(timeout);
    }

    let timeout: number | undefined;

    void refreshAuthSession()
      .then(() => router.replace('/'))
      .catch(() => {
        setError('Failed to complete sign-in');
        timeout = window.setTimeout(() => router.replace('/login'), 3000);
      });

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return <AuthCallbackStatus error={error} message="Completing sign-in..." />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackStatus message="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
