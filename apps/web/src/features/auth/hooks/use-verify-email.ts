'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';

import { authApi } from '../api';
import type { AuthSessionResponse } from '../types';

type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

export const useVerifyEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setSession = useAuthStore((state) => state.setSession);

  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'no-token');
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (response: AuthSessionResponse) => {
      setSession({ token: response.tokens.accessToken, currentUser: response.user });
      setState('success');
      setTimeout(() => router.replace('/'), 2000);
    },
    [router, setSession]
  );

  useEffect(() => {
    if (!token) {
      setState('no-token');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verifyEmail({ token });
        handleSuccess(response);
      } catch (verifyError) {
        setState('error');
        if (verifyError instanceof ApiError) {
          setError(verifyError.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    };

    verifyToken();
  }, [handleSuccess, token]);

  const verifyCode = useCallback(
    async (code: string) => {
      try {
        const response = await authApi.verifyEmail({ code });
        handleSuccess(response);
      } catch (verifyError) {
        if (verifyError instanceof ApiError) {
          setError(verifyError.message);
        } else {
          setError('Verification failed. Please try again.');
        }
        throw verifyError;
      }
    },
    [handleSuccess]
  );

  return {
    state,
    error,
    setError,
    verifyCode
  };
};
