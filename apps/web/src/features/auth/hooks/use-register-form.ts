'use client';

import { useState, type FormEvent } from 'react';
import { authApi } from '../api';
import { getErrorMessage } from '../error-utils';
import { useDelayedRedirect } from './use-delayed-redirect';

export const useRegisterForm = () => {
  const { scheduleReplace } = useDelayedRedirect();
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
      scheduleReplace('/verify-email', 2500);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to register'));
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
