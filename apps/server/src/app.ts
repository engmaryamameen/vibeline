import Fastify from 'fastify';

import { loggerConfig } from '@/config/logger';
import { registerErrorHandler } from '@/middleware/error.middleware';
import authPlugin from '@/plugins/auth.plugin';
import corsPlugin from '@/plugins/cors.plugin';
import { registerRoutes } from '@/routes';

export const buildApp = () => {
  const app = Fastify({
    logger: loggerConfig
  });

  app.register(corsPlugin);
  app.register(authPlugin);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  registerRoutes(app);
  registerErrorHandler(app);

  return app;
};
