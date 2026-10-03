'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react';

import { Button, Card, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { useVerifyEmail } from '@/src/features/auth/hooks/use-verify-email';

function VerifyEmailContent() {
  const {
    state,
    error,
    code,
    codeLoading,
    isCodeComplete,
    onCodeChange,
    submitCode
  } = useVerifyEmail();

  return (
    <AuthGuard mode="guest">
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-bg px-4 py-16">
        <div className="mb-8 flex items-center gap-2">
          <VibeLineLogo size="sm" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold text-content-primary">VibeLine</span>
        </div>

        <Card className="w-full max-w-sm animate-fade-in">
          {state === 'loading' && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <h1 className="mt-4 text-xl font-semibold text-content-primary">
                Verifying your email
              </h1>
              <p className="mt-2 text-sm text-content-secondary">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success/20">
                <CheckCircle className="h-6 w-6 text-status-success" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-content-primary">Email verified!</h1>
              <p className="mt-2 text-sm text-content-secondary">
                Your email has been verified successfully. Redirecting to the app...
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-error/20">
                <XCircle className="h-6 w-6 text-status-error" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-content-primary">
                Verification failed
              </h1>
              <p className="mt-2 text-sm text-content-secondary">
                {error || 'The verification link is invalid or has expired.'}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button variant="secondary">Back to login</Button>
                </Link>
              </div>
            </div>
          )}

          {state === 'no-token' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                <Mail className="h-6 w-6 text-content-muted" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-content-primary">Check your inbox</h1>
              <p className="mt-2 text-sm text-content-secondary">
                We&apos;ve sent a verification email. Click the link in the email, or enter the
                6-digit verification code below.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(event) => onCodeChange(event.target.value)}
                    className="w-32 text-center font-mono text-lg tracking-widest"
                    disabled={codeLoading}
                    aria-label="6-digit verification code"
                  />
                  <Button onClick={submitCode} disabled={codeLoading || !isCodeComplete}>
                    {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
              </div>
              {error && <p className="mt-2 text-sm text-status-error">{error}</p>}
              <div className="mt-6">
                <Link href="/login">
                  <Button variant="secondary">Back to login</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </main>
    </AuthGuard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-surface-bg px-4 py-16">
          <div className="mb-8 flex items-center gap-2">
            <VibeLineLogo size="sm" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-semibold text-content-primary">VibeLine</span>
          </div>
          <Card className="w-full max-w-sm animate-fade-in">
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="mt-4 text-sm text-content-secondary">Loading...</p>
            </div>
          </Card>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
