'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '../api';

export const useRegisterForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get('displayName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      await authApi.register(displayName, email, password);
      setSuccess(true);
      setTimeout(() => router.replace('/verify-email'), 2500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    showPassword,
    success,
    setShowPassword,
    handleSubmit
  };
};
