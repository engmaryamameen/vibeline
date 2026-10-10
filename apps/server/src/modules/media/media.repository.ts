import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { mediaAssets } from '@/db/schema';

export type StoredMediaAsset = typeof mediaAssets.$inferSelect;

export const mediaRepository = {
  create: async (value: typeof mediaAssets.$inferInsert) =>
    (await db.insert(mediaAssets).values(value).returning())[0]!,

  find: async (id: string) =>
    (await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1))[0],

  remove: async (id: string) => {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  },

  markAttached: async (ids: string[]) => {
    if (!ids.length) return;
    await db.update(mediaAssets).set({ status: 'attached' }).where(inArray(mediaAssets.id, ids));
  },

  findOwned: async (ownerUserId: string, ids: string[]) => {
    if (!ids.length) return [];
    return db
      .select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
      .from(mediaAssets)
      .where(and(inArray(mediaAssets.id, ids), eq(mediaAssets.ownerUserId, ownerUserId)));
  },

  async isReadableBy(assetId: string, userId: string) {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM media_assets a WHERE a.id = ${assetId} AND a.owner_user_id = ${userId}
      ) OR EXISTS (
        SELECT 1
        FROM message_attachments ma
        JOIN messages m ON m.id = ma.message_id
        JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
        WHERE ma.media_asset_id = ${assetId}
          AND cm.user_id = ${userId}
          AND cm.left_at IS NULL
          AND m.deleted_at IS NULL
          AND m.sequence >= cm.joined_sequence
          AND NOT EXISTS (
            SELECT 1 FROM message_user_deletions mud
            WHERE mud.message_id = m.id AND mud.user_id = ${userId}
          )
      ) OR EXISTS (
        SELECT 1
        FROM stories s
        WHERE s.media_asset_id = ${assetId}
          AND s.deleted_at IS NULL
          AND s.expires_at > now()
          AND EXISTS (
            SELECT 1 FROM connection_requests cr
            WHERE cr.status = 'accepted'
              AND (
                (cr.requester_id = ${userId} AND cr.addressee_id = s.author_user_id)
                OR (cr.addressee_id = ${userId} AND cr.requester_id = s.author_user_id)
              )
          )
      ) AS readable
    `);
    return Boolean((result.rows[0] as { readable?: boolean } | undefined)?.readable);
  }
};
