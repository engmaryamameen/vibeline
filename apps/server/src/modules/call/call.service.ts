import type { FastifyBaseLogger } from 'fastify';
import {
  CALL_RING_TIMEOUT_MS,
  type Call,
  type CallEndReason,
  type CallMedia,
  type SendCallSignalRequest
} from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { realtimePublisher } from '@/modules/chat/realtime.publisher';
import { notificationService } from '@/modules/notification/notification.service';
import { userRepository } from '@/repositories/user.repository';
import { CallBusyError, callRepository, type CallWithPeer } from './call.repository';

const HEARTBEAT_TIMEOUT_MS = 60_000;
const SWEEP_INTERVAL_MS = 15_000;

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : undefined);

const toCall = (row: CallWithPeer, viewerId: string): Call => ({
  id: row.id,
  conversationId: row.conversationId,
  callerId: row.callerId,
  calleeId: row.calleeId,
  media: row.media,
  status: row.status,
  ...(row.endReason ? { endReason: row.endReason } : {}),
  ringExpiresAt: row.ringExpiresAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  ...(iso(row.acceptedAt) ? { acceptedAt: iso(row.acceptedAt)! } : {}),
  ...(iso(row.connectedAt) ? { connectedAt: iso(row.connectedAt)! } : {}),
  ...(iso(row.endedAt) ? { endedAt: iso(row.endedAt)! } : {}),
  peer: {
    userId: row.callerId === viewerId ? row.calleeId : row.callerId,
    displayName: row.peerDisplayName,
    ...(row.peerAvatarUrl ? { avatarUrl: row.peerAvatarUrl } : {})
  }
});

class CallService {
  private logger: FastifyBaseLogger | undefined;
  private sweeper: NodeJS.Timeout | undefined;

