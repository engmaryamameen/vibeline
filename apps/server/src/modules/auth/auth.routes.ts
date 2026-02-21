import type { FastifyPluginAsync } from 'fastify';

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
  verifyEmailHandler
} from './auth.controller';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.post('/verify-email', verifyEmailHandler);
  app.post('/resend-verification', resendVerificationHandler);
  app.post('/forgot-password', forgotPasswordHandler);
  app.post('/reset-password', resetPasswordHandler);
  app.post('/refresh', refreshTokenHandler);
  app.post('/logout', logoutHandler);

  // Google OAuth
  app.get('/google', googleAuthHandler);
  app.get('/google/callback', googleCallbackHandler);

  // GitHub OAuth
  app.get('/github', githubAuthHandler);
  app.get('/github/callback', githubCallbackHandler);
};
