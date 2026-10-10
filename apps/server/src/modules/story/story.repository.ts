import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { mediaAssets, stories, storyViews, users } from '@/db/schema';

export type StoredStory = typeof stories.$inferSelect;

const live = () => and(isNull(stories.deletedAt), sql`${stories.expiresAt} > now()`);

const connectedTo = (viewerId: string, authorColumn = sql`${stories.authorUserId}`) => sql`EXISTS (
  SELECT 1 FROM connection_requests cr
  WHERE cr.status = 'accepted'
    AND (
      (cr.requester_id = ${viewerId} AND cr.addressee_id = ${authorColumn})
      OR (cr.addressee_id = ${viewerId} AND cr.requester_id = ${authorColumn})
    )
)`;

const visibleTo = (viewerId: string) => sql`(${stories.authorUserId} = ${viewerId} OR ${connectedTo(viewerId)})`;

const seenExpression = (viewerId: string) => sql<boolean>`EXISTS (
  SELECT 1 FROM story_views sv WHERE sv.story_id = ${stories.id} AND sv.viewer_user_id = ${viewerId}
)`;

const storyColumns = (viewerId: string) => ({
  id: stories.id,
  authorUserId: stories.authorUserId,
  mediaAssetId: stories.mediaAssetId,
  mimeType: mediaAssets.mimeType,
  caption: stories.caption,
  durationMs: stories.durationMs,
  createdAt: stories.createdAt,
  expiresAt: stories.expiresAt,
  seen: seenExpression(viewerId),
  viewCount: sql<number>`(SELECT COUNT(*)::int FROM story_views sv WHERE sv.story_id = ${stories.id})`
});

class StoryRepository {
  async ownsReadyAsset(userId: string, mediaAssetId: string) {
    const [row] = await db
      .select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, mediaAssetId), eq(mediaAssets.ownerUserId, userId)))
      .limit(1);
    return row;
  }

  async create(input: { authorUserId: string; mediaAssetId: string; caption?: string; durationMs: number; expiresAt: Date }) {
    return db.transaction(async (tx) => {
      const [story] = await tx
        .insert(stories)
        .values({
          id: randomUUID(),
          authorUserId: input.authorUserId,
          mediaAssetId: input.mediaAssetId,
          caption: input.caption ?? null,
          durationMs: input.durationMs,
          expiresAt: input.expiresAt
        })
        .returning();
      await tx.update(mediaAssets).set({ status: 'attached' }).where(eq(mediaAssets.id, input.mediaAssetId));
      return story!;
    });
  }

  listFeed(viewerId: string) {
    return db
      .select({
        userId: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        storyCount: sql<number>`COUNT(*)::int`,
        unseenCount: sql<number>`COUNT(*) FILTER (WHERE NOT ${seenExpression(viewerId)})::int`,
        latestAt: sql<Date>`MAX(${stories.createdAt})`,
        isSelf: sql<boolean>`${users.id} = ${viewerId}`
      })
      .from(stories)
      .innerJoin(users, eq(users.id, stories.authorUserId))
      .where(and(live(), visibleTo(viewerId)))
      .groupBy(users.id, users.displayName, users.avatarUrl)
      .orderBy(sql`${users.id} = ${viewerId} DESC`, sql`MAX(${stories.createdAt}) DESC`);
  }

  async listByAuthor(viewerId: string, authorUserId: string) {
    const rows = await db
      .select(storyColumns(viewerId))
      .from(stories)
      .innerJoin(mediaAssets, eq(mediaAssets.id, stories.mediaAssetId))
      .where(and(live(), eq(stories.authorUserId, authorUserId), visibleTo(viewerId)))
      .orderBy(asc(stories.createdAt));
    return rows;
  }

  async findVisible(viewerId: string, storyId: string) {
    const [row] = await db
      .select(storyColumns(viewerId))
      .from(stories)
      .innerJoin(mediaAssets, eq(mediaAssets.id, stories.mediaAssetId))
      .where(and(eq(stories.id, storyId), live(), visibleTo(viewerId)))
      .limit(1);
    return row;
  }

  async findOwned(authorUserId: string, storyId: string) {
    const [row] = await db
      .select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.authorUserId, authorUserId), isNull(stories.deletedAt)))
      .limit(1);
    return row;
  }

  async markViewed(storyId: string, viewerId: string) {
    await db.insert(storyViews).values({ storyId, viewerUserId: viewerId }).onConflictDoNothing({ target: [storyViews.storyId, storyViews.viewerUserId] });
  }

  listViewers(storyId: string) {
    return db
      .select({ userId: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, viewedAt: storyViews.viewedAt })
      .from(storyViews)
      .innerJoin(users, eq(users.id, storyViews.viewerUserId))
      .where(eq(storyViews.storyId, storyId))
      .orderBy(desc(storyViews.viewedAt));
  }

  async softDelete(storyId: string, authorUserId: string) {
    const [row] = await db
      .update(stories)
      .set({ deletedAt: new Date() })
      .where(and(eq(stories.id, storyId), eq(stories.authorUserId, authorUserId), isNull(stories.deletedAt)))
      .returning();
    return row;
  }

  listAuthorIdsForViewer(viewerId: string) {
    return db
      .selectDistinct({ authorUserId: stories.authorUserId })
      .from(stories)
      .where(and(live(), visibleTo(viewerId)));
  }
}

export const storyRepository = new StoryRepository();
