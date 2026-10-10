import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MEDIA_MAX_UPLOAD_BYTES, MEDIA_UPLOAD_CONTENT_TYPES } from '@vibeline/contracts';
import { validate } from '@/utils/validation';
import { mediaService } from './media.service';

const assetParamsSchema = z.object({ id: z.string().uuid() });

const readFilename = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  for (const contentType of [...MEDIA_UPLOAD_CONTENT_TYPES, 'application/octet-stream']) {
    app.addContentTypeParser(contentType, { parseAs: 'buffer', bodyLimit: MEDIA_MAX_UPLOAD_BYTES }, (_request, body, done) => done(null, body));
  }

  app.addHook('preHandler', app.authenticate);

  app.post('/assets', async (request, reply) => {
    const data = request.body;
    if (!Buffer.isBuffer(data)) {
      return reply.status(400).send({ code: 'UNSUPPORTED_MEDIA', message: 'Media body is required' });
    }
    const asset = await mediaService.upload(
      request.user.sub,
      data,
      readFilename(request.headers['x-file-name']),
      request.headers['content-type']
    );
    return reply.status(201).send({ asset });
  });

  app.get('/assets/:id/content', async (request, reply) => {
    const { id } = validate(assetParamsSchema, request.params);
    const { asset, stream } = await mediaService.content(request.user.sub, id);
    return reply
      .header('content-type', asset.mimeType)
      .header('content-length', String(asset.sizeBytes))
      .header('cache-control', 'private, max-age=3600, immutable')
      .send(stream);
  });
};
