import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import type { CallEndReason, CallMedia, CallSignalKind, CallStatus } from '@vibeline/contracts';
import { db } from '@/db/client';
import { callParticipants, calls, callSignals, conversationMembers, conversations, users } from '@/db/schema';

export type StoredCall = typeof calls.$inferSelect;
export type CallWithPeer = StoredCall & { peerDisplayName: string; peerAvatarUrl: string | null };

const ACTIVE_STATUSES: CallStatus[] = ['ringing', 'accepted', 'connected'];
const IN_PROGRESS_STATUSES: CallStatus[] = ['accepted', 'connected'];
const UNIQUE_VIOLATION = '23505';

export class CallBusyError extends Error {
  constructor() {
    super('A participant is already on another call');
    this.name = 'CallBusyError';
  }
}

const isUniqueViolation = (error: unknown) => (error as { code?: string } | null)?.code === UNIQUE_VIOLATION;

const callColumns = {
  id: calls.id,
  conversationId: calls.conversationId,
  callerId: calls.callerId,
  calleeId: calls.calleeId,
  media: calls.media,
  status: calls.status,
  endReason: calls.endReason,
  endedByUserId: calls.endedByUserId,
  ringExpiresAt: calls.ringExpiresAt,
  heartbeatAt: calls.heartbeatAt,
  createdAt: calls.createdAt,
  acceptedAt: calls.acceptedAt,
  connectedAt: calls.connectedAt,
  endedAt: calls.endedAt
};

const peerColumns = (viewerId: string) => {
  const peerId = sql`CASE WHEN ${calls.callerId} = ${viewerId} THEN ${calls.calleeId} ELSE ${calls.callerId} END`;
  return {
    peerDisplayName: sql<string>`COALESCE((SELECT u.display_name FROM users u WHERE u.id = ${peerId}), 'Unknown')`,
    peerAvatarUrl: sql<string | null>`(SELECT u.avatar_url FROM users u WHERE u.id = ${peerId})`
  };
};

class CallRepository {
  async findDirectPeer(conversationId: string, userId: string) {
    const [row] = await db
      .select({
        conversationType: conversations.type,
        peerId: conversationMembers.userId,
        peerDisplayName: users.displayName,
        peerAvatarUrl: users.avatarUrl
      })
      .from(conversations)
      .innerJoin(
        conversationMembers,
        and(eq(conversationMembers.conversationId, conversations.id), isNull(conversationMembers.leftAt), sql`${conversationMembers.userId} <> ${userId}`)
      )
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .where(and(eq(conversations.id, conversationId), isNull(conversations.archivedAt)))
      .limit(1);
    return row;
  }

