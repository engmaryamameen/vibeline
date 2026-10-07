import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env';
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/user/user.routes';
import { chatRoutes } from '@/modules/chat/chat.routes';
import { notificationRoutes } from '@/modules/notification/notification.routes';
import { mediaRoutes } from '@/modules/media/media.routes';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
  app.register(userRoutes, { prefix: `${env.API_PREFIX}/users` });
  app.register(chatRoutes, { prefix: `${env.API_PREFIX}/chat` });
  app.register(notificationRoutes, { prefix: `${env.API_PREFIX}/notifications` });
  app.register(mediaRoutes, { prefix: `${env.API_PREFIX}/media` });
};
