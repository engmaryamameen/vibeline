import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sessions } from '@/db/schema';
import { AppError } from '@/common/errors/app-error';
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
const expiry=()=>new Date(Date.now()+7*24*60*60*1000);
class SessionService {
 async create(userId:string){const token=randomBytes(48).toString('base64url');await db.insert(sessions).values({id:randomUUID(),userId,refreshTokenHash:hash(token),expiresAt:expiry()});return token;}
 async rotate(token:string){
  const tokenHash=hash(token);
  const result=await db.transaction(async tx=>{
    await tx.execute(sql`SELECT id FROM sessions WHERE refresh_token_hash = ${tokenHash} FOR UPDATE`);
    const [current]=await tx.select().from(sessions).where(eq(sessions.refreshTokenHash,tokenHash)).limit(1);
    if(!current||current.expiresAt<=new Date()) return {kind:'invalid' as const};
    if(current.revokedAt){await tx.update(sessions).set({revokedAt:new Date()}).where(and(eq(sessions.userId,current.userId),isNull(sessions.revokedAt)));return {kind:'reused' as const};}
    await tx.update(sessions).set({revokedAt:new Date(),lastUsedAt:new Date()}).where(eq(sessions.id,current.id));
    const next=randomBytes(48).toString('base64url');
    await tx.insert(sessions).values({id:randomUUID(),userId:current.userId,refreshTokenHash:hash(next),expiresAt:expiry()});
    return {kind:'rotated' as const,userId:current.userId,refreshToken:next};
  });
  if(result.kind==='reused') throw new AppError(401,'REFRESH_TOKEN_REUSED','Refresh token reuse detected; all sessions were revoked');
  if(result.kind==='invalid') throw new AppError(401,'INVALID_REFRESH_TOKEN','Refresh session is invalid or expired');
  return result;
 }

 async revoke(token:string){await db.update(sessions).set({revokedAt:new Date()}).where(eq(sessions.refreshTokenHash,hash(token)));}
 async revokeAll(userId:string){await db.update(sessions).set({revokedAt:new Date()}).where(and(eq(sessions.userId,userId),isNull(sessions.revokedAt)));}
}
export const sessionService=new SessionService();
