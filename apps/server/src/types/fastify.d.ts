import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@vibeline/contracts';
import '@fastify/jwt';

type AuthTokenPayload = {
  sub: string;
  email?: string;
  role: Role;
  type: 'access' | 'refresh';
  exp?: number;
};

declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime?: bigint;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}
