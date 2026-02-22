import { apiClient } from '@/src/lib/api-client';

import type {
  AuthMessageResponse,
  AuthSessionResponse,
  AuthUserProfileResponse,
  ResetPasswordRequest,
  VerifyEmailRequest
} from './types';

export const authApi = {
  login(email: string, password: string) {
    return apiClient<AuthSessionResponse>('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  register(displayName: string, email: string, password: string) {
    return apiClient<AuthSessionResponse>('/auth/register', {
      method: 'POST',
      body: { displayName, email, password }
    });
  },

  refresh() {
    return apiClient<{ tokens: { accessToken: string } }>('/auth/refresh', {
      method: 'POST'
    });
  },

  logout() {
    return apiClient<void>('/auth/logout', { method: 'POST' });
  },

  verifyEmail(payload: VerifyEmailRequest) {
    return apiClient<AuthSessionResponse>('/auth/verify-email', {
      method: 'POST',
      body: payload
    });
  },

  resendVerification(email: string) {
    return apiClient<AuthMessageResponse>('/auth/resend-verification', {
      method: 'POST',
      body: { email }
    });
  },

  forgotPassword(email: string) {
    return apiClient<AuthMessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  resetPassword(payload: ResetPasswordRequest) {
    return apiClient<AuthMessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: payload
    });
  }
};

export const userApi = {
  getProfile(token: string) {
    return apiClient<AuthUserProfileResponse>('/users/me', { token });
  }
};
