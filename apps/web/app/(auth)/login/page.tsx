'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { Button, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { SocialAuthButtons, useLoginForm } from '@/src/features/auth';

const highlights = [
  {
    icon: Zap,
    title: 'Lightning fast',
    description: 'Real-time messaging with zero delay'
  },
  {
    icon: Shield,
    title: 'Enterprise security',
    description: 'Bank-grade encryption for all data'
  },
  {
    icon: Globe,
    title: 'Global scale',
    description: 'Available in 190+ countries'
  }
];

const LoginPage = () => {
  const {
    loading,
    resending,
    error,
    resendSuccess,
    showPassword,
    isEmailNotVerified,
    setShowPassword,
    handleSubmit,
    handleResendVerification
  } = useLoginForm();

  return (
    <AuthGuard mode="guest">
      <main className="flex min-h-screen">
        {/* Left Panel - Branding & Highlights */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 lg:flex lg:flex-col lg:justify-between">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#dots)" />
            </svg>
          </div>

          {/* Floating Elements */}
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-32 left-10 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col justify-center px-12 py-16">
            {/* Logo */}
            <div className="mb-12 flex items-center gap-3">
              <VibeLineLogo size="md" variant="light" className="h-12 w-12 rounded-xl" />
              <span className="text-2xl font-bold text-white">VibeLine</span>
            </div>

            {/* Hero Text */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold leading-tight text-white">
                Welcome back to
                <br />
                <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  your workspace
                </span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-purple-100">
                Continue collaborating with your team. Your conversations and projects are waiting
                for you.
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-6">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <highlight.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{highlight.title}</h3>
                    <p className="text-sm text-purple-200">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Testimonial */}
          <div className="relative z-10 border-t border-white/10 px-12 py-6">
            <blockquote className="text-purple-100">
              <p className="text-sm italic">
                &ldquo;VibeLine transformed how our team communicates. It&apos;s fast, secure, and
                just works.&rdquo;
              </p>
              <footer className="mt-2 text-sm font-medium text-white">
                — Sarah Chen, Engineering Lead at TechCorp
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex flex-1 flex-col justify-center bg-surface-bg px-6 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <VibeLineLogo size="md" />
              <span className="text-xl font-bold text-content-primary">VibeLine</span>
            </div>

            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-content-primary lg:text-3xl">
                Sign in to your account
              </h2>
              <p className="mt-2 text-content-secondary">
                Enter your credentials to access your workspace
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" aria-label="Login form" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-content-primary">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-content-primary">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-accent transition-colors hover:text-accent-hover"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {resendSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verification email sent! Please check your inbox.
                </div>
              )}

              {error && !resendSuccess && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                  {isEmailNotVerified && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleResendVerification}
                      disabled={resending}
                    >
                      {resending ? (
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
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Resend verification email
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-content-muted">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social Login */}
            <SocialAuthButtons />

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-content-secondary">
              Don&apos;t have an account?{' '}
              <Link
                className="font-semibold text-accent transition-colors hover:text-accent-hover"
                href="/register"
              >
                Create one for free
              </Link>
            </p>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
};

export default LoginPage;
