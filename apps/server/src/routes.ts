import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env';
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/user/user.routes';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
  app.register(userRoutes, { prefix: `${env.API_PREFIX}/users` });
};
