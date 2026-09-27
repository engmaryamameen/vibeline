import type { FastifyPluginAsync } from 'fastify';
import { rateLimit } from '@/middleware/rate-limit';

import {
  forgotPasswordHandler,
  githubAuthHandler,
  githubCallbackHandler,
  googleAuthHandler,
  googleCallbackHandler,
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  registerHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  changePasswordHandler,
  addPasswordHandler
} from './auth.controller';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', registerHandler);
  app.post('/login', { preHandler: [rateLimit('login', 10, 60_000)] }, loginHandler);
  app.post('/verify-email', verifyEmailHandler);
  app.post('/resend-verification', { preHandler: [rateLimit('resend-verification', 5, 5*60_000)] }, resendVerificationHandler);
  app.post('/forgot-password', { preHandler: [rateLimit('forgot-password', 5, 5*60_000)] }, forgotPasswordHandler);
  app.post('/reset-password', resetPasswordHandler);
  app.post('/refresh', refreshTokenHandler);
  app.post('/logout', logoutHandler);
  app.post('/change-password', { preHandler: [app.authenticate] }, changePasswordHandler);
  app.post('/password', { preHandler: [app.authenticate] }, addPasswordHandler);

  // Google OAuth
  app.get('/google', googleAuthHandler);
  app.get('/google/callback', googleCallbackHandler);

  // GitHub OAuth
  app.get('/github', githubAuthHandler);
  app.get('/github/callback', githubCallbackHandler);
};
