import pino from 'pino';
import type { FastifyServerOptions } from 'fastify';

import { env } from '@/config/env';

const prettyTransport = {
  transport: {
    target: 'pino-pretty',
    options: {
      singleLine: true,
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
} as const;

const usePrettyLogger = env.NODE_ENV === 'development';

export const loggerConfig: FastifyServerOptions['logger'] = usePrettyLogger
  ? prettyTransport
  : true;

export const logger = pino(usePrettyLogger ? prettyTransport : {});
