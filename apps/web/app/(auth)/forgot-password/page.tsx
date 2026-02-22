'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';

import { Button, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { useForgotPassword } from '@/src/features/auth';

const ForgotPasswordPage = () => {
  const {
    loading,
    error,
    success,
    code,
    inputRefs,
    handleSubmit,
    handleCodeChange,
    handleCodeKeyDown,
    handleCodePaste,
    handleCodeSubmit
  } = useForgotPassword();

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
              <h1 className="mt-4 text-xl font-semibold text-slate-900">Check your email</h1>
              <p className="mt-2 text-sm text-slate-600">
                If an account with that email exists, we&apos;ve sent you a link and a code to reset
                your password.
              </p>

              <div className="mt-6 w-full">
                <p className="mb-3 text-sm font-medium text-slate-700">Enter your 6-digit code</p>
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      onPaste={handleCodePaste}
                      className="h-12 w-10 rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ))}
                </div>
                <Button
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  onClick={handleCodeSubmit}
                  disabled={code.some((digit) => !digit)}
                >
                  Continue
                </Button>
              </div>

              <div className="mt-4 flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link href="/login" className="mt-4 w-full">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-xl font-semibold text-slate-900">Forgot your password?</h1>
                <p className="mt-2 text-sm text-slate-600">
                  No worries! Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-900">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      placeholder="you@company.com"
                      type="email"
                      required
                      autoComplete="email"
                      className="pl-10"
                    />
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
                      Sending...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
};

export default ForgotPasswordPage;
