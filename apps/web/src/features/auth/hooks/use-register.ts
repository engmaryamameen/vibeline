'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/src/lib/api-client';
import type { AuthResponse } from '@/src/features/auth/types';

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(event.currentTarget);

    try {
      await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: {
          displayName: String(data.get('displayName') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          password: String(data.get('password') ?? '')
        }
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
    success,
    showPassword,
    onSubmit,
    togglePasswordVisibility: () => setShowPassword((visible) => !visible)
  };
}
