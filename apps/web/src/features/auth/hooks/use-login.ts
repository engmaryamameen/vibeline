'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { apiClient, ApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';
import type { AuthResponse } from '@/src/features/auth/types';
import {
  hasFieldErrors,
  validateLoginFields,
  type FieldErrors
} from '@/src/features/auth/validation';

type LoginField = 'email' | 'password';

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({});
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clearFieldError = (field: LoginField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setErrorCode(null);
    setResendSuccess(false);

    const data = new FormData(event.currentTarget);
    const emailValue = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const validationErrors = validateLoginFields(emailValue, password);

    setEmail(emailValue);
    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) return;

    setLoading(true);

    try {
      const response = await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email: emailValue, password }
      });

      setSession({
        token: response.tokens.accessToken,
        currentUser: response.user
      });
      router.replace('/');
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
        setErrorCode(submitError.code ?? null);
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    setResending(true);
    setResendSuccess(false);

    try {
      await apiClient('/auth/resend-verification', {
        method: 'POST',
        body: { email }
      });
      setResendSuccess(true);
      setError(null);
      setErrorCode(null);
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return {
    loading,
    resending,
    error,
    errorCode,
    fieldErrors,
    resendSuccess,
    showPassword,
    onSubmit,
    clearFieldError,
    resendVerification,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible)
  };
}
