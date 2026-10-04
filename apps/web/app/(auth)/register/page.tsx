'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
  AuthField,
  AuthFields,
  AuthForm,
  AuthHeader,
  AuthNotice,
  AuthPage,
  PasswordToggle,
  SocialAuth,
  SubmitButton
} from '@/src/features/auth/components/auth-surface';
import { useRegister } from '@/src/features/auth/hooks/use-register';
import { env } from '@/src/lib/env';

export default function RegisterPage() {
  const {
    loading,
    error,
    fieldErrors,
    success,
    showPassword,
    onSubmit,
    clearFieldError,
    togglePasswordVisibility
  } = useRegister();

  return (
    <AuthPage>
      <AuthHeader
        title="Join Now"
        description="SSet up your space and start chatting right away."
        action={
          <>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-content-link transition-colors hover:text-accent"
            >
              Login
            </Link>
          </>
        }
      />
      <AuthForm onSubmit={onSubmit}>
        <AuthFields>
          <AuthField
            label="Name"
            id="displayName"
            name="displayName"
            autoComplete="name"
            placeholder="Enter your name"
            error={fieldErrors.displayName}
            onChange={() => clearFieldError('displayName')}
          />
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
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={fieldErrors.password}
            onChange={() => clearFieldError('password')}
            trailing={<PasswordToggle visible={showPassword} onClick={togglePasswordVisibility} />}
          />

          {success && <AuthNotice tone="success">Account created. Check your inbox to verify your email.</AuthNotice>}
          {error && <AuthNotice>{error}</AuthNotice>}

        </AuthFields>

        <SubmitButton loading={loading} loadingLabel="Creating account…">
          <span>Create account</span>
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </AuthForm>

      <SocialAuth apiBaseUrl={env.apiBaseUrl} />
    </AuthPage>
  );
}
