'use client';

import { useCallback } from 'react';
import { apiClient, ApiError, type RequestOptions } from './api-client';
import { refreshAuthSession } from './auth-session';
import { useAuthStore } from '@/src/store/auth.store';

export type AuthorizedRequest = <T>(path: string, options?: Omit<RequestOptions<T>, 'token'>) => Promise<T>;

export function useAuthorizedRequest(): AuthorizedRequest {
  return useCallback(async <T>(path: string, options: Omit<RequestOptions<T>, 'token'> = {}): Promise<T> => {
    const execute = (token?: string) => apiClient<T>(path, { ...options, token });
    try {
      return await execute(useAuthStore.getState().token ?? undefined);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      const refreshed = await refreshAuthSession();
      return execute(refreshed.tokens.accessToken);
    }
  }, []);
}
