import { randomUUID } from 'node:crypto';
import { and,desc,eq,isNull,sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { assistantGenerationAttempts,assistantGenerations,conversationAssistants,conversationMembers,conversations,messages } from '@/db/schema';
import type { ModelProviderDescriptor } from './model.gateway';

const activeMembership=(conversationId:string,userId:string)=>and(eq(conversationMembers.conversationId,conversationId),eq(conversationMembers.userId,userId),isNull(conversationMembers.leftAt));
const LEASE_MS=45_000;
export type GenerationFailureCode='AUTHORIZATION_REVOKED'|'CONVERSATION_UNAVAILABLE'|'PROVIDER_TIMEOUT'|'PROVIDER_RATE_LIMIT'|'PROVIDER_SERVER_FAILURE'|'INVALID_PROVIDER_RESPONSE'|'GENERATION_OWNERSHIP_LOST'|'FINALIZATION_FAILURE'|'INTERNAL_FAILURE'|'PROVIDER_UNAVAILABLE';

class AssistantRepository{
  getAssistant(conversationId:string){return db.query.conversationAssistants.findFirst({where:eq(conversationAssistants.conversationId,conversationId)});}
  async getState(conversationId:string,userId:string){
    const conversation=await db.query.conversations.findFirst({where:and(eq(conversations.id,conversationId),isNull(conversations.archivedAt))});
    if(!conversation||!(await db.query.conversationMembers.findFirst({where:activeMembership(conversationId,userId)})))return null;
    const assistant=await this.getAssistant(conversationId);
    const generation=assistant?await db.query.assistantGenerations.findFirst({where:and(eq(assistantGenerations.conversationId,conversationId),eq(assistantGenerations.requestedByUserId,userId)),orderBy:[desc(assistantGenerations.createdAt)]}):undefined;
    return {assistant,generation};
  }
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

  async claimGeneration(conversationId:string,userId:string,clientRequestId:string,provider:ModelProviderDescriptor){return db.transaction(async tx=>{
    const locked=await tx.execute(sql`SELECT id FROM conversations WHERE id=${conversationId} AND archived_at IS NULL FOR UPDATE`);
    if(!locked.rowCount)return {kind:'not-found' as const};
    const member=await tx.query.conversationMembers.findFirst({where:activeMembership(conversationId,userId)});
    if(!member)return {kind:'not-found' as const};
    const assistant=await tx.query.conversationAssistants.findFirst({where:eq(conversationAssistants.conversationId,conversationId)});
    if(!assistant)return {kind:'not-configured' as const};

    const newId=randomUUID();
    const [created]=await tx.insert(assistantGenerations).values({id:newId,conversationId,assistantId:assistant.id,requestedByUserId:userId,clientRequestId,status:'pending'}).onConflictDoNothing({target:[assistantGenerations.conversationId,assistantGenerations.requestedByUserId,assistantGenerations.clientRequestId]}).returning();
    const generation=created??await tx.query.assistantGenerations.findFirst({where:and(eq(assistantGenerations.conversationId,conversationId),eq(assistantGenerations.requestedByUserId,userId),eq(assistantGenerations.clientRequestId,clientRequestId))});
    if(!generation)throw new Error('GENERATION_IDEMPOTENCY_LOOKUP_FAILED');
    if(generation.status==='completed'||generation.status==='failed')return {kind:'existing' as const,generation};

    if(generation.status==='running'&&generation.leaseExpiresAt&&generation.leaseExpiresAt.getTime()>Date.now())return {kind:'existing' as const,generation};

    if(generation.status==='running'&&generation.ownerToken){
      await tx.update(assistantGenerationAttempts).set({status:'abandoned',errorCode:'GENERATION_OWNERSHIP_LOST',completedAt:new Date()}).where(and(eq(assistantGenerationAttempts.generationId,generation.id),eq(assistantGenerationAttempts.ownerToken,generation.ownerToken),eq(assistantGenerationAttempts.status,'running')));
    }

    const ownerToken=randomUUID();
    const attemptNumber=generation.attemptCount+1;
    const leaseExpiresAt=new Date(Date.now()+LEASE_MS);
    const attemptId=randomUUID();
    await tx.insert(assistantGenerationAttempts).values({id:attemptId,generationId:generation.id,attemptNumber,ownerToken,status:'running',provider:provider.provider,model:provider.model,leaseExpiresAt});
    const [claimed]=await tx.update(assistantGenerations).set({status:'running',ownerToken,leaseExpiresAt,attemptCount:attemptNumber,startedAt:new Date(),completedAt:null,errorCode:null}).where(eq(assistantGenerations.id,generation.id)).returning();

    return {kind:'claimed' as const,generation:claimed!,assistant,ownerToken,attemptId};
  });}

  async prepareProviderInvocation(conversationId:string,generationId:string,ownerToken:string){return db.transaction(async tx=>{
    const locked=await tx.execute(sql`SELECT id FROM conversations WHERE id=${conversationId} AND archived_at IS NULL FOR UPDATE`);
    if(!locked.rowCount)return {kind:'conversation-unavailable' as const};
    const generation=await tx.query.assistantGenerations.findFirst({where:eq(assistantGenerations.id,generationId)});
    if(!generation||generation.status!=='running'||generation.ownerToken!==ownerToken||!generation.leaseExpiresAt||generation.leaseExpiresAt.getTime()<=Date.now())return {kind:'ownership-lost' as const};
    const member=await tx.query.conversationMembers.findFirst({where:activeMembership(conversationId,generation.requestedByUserId)});
    const assistant=await tx.query.conversationAssistants.findFirst({where:eq(conversationAssistants.id,generation.assistantId)});
    if(!member||!assistant)return {kind:'authorization-revoked' as const};
    const lower=Math.max(member.joinedSequence,assistant.joinedSequence);
    const contextRows=await tx.select().from(messages).where(and(eq(messages.conversationId,conversationId),sql`${messages.sequence} >= ${lower}`,isNull(messages.deletedAt))).orderBy(desc(messages.sequence)).limit(40);
    return {kind:'authorized' as const,context:contextRows.reverse()};
  });}

  async completeGeneration(conversationId:string,generationId:string,ownerToken:string,text:string,usage:{provider:string;model:string;inputTokens?:number;outputTokens?:number;totalTokens?:number;latencyMs:number}){return db.transaction(async tx=>{
    const locked=await tx.execute(sql`SELECT id FROM conversations WHERE id=${conversationId} AND archived_at IS NULL FOR UPDATE`);
    if(!locked.rowCount){await tx.update(assistantGenerationAttempts).set({status:'failed',errorCode:'CONVERSATION_UNAVAILABLE',latencyMs:usage.latencyMs,provider:usage.provider,model:usage.model,completedAt:new Date()}).where(and(eq(assistantGenerationAttempts.generationId,generationId),eq(assistantGenerationAttempts.ownerToken,ownerToken),eq(assistantGenerationAttempts.status,'running')));await tx.update(assistantGenerations).set({status:'failed',errorCode:'CONVERSATION_UNAVAILABLE',latencyMs:usage.latencyMs,provider:usage.provider,model:usage.model,completedAt:new Date(),ownerToken:null,leaseExpiresAt:null}).where(and(eq(assistantGenerations.id,generationId),eq(assistantGenerations.ownerToken,ownerToken),eq(assistantGenerations.status,'running')));return {kind:'conversation-unavailable' as const};}
    const generation=await tx.query.assistantGenerations.findFirst({where:eq(assistantGenerations.id,generationId)});
    if(!generation||generation.conversationId!==conversationId||generation.status!=='running'||generation.ownerToken!==ownerToken)return {kind:'ownership-lost' as const};
    if(!generation.leaseExpiresAt||generation.leaseExpiresAt.getTime()<=Date.now())return {kind:'ownership-lost' as const};
    const member=await tx.query.conversationMembers.findFirst({where:activeMembership(conversationId,generation.requestedByUserId)});
    if(!member){await tx.update(assistantGenerationAttempts).set({status:'failed',errorCode:'AUTHORIZATION_REVOKED',latencyMs:usage.latencyMs,provider:usage.provider,model:usage.model,completedAt:new Date()}).where(and(eq(assistantGenerationAttempts.generationId,generationId),eq(assistantGenerationAttempts.ownerToken,ownerToken),eq(assistantGenerationAttempts.status,'running')));await tx.update(assistantGenerations).set({status:'failed',errorCode:'AUTHORIZATION_REVOKED',latencyMs:usage.latencyMs,provider:usage.provider,model:usage.model,completedAt:new Date(),ownerToken:null,leaseExpiresAt:null}).where(and(eq(assistantGenerations.id,generationId),eq(assistantGenerations.ownerToken,ownerToken)));return {kind:'authorization-revoked' as const};}
    const [conversation]=await tx.select().from(conversations).where(eq(conversations.id,conversationId)).limit(1);
    if(!conversation)return {kind:'conversation-unavailable' as const};
    const [message]=await tx.insert(messages).values({id:randomUUID(),conversationId,assistantId:generation.assistantId,clientMessageId:generation.id,sequence:conversation.nextMessageSequence,body:text}).returning();
    await tx.update(conversations).set({nextMessageSequence:conversation.nextMessageSequence+1,updatedAt:new Date()}).where(eq(conversations.id,conversationId));
    await tx.update(assistantGenerationAttempts).set({status:'succeeded',provider:usage.provider,model:usage.model,inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens,latencyMs:usage.latencyMs,completedAt:new Date()}).where(and(eq(assistantGenerationAttempts.generationId,generationId),eq(assistantGenerationAttempts.ownerToken,ownerToken),eq(assistantGenerationAttempts.status,'running')));
    await tx.update(assistantGenerations).set({status:'completed',provider:usage.provider,model:usage.model,finalMessageId:message!.id,inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens,latencyMs:usage.latencyMs,completedAt:new Date(),errorCode:null,ownerToken:null,leaseExpiresAt:null}).where(and(eq(assistantGenerations.id,generationId),eq(assistantGenerations.ownerToken,ownerToken)));
    return {kind:'completed' as const,message:message!};
  });}

  async failOwned(generationId:string,ownerToken:string,errorCode:GenerationFailureCode,latencyMs:number,provider?:ModelProviderDescriptor){return db.transaction(async tx=>{
    const generation=await tx.query.assistantGenerations.findFirst({where:eq(assistantGenerations.id,generationId)});
    if(!generation||generation.status!=='running'||generation.ownerToken!==ownerToken)return false;
    await tx.update(assistantGenerationAttempts).set({status:'failed',errorCode,latencyMs,provider:provider?.provider,model:provider?.model,completedAt:new Date()}).where(and(eq(assistantGenerationAttempts.generationId,generationId),eq(assistantGenerationAttempts.ownerToken,ownerToken),eq(assistantGenerationAttempts.status,'running')));
    await tx.update(assistantGenerations).set({status:'failed',errorCode,latencyMs,provider:provider?.provider,model:provider?.model,completedAt:new Date(),ownerToken:null,leaseExpiresAt:null}).where(and(eq(assistantGenerations.id,generationId),eq(assistantGenerations.ownerToken,ownerToken)));
    return true;
  });}

  getFinalMessage(id:string){return db.query.messages.findFirst({where:eq(messages.id,id)});}
  getGeneration(conversationId:string,userId:string,clientRequestId:string){return db.query.assistantGenerations.findFirst({where:and(eq(assistantGenerations.conversationId,conversationId),eq(assistantGenerations.requestedByUserId,userId),eq(assistantGenerations.clientRequestId,clientRequestId))});}
  getAttempts(generationId:string){return db.select().from(assistantGenerationAttempts).where(eq(assistantGenerationAttempts.generationId,generationId)).orderBy(assistantGenerationAttempts.attemptNumber);}
}
export const assistantRepository=new AssistantRepository();
