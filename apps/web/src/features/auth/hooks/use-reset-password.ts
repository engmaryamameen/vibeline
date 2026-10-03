'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient, ApiError } from '@/src/lib/api-client';

export function useResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

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
    success,
    showPassword,
    showConfirmPassword,
    hasResetCredential: Boolean(token || code),
    onSubmit,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible),
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((visible) => !visible)
  };
}
