'use client';

import Link from 'next/link';
import { ArrowRight, Globe2, Lock, Mail, ShieldCheck, Zap } from 'lucide-react';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import {
  AuthField,
  AuthHeader,
  AuthNotice,
  AuthShell,
  PasswordToggle,
  SocialAuth,
  SubmitButton
} from '@/src/components/auth/auth-surface';
import { useLogin } from '@/src/features/auth/hooks/use-login';
import { env } from '@/src/lib/env';

const features = [
  {
    icon: Zap,
    title: 'Fast by default',
    description: 'Conversations stay fluid across every screen.'
  },
  {
    icon: ShieldCheck,
    title: 'Private space',
    description: 'Secure sessions and protected conversations.'
  },
  {
    icon: Globe2,
    title: 'Always in reach',
    description: 'Designed intentionally for desktop and mobile.'
  }
];

export default function LoginPage() {
  const {
    loading,
    resending,
    error,
    errorCode,
    resendSuccess,
    showPassword,
    onSubmit,
    resendVerification,
    togglePasswordVisibility
  } = useLogin();

  return (
    <AuthGuard mode="guest">
      <AuthShell
        eyebrow="Welcome back"
        title="Pick up where"
        accent="the conversation left off."
        description="A calm, focused place for conversations that matter, without the noise around them."
        features={features}
      >
        <AuthHeader
          kicker="Sign in"
          title="Good to see you again."
          description="Use your account details to return to your conversations."
        />

        <form className="space-y-5" onSubmit={onSubmit} aria-label="Login form">
          <AuthField
            label="Email address"
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-content-primary">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
            <AuthField
              label=""
              aria-label="Password"
              icon={Lock}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              trailing={
                <PasswordToggle
                  visible={showPassword}
                  onClick={togglePasswordVisibility}
                />
              }
            />
          </div>

          {error && (
            <AuthNotice>
              {error}
              {errorCode === 'EMAIL_NOT_VERIFIED' && (
                <button
                  type="button"
                  disabled={resending}
                  onClick={resendVerification}
                  className="ml-1 font-semibold underline underline-offset-2"
                >
                  {resending ? 'Sending…' : 'Resend verification'}
                </button>
              )}
            </AuthNotice>
          )}

          {resendSuccess && (
            <AuthNotice tone="success">Verification email sent. Check your inbox.</AuthNotice>
          )}

          <SubmitButton loading={loading} loadingLabel="Signing in…">
            Sign in <ArrowRight className="h-4 w-4" />
          </SubmitButton>
        </form>

        <SocialAuth apiBaseUrl={env.apiBaseUrl} />

        <p className="mt-7 text-center text-sm text-content-secondary">
          New here?{' '}
          <Link href="/register" className="font-semibold text-content-primary hover:text-accent">
            Create an account
          </Link>
        </p>
      </AuthShell>
    </AuthGuard>
  );
}
