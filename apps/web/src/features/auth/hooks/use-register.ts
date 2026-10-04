'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/src/lib/api-client';
import type { AuthResponse } from '@/src/features/auth/types';
import {
  hasFieldErrors,
  validateRegisterFields,
  type FieldErrors
} from '@/src/features/auth/validation';

type RegisterField = 'displayName' | 'email' | 'password';

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearFieldError = (field: RegisterField) => {
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

    const data = new FormData(event.currentTarget);
    const displayName = String(data.get('displayName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const validationErrors = validateRegisterFields(displayName, email, password);

    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) return;

    setLoading(true);

    try {
      await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { displayName, email, password }
      });
      setSuccess(true);
      window.setTimeout(() => router.replace('/verify-email'), 2500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register');
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
    onSubmit,
    clearFieldError,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible)
  };
}
