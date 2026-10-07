import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validate } from '@/utils/validation';
import { notificationService } from './notification.service';
const subscriptionSchema=z.object({endpoint:z.string().url(),keys:z.object({p256dh:z.string().min(1),auth:z.string().min(1)})});
const unsubscribeSchema=z.object({endpoint:z.string().url()});
const preferencesSchema=z.object({enabled:z.boolean(),messagesEnabled:z.boolean(),connectionsEnabled:z.boolean()});
const conversationParamsSchema=z.object({conversationId:z.string().uuid()});
const conversationPreferenceSchema=z.object({muted:z.boolean()});
export const notificationRoutes:FastifyPluginAsync=async app=>{
 app.addHook('preHandler',app.authenticate);
 app.get('/config',async()=>({publicKey:notificationService.getPublicKey()}));
 app.get('/preferences',async request=>({preferences:await notificationService.getPreferences(request.user.sub)}));
 app.put('/preferences',async request=>({preferences:await notificationService.updatePreferences(request.user.sub,validate(preferencesSchema,request.body))}));
 app.get('/conversations/:conversationId',async(request,reply)=>{const {conversationId}=validate(conversationParamsSchema,request.params);const preference=await notificationService.getConversationPreference(request.user.sub,conversationId);if(!preference)return reply.status(404).send({error:'Conversation not found'});return {preference};});
 app.put('/conversations/:conversationId',async(request,reply)=>{const {conversationId}=validate(conversationParamsSchema,request.params);const {muted}=validate(conversationPreferenceSchema,request.body);const preference=await notificationService.updateConversationPreference(request.user.sub,conversationId,muted);if(!preference)return reply.status(404).send({error:'Conversation not found'});return {preference};});
 app.post('/subscriptions',async(request,reply)=>{await notificationService.subscribe(request.user.sub,validate(subscriptionSchema,request.body),request.headers['user-agent']);return reply.status(204).send();});
 app.delete('/subscriptions',async(request,reply)=>{await notificationService.unsubscribe(request.user.sub,validate(unsubscribeSchema,request.body).endpoint);return reply.status(204).send();});
};
