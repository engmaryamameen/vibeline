import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env';
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/user/user.routes';
import { chatRoutes } from '@/modules/chat/chat.routes';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
  app.register(userRoutes, { prefix: `${env.API_PREFIX}/users` });
  app.register(chatRoutes, { prefix: `${env.API_PREFIX}/chat` });
};
