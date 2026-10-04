'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
  AuthField,
  AuthHeader,
  AuthNotice,
  AuthPage,
  PasswordToggle,
  SocialAuth,
  SubmitButton
} from '@/src/features/auth/components/auth-surface';
import { useLogin } from '@/src/features/auth/hooks/use-login';
import { env } from '@/src/lib/env';

export default function LoginPage() {
  const {
    loading,
    resending,
    error,
    errorCode,
    fieldErrors,
    resendSuccess,
    showPassword,
    onSubmit,
    clearFieldError,
    resendVerification,
    togglePasswordVisibility
  } = useLogin();

  return (
    <AuthPage>
      <AuthHeader title="Login" description="Welcome back. Continue your conversations from where you left them." />

      <form className="space-y-5" onSubmit={onSubmit} aria-label="Login form" noValidate>
        <AuthField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          error={fieldErrors.email}
          onChange={() => clearFieldError('email')}
        />

        <AuthField
          label="Password"
          labelAction={
            <Link href="/forgot-password" className="text-xs font-medium text-accent transition-colors hover:text-accent-hover">
              Forgot password?
            </Link>
          }
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          error={fieldErrors.password}
          onChange={() => clearFieldError('password')}
          trailing={<PasswordToggle visible={showPassword} onClick={togglePasswordVisibility} />}
        />

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

        {resendSuccess && <AuthNotice tone="success">Verification email sent. Check your inbox.</AuthNotice>}

        <SubmitButton loading={loading} loadingLabel="Signing in…">
          <span>Login</span>
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </form>

      <SocialAuth apiBaseUrl={env.apiBaseUrl} />

      <p className="mt-7 text-center text-sm text-content-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-accent transition-colors hover:text-accent-hover">
          Register
        </Link>
      </p>
    </AuthPage>
  );
}
