import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validate } from '@/utils/validation';
import { notificationService } from './notification.service';
const subscriptionSchema=z.object({endpoint:z.string().url(),keys:z.object({p256dh:z.string().min(1),auth:z.string().min(1)})});
const unsubscribeSchema=z.object({endpoint:z.string().url()});
const preferencesSchema=z.object({enabled:z.boolean(),messagesEnabled:z.boolean(),connectionsEnabled:z.boolean()});
export const notificationRoutes:FastifyPluginAsync=async app=>{
 app.addHook('preHandler',app.authenticate);
 app.get('/config',async()=>({publicKey:notificationService.getPublicKey()}));
 app.get('/preferences',async request=>({preferences:await notificationService.getPreferences(request.user.sub)}));
 app.put('/preferences',async request=>({preferences:await notificationService.updatePreferences(request.user.sub,validate(preferencesSchema,request.body))}));
 app.post('/subscriptions',async(request,reply)=>{await notificationService.subscribe(request.user.sub,validate(subscriptionSchema,request.body),request.headers['user-agent']);return reply.status(204).send();});
 app.delete('/subscriptions',async(request,reply)=>{await notificationService.unsubscribe(request.user.sub,validate(unsubscribeSchema,request.body).endpoint);return reply.status(204).send();});
};
