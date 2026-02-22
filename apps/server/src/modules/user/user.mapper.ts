import type { Role, User } from '@vibeline/types';
import type { InferSelectModel } from 'drizzle-orm';

import { users } from '@/db/schema';

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  emailVerified: boolean;
  passwordHash: string;
  verificationToken?: string | null;
  verificationCode?: string | null;
  verificationTokenExpiresAt?: string | null;
  passwordResetToken?: string | null;
  passwordResetCode?: string | null;
  passwordResetTokenExpiresAt?: string | null;
  createdAt: Date | string;
};

const toOptionalIsoString = (value: Date | string | null | undefined): string | undefined => {
  if (value == null) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
};

export const mapUserRowToStoredUser = (row: InferSelectModel<typeof users>): StoredUser => ({
  ...row,
  role: row.role as Role,
  avatarUrl: row.avatarUrl ?? null,
  verificationToken: row.verificationToken ?? undefined,
  verificationCode: row.verificationCode ?? undefined,
  verificationTokenExpiresAt: toOptionalIsoString(row.verificationTokenExpiresAt),
  passwordResetToken: row.passwordResetToken ?? undefined,
  passwordResetCode: row.passwordResetCode ?? undefined,
  passwordResetTokenExpiresAt: toOptionalIsoString(row.passwordResetTokenExpiresAt)
});

export const mapStoredUserToPublicUser = (stored: StoredUser): User => ({
  id: stored.id,
  email: stored.email,
  displayName: stored.displayName,
  avatarUrl: stored.avatarUrl ?? undefined,
  role: stored.role,
  emailVerified: stored.emailVerified ?? false,
  createdAt:
    stored.createdAt instanceof Date ? stored.createdAt.toISOString() : String(stored.createdAt)
});
