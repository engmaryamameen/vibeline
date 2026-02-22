'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/src/store/auth.store';

import { userApi } from '../api';
import { OAUTH_CALLBACK_ERROR_MESSAGES } from '../constants';
import type { OAuthCallbackErrorCode } from '../types';
import { useDelayedRedirect } from './use-delayed-redirect';

export const useAuthCallback = () => {
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const { scheduleReplace } = useDelayedRedirect();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const knownError = errorParam as OAuthCallbackErrorCode;
      setError(OAUTH_CALLBACK_ERROR_MESSAGES[knownError] ?? 'Authentication failed');
      setIsLoading(false);
      scheduleReplace('/login', 3000);
      return;
    }

    if (!token) {
      setError('No authentication token received');
      setIsLoading(false);
      scheduleReplace('/login', 3000);
      return;
    }

    const initializeSession = async () => {
      try {
        const { user } = await userApi.getProfile(token);
        setSession({ token, currentUser: user });
        scheduleReplace('/', 0);
      } catch {
        setError('Failed to complete sign-in');
        setIsLoading(false);
        scheduleReplace('/login', 3000);
      }
    };

    initializeSession();
  }, [scheduleReplace, searchParams, setSession]);

  return { error, isLoading };
};
