import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@vibeline/types';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { oauthService } from '@/services/oauth.service';
import { signOAuthState, verifyOAuthState } from '@/utils/jwt';
import { validate } from '@/utils/validation';

import { authService } from './auth.service';
import {
  buildClearRefreshTokenCookie,
  buildRefreshTokenCookie,
  getRefreshTokenFromCookieHeader
} from './auth.cookies';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from './auth.schema';

type OAuthProvider = 'google' | 'github';
type OAuthCallbackQuery = {
  code?: string;
  error?: string;
  state?: string;
};

const getOAuthCallbackErrorUrl = (errorCode: string) => {
  const params = new URLSearchParams({ error: errorCode });
  return `${env.APP_URL}/auth/callback?${params.toString()}`;
};

const redirectWithAccessToken = (
  reply: FastifyReply,
  payload: { accessToken: string; refreshToken: string }
) => {
  reply.header('Set-Cookie', buildRefreshTokenCookie(payload.refreshToken));
  const params = new URLSearchParams({ token: payload.accessToken });
  return reply.redirect(`${env.APP_URL}/auth/callback?${params.toString()}`);
};

const validateOAuthQuery = (query: OAuthCallbackQuery): string | null => {
  if (query.error) return 'oauth_denied';
  if (!query.code) return 'oauth_no_code';
  if (!query.state) return 'oauth_invalid_state';
  return null;
};

const handleOAuthCallback = async (
  provider: OAuthProvider,
  query: OAuthCallbackQuery,
  reply: FastifyReply
) => {
  const validationError = validateOAuthQuery(query);
  if (validationError) {
    if (query.error) {
      logger.warn({ error: query.error, provider }, `${provider} OAuth error`);
    }
    return reply.redirect(getOAuthCallbackErrorUrl(validationError));
  }

  try {
    verifyOAuthState(query.state!, provider);
  } catch (error) {
    logger.warn({ error, provider }, `Invalid ${provider} OAuth state`);
    return reply.redirect(getOAuthCallbackErrorUrl('oauth_invalid_state'));
  }

  try {
    const result =
      provider === 'google'
        ? await oauthService.handleGoogleCallback(query.code!)
        : await oauthService.handleGithubCallback(query.code!);
    return redirectWithAccessToken(reply, {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken
    });
  } catch (error) {
    logger.error({ error, provider }, `${provider} OAuth callback failed`);
    return reply.redirect(getOAuthCallbackErrorUrl('oauth_failed'));
  }
};

const sendAuthResponse = (
  reply: FastifyReply,
  result: {
    user: User;
    tokens: { accessToken: string; refreshToken: string };
    message?: string;
  },
  statusCode: number
) => {
  reply.header('Set-Cookie', buildRefreshTokenCookie(result.tokens.refreshToken));

  return reply.status(statusCode).send({
    user: result.user,
    tokens: {
      accessToken: result.tokens.accessToken
    },
    ...(result.message ? { message: result.message } : {})
  });
};

export const registerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(registerSchema, request.body);
  const result = await authService.register(payload);

  return sendAuthResponse(reply, result, 201);
};

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(loginSchema, request.body);
  const result = await authService.login(payload);

  return sendAuthResponse(reply, result, 200);
};

export const verifyEmailHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(verifyEmailSchema, request.body);
  const result = await authService.verifyEmail(payload);

  return sendAuthResponse(reply, result, 200);
};

export const resendVerificationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(resendVerificationSchema, request.body);
  const result = await authService.resendVerificationEmail(payload.email);

  return reply.status(200).send(result);
};

export const forgotPasswordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(forgotPasswordSchema, request.body);
  const result = await authService.forgotPassword(payload);

  return reply.status(200).send(result);
};

export const resetPasswordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(resetPasswordSchema, request.body);
  const result = await authService.resetPassword(payload);

  return reply.status(200).send(result);
};

export const refreshTokenHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(refreshTokenSchema, request.body ?? {});
  const refreshTokenFromCookie = getRefreshTokenFromCookieHeader(request.headers.cookie);
  const refreshToken = refreshTokenFromCookie ?? payload.refreshToken;

  const result = await authService.refreshSession(refreshToken ?? '');
  return sendAuthResponse(reply, result, 200);
};

export const logoutHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  reply.header('Set-Cookie', buildClearRefreshTokenCookie());
  return reply.status(204).send();
};

export const googleAuthHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const state = signOAuthState('google');
    const authUrl = oauthService.getGoogleAuthUrl(state);
    return reply.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'Google OAuth not configured');
    return reply.redirect(getOAuthCallbackErrorUrl('oauth_not_configured'));
  }
};

export const googleCallbackHandler = async (
  request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>,
  reply: FastifyReply
) => {
  return handleOAuthCallback('google', request.query, reply);
};

export const githubAuthHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const state = signOAuthState('github');
    const authUrl = oauthService.getGithubAuthUrl(state);
    return reply.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'GitHub OAuth not configured');
    return reply.redirect(getOAuthCallbackErrorUrl('oauth_not_configured'));
  }
};

export const githubCallbackHandler = async (
  request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>,
  reply: FastifyReply
) => {
  return handleOAuthCallback('github', request.query, reply);
};
