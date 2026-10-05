import type { Role } from '@vibeline/contracts';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { userRepository } from '@/repositories/user.repository';
import { authIdentityRepository, type AuthProvider } from '@/repositories/auth-identity.repository';
import { AppError } from '@/common/errors/app-error';
import { signAccessToken } from '@/utils/jwt';
import { sessionService } from '@/modules/auth/session.service';

type OAuthAuthResult = {
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phoneNumber?: string | null;
    avatarUrl: string | null;
    role: Role;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

type GoogleTokenResponse = {
  access_token: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};


class OAuthService {
  getGoogleAuthUrl(state?: string): string {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
      throw new Error('Google OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string): Promise<OAuthAuthResult> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
      throw new Error('Google OAuth is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      logger.error({ error }, 'Failed to exchange Google code for tokens');
      throw new Error('Failed to authenticate with Google');
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text();
      logger.error({ error }, 'Failed to fetch Google user info');
      throw new Error('Failed to get user information from Google');
    }

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!googleUser.email) {
      throw new Error('Google account does not have an email address');
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerSubject: googleUser.sub,
      email: googleUser.email.trim().toLowerCase(),
      emailVerified: googleUser.email_verified === true,
      displayName: googleUser.name || this.getDefaultDisplayName(googleUser.email),
      firstName: googleUser.given_name?.trim() || undefined,
      lastName: googleUser.family_name?.trim() || undefined,
      avatarUrl: googleUser.picture || null
    });
  }


  private async findOrCreateOAuthUser(payload: {
    provider: AuthProvider;
    providerSubject: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phoneNumber?: string | null;
    avatarUrl: string | null;
  }): Promise<OAuthAuthResult> {
    if (!payload.emailVerified) throw new AppError(403, 'OAUTH_EMAIL_UNVERIFIED', 'A verified provider email is required');

    let identity = await authIdentityRepository.findIdentity(payload.provider, payload.providerSubject);
    let user;
    if (identity) {
      user = await userRepository.findById(identity.userId);
      if (!user) throw new Error('OAuth identity references a missing user');
      await authIdentityRepository.updateIdentityProfile(identity.id, payload.email, payload.emailVerified);
      if (!user.avatarUrl && payload.avatarUrl) await userRepository.update(user.id, { avatarUrl: payload.avatarUrl });
    } else {
      const result = await authIdentityRepository.createOAuthAccount({ ...payload, firstName: payload.firstName ?? null, lastName: payload.lastName ?? null });
      if (result.kind === 'email-conflict') {
        throw new AppError(409, 'ACCOUNT_LINK_REQUIRED', 'An account with this email already exists. Sign in to that account before linking this provider.');
      }
      user = await userRepository.findById(result.userId);
      if (!user) throw new Error('Failed to resolve OAuth user');
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      dateOfBirth: user.dateOfBirth ?? undefined,
      phoneNumber: user.phoneNumber ?? null,
      avatarUrl: user.avatarUrl,
      role: user.role as Role,
      emailVerified: user.emailVerified
    };
    return { user: publicUser, tokens: { accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role as Role }), refreshToken: await sessionService.create(user.id) } };
  }

  private getDefaultDisplayName(email: string): string {
    const [localPart] = email.split('@');
    return localPart || 'user';
  }
}

export const oauthService = new OAuthService();
