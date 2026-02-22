'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/src/store/auth.store';

import { userApi } from '../api';
import { OAUTH_CALLBACK_ERROR_MESSAGES } from '../constants';
import type { OAuthCallbackErrorCode } from '../types';

export const useAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectTimerIds: ReturnType<typeof setTimeout>[] = [];
    const scheduleLoginRedirect = () => {
      redirectTimerIds.push(setTimeout(() => router.replace('/login'), 3000));
    };

    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const knownError = errorParam as OAuthCallbackErrorCode;
      setError(OAUTH_CALLBACK_ERROR_MESSAGES[knownError] ?? 'Authentication failed');
      setIsLoading(false);
      scheduleLoginRedirect();
      return () => {
        for (const timerId of redirectTimerIds) clearTimeout(timerId);
      };
    }

    if (!token) {
      setError('No authentication token received');
      setIsLoading(false);
      scheduleLoginRedirect();
      return () => {
        for (const timerId of redirectTimerIds) clearTimeout(timerId);
      };
    }

    const initializeSession = async () => {
      try {
        const { user } = await userApi.getProfile(token);
        setSession({ token, currentUser: user });
        router.replace('/');
      } catch {
        setError('Failed to complete sign-in');
        setIsLoading(false);
        scheduleLoginRedirect();
      }
    };

    initializeSession();

    return () => {
      for (const timerId of redirectTimerIds) clearTimeout(timerId);
    };
  }, [router, searchParams, setSession]);

  return { error, isLoading };
};
