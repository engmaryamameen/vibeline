'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

import type { User as UserType } from '@vibeline/types';
import { Button, Input, VibeLineLogo } from '@vibeline/ui';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { apiClient } from '@/src/lib/api-client';
import { env } from '@/src/lib/env';

type AuthResponse = {
  user: UserType;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
  message?: string;
};

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get('displayName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { displayName, email, password }
      });

      setSuccess(true);
      setTimeout(() => router.replace('/verify-email'), 2500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

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
                Join thousands of teams who use VibeLine to collaborate,
                communicate, and get work done faster.
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
            <form className="space-y-5" aria-label="Registration form" onSubmit={onSubmit}>
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
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Registration successful! We&apos;ve sent a verification email to your inbox. Please check your email and click the link to verify your address.</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                <Link href="#" className="text-accent hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
              </p>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-content-muted">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`${env.apiBaseUrl}/auth/google`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-panel px-4 py-2.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </a>
              <a
                href={`${env.apiBaseUrl}/auth/github`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-panel px-4 py-2.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>

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
