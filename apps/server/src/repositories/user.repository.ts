import { randomUUID } from 'node:crypto';
import type { User } from '@vibeline/contracts';
import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { connectionRequests, userPresence, users } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type StoredUser = InferSelectModel<typeof users>;

export const toPublicUser = (row: StoredUser): User => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  firstName: row.firstName ?? undefined,
  lastName: row.lastName ?? undefined,
  dateOfBirth: row.dateOfBirth ?? undefined,
  phoneNumber: row.phoneNumber,
  avatarUrl: row.avatarUrl ?? undefined,
  role: row.role as User['role'],
  emailVerified: row.emailVerified,
  createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
});

class UserRepository {
  findByEmail(email: string) {
    return db.query.users.findFirst({ where: ilike(users.email, email) }).then((row) => row ?? null);
  }

  findById(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id) }).then((row) => row ?? null);
  }

  findByVerificationToken(token: string) {
    return db.query.users.findFirst({ where: eq(users.verificationToken, token) }).then((row) => row ?? null);
  }

  findByVerificationCode(code: string) {
    return db.query.users.findFirst({ where: eq(users.verificationCode, code) }).then((row) => row ?? null);
  }

  async create(payload: Omit<StoredUser, 'createdAt'> & { createdAt?: Date }) {
    const [row] = await db.insert(users).values(payload).returning();
    if (!row) throw new Error('Failed to create user');
    return toPublicUser(row);
  }

  async update(id: string, updates: Partial<StoredUser>): Promise<User | null> {
    const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return row ? toPublicUser(row) : null;
  }

  async search(query: string, excludeUserId: string) {
    const trimmed = query.trim();
    const pattern = `%${trimmed}%`;
    return db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        lastSeenAt: userPresence.lastSeenAt,
        connectionStatus: sql<'none' | 'incoming' | 'outgoing' | 'connected'>`COALESCE((
          SELECT CASE
            WHEN cr.status = 'accepted' THEN 'connected'
            WHEN cr.status = 'pending' AND cr.addressee_id = ${excludeUserId} THEN 'incoming'
            WHEN cr.status = 'pending' THEN 'outgoing'
            ELSE 'none'
          END
          FROM connection_requests cr
          WHERE (cr.requester_id = ${excludeUserId} AND cr.addressee_id = ${users.id})
             OR (cr.addressee_id = ${excludeUserId} AND cr.requester_id = ${users.id})
          LIMIT 1
        ), 'none')`,
        connectionRequestId: sql<string | null>`(
          SELECT cr.id
          FROM connection_requests cr
          WHERE cr.status = 'pending'
            AND ((cr.requester_id = ${excludeUserId} AND cr.addressee_id = ${users.id})
              OR (cr.addressee_id = ${excludeUserId} AND cr.requester_id = ${users.id}))
          LIMIT 1
        )`
      })
      .from(users)
      .leftJoin(userPresence, eq(userPresence.userId, users.id))
      .where(and(ne(users.id, excludeUserId), eq(users.emailVerified, true), ...(trimmed ? [or(ilike(users.email, pattern), ilike(users.displayName, pattern))!] : [])))
      .orderBy(sql`${userPresence.lastSeenAt} DESC NULLS LAST`, asc(users.displayName))
      .limit(30);
  }

  async listIncomingConnectionRequests(userId: string) {
    return db.select({ id: connectionRequests.id, createdAt: connectionRequests.createdAt, user: { id: users.id, email: users.email, displayName: users.displayName, avatarUrl: users.avatarUrl, lastSeenAt: userPresence.lastSeenAt } })
      .from(connectionRequests)
      .innerJoin(users, eq(users.id, connectionRequests.requesterId))
      .leftJoin(userPresence, eq(userPresence.userId, users.id))
      .where(and(eq(connectionRequests.addresseeId, userId), eq(connectionRequests.status, 'pending')))
      .orderBy(desc(connectionRequests.createdAt));
  }

  async requestConnection(userId: string, targetUserId: string) {
    const existing = await db.query.connectionRequests.findFirst({ where: or(and(eq(connectionRequests.requesterId,userId),eq(connectionRequests.addresseeId,targetUserId)),and(eq(connectionRequests.requesterId,targetUserId),eq(connectionRequests.addresseeId,userId))) });
    if (existing?.status === 'accepted' || existing?.status === 'pending') return existing;
    if (existing) { const [row]=await db.update(connectionRequests).set({requesterId:userId,addresseeId:targetUserId,status:'pending',createdAt:new Date(),respondedAt:null}).where(eq(connectionRequests.id,existing.id)).returning(); return row!; }
    const [row]=await db.insert(connectionRequests).values({id:randomUUID(),requesterId:userId,addresseeId:targetUserId}).returning(); return row!;
  }

  async respondConnection(userId: string, requestId: string, accept: boolean) {
    const [row]=await db.update(connectionRequests).set({status:accept?'accepted':'rejected',respondedAt:new Date()}).where(and(eq(connectionRequests.id,requestId),eq(connectionRequests.addresseeId,userId),eq(connectionRequests.status,'pending'))).returning();
    return row ?? null;
  }

  async setEmailVerified(id: string) {
    return this.update(id, {
      emailVerified: true,
      verificationToken: null,
      verificationCode: null,
      verificationTokenExpiresAt: null
    });
  }
}

export const userRepository = new UserRepository();
