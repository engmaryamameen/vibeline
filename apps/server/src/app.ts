import Fastify from 'fastify';
import { loggerConfig } from '@/config/logger';
import { checkDatabase } from '@/db/client';
import { registerErrorHandler } from '@/middleware/error.middleware';
import authPlugin from '@/plugins/auth.plugin';
import corsPlugin from '@/plugins/cors.plugin';
import { registerRoutes } from '@/routes';
import { env } from '@/config/env';
import { realtimePublisher } from '@/modules/chat/realtime.publisher';
import { chatService } from '@/modules/chat/chat.service';

export const buildApp = () => {
  const app = Fastify({ logger: loggerConfig, bodyLimit: 64 * 1024, requestIdHeader: 'x-request-id', trustProxy: env.TRUST_PROXY });
  app.register(corsPlugin);
  chatService.setLogger(app.log);
  app.addHook('onReady',async()=>{realtimePublisher.start((conversationId,messageId)=>chatService.getMessageForRealtime(conversationId,messageId),app.log);});
  app.addHook('onClose',async()=>{await realtimePublisher.stop();});
  app.addHook('onRequest', async request => { request.requestStartTime = process.hrtime.bigint(); });
  app.addHook('onResponse', async (request, reply) => {
    const durationMs = request.requestStartTime ? Number(process.hrtime.bigint() - request.requestStartTime) / 1_000_000 : undefined;
    request.log.info({ operation: `${request.method} ${request.routeOptions.url}`, statusCode: reply.statusCode, durationMs, actorId: request.user?.sub }, 'request completed');
  });
  app.register(authPlugin);
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Cache-Control', 'no-store');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => {
    try { await checkDatabase(); return { status: 'ready' }; }
    catch { return reply.status(503).send({ status: 'not_ready' }); }
  });
  registerRoutes(app);
  registerErrorHandler(app);
  return app;
};
