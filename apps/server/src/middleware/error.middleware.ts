import type { FastifyInstance } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import { env } from '@/config/env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

const setCorsHeaders = (request: { headers: { origin?: string } }, reply: { header: (name: string, value: string) => void }) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Credentials', 'true');
  }
};

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    setCorsHeaders(request, reply);

    if (error instanceof AppError) {
      request.log.warn({ err: error, code: error.code }, 'application error');
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message
      });
    }

    const unknownError = error as Error;
    request.log.error({ err: unknownError }, 'unhandled error');
    return reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error'
    });
  });
};
