import webpush from 'web-push';
import type { FastifyBaseLogger } from 'fastify';
import { env } from '@/config/env';
import { notificationRepository } from './notification.repository';

type Kind='message'|'connection';
type Payload={title:string;body:string;url:string;tag:string;conversationId?:string};
class NotificationService{
 private logger?:FastifyBaseLogger;
 private configured=Boolean(env.WEB_PUSH_PUBLIC_KEY&&env.WEB_PUSH_PRIVATE_KEY&&env.WEB_PUSH_SUBJECT);
 constructor(){if(this.configured)webpush.setVapidDetails(env.WEB_PUSH_SUBJECT!,env.WEB_PUSH_PUBLIC_KEY!,env.WEB_PUSH_PRIVATE_KEY!);}
 setLogger(logger:FastifyBaseLogger){this.logger=logger;}
 getPublicKey(){return this.configured?env.WEB_PUSH_PUBLIC_KEY:null;}
 async subscribe(userId:string,subscription:{endpoint:string;keys:{p256dh:string;auth:string}},userAgent?:string){if(!this.configured)throw new Error('Web Push is not configured');return notificationRepository.upsertSubscription(userId,subscription,userAgent);}
 unsubscribe(userId:string,endpoint:string){return notificationRepository.removeSubscription(userId,endpoint);}
 getPreferences(userId:string){return notificationRepository.getPreferences(userId);}
 updatePreferences(userId:string,value:{enabled:boolean;messagesEnabled:boolean;connectionsEnabled:boolean}){return notificationRepository.updatePreferences(userId,value);}
 async getConversationPreference(userId:string,conversationId:string){const row=await notificationRepository.getConversationPreference(userId,conversationId);return row?{muted:row.notificationsMuted}:null;}
 async updateConversationPreference(userId:string,conversationId:string,muted:boolean){const row=await notificationRepository.updateConversationPreference(userId,conversationId,muted);return row?{muted:row.notificationsMuted}:null;}
 async notify(userId:string,kind:Kind,payload:Payload){
  if(!this.configured)return;
  try{const prefs=await notificationRepository.getPreferences(userId);if(!prefs.enabled||(kind==='message'&&!prefs.messagesEnabled)||(kind==='connection'&&!prefs.connectionsEnabled))return;if(kind==='message'&&payload.conversationId){const conversation=await notificationRepository.getConversationPreference(userId,payload.conversationId);if(!conversation||conversation.notificationsMuted)return;}const subscriptions=await notificationRepository.listSubscriptions(userId);await Promise.allSettled(subscriptions.map(async sub=>{try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify(payload),{TTL:60*60,urgency:'high'});}catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404||status===410)await notificationRepository.removeEndpoint(sub.endpoint);else throw error;}}));}
  catch(error){this.logger?.error({error,operation:'push.notify',userId,kind},'push notification delivery failed');}
 }
}
export const notificationService=new NotificationService();
