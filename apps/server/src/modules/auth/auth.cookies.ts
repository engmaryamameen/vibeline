import { env } from '@/config/env';

const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const REFRESH_TOKEN_COOKIE_NAME = 'vibeline_rt';

const isSecureCookie = env.NODE_ENV === 'production';

export const buildRefreshTokenCookie = (refreshToken: string): string => {
  const token = encodeURIComponent(refreshToken);
  const secureFlag = isSecureCookie ? '; Secure' : '';

  return `${REFRESH_TOKEN_COOKIE_NAME}=${token}; Max-Age=${REFRESH_TOKEN_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
};

export const buildClearRefreshTokenCookie = (): string => {
  const secureFlag = isSecureCookie ? '; Secure' : '';
  return `${REFRESH_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
};

export const getRefreshTokenFromCookieHeader = (cookieHeader?: string): string | null => {
  if (!cookieHeader) return null;

  const cookiePairs = cookieHeader.split(';');

  for (const cookiePair of cookiePairs) {
    const [rawName, ...rawValueParts] = cookiePair.trim().split('=');
    if (!rawName || rawValueParts.length === 0) continue;

    if (rawName === REFRESH_TOKEN_COOKIE_NAME) {
      const rawValue = rawValueParts.join('=');
      return decodeURIComponent(rawValue);
    }
  }

  return null;
};
