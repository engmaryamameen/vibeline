'use client';

import Link from 'next/link';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

import {
  AuthField,
  AuthHeader,
  AuthNotice,
  AuthPage,
  PasswordToggle,
  SocialAuth,
  SubmitButton
} from '@/src/components/auth/auth-surface';
import { useRegister } from '@/src/features/auth/hooks/use-register';
import { env } from '@/src/lib/env';

export default function RegisterPage() {
  const { loading, error, success, showPassword, onSubmit, togglePasswordVisibility } = useRegister();

  return (
    <AuthPage>
      <AuthHeader title="Create account" description="Set up your space and start a conversation in a few seconds." />

      <form className="space-y-5" onSubmit={onSubmit} aria-label="Registration form">
        <AuthField
          label="Name"
          icon={User}
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="Enter your name"
          required
        />
        <AuthField
          label="Email"
          icon={Mail}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
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
          trailing={<PasswordToggle visible={showPassword} onClick={togglePasswordVisibility} />}
        />

        {success && <AuthNotice tone="success">Account created. Check your inbox to verify your email.</AuthNotice>}
        {error && <AuthNotice>{error}</AuthNotice>}

        <SubmitButton loading={loading} loadingLabel="Creating account…">
          <span>Create account</span>
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </form>

      <SocialAuth apiBaseUrl={env.apiBaseUrl} />

      <p className="mt-7 text-center text-sm text-content-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-accent transition-colors hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </AuthPage>
  );
}
