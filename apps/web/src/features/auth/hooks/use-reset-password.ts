'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient, ApiError } from '@/src/lib/api-client';
import {
  hasFieldErrors,
  validateResetPasswordFields,
  type FieldErrors
} from '@/src/features/auth/validation';

type ResetPasswordField = 'password' | 'confirmPassword';

export function useResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ResetPasswordField>>({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearFieldError = (field: ResetPasswordField) => {
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

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    const validationErrors = validateResetPasswordFields(password, confirmPassword);

    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) return;

    setLoading(true);

    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: { ...(token ? { token } : { code }), password }
      });
      setSuccess(true);
      window.setTimeout(() => router.replace('/login'), 3000);
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Unable to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fieldErrors,
    success,
    showPassword,
    showConfirmPassword,
    hasResetCredential: Boolean(token || code),
    onSubmit,
    clearFieldError,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible),
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((visible) => !visible)
  };
}
