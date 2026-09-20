import type { FastifyPluginAsync } from 'fastify';

import { getProfileHandler } from './user.controller';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: [app.authenticate] }, getProfileHandler);
};
