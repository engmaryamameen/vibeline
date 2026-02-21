import type { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { env } from '@/config/env';

const corsPlugin: FastifyPluginAsync = async (app) => {
  const origins = env.CORS_ORIGIN.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  await app.register(fastifyCors, {
    origin: origins.length > 0 ? origins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });
};

export default corsPlugin;
