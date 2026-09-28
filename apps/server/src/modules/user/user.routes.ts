import type { FastifyPluginAsync } from 'fastify';

import { getProfileHandler, searchUsersHandler } from './user.controller';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: [app.authenticate] }, getProfileHandler);
  app.get('/search', { preHandler: [app.authenticate] }, searchUsersHandler);
};
