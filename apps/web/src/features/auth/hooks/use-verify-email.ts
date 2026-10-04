'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient, ApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';
import type { AuthResponse, VerificationState } from '@/src/features/auth/types';

export function useVerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setSession = useAuthStore((state) => state.setSession);
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'no-token');
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const handleSuccess = useCallback(
    (response: AuthResponse) => {
      setSession({
        token: response.tokens.accessToken,
        currentUser: response.user
      });
      setError(null);
      setState('success');
    },
    [setSession]
  );

  useEffect(() => {
    if (state !== 'success') return;

    const timeoutId = window.setTimeout(() => router.replace('/'), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [router, state]);

  useEffect(() => {
    if (!token) {
      setState('no-token');
      return;
    }

    let active = true;

    const verifyToken = async () => {
      try {
        const response = await apiClient<AuthResponse>('/auth/verify-email', {
          method: 'POST',
          body: { token }
        });

        if (active) handleSuccess(response);
      } catch (verifyError) {
        if (!active) return;

        setState('error');
        setError(
          verifyError instanceof ApiError
            ? verifyError.message
            : 'An unexpected error occurred. Please try again.'
        );
      }
    };

    void verifyToken();

    return () => {
      active = false;
    };
  }, [handleSuccess, token]);

  const onCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  };

  const submitCode = async () => {
    const trimmed = code.replace(/\D/g, '').slice(0, 6);

    if (trimmed.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setCodeLoading(true);
    setError(null);

    try {
      const response = await apiClient<AuthResponse>('/auth/verify-email', {
        method: 'POST',
        body: { code: trimmed }
      });
      handleSuccess(response);
    } catch (verifyError) {
      setError(
        verifyError instanceof ApiError
          ? verifyError.message
          : 'Verification failed. Please try again.'
      );
    } finally {
      setCodeLoading(false);
    }
  };

  return {
    state,
    error,
    code,
    codeLoading,
    isCodeComplete: code.length === 6,
    onCodeChange,
    submitCode
  };
}
