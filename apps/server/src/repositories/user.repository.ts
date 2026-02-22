import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/db/schema';
import { mapUserRowToStoredUser, type StoredUser } from '@/modules/user/user.mapper';

class UserRepository {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({ where: eq(users.email, email) });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async findById(id: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({ where: eq(users.id, id) });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async findByVerificationToken(token: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({
      where: eq(users.verificationToken, token)
    });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async findByVerificationCode(code: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({
      where: eq(users.verificationCode, code)
    });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async findByPasswordResetToken(token: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({
      where: eq(users.passwordResetToken, token)
    });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async findByPasswordResetCode(code: string): Promise<StoredUser | null> {
    const row = await db.query.users.findFirst({
      where: eq(users.passwordResetCode, code)
    });
    return row ? mapUserRowToStoredUser(row) : null;
  }

  async create(
    payload: Omit<StoredUser, 'createdAt' | 'avatarUrl'> & {
      createdAt?: string;
      avatarUrl?: string | null;
    }
  ): Promise<StoredUser> {
    const [row] = await db
      .insert(users)
      .values({
        id: payload.id,
        email: payload.email,
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl ?? null,
        role: payload.role,
        emailVerified: payload.emailVerified ?? false,
        passwordHash: payload.passwordHash,
        verificationToken: payload.verificationToken ?? null,
        verificationCode: payload.verificationCode ?? null,
        verificationTokenExpiresAt: payload.verificationTokenExpiresAt
          ? new Date(payload.verificationTokenExpiresAt)
          : null,
        passwordResetToken: payload.passwordResetToken ?? null,
        passwordResetCode: payload.passwordResetCode ?? null,
        passwordResetTokenExpiresAt: payload.passwordResetTokenExpiresAt
          ? new Date(payload.passwordResetTokenExpiresAt)
          : null
      })
      .returning();

    if (!row) throw new Error('Failed to create user');
    return mapUserRowToStoredUser(row);
  }

  async update(id: string, updates: Partial<StoredUser>): Promise<StoredUser | null> {
    const payload: Record<string, unknown> = {};

    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.displayName !== undefined) payload.displayName = updates.displayName;
    if (updates.avatarUrl !== undefined) payload.avatarUrl = updates.avatarUrl;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.emailVerified !== undefined) payload.emailVerified = updates.emailVerified;
    if (updates.passwordHash !== undefined) payload.passwordHash = updates.passwordHash;
    if ('verificationToken' in updates)
      payload.verificationToken = updates.verificationToken ?? null;
    if ('verificationCode' in updates) payload.verificationCode = updates.verificationCode ?? null;
    if ('verificationTokenExpiresAt' in updates)
      payload.verificationTokenExpiresAt = updates.verificationTokenExpiresAt
        ? new Date(updates.verificationTokenExpiresAt)
        : null;
    if ('passwordResetToken' in updates)
      payload.passwordResetToken = updates.passwordResetToken ?? null;
    if ('passwordResetCode' in updates)
      payload.passwordResetCode = updates.passwordResetCode ?? null;
    if ('passwordResetTokenExpiresAt' in updates)
      payload.passwordResetTokenExpiresAt = updates.passwordResetTokenExpiresAt
        ? new Date(updates.passwordResetTokenExpiresAt)
        : null;

    const [row] = await db.update(users).set(payload).where(eq(users.id, id)).returning();

    return row ? mapUserRowToStoredUser(row) : null;
  }

  async setEmailVerified(id: string): Promise<StoredUser | null> {
    return this.update(id, {
      emailVerified: true,
      verificationToken: undefined,
      verificationCode: undefined,
      verificationTokenExpiresAt: undefined
    });
  }
}

export const userRepository = new UserRepository();
