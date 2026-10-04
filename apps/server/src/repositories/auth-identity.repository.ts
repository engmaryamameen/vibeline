import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { externalIdentities, passwordCredentials, users } from '@/db/schema';

export type AuthProvider = 'google';

class AuthIdentityRepository {
  async createPasswordAccount(payload: { userId: string; email: string; displayName: string; passwordHash: string; verificationToken: string; verificationCode: string; verificationTokenExpiresAt: Date }) {
    return db.transaction(async tx => {
      const [user] = await tx.insert(users).values({ id: payload.userId, email: payload.email, displayName: payload.displayName, role: 'user', emailVerified: false, verificationToken: payload.verificationToken, verificationCode: payload.verificationCode, verificationTokenExpiresAt: payload.verificationTokenExpiresAt }).returning();
      await tx.insert(passwordCredentials).values({ userId: payload.userId, passwordHash: payload.passwordHash });
      return user!;
    });
  }
  findPasswordCredential(userId: string) {
    return db.query.passwordCredentials.findFirst({ where: eq(passwordCredentials.userId, userId) });
  }

  async createPasswordCredential(userId: string, passwordHash: string) {
    const [row] = await db.insert(passwordCredentials).values({ userId, passwordHash }).returning();
    return row!;
  }

  findByPasswordResetToken(token: string) { return db.query.passwordCredentials.findFirst({ where: eq(passwordCredentials.passwordResetToken, token) }); }
  findByPasswordResetCode(code: string) { return db.query.passwordCredentials.findFirst({ where: eq(passwordCredentials.passwordResetCode, code) }); }
  async setPasswordReset(userId: string, values: { token: string | null; code: string | null; expiresAt: Date | null }) {
    await db.update(passwordCredentials).set({ passwordResetToken: values.token, passwordResetCode: values.code, passwordResetTokenExpiresAt: values.expiresAt, updatedAt: new Date() }).where(eq(passwordCredentials.userId, userId));
  }

  async updatePassword(userId: string, passwordHash: string) {
    const [row] = await db.update(passwordCredentials).set({ passwordHash, updatedAt: new Date() }).where(eq(passwordCredentials.userId, userId)).returning();
    return row ?? null;
  }

  findIdentity(provider: AuthProvider, providerSubject: string) {
    return db.query.externalIdentities.findFirst({ where: and(eq(externalIdentities.provider, provider), eq(externalIdentities.providerSubject, providerSubject)) });
  }

  findUserProviderIdentity(userId: string, provider: AuthProvider) {
    return db.query.externalIdentities.findFirst({ where: and(eq(externalIdentities.userId, userId), eq(externalIdentities.provider, provider)) });
  }

  async createOAuthAccount(payload: { provider: AuthProvider; providerSubject: string; email: string; emailVerified: boolean; displayName: string; avatarUrl: string | null }) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${payload.provider + ':' + payload.providerSubject}, 0))`);
      const existingIdentity = await tx.query.externalIdentities.findFirst({ where: and(eq(externalIdentities.provider, payload.provider), eq(externalIdentities.providerSubject, payload.providerSubject)) });
      if (existingIdentity) return { kind: 'identity-exists' as const, userId: existingIdentity.userId };
      const existingEmail = await tx.query.users.findFirst({ where: sql`lower(${users.email}) = ${payload.email}` });
      if (existingEmail) return { kind: 'email-conflict' as const, userId: existingEmail.id };
      const userId = randomUUID();
      await tx.insert(users).values({ id: userId, email: payload.email, displayName: payload.displayName, avatarUrl: payload.avatarUrl, role: 'user', emailVerified: payload.emailVerified });
      await tx.insert(externalIdentities).values({ id: randomUUID(), userId, provider: payload.provider, providerSubject: payload.providerSubject, providerEmail: payload.email, providerEmailVerified: payload.emailVerified });
      return { kind: 'created' as const, userId };
    });
  }

  async updateIdentityProfile(identityId: string, providerEmail: string, providerEmailVerified: boolean) {
    await db.update(externalIdentities).set({ providerEmail, providerEmailVerified, updatedAt: new Date() }).where(eq(externalIdentities.id, identityId));
  }

  async countAuthenticationMethods(userId: string) {
    const [password, identities] = await Promise.all([
      this.findPasswordCredential(userId),
      db.select({ id: externalIdentities.id }).from(externalIdentities).where(eq(externalIdentities.userId, userId))
    ]);
    return (password ? 1 : 0) + identities.length;
  }
}

export const authIdentityRepository = new AuthIdentityRepository();
