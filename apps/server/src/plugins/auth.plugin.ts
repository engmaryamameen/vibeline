import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import type { FastifyPluginAsync } from 'fastify';
import type { Role } from '@vibeline/types';

import { AppError } from '@/common/errors/app-error';
import { env } from '@/config/env';

const authPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  const ensureAccessToken = (request: { user: { type?: string } }) => {
    if (request.user.type !== 'access') {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or expired');
    }
  };

  app.decorate('authenticate', async (request) => {
    await request.jwtVerify();
    ensureAccessToken(request as { user: { type?: string } });
  });

  app.decorate('authorize', (roles: Role[]) => {
    return async (request, reply) => {
      await request.jwtVerify();
      ensureAccessToken(request as { user: { type?: string } });
      const role = (request.user as { role: Role }).role;

      if (!roles.includes(role)) {
        return reply.status(403).send({
          code: 'FORBIDDEN',
          message: 'Missing required permissions'
        });
      }
    };
  });
};

export default fp(authPlugin);
