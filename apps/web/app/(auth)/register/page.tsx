'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DatePicker } from '@vibeline/ui';

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

const toIsoDate = (
  date: Date
) => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getRegistrationCalendarDates =
  () => {
    const today =
      new Date();

    return {
      maxDate:
        toIsoDate(
          today
        )
    };
  };

export default function RegisterPage() {
  const {
    maxDate
  } =
    getRegistrationCalendarDates();

  const {
    loading,
    error,
    fieldErrors,
    success,
    showPassword,
    showConfirmPassword,
    onSubmit,
    clearFieldError,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility
  } = useRegister();

  return (
    <AuthPage>
      <AuthHeader
        title="Join Now"
        description="Set up your space and start chatting right away."
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

      <AuthForm
        onSubmit={
          onSubmit
        }
      >
        <AuthFields>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AuthField
              label="First name"
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="First name"
              error={
                fieldErrors.firstName
              }
              onChange={() =>
                clearFieldError(
                  'firstName'
                )
              }
            />

            <AuthField
              label="Last name"
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Last name"
              error={
                fieldErrors.lastName
              }
              onChange={() =>
                clearFieldError(
                  'lastName'
                )
              }
            />
          </div>

          <AuthField
            label="Email"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            error={
              fieldErrors.email
            }
            onChange={() =>
              clearFieldError(
                'email'
              )
            }
          />

          <DatePicker
            id="dateOfBirth"
            name="dateOfBirth"
            label="Date of birth"
            placeholder="MM/DD/YYYY"
            maxDate={maxDate}
            minimumAge={10}
            error={fieldErrors.dateOfBirth}
            onChange={() =>
              clearFieldError(
                'dateOfBirth'
              )
            }
          />

          <AuthField
            label="Password"
            id="password"
            name="password"
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={
              fieldErrors.password
            }
            onChange={() =>
              clearFieldError(
                'password'
              )
            }
            trailing={
              <PasswordToggle
                visible={
                  showPassword
                }
                onClick={
                  togglePasswordVisibility
                }
              />
            }
          />

          <AuthField
            label="Confirm password"
            id="confirmPassword"
            name="confirmPassword"
            type={
              showConfirmPassword
                ? 'text'
                : 'password'
            }
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={
              fieldErrors.confirmPassword
            }
            onChange={() =>
              clearFieldError(
                'confirmPassword'
              )
            }
            trailing={
              <PasswordToggle
                visible={
                  showConfirmPassword
                }
                onClick={
                  toggleConfirmPasswordVisibility
                }
              />
            }
          />

          {success && (
            <AuthNotice tone="success">
              Account created. Check your inbox to verify your email.
            </AuthNotice>
          )}

          {error && (
            <AuthNotice>
              {error}
            </AuthNotice>
          )}
        </AuthFields>

        <SubmitButton
          loading={
            loading
          }
          loadingLabel="Creating account…"
        >
          <span>
            Create account
          </span>

          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </AuthForm>

      <SocialAuth
        apiBaseUrl={
          env.apiBaseUrl
        }
      />
    </AuthPage>
  );
}