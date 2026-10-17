import {
  activeCallResponseSchema,
  callHistoryResponseSchema,
  callResponseSchema,
  callSignalsResponseSchema,
  iceServersResponseSchema,
  type CallMedia,
  type SendCallSignalRequest
} from '@vibeline/contracts';
import type { AuthorizedRequest } from '@/src/lib/authorized-request';

export const callApi = (request: AuthorizedRequest) => ({
  iceServers: () => request('/calls/ice-servers', { responseSchema: iceServersResponseSchema }),
  active: () => request('/calls/active', { responseSchema: activeCallResponseSchema }),
  history: (conversationId?: string, limit = 30) =>
    request(`/calls/history?${new URLSearchParams({ ...(conversationId ? { conversationId } : {}), limit: String(limit) })}`, {
      responseSchema: callHistoryResponseSchema
    }),
  start: (conversationId: string, media: CallMedia) =>
    request('/calls', { method: 'POST', body: { conversationId, media }, responseSchema: callResponseSchema }),
  accept: (callId: string) => request(`/calls/${callId}/accept`, { method: 'POST', responseSchema: callResponseSchema }),
  markConnected: (callId: string) => request(`/calls/${callId}/connected`, { method: 'POST', responseSchema: callResponseSchema }),
  heartbeat: (callId: string) => request(`/calls/${callId}/heartbeat`, { method: 'POST', responseSchema: callResponseSchema }),
  decline: (callId: string) => request(`/calls/${callId}/decline`, { method: 'POST', responseSchema: callResponseSchema }),
  end: (callId: string, reason: 'completed' | 'canceled' | 'failed' = 'completed') =>
    request(`/calls/${callId}/end`, { method: 'POST', body: { reason }, responseSchema: callResponseSchema }),
  sendSignal: (callId: string, signal: SendCallSignalRequest) =>
    request<{ id: string }>(`/calls/${callId}/signals`, { method: 'POST', body: signal }),
  listSignals: (callId: string, afterSequence: number) =>
    request(`/calls/${callId}/signals?afterSequence=${afterSequence}`, { responseSchema: callSignalsResponseSchema })
});

export type CallApi = ReturnType<typeof callApi>;
