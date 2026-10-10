import { z } from 'zod';

const isoDate = z.coerce.date().transform((value) => value.toISOString()).or(z.string());

export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const STORY_IMAGE_DURATION_MS = 5_000;
export const STORY_MIN_DURATION_MS = 1_000;
export const STORY_MAX_DURATION_MS = 60_000;

export const storySchema = z.object({
  id: z.string().uuid(),
  authorUserId: z.string().uuid(),
  mediaAssetId: z.string().uuid(),
  url: z.string(),
  mimeType: z.string(),
  caption: z.string().nullish().transform((value) => value ?? undefined),
  durationMs: z.number().int().positive(),
  createdAt: isoDate,
  expiresAt: isoDate,
  seen: z.boolean().default(false),
  viewCount: z.number().int().nonnegative().default(0)
});
export type Story = z.infer<typeof storySchema>;

export const storyAuthorSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullish().transform((value) => value ?? undefined)
});
export type StoryAuthor = z.infer<typeof storyAuthorSchema>;

export const storyGroupSchema = z.object({
  author: storyAuthorSchema,
  storyCount: z.number().int().nonnegative(),
  unseenCount: z.number().int().nonnegative(),
  latestAt: isoDate,
  isSelf: z.boolean().default(false)
});
export type StoryGroup = z.infer<typeof storyGroupSchema>;

export const storyViewerSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullish().transform((value) => value ?? undefined),
  viewedAt: isoDate
});
export type StoryViewer = z.infer<typeof storyViewerSchema>;

export const createStoryRequestSchema = z.object({
  mediaAssetId: z.string().uuid(),
  caption: z.string().trim().max(500).optional(),
  durationMs: z.coerce.number().int().min(STORY_MIN_DURATION_MS).max(STORY_MAX_DURATION_MS).optional()
});

export const storyParamsSchema = z.object({ storyId: z.string().uuid() });
export const storyAuthorParamsSchema = z.object({ authorUserId: z.string().uuid() });

export const storyFeedResponseSchema = z.object({ groups: z.array(storyGroupSchema) });
export const storiesResponseSchema = z.object({ author: storyAuthorSchema, stories: z.array(storySchema) });
export const storyResponseSchema = z.object({ story: storySchema });
export const storyViewersResponseSchema = z.object({ viewers: z.array(storyViewerSchema) });

export const storyTimeRemaining = (expiresAt: string, now = Date.now()) => Math.max(0, new Date(expiresAt).getTime() - now);

export const storyAgeLabel = (createdAt: string, now = Date.now()) => {
  const minutes = Math.floor((now - new Date(createdAt).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};
