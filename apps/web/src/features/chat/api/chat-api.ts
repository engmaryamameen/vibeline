import {
  assistantEnableResponseSchema,
  assistantResponseResponseSchema,
  assistantStateResponseSchema,
  connectionRequestsResponseSchema,
  conversationDetailResponseSchema,
  conversationResponseSchema,
  conversationsResponseSchema,
  messageResponseSchema,
  messagesResponseSchema,
  quickEmojiResponseSchema,
  reactionsResponseSchema,
  userSearchResponseSchema
} from '@vibeline/contracts';
import type { AuthorizedRequest } from '@/src/lib/authorized-request';

const conversationPath = (id: string) => `/chat/conversations/${id}`;

export const chatApi = (request: AuthorizedRequest) => ({
  listConversations: () => request('/chat/conversations', { responseSchema: conversationsResponseSchema }),

  getConversation: (id: string) => request(conversationPath(id), { responseSchema: conversationDetailResponseSchema }),

  createConversation: (participantUserIds: string[], type: 'direct' | 'group', title?: string) =>
    request('/chat/conversations', {
      method: 'POST',
      body: { participantUserIds, type, ...(title ? { title } : {}) },
      responseSchema: conversationResponseSchema
    }),

  updateConversation: (id: string, title: string) =>
    request(conversationPath(id), { method: 'PATCH', body: { title }, responseSchema: conversationResponseSchema }),

  listMessages: (id: string, params: { before?: number; after?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.before !== undefined) query.set('beforeSequence', String(params.before));
    if (params.after !== undefined) query.set('afterSequence', String(params.after));
    query.set('limit', String(params.limit ?? 50));
    return request(`${conversationPath(id)}/messages?${query}`, { responseSchema: messagesResponseSchema });
  },

  sendMessage: (id: string, body: string, mediaAssetIds: string[] = [], clientMessageId = crypto.randomUUID()) =>
    request(`${conversationPath(id)}/messages`, {
      method: 'POST',
      body: { clientMessageId, body, mediaAssetIds },
      responseSchema: messageResponseSchema
    }),

  editMessage: (id: string, messageId: string, body: string) =>
    request(`${conversationPath(id)}/messages/${messageId}`, { method: 'PATCH', body: { body }, responseSchema: messageResponseSchema }),

  deleteMessage: (id: string, messageId: string, scope: 'me' | 'everyone') =>
    request(`${conversationPath(id)}/messages/${messageId}?scope=${scope}`, { method: 'DELETE', responseSchema: messageResponseSchema }),

  listReactions: (id: string) => request(`${conversationPath(id)}/reactions`, { responseSchema: reactionsResponseSchema }),

  addReaction: (id: string, messageId: string, emoji: string) =>
    request<void>(`${conversationPath(id)}/messages/${messageId}/reactions`, { method: 'PUT', body: { emoji } }),

  removeReaction: (id: string, messageId: string, emoji: string) =>
    request<void>(`${conversationPath(id)}/messages/${messageId}/reactions`, { method: 'DELETE', body: { emoji } }),

  getQuickEmoji: (id: string) => request(`${conversationPath(id)}/quick-emoji`, { responseSchema: quickEmojiResponseSchema }),

  setQuickEmoji: (id: string, emoji: string) =>
    request(`${conversationPath(id)}/quick-emoji`, { method: 'PUT', body: { emoji }, responseSchema: quickEmojiResponseSchema }),

  updateReceipt: (id: string, deliveredSequence: number, readSequence: number) =>
    request<void>(`${conversationPath(id)}/receipt`, { method: 'POST', body: { deliveredSequence, readSequence } }),

  touchPresence: () => request<{ lastSeenAt: string }>('/chat/presence', { method: 'POST' }),

  addMember: (id: string, userId: string) =>
    request(`${conversationPath(id)}/members`, { method: 'POST', body: { userId }, responseSchema: conversationDetailResponseSchema }),

  removeMember: (id: string, userId: string) => request<void>(`${conversationPath(id)}/members/${userId}`, { method: 'DELETE' }),

  getAssistantState: (id: string) => request(`${conversationPath(id)}/assistant`, { responseSchema: assistantStateResponseSchema }),

  enableAssistant: (id: string, displayName = 'Assistant') =>
    request(`${conversationPath(id)}/assistant`, { method: 'POST', body: { displayName }, responseSchema: assistantEnableResponseSchema }),

  requestAssistantResponse: (id: string, clientRequestId: string) =>
    request(`${conversationPath(id)}/assistant/responses`, {
      method: 'POST',
      body: { clientRequestId },
      responseSchema: assistantResponseResponseSchema
    }),

  searchUsers: (query: string) => request(`/users/search?q=${encodeURIComponent(query)}`, { responseSchema: userSearchResponseSchema }),

  listConnectionRequests: () => request('/users/connections/requests', { responseSchema: connectionRequestsResponseSchema }),

  requestConnection: (userId: string) => request<void>(`/users/connections/${userId}`, { method: 'POST' }),

  acceptConnection: (requestId: string) => request<void>(`/users/connections/requests/${requestId}/accept`, { method: 'POST' }),

  rejectConnection: (requestId: string) => request<void>(`/users/connections/requests/${requestId}/reject`, { method: 'POST' })
});

export type ChatApi = ReturnType<typeof chatApi>;
