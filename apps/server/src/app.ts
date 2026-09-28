import Fastify from 'fastify';
import { loggerConfig } from '@/config/logger';
import { checkDatabase } from '@/db/client';
import { registerErrorHandler } from '@/middleware/error.middleware';
import authPlugin from '@/plugins/auth.plugin';
import corsPlugin from '@/plugins/cors.plugin';
import { registerRoutes } from '@/routes';
export const buildApp=()=>{const app=Fastify({logger:loggerConfig,bodyLimit:64*1024,requestIdHeader:'x-request-id'});app.register(corsPlugin);app.register(authPlugin);app.addHook('onSend',async(_request,reply)=>{reply.header('X-Content-Type-Options','nosniff');reply.header('X-Frame-Options','DENY');reply.header('Referrer-Policy','no-referrer');reply.header('Cache-Control','no-store');});app.get('/health/live',async()=>({status:'ok'}));app.get('/health/ready',async(_r,reply)=>{try{await checkDatabase();return {status:'ready'}}catch{return reply.status(503).send({status:'not_ready'})}});app.get('/health',async()=>({status:'ok',timestamp:new Date().toISOString()}));registerRoutes(app);registerErrorHandler(app);return app;};
