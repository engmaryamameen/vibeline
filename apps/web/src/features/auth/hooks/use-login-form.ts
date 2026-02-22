'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/src/store/auth.store';

import { authApi } from '../api';
import { ApiError } from '@/src/lib/api-client';

export const useLoginForm = () => {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setErrorCode(null);
    setResendSuccess(false);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const emailValue = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    setEmail(emailValue);

    try {
      const response = await authApi.login(emailValue, password);
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

  const handleResendVerification = async () => {
    if (!email) return;

    setResending(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification(email);
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
    resendSuccess,
    showPassword,
    isEmailNotVerified: errorCode === 'EMAIL_NOT_VERIFIED',
    setShowPassword,
    handleSubmit,
    handleResendVerification
  };
};
