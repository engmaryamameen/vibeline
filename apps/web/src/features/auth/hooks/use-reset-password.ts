'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiError } from '@/src/lib/api-client';

import { authApi } from '../api';

export const useResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token && !code) {
      setError('Invalid reset link');
      return;
    }

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
      await authApi.resetPassword(token ? { token, password } : { code: code!, password });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
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
    token,
    code,
    loading,
    error,
    success,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit
  };
};
