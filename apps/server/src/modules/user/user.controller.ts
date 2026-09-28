import type { FastifyReply,FastifyRequest } from 'fastify';
import { userSearchQuerySchema } from '@vibeline/contracts';
import { validate } from '@/utils/validation';
import { userService } from './user.service';
const userId=(request:FastifyRequest)=>request.user.sub;
export const getProfileHandler=async(request:FastifyRequest,reply:FastifyReply)=>reply.status(200).send({user:await userService.getProfile(userId(request))});
export const searchUsersHandler=async(request:FastifyRequest,reply:FastifyReply)=>{const {q}=validate(userSearchQuerySchema,request.query);return reply.send({users:await userService.searchUsers(userId(request),q)});};
