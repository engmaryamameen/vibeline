'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/src/store/auth.store';

import { authApi } from '../api';
import { getErrorMessage } from '../error-utils';
import type { AuthSessionResponse } from '../types';
import { useDelayedRedirect } from './use-delayed-redirect';

type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

export const useVerifyEmail = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setSession = useAuthStore((state) => state.setSession);
  const { scheduleReplace } = useDelayedRedirect();

  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'no-token');
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (response: AuthSessionResponse) => {
      setSession({ token: response.tokens.accessToken, currentUser: response.user });
      setState('success');
      scheduleReplace('/', 2000);
    },
    [scheduleReplace, setSession]
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
        setError(getErrorMessage(verifyError, 'An unexpected error occurred. Please try again.'));
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
        setError(getErrorMessage(verifyError, 'Verification failed. Please try again.'));
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