  isActiveMember(conversationId: string, userId: string) {
    return db.query.conversationMembers
      .findFirst({
        where: and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId), isNull(conversationMembers.leftAt))
      })
      .then((row) => Boolean(row));
  }

  async create(input: { conversationId: string; callerId: string; calleeId: string; media: CallMedia; ringExpiresAt: Date }) {
    try {
      return await db.transaction(async (tx) => {
        const id = randomUUID();
        const [call] = await tx
          .insert(calls)
          .values({
            id,
            conversationId: input.conversationId,
            callerId: input.callerId,
            calleeId: input.calleeId,
            media: input.media,
            ringExpiresAt: input.ringExpiresAt
          })
          .returning();
        await tx.insert(callParticipants).values([
          { callId: id, userId: input.callerId, role: 'caller', joinedAt: new Date() },
          { callId: id, userId: input.calleeId, role: 'callee' }
        ]);
        return call!;
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new CallBusyError();
      throw error;
    }
  }

  async findById(callId: string, viewerId: string) {
    const [row] = await db
      .select({ ...callColumns, ...peerColumns(viewerId) })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);
    return row as CallWithPeer | undefined;
  }

  async findActiveForUser(userId: string) {
    const [row] = await db
      .select({ ...callColumns, ...peerColumns(userId) })
      .from(calls)
      .innerJoin(callParticipants, and(eq(callParticipants.callId, calls.id), eq(callParticipants.userId, userId), eq(callParticipants.active, true)))
      .where(inArray(calls.status, ACTIVE_STATUSES))
      .orderBy(desc(calls.createdAt))
      .limit(1);
    return row as CallWithPeer | undefined;
  }

  async listHistory(userId: string, conversationId: string | undefined, limit: number) {
    const rows = await db
      .select({ ...callColumns, ...peerColumns(userId) })
      .from(calls)
      .where(and(or(eq(calls.callerId, userId), eq(calls.calleeId, userId))!, ...(conversationId ? [eq(calls.conversationId, conversationId)] : [])))
      .orderBy(desc(calls.createdAt))
      .limit(limit);
    return rows as CallWithPeer[];
  }

  async accept(callId: string, calleeId: string) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [call] = await tx
        .update(calls)
        .set({ status: 'accepted', acceptedAt: now, heartbeatAt: now })
        .where(and(eq(calls.id, callId), eq(calls.calleeId, calleeId), eq(calls.status, 'ringing')))
        .returning();
      if (!call) return undefined;
      await tx.update(callParticipants).set({ joinedAt: now }).where(and(eq(callParticipants.callId, callId), eq(callParticipants.userId, calleeId)));
      return call;
    });
  }

  async markConnected(callId: string) {
    const now = new Date();
    const [call] = await db
      .update(calls)
      .set({ status: 'connected', connectedAt: now, heartbeatAt: now })
      .where(and(eq(calls.id, callId), eq(calls.status, 'accepted')))
      .returning();
    return call;
  }

  async heartbeat(callId: string, userId: string) {
    const [call] = await db
      .update(calls)
      .set({ heartbeatAt: new Date() })
      .where(and(eq(calls.id, callId), inArray(calls.status, IN_PROGRESS_STATUSES), or(eq(calls.callerId, userId), eq(calls.calleeId, userId))!))
      .returning();
    return call;
  }

  async end(callId: string, endedByUserId: string | null, reason: CallEndReason) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [call] = await tx
        .update(calls)
        .set({ status: 'ended', endedAt: now, endReason: reason, endedByUserId })
        .where(and(eq(calls.id, callId), inArray(calls.status, ACTIVE_STATUSES)))
        .returning();
      if (!call) return undefined;
      await tx
        .update(callParticipants)
        .set({ active: false, leftAt: now })
        .where(and(eq(callParticipants.callId, callId), eq(callParticipants.active, true)));
      await tx.delete(callSignals).where(eq(callSignals.callId, callId));
      return call;
    });
  }

  async expireStale(heartbeatTimeoutMs: number) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const staleBefore = new Date(now.getTime() - heartbeatTimeoutMs);
      const unanswered = await tx
        .update(calls)
        .set({ status: 'ended', endedAt: now, endReason: 'missed' })
        .where(and(eq(calls.status, 'ringing'), sql`${calls.ringExpiresAt} <= ${now}`))
        .returning();
      const abandoned = await tx
        .update(calls)
        .set({ status: 'ended', endedAt: now, endReason: 'failed' })
        .where(and(inArray(calls.status, IN_PROGRESS_STATUSES), sql`${calls.heartbeatAt} <= ${staleBefore}`))
        .returning();
      const expired = [...unanswered, ...abandoned];
      if (!expired.length) return [];
      const ids = expired.map((call) => call.id);
      await tx
        .update(callParticipants)
        .set({ active: false, leftAt: now })
        .where(and(inArray(callParticipants.callId, ids), eq(callParticipants.active, true)));
      await tx.delete(callSignals).where(inArray(callSignals.callId, ids));
      return expired;
    });
  }

  async addSignal(input: { callId: string; senderId: string; recipientId: string; kind: CallSignalKind; payload: unknown }) {
    const [row] = await db
      .insert(callSignals)
      .values({ id: randomUUID(), callId: input.callId, senderId: input.senderId, recipientId: input.recipientId, kind: input.kind, payload: input.payload })
      .returning();
    return row!;
  }

  findSignal(signalId: string) {
    return db.query.callSignals.findFirst({ where: eq(callSignals.id, signalId) });
  }

  listSignals(callId: string, recipientId: string, afterSequence: number, limit: number) {
    return db
      .select()
      .from(callSignals)
      .where(and(eq(callSignals.callId, callId), eq(callSignals.recipientId, recipientId), gt(callSignals.sequence, afterSequence)))
      .orderBy(asc(callSignals.sequence))
      .limit(limit);
  }
}

export const callRepository = new CallRepository();
