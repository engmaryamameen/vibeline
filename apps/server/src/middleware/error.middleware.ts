import type { FastifyInstance } from 'fastify';
import { AppError } from '@/common/errors/app-error';
import { env } from '@/config/env';
const allowedOrigins=env.CORS_ORIGIN.split(',').map(origin=>origin.trim());
const setCorsHeaders=(request:{headers:{origin?:string}},reply:{header:(name:string,value:string)=>void})=>{const origin=request.headers.origin;if(origin&&allowedOrigins.includes(origin)){reply.header('Access-Control-Allow-Origin',origin);reply.header('Access-Control-Allow-Credentials','true');}};
export const registerErrorHandler=(app:FastifyInstance)=>{app.setErrorHandler((error,request,reply)=>{setCorsHeaders(request,reply);if(error instanceof AppError){request.log.warn({code:error.code,statusCode:error.statusCode},'application request rejected');return reply.status(error.statusCode).send({code:error.code,message:error.message});}request.log.error({err:error},'unhandled error');return reply.status(500).send({code:'INTERNAL_SERVER_ERROR',message:'Unexpected server error'});});};
