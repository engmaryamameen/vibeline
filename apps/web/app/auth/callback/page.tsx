'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VibeLineLogo } from '@vibeline/ui';

import { refreshAuthSession } from '@/src/lib/auth-session';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam === 'account_link_required' ? 'An account with this email already exists. Sign in with its existing method before linking this provider.' : 'Authentication failed. Please try again.'); setIsLoading(false); setTimeout(() => router.replace('/login'), 3000); return;
    }
    const initSession = async () => {
      try {
        await refreshAuthSession(); router.replace('/');
      } catch { setError('Failed to complete sign-in'); setIsLoading(false); setTimeout(() => router.replace('/login'), 3000); }
    };
    initSession();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 animate-ping rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30" />
        )}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-xl" />
        <VibeLineLogo size="lg" className="relative" />
      </div>

      <h1 className="mt-6 text-xl font-bold text-slate-900">VibeLine</h1>

      {error && !isLoading ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-2 text-xs text-slate-500">Redirecting to login...</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Completing sign-in...</p>
        </>
      )}
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30" />
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-xl" />
            <VibeLineLogo size="lg" className="relative" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-slate-900">VibeLine</h1>
          <div className="mt-4 flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Loading...</p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
