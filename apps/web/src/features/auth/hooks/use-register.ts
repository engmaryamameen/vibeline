'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/src/lib/api-client';
import {
  hasFieldErrors,
  validateRegisterFields,
  type FieldErrors
} from '@/src/features/auth/validation';

type RegisterField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'dateOfBirth'
  | 'password'
  | 'confirmPassword';

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const dateOfBirth = String(data.get('dateOfBirth') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const confirmPassword = String(data.get('confirmPassword') ?? '');

    const validationErrors = validateRegisterFields(
      firstName,
      lastName,
      email,
      dateOfBirth,
      password,
      confirmPassword
    );

    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) return;

    setLoading(true);

    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: { firstName, lastName, email, dateOfBirth, password }
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
    showConfirmPassword,
    onSubmit,
    clearFieldError,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible),
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((visible) => !visible)
  };
}
