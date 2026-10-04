import type { FastifyPluginAsync } from 'fastify';

import { getProfileHandler, searchUsersHandler, updateProfileHandler } from './user.controller';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: [app.authenticate] }, getProfileHandler);
  app.patch('/me', { preHandler: [app.authenticate] }, updateProfileHandler);
  app.get('/search', { preHandler: [app.authenticate] }, searchUsersHandler);
};
