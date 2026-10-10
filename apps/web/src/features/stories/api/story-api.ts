import { storiesResponseSchema, storyFeedResponseSchema, storyResponseSchema, storyViewersResponseSchema } from '@vibeline/contracts';
import type { AuthorizedRequest } from '@/src/features/chat/api/chat-api';

export const storyApi = (request: AuthorizedRequest) => ({
  feed: () => request('/stories/feed', { responseSchema: storyFeedResponseSchema }),
  byAuthor: (authorUserId: string) => request(`/stories/authors/${authorUserId}`, { responseSchema: storiesResponseSchema.pick({ stories: true }) }),
  create: (mediaAssetId: string, caption?: string, durationMs?: number) =>
    request('/stories', {
      method: 'POST',
      body: { mediaAssetId, ...(caption ? { caption } : {}), ...(durationMs ? { durationMs } : {}) },
      responseSchema: storyResponseSchema
    }),
  markViewed: (storyId: string) => request(`/stories/${storyId}/views`, { method: 'POST', responseSchema: storyResponseSchema }),
  viewers: (storyId: string) => request(`/stories/${storyId}/viewers`, { responseSchema: storyViewersResponseSchema }),
  remove: (storyId: string) => request<void>(`/stories/${storyId}`, { method: 'DELETE' })
});

export type StoryApi = ReturnType<typeof storyApi>;
