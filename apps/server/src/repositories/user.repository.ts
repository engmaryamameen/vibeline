import type { User } from '@vibeline/contracts';
import { and, eq, ilike, ne, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type StoredUser = InferSelectModel<typeof users>;

const toPublicUser = (row: StoredUser): User => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  avatarUrl: row.avatarUrl ?? undefined,
  role: row.role as User['role'],
  emailVerified: row.emailVerified,
  createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
});

class UserRepository {
  findByEmail(email: string) { return db.query.users.findFirst({ where: ilike(users.email, email) }).then(row => row ?? null); }
  findById(id: string) { return db.query.users.findFirst({ where: eq(users.id, id) }).then(row => row ?? null); }
  findByVerificationToken(token: string) { return db.query.users.findFirst({ where: eq(users.verificationToken, token) }).then(row => row ?? null); }
  findByVerificationCode(code: string) { return db.query.users.findFirst({ where: eq(users.verificationCode, code) }).then(row => row ?? null); }

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
    const pattern = `%${query}%`;
    return db.select({ id: users.id, email: users.email, displayName: users.displayName, avatarUrl: users.avatarUrl }).from(users).where(and(ne(users.id, excludeUserId), eq(users.emailVerified, true), or(ilike(users.email, pattern), ilike(users.displayName, pattern)))).limit(20);
  }

  async setEmailVerified(id: string) {
    return this.update(id, { emailVerified: true, verificationToken: null, verificationCode: null, verificationTokenExpiresAt: null });
  }
}
export const userRepository = new UserRepository();
