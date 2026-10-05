import { randomUUID } from 'node:crypto';
import { and,eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { notificationPreferences,pushSubscriptions } from '@/db/schema';

export const notificationRepository={
 async upsertSubscription(userId:string,subscription:{endpoint:string;keys:{p256dh:string;auth:string}},userAgent?:string){
  const [row]=await db.insert(pushSubscriptions).values({id:randomUUID(),userId,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,userAgent}).onConflictDoUpdate({target:pushSubscriptions.endpoint,set:{userId,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,userAgent,updatedAt:new Date()}}).returning();return row!;
 },
 async removeSubscription(userId:string,endpoint:string){await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId,userId),eq(pushSubscriptions.endpoint,endpoint)));},
 listSubscriptions(userId:string){return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId,userId));},
 async removeEndpoint(endpoint:string){await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint,endpoint));},
 async getPreferences(userId:string){return (await db.query.notificationPreferences.findFirst({where:eq(notificationPreferences.userId,userId)}))??{userId,enabled:true,messagesEnabled:true,connectionsEnabled:true,updatedAt:new Date()};},
 async updatePreferences(userId:string,value:{enabled:boolean;messagesEnabled:boolean;connectionsEnabled:boolean}){const [row]=await db.insert(notificationPreferences).values({userId,...value}).onConflictDoUpdate({target:notificationPreferences.userId,set:{...value,updatedAt:new Date()}}).returning();return row!;}
};
