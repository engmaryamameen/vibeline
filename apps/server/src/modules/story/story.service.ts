import {
  isImageMedia,
  isVideoMedia,
  mediaAssetUrl,
  STORY_IMAGE_DURATION_MS,
  STORY_LIFETIME_MS,
  STORY_MAX_DURATION_MS,
  STORY_MIN_DURATION_MS,
  type Story,
  type StoryGroup
} from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { storyRepository } from './story.repository';

type StoryRow = Awaited<ReturnType<typeof storyRepository.listByAuthor>>[number];

const clampDuration = (value: number) => Math.min(STORY_MAX_DURATION_MS, Math.max(STORY_MIN_DURATION_MS, Math.round(value)));

const toStory = (row: StoryRow): Story => ({
  id: row.id,
  authorUserId: row.authorUserId,
  mediaAssetId: row.mediaAssetId,
  url: mediaAssetUrl(row.mediaAssetId),
  mimeType: row.mimeType,
  ...(row.caption ? { caption: row.caption } : {}),
  durationMs: row.durationMs,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  seen: Boolean(row.seen),
  viewCount: Number(row.viewCount ?? 0)
});

class StoryService {
  async create(userId: string, mediaAssetId: string, caption: string | undefined, durationMs: number | undefined) {
    const asset = await storyRepository.ownsReadyAsset(userId, mediaAssetId);
    if (!asset) throw new AppError(400, 'INVALID_ATTACHMENTS', 'That media is not available for a story');
    if (!isImageMedia(asset.mimeType) && !isVideoMedia(asset.mimeType)) {
      throw new AppError(400, 'UNSUPPORTED_MEDIA', 'Stories support images and videos only');
    }

    const resolvedDuration = isVideoMedia(asset.mimeType)
      ? clampDuration(durationMs ?? STORY_MAX_DURATION_MS)
      : STORY_IMAGE_DURATION_MS;

    const created = await storyRepository.create({
      authorUserId: userId,
      mediaAssetId,
      ...(caption ? { caption } : {}),
      durationMs: resolvedDuration,
      expiresAt: new Date(Date.now() + STORY_LIFETIME_MS)
    });

    const story = await storyRepository.findVisible(userId, created.id);
    if (!story) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'The story could not be read back');
    return toStory(story);
  }

  async feed(userId: string): Promise<StoryGroup[]> {
    const rows = await storyRepository.listFeed(userId);
    return rows.map((row) => ({
      author: { userId: row.userId, displayName: row.displayName, ...(row.avatarUrl ? { avatarUrl: row.avatarUrl } : {}) },
      storyCount: Number(row.storyCount),
      unseenCount: Number(row.unseenCount),
      latestAt: new Date(row.latestAt).toISOString(),
      isSelf: Boolean(row.isSelf)
    }));
  }

  async listByAuthor(userId: string, authorUserId: string) {
    const rows = await storyRepository.listByAuthor(userId, authorUserId);
    if (!rows.length) throw new AppError(404, 'STORY_NOT_FOUND', 'No live stories for this person');
    return rows.map(toStory);
  }

  async markViewed(userId: string, storyId: string) {
    const story = await storyRepository.findVisible(userId, storyId);
    if (!story) throw new AppError(404, 'STORY_NOT_FOUND', 'Story not found or expired');
    if (story.authorUserId !== userId) await storyRepository.markViewed(storyId, userId);
    const refreshed = await storyRepository.findVisible(userId, storyId);
    return toStory(refreshed ?? story);
  }

  async listViewers(userId: string, storyId: string) {
    const owned = await storyRepository.findOwned(userId, storyId);
    if (!owned) throw new AppError(404, 'STORY_NOT_FOUND', 'Story not found');
    const viewers = await storyRepository.listViewers(storyId);
    return viewers.map((viewer) => ({
      userId: viewer.userId,
      displayName: viewer.displayName,
      ...(viewer.avatarUrl ? { avatarUrl: viewer.avatarUrl } : {}),
      viewedAt: viewer.viewedAt.toISOString()
    }));
  }

  async remove(userId: string, storyId: string) {
    const deleted = await storyRepository.softDelete(storyId, userId);
    if (!deleted) throw new AppError(404, 'STORY_NOT_FOUND', 'Story not found');
  }
}

export const storyService = new StoryService();
