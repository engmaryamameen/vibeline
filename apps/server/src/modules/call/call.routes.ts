import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import {
  callHistoryQuerySchema,
  callParamsSchema,
  callSignalsQuerySchema,
  createCallRequestSchema,
  endCallRequestSchema,
  sendCallSignalRequestSchema
} from '@vibeline/contracts';
import { validate } from '@/utils/validation';
import { callService } from './call.service';
import { iceService } from './ice.service';

const actorId = (request: FastifyRequest) => request.user.sub;

export const callRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/ice-servers', async (request) => ({
    iceServers: iceService.forUser(actorId(request)),
    ttlSeconds: iceService.ttlSeconds()
  }));

  app.get('/active', async (request) => ({ call: await callService.getActive(actorId(request)) }));

  app.get('/history', async (request) => {
    const query = validate(callHistoryQuerySchema, request.query);
    return { calls: await callService.listHistory(actorId(request), query.conversationId, query.limit) };
  });

  app.post('/', async (request, reply) => {
    const body = validate(createCallRequestSchema, request.body);
    const call = await callService.start(actorId(request), body.conversationId, body.media);
    return reply.status(201).send({ call });
  });

  app.post('/:callId/accept', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    return { call: await callService.accept(actorId(request), callId) };
  });

  app.post('/:callId/connected', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    return { call: await callService.markConnected(actorId(request), callId) };
  });

  app.post('/:callId/heartbeat', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    return { call: await callService.heartbeat(actorId(request), callId) };
  });

  app.post('/:callId/decline', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    return { call: await callService.decline(actorId(request), callId) };
  });

  app.post('/:callId/end', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    const body = validate(endCallRequestSchema, request.body ?? {});
    return { call: await callService.end(actorId(request), callId, body.reason) };
  });

  app.post('/:callId/signals', async (request, reply) => {
    const { callId } = validate(callParamsSchema, request.params);
    const body = validate(sendCallSignalRequestSchema, request.body);
    const id = await callService.sendSignal(actorId(request), callId, body);
    return reply.status(202).send({ id });
  });

  app.get('/:callId/signals', async (request) => {
    const { callId } = validate(callParamsSchema, request.params);
    const query = validate(callSignalsQuerySchema, request.query);
    return { signals: await callService.listSignals(actorId(request), callId, query.afterSequence, query.limit) };
  });
};
