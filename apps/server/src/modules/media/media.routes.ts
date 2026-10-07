import type { FastifyPluginAsync } from 'fastify';import { mediaService } from './media.service';
export const mediaRoutes:FastifyPluginAsync=async app=>{
 for(const type of ['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/ogg','audio/mp4','application/octet-stream'])app.addContentTypeParser(type,{parseAs:'buffer',bodyLimit:25*1024*1024},(_req,body,done)=>done(null,body));
 app.addHook('preHandler',app.authenticate);
 app.post('/assets',async(request,reply)=>{const data=request.body as Buffer;if(!Buffer.isBuffer(data))return reply.status(400).send({code:'INVALID_MEDIA',message:'Media body is required'});const asset=await mediaService.upload(request.user.sub,data,typeof request.headers['x-file-name']==='string'?decodeURIComponent(request.headers['x-file-name']):undefined,typeof request.headers['content-type']==='string'?request.headers['content-type']:undefined);return reply.status(201).send({asset:{id:asset.id,mimeType:asset.mimeType,sizeBytes:asset.sizeBytes,originalFilename:asset.originalFilename,url:`/media/assets/${asset.id}/content`}});});
 app.get('/assets/:id/content',async(request,reply)=>{const {id}=request.params as {id:string};const {asset,data}=await mediaService.content(id);return reply.header('content-type',asset.mimeType).header('cache-control','private, max-age=3600').send(data);});
};
