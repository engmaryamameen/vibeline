import type { FastifyReply, FastifyRequest } from 'fastify';
import { connectionRequestParamsSchema, connectionUserParamsSchema, updateProfileRequestSchema, userSearchQuerySchema } from '@vibeline/contracts';
import { validate } from '@/utils/validation';
import { userService } from './user.service';

const userId = (request: FastifyRequest) => request.user.sub;

export const getProfileHandler = async (request: FastifyRequest, reply: FastifyReply) =>
  reply.status(200).send({ user: await userService.getProfile(userId(request)) });

export const updateProfileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = validate(updateProfileRequestSchema, request.body);
  return reply.status(200).send({ user: await userService.updateProfile(userId(request), payload) });
};

export const searchUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { q } = validate(userSearchQuerySchema, request.query);
  return reply.send({ users: await userService.searchUsers(userId(request), q) });
};

export const listConnectionRequestsHandler = async (request: FastifyRequest, reply: FastifyReply) => reply.send({ requests: await userService.listConnectionRequests(userId(request)) });

export const requestConnectionHandler = async (request: FastifyRequest, reply: FastifyReply) => { const { userId: targetUserId } = validate(connectionUserParamsSchema, request.params); await userService.requestConnection(userId(request), targetUserId); return reply.status(204).send(); };

export const acceptConnectionHandler = async (request: FastifyRequest, reply: FastifyReply) => { const { requestId } = validate(connectionRequestParamsSchema, request.params); await userService.respondConnection(userId(request), requestId, true); return reply.status(204).send(); };

export const rejectConnectionHandler = async (request: FastifyRequest, reply: FastifyReply) => { const { requestId } = validate(connectionRequestParamsSchema, request.params); await userService.respondConnection(userId(request), requestId, false); return reply.status(204).send(); };
