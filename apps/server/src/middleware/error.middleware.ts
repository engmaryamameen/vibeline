import type { FastifyInstance } from 'fastify';
import { AppError } from '@/common/errors/app-error';

type HttpError = Error & { statusCode?: number; code?: string; validation?: unknown };

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error: HttpError, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ operation: `${request.method} ${request.routeOptions.url}`, code: error.code, statusCode: error.statusCode, actorId: request.user?.sub }, 'application request rejected');
      return reply.status(error.statusCode).send({ code: error.code, message: error.message });
    }

    const statusCode = error.statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const code = error.validation ? 'VALIDATION_ERROR' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : statusCode === 415 ? 'UNSUPPORTED_MEDIA_TYPE' : 'BAD_REQUEST';
      const message = statusCode === 404 ? 'Resource not found' : statusCode === 413 ? 'Request payload is too large' : statusCode === 415 ? 'Unsupported media type' : 'Invalid request';
      request.log.warn({ operation: `${request.method} ${request.routeOptions.url}`, code, statusCode, fastifyCode: error.code, actorId: request.user?.sub }, 'request rejected');
      return reply.status(statusCode).send({ code, message });
    }

    request.log.error({ err: error, operation: `${request.method} ${request.routeOptions.url}`, statusCode: 500, actorId: request.user?.sub }, 'unhandled request error');
    return reply.status(500).send({ code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' });
  });
};
