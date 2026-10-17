import type { FastifyPluginAsync } from 'fastify';
import { acceptConnectionHandler, getProfileHandler, listConnectionRequestsHandler, rejectConnectionHandler, requestConnectionHandler, searchUsersHandler, updateProfileHandler } from './user.controller';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.get('/me', getProfileHandler);
  app.patch('/me', updateProfileHandler);
  app.get('/search', searchUsersHandler);
  app.get('/connections/requests', listConnectionRequestsHandler);
  app.post('/connections/:userId', requestConnectionHandler);
  app.post('/connections/requests/:requestId/accept', acceptConnectionHandler);
  app.post('/connections/requests/:requestId/reject', rejectConnectionHandler);
};
