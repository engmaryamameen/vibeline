import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env';
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/user/user.routes';
import { chatRoutes } from '@/modules/chat/chat.routes';
import { callRoutes } from '@/modules/call/call.routes';
import { notificationRoutes } from '@/modules/notification/notification.routes';
import { mediaRoutes } from '@/modules/media/media.routes';
import { storyRoutes } from '@/modules/story/story.routes';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
  app.register(userRoutes, { prefix: `${env.API_PREFIX}/users` });
  app.register(chatRoutes, { prefix: `${env.API_PREFIX}/chat` });
  app.register(callRoutes, { prefix: `${env.API_PREFIX}/calls` });
  app.register(notificationRoutes, { prefix: `${env.API_PREFIX}/notifications` });
  app.register(mediaRoutes, { prefix: `${env.API_PREFIX}/media` });
  app.register(storyRoutes, { prefix: `${env.API_PREFIX}/stories` });
};
