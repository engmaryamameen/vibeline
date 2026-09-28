import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Role } from '@vibeline/contracts';

declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime?: bigint;
  }

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
      exp?: number;
    };
    user: {
      sub: string;
      email?: string;
      role: Role;
      type: 'access' | 'refresh';
      exp?: number;
    };
  }
}
