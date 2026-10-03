'use client';

import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import {
  AuthField,
  AuthHeader,
  AuthNotice,
  AuthShell,
  SubmitButton
} from '@/src/components/auth/auth-surface';
import { useForgotPassword } from '@/src/features/auth/hooks/use-forgot-password';

export default function ForgotPasswordPage() {
  const {
    loading,
    error,
    success,
    code,
    isCodeComplete,
    onSubmit,
    onCodeChange,
    onCodeKeyDown,
    onCodePaste,
    continueWithCode,
    setCodeInputRef
  } = useForgotPassword();

  return (
    <AuthGuard mode="guest">
      <AuthShell
        eyebrow="Account recovery"
        title="Lose the password,"
        accent="not the conversation."
        description="Recovery stays deliberately simple: verify it’s you, choose a new password, and continue where you left off."
        features={[
          {
            icon: ShieldCheck,
            title: 'Secure recovery',
            description: 'Reset access without exposing account details.'
          },
          {
            icon: KeyRound,
            title: 'Short-lived codes',
            description: 'A focused path back into your account.'
          }
        ]}
      >
        {!success ? (
          <>
            <AuthHeader
              kicker="Reset password"
              title="Find your way back."
              description="Enter your email and we’ll send recovery instructions if an account exists."
            />
            <form className="space-y-5" onSubmit={onSubmit}>
              <AuthField
                label="Email address"
                icon={Mail}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
              {error && <AuthNotice>{error}</AuthNotice>}
              <SubmitButton loading={loading} loadingLabel="Sending…">
                Send recovery link
              </SubmitButton>
            </form>
          </>
        ) : (
          <>
            <AuthHeader
              kicker="Check your inbox"
              title="We sent the next step."
              description="Use the link in your email, or enter the six digit recovery code below."
            />
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => setCodeInputRef(index, element)}
                  value={digit}
                  onChange={(event) => onCodeChange(index, event.target.value)}
                  onKeyDown={(event) => onCodeKeyDown(index, event)}
                  onPaste={onCodePaste}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  className="h-14 min-w-0 flex-1 rounded-xl border border-border bg-surface-panel text-center text-xl font-semibold text-content-primary outline-none transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out hover:border-border-strong focus:border-accent/70 focus:ring-4 focus:ring-accent/10 focus:scale-[1.02]"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={continueWithCode}
              disabled={!isCodeComplete}
              className="auth-primary mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            >
              Continue
            </button>
          </>
        )}

        <Link
          href="/login"
          className="mt-7 flex items-center justify-center gap-2 text-sm text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </AuthShell>
    </AuthGuard>
  );
}
