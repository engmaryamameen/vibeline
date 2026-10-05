import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/jwt';

type AuthenticatedRequest = FastifyRequest;

import type { Role } from '@vibeline/contracts';

declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime?: bigint;
  }

  interface FastifyInstance {
    authenticate: (request: AuthenticatedRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: Role[]) => (request: AuthenticatedRequest, reply: FastifyReply) => Promise<void>;
  }

}

declare module '@fastify/jwt' {
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
