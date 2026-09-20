import { randomUUID } from 'crypto';

import type { Role } from '@vibeline/types';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { userRepository, type StoredUser } from '@/repositories/user.repository';
import { signTokens } from '@/utils/jwt';

type OAuthAuthResult = {
  user: {
    id: string;
    email: string;
    displayName: string;
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
  email: string;
  name?: string;
  picture?: string;
};

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GithubUser = {
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
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

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
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
      provider: 'Google',
      email: googleUser.email,
      displayName: googleUser.name || this.getDefaultDisplayName(googleUser.email),
      avatarUrl: googleUser.picture || null
    });
  }

  getGithubAuthUrl(state?: string): string {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CALLBACK_URL) {
      throw new Error('GitHub OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'read:user user:email'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleGithubCallback(code: string): Promise<OAuthAuthResult> {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_CALLBACK_URL) {
      throw new Error('GitHub OAuth is not configured');
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      logger.error({ error }, 'Failed to exchange GitHub code for tokens');
      throw new Error('Failed to authenticate with GitHub');
    }

    const tokenPayload = (await tokenResponse.json()) as GithubTokenResponse;

    if (!tokenPayload.access_token) {
      logger.error({ error: tokenPayload }, 'GitHub token exchange returned no access token');
      throw new Error('Failed to authenticate with GitHub');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenPayload.access_token}`,
        'User-Agent': 'VibeLine'
      }
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      logger.error({ error }, 'Failed to fetch GitHub user profile');
      throw new Error('Failed to get user information from GitHub');
    }

    const githubUser = (await userResponse.json()) as GithubUser;
    const githubEmail = await this.getGithubEmail(tokenPayload.access_token);
    const email = githubUser.email || githubEmail;

    if (!email) {
      throw new Error('GitHub account does not expose an email address');
    }

    return this.findOrCreateOAuthUser({
      provider: 'GitHub',
      email,
      displayName: githubUser.name || githubUser.login || this.getDefaultDisplayName(email),
      avatarUrl: githubUser.avatar_url || null
    });
  }

  private async getGithubEmail(accessToken: string): Promise<string | null> {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'VibeLine'
      }
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      logger.error({ error }, 'Failed to fetch GitHub user emails');
      return null;
    }

    const emails = (await emailResponse.json()) as GithubEmail[];
    const primaryVerified = emails.find((entry) => entry.primary && entry.verified);
    if (primaryVerified) return primaryVerified.email;

    const anyVerified = emails.find((entry) => entry.verified);
    return anyVerified?.email ?? null;
  }

  private async findOrCreateOAuthUser(payload: {
    provider: 'Google' | 'GitHub';
    email: string;
    displayName: string;
    avatarUrl: string | null;
  }): Promise<OAuthAuthResult> {
    let user = await userRepository.findByEmail(payload.email);

    if (user) {
      const updates: Partial<StoredUser> = {};

      if (!user.avatarUrl && payload.avatarUrl) {
        updates.avatarUrl = payload.avatarUrl;
      }

      if (!user.emailVerified) {
        updates.emailVerified = true;
      }

      if (Object.keys(updates).length > 0) {
        await userRepository.update(user.id, updates);
        user = await userRepository.findByEmail(payload.email);
      }

      if (!user) {
        throw new Error('Failed to update OAuth user');
      }

      logger.info(
        { userId: user.id, email: user.email, provider: payload.provider },
        'User logged in via OAuth'
      );
    } else {
      await userRepository.create({
        id: randomUUID(),
        email: payload.email,
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        role: 'user',
        emailVerified: true,
        passwordHash: ''
      });

      user = await userRepository.findByEmail(payload.email);

      if (!user) {
        throw new Error('Failed to create OAuth user');
      }

      logger.info(
        { userId: user.id, email: user.email, provider: payload.provider },
        'New user created via OAuth'
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role as Role,
        emailVerified: user.emailVerified
      },
      tokens: signTokens({
        id: user.id,
        email: user.email,
        role: user.role as Role
      })
    };
  }

  private getDefaultDisplayName(email: string): string {
    const [localPart] = email.split('@');
    return localPart || 'user';
  }
}

export const oauthService = new OAuthService();
