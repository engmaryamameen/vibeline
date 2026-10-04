'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import {
  AuthField,
  AuthFields,
  AuthForm,
  AuthHeader,
  AuthNotice,
  AuthPage,
  AuthStatePanel,
  PasswordToggle,
  authPrimaryClassName,
  SubmitButton
} from '@/src/features/auth/components/auth-surface';
import { cn } from '@vibeline/utils';
import { useResetPassword } from '@/src/features/auth/hooks/use-reset-password';

function ResetPasswordContent() {
  const {
    loading,
    error,
    fieldErrors,
    success,
    showPassword,
    showConfirmPassword,
    hasResetCredential,
    onSubmit,
    clearFieldError,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility
  } = useResetPassword();

  if (!hasResetCredential) {
    return (
      <AuthPage>
        <AuthStatePanel
          icon={<XCircle className="h-6 w-6" />}
          title="Reset link expired"
          description="This password reset link is invalid or has expired. Request a new one to continue."
        >
          <Link href="/forgot-password" className={cn(authPrimaryClassName, 'mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold')}>
            Request new link
          </Link>
        </AuthStatePanel>
      </AuthPage>
    );
  }

  if (success) {
    return (
      <AuthPage>
        <AuthStatePanel
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Password updated"
          description="Your new password is ready. You can sign in and continue your conversations."
        >
          <Link href="/login" className={cn(authPrimaryClassName, 'mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold')}>
            Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </AuthStatePanel>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthHeader title="Create a new password" description="Choose a password you haven’t used here before." />
      <AuthForm onSubmit={onSubmit}>
        <AuthFields>
        <AuthField
          label="New password"
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={fieldErrors.password}
          onChange={() => clearFieldError('password')}
          trailing={<PasswordToggle visible={showPassword} onClick={togglePasswordVisibility} />}
        />
        <AuthField
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Enter it again"
          error={fieldErrors.confirmPassword}
          onChange={() => clearFieldError('confirmPassword')}
          trailing={<PasswordToggle visible={showConfirmPassword} onClick={toggleConfirmPasswordVisibility} />}
        />
        {error && <AuthNotice>{error}</AuthNotice>}
        </AuthFields>

        <SubmitButton loading={loading} loadingLabel="Updating…">Reset password</SubmitButton>
      </AuthForm>
    </AuthPage>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-72 w-full max-w-[420px] animate-pulse rounded-3xl bg-surface-soft" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
