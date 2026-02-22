'use client';

import { Suspense } from 'react';

import { AuthLoadingScreen, useAuthCallback } from '@/src/features/auth';

function AuthCallbackContent() {
  const { error, isLoading } = useAuthCallback();

  return (
    <>
      {error && !isLoading ? (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="mt-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-slate-500">Redirecting to login...</p>
          </div>
        </main>
      ) : (
        <AuthLoadingScreen description="Completing sign-in..." />
      )}
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoadingScreen description="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
