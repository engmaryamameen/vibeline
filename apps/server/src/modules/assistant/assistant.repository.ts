import { randomUUID } from 'node:crypto';
import { and,desc,eq,isNull,sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { assistantGenerations,conversationAssistants,conversationMembers,conversations,messages } from '@/db/schema';

const activeMembership=(conversationId:string,userId:string)=>and(eq(conversationMembers.conversationId,conversationId),eq(conversationMembers.userId,userId),isNull(conversationMembers.leftAt));

class AssistantRepository{
  getAssistant(conversationId:string){return db.query.conversationAssistants.findFirst({where:eq(conversationAssistants.conversationId,conversationId)});}
  async enableAssistant(conversationId:string,actorId:string,displayName:string){return db.transaction(async tx=>{
    await tx.execute(sql`SELECT id FROM conversations WHERE id=${conversationId} AND archived_at IS NULL FOR UPDATE`);
    const conversation=await tx.query.conversations.findFirst({where:eq(conversations.id,conversationId)});
    const member=await tx.query.conversationMembers.findFirst({where:activeMembership(conversationId,actorId)});
    if(!conversation||!member)return {kind:'not-found' as const};
    if(conversation.type!=='group')return {kind:'direct' as const};
    if(!['owner','admin'].includes(member.role))return {kind:'forbidden' as const};
    const existing=await tx.query.conversationAssistants.findFirst({where:eq(conversationAssistants.conversationId,conversationId)});
    if(existing)return {kind:'ok' as const,assistant:existing};
    const [assistant]=await tx.insert(conversationAssistants).values({id:randomUUID(),conversationId,displayName,joinedSequence:conversation.nextMessageSequence,createdByUserId:actorId}).returning();
    return {kind:'ok' as const,assistant:assistant!};
  });}
  async beginGeneration(conversationId:string,userId:string,clientRequestId:string){return db.transaction(async tx=>{
    const member=await tx.query.conversationMembers.findFirst({where:activeMembership(conversationId,userId)});
    if(!member)return {kind:'not-found' as const};
    const assistant=await tx.query.conversationAssistants.findFirst({where:eq(conversationAssistants.conversationId,conversationId)});
    if(!assistant)return {kind:'not-configured' as const};
    const id=randomUUID();
    const [created]=await tx.insert(assistantGenerations).values({id,conversationId,assistantId:assistant.id,requestedByUserId:userId,clientRequestId,status:'running',startedAt:new Date()}).onConflictDoNothing({target:[assistantGenerations.conversationId,assistantGenerations.requestedByUserId,assistantGenerations.clientRequestId]}).returning();
    const generation=created??await tx.query.assistantGenerations.findFirst({where:and(eq(assistantGenerations.conversationId,conversationId),eq(assistantGenerations.requestedByUserId,userId),eq(assistantGenerations.clientRequestId,clientRequestId))});
    return {kind:'ok' as const,assistant,generation:generation!,created:Boolean(created),joinedSequence:member.joinedSequence};
  });}
  async listContext(conversationId:string,joinedSequence:number,limit=40){const rows=await db.select().from(messages).where(and(eq(messages.conversationId,conversationId),sql`${messages.sequence} >= ${joinedSequence}`,isNull(messages.deletedAt))).orderBy(desc(messages.sequence)).limit(limit);return rows.reverse();}
  async completeGeneration(generationId:string,text:string,usage:{provider:string;model:string;inputTokens?:number;outputTokens?:number;totalTokens?:number;latencyMs:number}){return db.transaction(async tx=>{
    const generation=await tx.query.assistantGenerations.findFirst({where:eq(assistantGenerations.id,generationId)});
    if(!generation)return null;
    if(generation.status==='completed'&&generation.finalMessageId)return tx.query.messages.findFirst({where:eq(messages.id,generation.finalMessageId)});
    if(generation.status!=='running')return null;
    await tx.execute(sql`SELECT id FROM conversations WHERE id=${generation.conversationId} AND archived_at IS NULL FOR UPDATE`);
    const [conversation]=await tx.select().from(conversations).where(eq(conversations.id,generation.conversationId)).limit(1);if(!conversation)return null;
    const [message]=await tx.insert(messages).values({id:randomUUID(),conversationId:generation.conversationId,assistantId:generation.assistantId,clientMessageId:generation.id,sequence:conversation.nextMessageSequence,body:text}).returning();
    await tx.update(conversations).set({nextMessageSequence:conversation.nextMessageSequence+1,updatedAt:new Date()}).where(eq(conversations.id,generation.conversationId));
    await tx.update(assistantGenerations).set({status:'completed',provider:usage.provider,model:usage.model,finalMessageId:message!.id,inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens,latencyMs:usage.latencyMs,completedAt:new Date(),errorCode:null}).where(eq(assistantGenerations.id,generationId));
    return message!;
  });}
  failGeneration(id:string,errorCode:string,latencyMs:number){return db.update(assistantGenerations).set({status:'failed',errorCode,latencyMs,completedAt:new Date()}).where(and(eq(assistantGenerations.id,id),eq(assistantGenerations.status,'running')));}
  getFinalMessage(id:string){return db.query.messages.findFirst({where:eq(messages.id,id)});}
}
export const assistantRepository=new AssistantRepository();
