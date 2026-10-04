import type { User } from '@vibeline/contracts';

export type AuthResponse = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
  message?: string;
};

export type VerificationState = 'loading' | 'success' | 'error' | 'no-token';
