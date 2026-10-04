'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';

import { Button, Input } from '@vibeline/ui';
import { AuthPage, AuthStatePanel } from '@/src/features/auth/components/auth-surface';
import { useVerifyEmail } from '@/src/features/auth/hooks/use-verify-email';

function VerifyEmailContent() {
  const { state, error, code, codeLoading, isCodeComplete, onCodeChange, submitCode } = useVerifyEmail();

  if (state === 'loading') {
    return (
      <AuthPage>
        <AuthStatePanel icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Verifying your email" description="This should only take a moment." />
      </AuthPage>
    );
  }

  if (state === 'success') {
    return (
      <AuthPage>
        <AuthStatePanel icon={<CheckCircle2 className="h-6 w-6" />} title="Email verified" description="Your account is ready. We’re taking you into VibeLine now." />
      </AuthPage>
    );
  }

  if (state === 'error') {
    return (
      <AuthPage>
        <AuthStatePanel
          icon={<XCircle className="h-6 w-6" />}
          title="Verification failed"
          description={error || 'The verification link is invalid or has expired.'}
        >
          <Link href="/login" className="mt-7 inline-flex text-sm font-semibold text-accent hover:text-accent-hover">Back to sign in</Link>
        </AuthStatePanel>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthStatePanel icon={<Mail className="h-6 w-6" />} title="Check your inbox" description="Open the verification link we sent, or enter the six digit code below.">
        <div className="mx-auto mt-7 flex max-w-xs gap-2">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            className="h-12 flex-1 rounded-xl text-center font-mono text-lg tracking-[0.25em]"
            disabled={codeLoading}
            aria-label="6-digit verification code"
          />
          <Button size="lg" className="h-12 rounded-xl px-5" onClick={submitCode} disabled={codeLoading || !isCodeComplete}>
            {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-status-error">{error}</p>}
      </AuthStatePanel>
    </AuthPage>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-64 w-full max-w-[420px] animate-pulse rounded-3xl bg-surface-soft" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
