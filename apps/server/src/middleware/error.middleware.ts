import type { FastifyInstance } from 'fastify';
import { AppError } from '@/common/errors/app-error';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ operation: `${request.method} ${request.routeOptions.url}`, code: error.code, statusCode: error.statusCode, actorId: request.user?.sub }, 'application request rejected');
      return reply.status(error.statusCode).send({ code: error.code, message: error.message });
    }
    request.log.error({ err: error, operation: `${request.method} ${request.routeOptions.url}`, statusCode: 500, actorId: request.user?.sub }, 'unhandled request error');
    return reply.status(500).send({ code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' });
  });
};
