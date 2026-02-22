'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

import { Button, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { SocialAuthButtons, useRegisterForm } from '@/src/features/auth';

const features = [
  {
    icon: Zap,
    title: 'Real-time messaging',
    description: 'Instant delivery with zero lag'
  },
  {
    icon: Shield,
    title: 'Secure by design',
    description: 'End-to-end encryption for privacy'
  },
  {
    icon: Users,
    title: 'Team collaboration',
    description: 'Channels for every project'
  }
];

const RegisterPage = () => {
  const { loading, error, showPassword, success, setShowPassword, handleSubmit } =
    useRegisterForm();

  return (
    <AuthGuard mode="guest">
      <main className="flex min-h-screen">
        {/* Left Panel - Branding & Features */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 lg:flex lg:flex-col lg:justify-between">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* Floating Elements */}
          <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

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
                Connect with your
                <br />
                <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                  team instantly
                </span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-blue-100">
                Join thousands of teams who use VibeLine to collaborate, communicate, and get work
                done faster.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-blue-200">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="relative z-10 border-t border-white/10 px-12 py-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-sm text-blue-200">Active users</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-sm text-blue-200">Uptime</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold text-white">50M+</p>
                <p className="text-sm text-blue-200">Messages sent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="flex flex-1 flex-col justify-center bg-surface-bg px-6 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <VibeLineLogo size="md" />
              <span className="text-xl font-bold text-content-primary">VibeLine</span>
            </div>

            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" />
                Free to get started
              </div>
              <h2 className="mt-4 text-2xl font-bold text-content-primary lg:text-3xl">
                Create your account
              </h2>
              <p className="mt-2 text-content-secondary">
                Start collaborating with your team in minutes
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" aria-label="Registration form" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="displayName" className="text-sm font-medium text-content-primary">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Alex Johnson"
                    required
                    autoComplete="name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-content-primary">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                  <Input
                    id="email"
                    name="email"
                    placeholder="alex@company.com"
                    type="email"
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-content-primary">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Registration successful! We&apos;ve sent a verification email to your inbox.
                    Please check your email and click the link to verify your address.
                  </span>
                </div>
              )}

              {error && (
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
              )}

              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                type="submit"
                disabled={loading || success}
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-content-muted">
                By signing up, you agree to our{' '}
                <Link href="#" className="text-accent hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-content-muted">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social Login */}
            <SocialAuthButtons />

            {/* Sign in link */}
            <p className="mt-8 text-center text-sm text-content-secondary">
              Already have an account?{' '}
              <Link
                className="font-semibold text-accent transition-colors hover:text-accent-hover"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
};

export default RegisterPage;
