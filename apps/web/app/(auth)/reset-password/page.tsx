'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, XCircle } from 'lucide-react';

import { Button, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { useResetPassword } from '@/src/features/auth/hooks/use-reset-password';

function ResetPasswordContent() {
  const {
    loading,
    error,
    success,
    showPassword,
    showConfirmPassword,
    hasResetCredential,
    onSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility
  } = useResetPassword();

  if (!hasResetCredential) {
    return (
      <AuthGuard mode="guest">
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-16">
          <div className="mb-8 flex items-center gap-2">
            <VibeLineLogo size="md" />
            <span className="text-xl font-bold text-slate-900">VibeLine</span>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">Invalid reset link</h1>
              <p className="mt-2 text-sm text-slate-600">
                This password reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password" className="mt-6 w-full">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  Request new link
                </Button>
              </Link>
              <Link
                href="/login"
                className="mt-4 text-sm text-slate-600 transition-colors hover:text-slate-900"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard mode="guest">
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-16">
        <div className="mb-8 flex items-center gap-2">
          <VibeLineLogo size="md" />
          <span className="text-xl font-bold text-slate-900">VibeLine</span>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">Password reset!</h1>
              <p className="mt-2 text-sm text-slate-600">
                Your password has been reset successfully. Redirecting to sign in...
              </p>
              <Link href="/login" className="mt-6 w-full">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <span className="flex items-center gap-2">
                    Sign in now
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-xl font-semibold text-slate-900">Create new password</h1>
                <p className="mt-2 text-sm text-slate-600">Enter your new password below.</p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-slate-900">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="pl-10 pr-10"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-900">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="pl-10 pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-16">
          <div className="mb-8 flex items-center gap-2">
            <VibeLineLogo size="md" />
            <span className="text-xl font-bold text-slate-900">VibeLine</span>
          </div>
          <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
