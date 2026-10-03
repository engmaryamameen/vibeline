import type { AuthSessionResponse } from '@vibeline/contracts';
import { apiClient } from './api-client';
import { useAuthStore } from '@/src/store/auth.store';

let refreshInFlight: Promise<AuthSessionResponse> | null = null;

export const refreshAuthSession = (): Promise<AuthSessionResponse> => {
  if (!refreshInFlight) {
    refreshInFlight = apiClient<AuthSessionResponse>('/auth/refresh', { method: 'POST' })
      .then((session) => {
        useAuthStore.getState().setSession({ token: session.tokens.accessToken, currentUser: session.user });
        return session;
      })
      .catch((error) => {
        useAuthStore.getState().clearSession();
        throw error;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
};

export const restoreAuthSession = async () => {
  const state = useAuthStore.getState();
  if (state.token && state.currentUser) return { user: state.currentUser, tokens: { accessToken: state.token } };
  return refreshAuthSession();
};
