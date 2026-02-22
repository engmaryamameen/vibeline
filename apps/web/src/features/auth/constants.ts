import type { OAuthCallbackErrorCode } from './types';

export const OAUTH_CALLBACK_ERROR_MESSAGES: Record<OAuthCallbackErrorCode, string> = {
  oauth_not_configured: 'Google/GitHub sign-in is not configured',
  oauth_denied: 'Sign-in was cancelled',
  oauth_no_code: 'Authentication failed',
  oauth_invalid_state: 'Authentication session expired. Please try again.',
  oauth_failed: 'Failed to sign in with Google/GitHub'
};
