import type { User } from '@vibeline/types';

export type OAuthProvider = 'google' | 'github';

export type OAuthCallbackErrorCode =
  | 'oauth_not_configured'
  | 'oauth_denied'
  | 'oauth_no_code'
  | 'oauth_invalid_state'
  | 'oauth_failed';

export type AccessTokenPayload = {
  tokens: {
    accessToken: string;
  };
};

export type AuthSessionResponse = AccessTokenPayload & {
  user: User;
  message?: string;
};

export type VerifyEmailRequest = { token: string } | { code: string };

export type ResetPasswordRequest =
  | { token: string; password: string }
  | { code: string; password: string };

export type AuthUserProfileResponse = {
  user: User;
};

export type AuthMessageResponse = {
  message: string;
};
