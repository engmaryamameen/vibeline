import { eq } from 'drizzle-orm';import { db } from '@/db/client';import { mediaAssets } from '@/db/schema';
export const mediaRepository={
 create:async(value:typeof mediaAssets.$inferInsert)=>(await db.insert(mediaAssets).values(value).returning())[0]!,
 find:async(id:string)=>(await db.select().from(mediaAssets).where(eq(mediaAssets.id,id)).limit(1))[0],
 remove:async(id:string)=>{await db.delete(mediaAssets).where(eq(mediaAssets.id,id));}
};
