'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Lock,
  Mail,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';

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
import { useRegister } from '@/src/features/auth/hooks/use-register';
import { env } from '@/src/lib/env';

const features = [
  {
    icon: MessageCircleMore,
    title: 'One clear place',
    description: 'Keep conversations focused and easy to return to.'
  },
  {
    icon: ShieldCheck,
    title: 'Yours by default',
    description: 'Verified identity and protected account access.'
  },
  {
    icon: Sparkles,
    title: 'Built to feel alive',
    description: 'Thoughtful interactions without visual clutter.'
  }
];

export default function RegisterPage() {
  const {
    loading,
    error,
    success,
    showPassword,
    onSubmit,
    togglePasswordVisibility
  } = useRegister();

  return (
    <AuthGuard mode="guest">
      <AuthShell
        eyebrow="Start a new line"
        title="Make room for"
        accent="better conversations."
        description="Create your space in seconds. Simple enough to feel effortless, structured enough to grow with you."
        features={features}
      >
        <AuthHeader
          kicker="Create account"
          title="Your space starts here."
          description="A few details and you’re ready to start talking."
        />

        <form className="space-y-5" onSubmit={onSubmit} aria-label="Registration form">
          <AuthField
            label="Full name"
            icon={User}
            id="displayName"
            name="displayName"
            autoComplete="name"
            placeholder="Alex Johnson"
            required
          />
          <AuthField
            label="Email address"
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            required
          />
          <AuthField
            label="Password"
            icon={Lock}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            trailing={
              <PasswordToggle
                visible={showPassword}
                onClick={togglePasswordVisibility}
              />
            }
          />

          {success && (
            <AuthNotice tone="success">
              Account created. Check your inbox to verify your email.
            </AuthNotice>
          )}
          {error && <AuthNotice>{error}</AuthNotice>}

          <SubmitButton loading={loading} loadingLabel="Creating account…">
            Create account <ArrowRight className="h-4 w-4" />
          </SubmitButton>
        </form>

        <SocialAuth apiBaseUrl={env.apiBaseUrl} />

        <p className="mt-7 text-center text-sm text-content-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-content-primary hover:text-accent">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </AuthGuard>
  );
}
