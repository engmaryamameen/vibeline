import { z } from 'zod';
import { callSchema, callSignalSchema } from './call';
import { messageSchema, presenceUpdateSchema, receiptUpdateSchema } from './chat';

const conversationId = z.string().uuid();

export const realtimeEventSchema = z.union([
  z.object({ type: z.enum(['message.created', 'message.updated', 'message.deleted']), conversationId, payload: messageSchema }),
  z.object({ type: z.literal('message.reaction'), conversationId, payload: z.object({ messageId: z.string().uuid() }) }),
  z.object({ type: z.literal('receipt.updated'), conversationId, payload: receiptUpdateSchema }),
  z.object({ type: z.literal('presence.updated'), conversationId: conversationId.optional(), payload: presenceUpdateSchema }),
  z.object({ type: z.literal('conversation.updated'), conversationId, payload: z.object({}) }),
  z.object({ type: z.literal('call.updated'), conversationId, payload: callSchema }),
  z.object({ type: z.literal('call.signal'), conversationId, payload: callSignalSchema })
]);

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;
export type RealtimeEventOf<TType extends RealtimeEvent['type']> = Extract<RealtimeEvent, { type: TType }>;
