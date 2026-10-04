'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { AuthField, AuthFields, AuthForm, AuthHeader, AuthNotice, AuthPage, SubmitButton, authPrimaryClassName } from '@/src/features/auth/components/auth-surface';
import { cn } from '@vibeline/utils';
import { useForgotPassword } from '@/src/features/auth/hooks/use-forgot-password';

export default function ForgotPasswordPage() {
  const {
    loading,
    error,
    fieldErrors,
    success,
    code,
    isCodeComplete,
    onSubmit,
    clearFieldError,
    onCodeChange,
    onCodeKeyDown,
    onCodePaste,
    continueWithCode,
    setCodeInputRef
  } = useForgotPassword();

  return (
    <AuthPage>
      {!success ? (
        <>
          <AuthHeader
            title="Reset password"
            description="Enter your email and we’ll send you instructions to reset your password."
          />
          <AuthForm onSubmit={onSubmit}>
            <AuthFields>
            <AuthField
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              error={fieldErrors.email}
              onChange={() => clearFieldError('email')}
            />
            {error && <AuthNotice>{error}</AuthNotice>}
            </AuthFields>

            <SubmitButton loading={loading} loadingLabel="Sending…">
              Send recovery link
            </SubmitButton>
          </AuthForm>
        </>
      ) : (
        <>
          <AuthHeader
            title="Check your inbox"
            description="Use the link in your email, or enter the six digit recovery code below."
          />
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => setCodeInputRef(index, element)}
                value={digit}
                onChange={(event) => onCodeChange(index, event.target.value)}
                onKeyDown={(event) => onCodeKeyDown(index, event)}
                onPaste={onCodePaste}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${index + 1}`}
                className="h-14 min-w-0 rounded-xl border border-border bg-surface-panel text-center text-xl font-semibold text-content-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-border-strong focus:border-accent/70 focus:ring-2 focus:ring-accent/10"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={continueWithCode}
            disabled={!isCodeComplete}
            className={cn(authPrimaryClassName, 'mt-5 h-12 w-full rounded-xl text-sm font-semibold disabled:opacity-50')}
          >
            Continue
          </button>
        </>
      )}

      <Link
        href="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm text-content-secondary transition-colors hover:text-content-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </AuthPage>
  );
}
