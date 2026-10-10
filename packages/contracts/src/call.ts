import { z } from 'zod';

export const callMediaSchema = z.enum(['audio', 'video']);
export type CallMedia = z.infer<typeof callMediaSchema>;

export const callStatusSchema = z.enum(['ringing', 'accepted', 'connected', 'ended']);
export type CallStatus = z.infer<typeof callStatusSchema>;

export const callEndReasonSchema = z.enum(['completed', 'rejected', 'canceled', 'missed', 'failed', 'busy']);
export type CallEndReason = z.infer<typeof callEndReasonSchema>;

export const callSignalKindSchema = z.enum(['offer', 'answer', 'candidate']);
export type CallSignalKind = z.infer<typeof callSignalKindSchema>;

const isoDate = z.coerce.date().transform((value) => value.toISOString()).or(z.string());
const optionalIsoDate = isoDate.nullish().transform((value) => value ?? undefined);

export const callPeerSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullish().transform((value) => value ?? undefined)
});
export type CallPeer = z.infer<typeof callPeerSchema>;

export const callSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  callerId: z.string().uuid(),
  calleeId: z.string().uuid(),
  media: callMediaSchema,
  status: callStatusSchema,
  endReason: callEndReasonSchema.nullish().transform((value) => value ?? undefined),
  ringExpiresAt: isoDate,
  createdAt: isoDate,
  acceptedAt: optionalIsoDate,
  connectedAt: optionalIsoDate,
  endedAt: optionalIsoDate,
  peer: callPeerSchema
});
export type Call = z.infer<typeof callSchema>;

export const callSignalSchema = z.object({
  id: z.string().uuid(),
  callId: z.string().uuid(),
  senderId: z.string().uuid(),
  kind: callSignalKindSchema,
  payload: z.unknown(),
  sequence: z.coerce.number().int().nonnegative(),
  createdAt: isoDate
});
export type CallSignal = z.infer<typeof callSignalSchema>;

export const sessionDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer']),
  sdp: z.string().min(1).max(64_000)
});

export const iceCandidateSchema = z.object({
  candidate: z.string().max(2_000),
  sdpMid: z.string().max(200).nullish(),
  sdpMLineIndex: z.number().int().nonnegative().nullish(),
  usernameFragment: z.string().max(200).nullish()
});

export const createCallRequestSchema = z.object({
  conversationId: z.string().uuid(),
  media: callMediaSchema
});

export const sendCallSignalRequestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('offer'), payload: sessionDescriptionSchema }),
  z.object({ kind: z.literal('answer'), payload: sessionDescriptionSchema }),
  z.object({ kind: z.literal('candidate'), payload: iceCandidateSchema })
]);
export type SendCallSignalRequest = z.infer<typeof sendCallSignalRequestSchema>;

export const endCallRequestSchema = z.object({
  reason: z.enum(['completed', 'canceled', 'failed']).default('completed')
});

export const callParamsSchema = z.object({ callId: z.string().uuid() });
export const callSignalsQuerySchema = z.object({
  afterSequence: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(200).default(100)
});
export const callHistoryQuerySchema = z.object({
  conversationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const callResponseSchema = z.object({ call: callSchema });
export const activeCallResponseSchema = z.object({ call: callSchema.optional() });
export const callHistoryResponseSchema = z.object({ calls: z.array(callSchema) });
export const callSignalsResponseSchema = z.object({ signals: z.array(callSignalSchema) });

export const iceServerSchema = z.object({
  urls: z.array(z.string()),
  username: z.string().optional(),
  credential: z.string().optional()
});
export type IceServer = z.infer<typeof iceServerSchema>;
export const iceServersResponseSchema = z.object({
  iceServers: z.array(iceServerSchema),
  ttlSeconds: z.number().int().positive()
});

export const CALL_RING_TIMEOUT_MS = 45_000;
export const CALL_CONNECT_TIMEOUT_MS = 30_000;

export const isActiveCallStatus = (status: CallStatus) => status !== 'ended';

export const callEndReasonLabel = (reason: CallEndReason | undefined, outgoing: boolean) => {
  switch (reason) {
    case 'rejected':
      return outgoing ? 'Declined' : 'You declined';
    case 'canceled':
      return outgoing ? 'Cancelled' : 'Missed call';
    case 'missed':
      return outgoing ? 'No answer' : 'Missed call';
    case 'busy':
      return 'Busy';
    case 'failed':
      return 'Connection failed';
    default:
      return outgoing ? 'Outgoing call' : 'Incoming call';
  }
};
