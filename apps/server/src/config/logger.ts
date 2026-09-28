import pino from 'pino';
import type { FastifyServerOptions } from 'fastify';
import { env } from '@/config/env';

const redact = {
  paths: [
    'req.headers.authorization', 'req.headers.cookie', 'request.headers.authorization', 'request.headers.cookie',
    '*.password', '*.currentPassword', '*.newPassword', '*.accessToken', '*.refreshToken', '*.token',
    'authorization', 'cookie', 'password', 'accessToken', 'refreshToken',
    'error.config.headers.authorization', 'error.config.headers.Authorization', 'err.config.headers.authorization', 'err.config.headers.Authorization'
  ],
  censor: '[REDACTED]'
};

const baseOptions = { redact };
export const loggerConfig: FastifyServerOptions['logger'] = env.NODE_ENV === 'development'
  ? { ...baseOptions, transport: { target: 'pino-pretty', options: { singleLine: true, colorize: true, translateTime: 'SYS:standard' } } }
  : baseOptions;
export const logger = pino(env.NODE_ENV === 'development'
  ? { ...baseOptions, transport: { target: 'pino-pretty', options: { singleLine: true, colorize: true, translateTime: 'SYS:standard' } } }
  : baseOptions);
