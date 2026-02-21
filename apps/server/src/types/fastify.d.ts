import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Role } from '@vibeline/types';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyJWT {
    payload: {
      sub: string;
      email?: string;
      role: Role;
      type: 'access' | 'refresh';
    };
    user: {
      sub: string;
      email?: string;
      role: Role;
      type: 'access' | 'refresh';
    };
  }
}
