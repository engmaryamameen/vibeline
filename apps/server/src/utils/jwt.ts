import jwt from 'jsonwebtoken';

import type { AuthTokens, Role } from '@vibeline/types';

import { AppError } from '@/common/errors/app-error';
import { env } from '@/config/env';

type JwtUserPayload = {
  id: string;
  email: string;
  role: Role;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
};

type RefreshTokenPayload = {
  sub: string;
  role: Role;
  type: 'refresh';
};

type OAuthProvider = 'google' | 'github';

type OAuthStatePayload = {
  provider: OAuthProvider;
  type: 'oauth_state';
};

export const signTokens = (user: JwtUserPayload): AuthTokens => ({
  accessToken: jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'access' } satisfies AccessTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  ),
  refreshToken: jwt.sign(
    { sub: user.id, role: user.role, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )
});

export const verifyRefreshToken = (token: string): { userId: string; role: Role } => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Partial<RefreshTokenPayload>;

    if (payload.type !== 'refresh' || !payload.sub || !payload.role) {
      throw new Error('Invalid refresh token payload');
    }

    return { userId: payload.sub, role: payload.role };
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  }
};

export const signOAuthState = (provider: OAuthProvider): string => {
  return jwt.sign(
    { provider, type: 'oauth_state' } satisfies OAuthStatePayload,
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );
};

export const verifyOAuthState = (state: string, provider: OAuthProvider): void => {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as Partial<OAuthStatePayload>;
    const isValid = payload.type === 'oauth_state' && payload.provider === provider;

    if (!isValid) {
      throw new Error('Invalid OAuth state payload');
    }
  } catch {
    throw new AppError(401, 'INVALID_OAUTH_STATE', 'OAuth state is invalid or expired');
  }
};
