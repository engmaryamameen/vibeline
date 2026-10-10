import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createStoryRequestSchema, storyAuthorParamsSchema, storyParamsSchema } from '@vibeline/contracts';
import { rateLimit } from '@/middleware/rate-limit';
import { validate } from '@/utils/validation';
import { storyService } from './story.service';

const actorId = (request: FastifyRequest) => request.user.sub;

export const storyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/feed', async (request) => ({ groups: await storyService.feed(actorId(request)) }));

  app.post('/', { preHandler: [rateLimit('story-create', 20, 60_000)] }, async (request, reply) => {
    const body = validate(createStoryRequestSchema, request.body);
    const story = await storyService.create(actorId(request), body.mediaAssetId, body.caption, body.durationMs);
    return reply.status(201).send({ story });
  });

  app.get('/authors/:authorUserId', async (request) => {
    const { authorUserId } = validate(storyAuthorParamsSchema, request.params);
    return { stories: await storyService.listByAuthor(actorId(request), authorUserId) };
  });

  app.post('/:storyId/views', async (request) => {
    const { storyId } = validate(storyParamsSchema, request.params);
    return { story: await storyService.markViewed(actorId(request), storyId) };
  });

  app.get('/:storyId/viewers', async (request) => {
    const { storyId } = validate(storyParamsSchema, request.params);
    return { viewers: await storyService.listViewers(actorId(request), storyId) };
  });

  app.delete('/:storyId', async (request, reply) => {
    const { storyId } = validate(storyParamsSchema, request.params);
    await storyService.remove(actorId(request), storyId);
    return reply.status(204).send();
  });
};