  setLogger(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  startExpirySweeper() {
    if (this.sweeper) return;
    this.sweeper = setInterval(() => {
      void this.expireStale().catch((error) => this.logger?.error({ error, operation: 'call.sweep' }, 'call expiry sweep failed'));
    }, SWEEP_INTERVAL_MS);
    this.sweeper.unref();
  }

  stopExpirySweeper() {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = undefined;
  }

  async expireStale() {
    const expired = await callRepository.expireStale(HEARTBEAT_TIMEOUT_MS);
    for (const call of expired) {
      await this.broadcast(call.id, [call.callerId, call.calleeId], call.conversationId);
      if (call.endReason === 'missed') void this.notifyMissed(call.callerId, call.calleeId, call.conversationId);
    }
    return expired.length;
  }

  async start(userId: string, conversationId: string, media: CallMedia) {
    await this.expireStale();

    const peer = await callRepository.findDirectPeer(conversationId, userId);
    if (!peer) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    if (peer.conversationType !== 'direct') throw new AppError(400, 'CALL_UNSUPPORTED_CONVERSATION', 'Calling is available in one-to-one conversations only');
    if (!(await callRepository.isActiveMember(conversationId, userId))) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');

    let created;
    try {
      created = await callRepository.create({
        conversationId,
        callerId: userId,
        calleeId: peer.peerId,
        media,
        ringExpiresAt: new Date(Date.now() + CALL_RING_TIMEOUT_MS)
      });
    } catch (error) {
      if (error instanceof CallBusyError) throw new AppError(409, 'CALL_BUSY', 'Either you or the person you are calling is already on a call');
      throw error;
    }

    await this.broadcast(created.id, [userId, peer.peerId], conversationId);
    void this.notifyIncoming(userId, peer.peerId, conversationId, media);
    return this.require(created.id, userId);
  }

  async getActive(userId: string) {
    await this.expireStale();
    const row = await callRepository.findActiveForUser(userId);
    return row ? toCall(row, userId) : undefined;
  }

  async listHistory(userId: string, conversationId: string | undefined, limit: number) {
    const rows = await callRepository.listHistory(userId, conversationId, limit);
    return rows.map((row) => toCall(row, userId));
  }

  async accept(userId: string, callId: string) {
    const existing = await this.requireParticipant(callId, userId);
    if (existing.calleeId !== userId) throw new AppError(403, 'CALL_FORBIDDEN', 'Only the person being called can accept');
    if (existing.status === 'ended') throw new AppError(409, 'CALL_ALREADY_ENDED', 'This call has already ended');

    const accepted = await callRepository.accept(callId, userId);
    if (!accepted) throw new AppError(409, 'CALL_NOT_RINGING', 'This call is no longer ringing');
    await this.broadcast(callId, [accepted.callerId, accepted.calleeId], accepted.conversationId);
    return this.require(callId, userId);
  }

  async markConnected(userId: string, callId: string) {
    const existing = await this.requireParticipant(callId, userId);
    if (existing.status === 'accepted') {
      const connected = await callRepository.markConnected(callId);
      if (connected) await this.broadcast(callId, [connected.callerId, connected.calleeId], connected.conversationId);
    }
    return this.require(callId, userId);
  }

  async heartbeat(userId: string, callId: string) {
    const call = await callRepository.heartbeat(callId, userId);
    if (!call) throw new AppError(409, 'CALL_ALREADY_ENDED', 'This call is no longer active');
    return this.require(callId, userId);
  }

  async decline(userId: string, callId: string) {
    const existing = await this.requireParticipant(callId, userId);
    if (existing.calleeId !== userId) throw new AppError(403, 'CALL_FORBIDDEN', 'Only the person being called can decline');
    return this.finish(callId, userId, 'rejected');
  }

  async end(userId: string, callId: string, reason: 'completed' | 'canceled' | 'failed') {
    const existing = await this.requireParticipant(callId, userId);
    const effective: CallEndReason = existing.status === 'ringing' && existing.callerId === userId ? 'canceled' : reason;
    return this.finish(callId, userId, effective);
  }

  async sendSignal(userId: string, callId: string, request: SendCallSignalRequest) {
    const call = await this.requireParticipant(callId, userId);
    if (call.status === 'ended') throw new AppError(409, 'CALL_ALREADY_ENDED', 'This call has already ended');
    if (request.kind === 'answer' && call.status === 'ringing') throw new AppError(409, 'CALL_NOT_RINGING', 'The call must be accepted before answering');

    const recipientId = call.callerId === userId ? call.calleeId : call.callerId;
    const signal = await callRepository.addSignal({ callId, senderId: userId, recipientId, kind: request.kind, payload: request.payload });
    await realtimePublisher
      .publish(
        [recipientId],
        { type: 'call.signal', conversationId: call.conversationId, payload: this.toSignal(signal) },
        { kind: 'call-signal', id: signal.id }
      )
      .catch((error) => this.logger?.error({ error, operation: 'call.signal.publish', callId }, 'call signal publish failed'));
    return signal.id;
  }

  async listSignals(userId: string, callId: string, afterSequence: number, limit: number) {
    await this.requireParticipant(callId, userId);
    const rows = await callRepository.listSignals(callId, userId, afterSequence, limit);
    return rows.map((row) => this.toSignal(row));
  }

  async getSignalForRealtime(signalId: string) {
    const signal = await callRepository.findSignal(signalId);
    return signal ? this.toSignal(signal) : undefined;
  }

  private toSignal(signal: Awaited<ReturnType<typeof callRepository.addSignal>>) {
    return {
      id: signal.id,
      callId: signal.callId,
      senderId: signal.senderId,
      kind: signal.kind,
      payload: signal.payload,
      sequence: Number(signal.sequence),
      createdAt: signal.createdAt.toISOString()
    };
  }

  private async finish(callId: string, userId: string, reason: CallEndReason) {
    const ended = await callRepository.end(callId, userId, reason);
    if (ended) {
      await this.broadcast(callId, [ended.callerId, ended.calleeId], ended.conversationId);
      if (reason === 'canceled') void this.notifyMissed(ended.callerId, ended.calleeId, ended.conversationId);
    }
    return this.require(callId, userId);
  }

  private async broadcast(callId: string, userIds: string[], conversationId: string) {
    for (const userId of new Set(userIds)) {
      const row = await callRepository.findById(callId, userId);
      if (!row) continue;
      await realtimePublisher
        .publish([userId], { type: 'call.updated', conversationId, payload: toCall(row, userId) })
        .catch((error) => this.logger?.error({ error, operation: 'call.publish', callId }, 'call state publish failed'));
    }
  }

  private async require(callId: string, userId: string) {
    const row = await callRepository.findById(callId, userId);
    if (!row) throw new AppError(404, 'CALL_NOT_FOUND', 'Call not found');
    return toCall(row, userId);
  }

  private async requireParticipant(callId: string, userId: string) {
    const row = await callRepository.findById(callId, userId);
    if (!row || (row.callerId !== userId && row.calleeId !== userId)) throw new AppError(404, 'CALL_NOT_FOUND', 'Call not found');
    return row;
  }

  private async notifyIncoming(callerId: string, calleeId: string, conversationId: string, media: CallMedia) {
    try {
      const caller = await userRepository.findById(callerId);
      await notificationService.notify(calleeId, 'call', {
        title: caller?.displayName ?? 'Vibeline',
        body: media === 'video' ? 'Incoming video call' : 'Incoming audio call',
        url: `/chat?conversation=${conversationId}`,
        tag: `call:${conversationId}`,
        conversationId
      });
    } catch (error) {
      this.logger?.error({ error, operation: 'call.notify.incoming', conversationId }, 'incoming call notification failed');
    }
  }

  private async notifyMissed(callerId: string, calleeId: string, conversationId: string) {
    try {
      const caller = await userRepository.findById(callerId);
      await notificationService.notify(calleeId, 'call', {
        title: caller?.displayName ?? 'Vibeline',
        body: 'Missed call',
        url: `/chat?conversation=${conversationId}`,
        tag: `call:${conversationId}`,
        conversationId
      });
    } catch (error) {
      this.logger?.error({ error, operation: 'call.notify.missed', conversationId }, 'missed call notification failed');
    }
  }
}

export const callService = new CallService();
