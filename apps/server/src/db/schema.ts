import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull().default('user'),
    emailVerified: boolean('email_verified').notNull().default(false),
    passwordHash: text('password_hash').notNull(),
    verificationToken: text('verification_token'),
    verificationCode: text('verification_code'),
    verificationTokenExpiresAt: timestamp('verification_token_expires_at', {
      withTimezone: true
    }),
    passwordResetToken: text('password_reset_token'),
    passwordResetCode: text('password_reset_code'),
    passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at', {
      withTimezone: true
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
    verificationTokenIdx: index('users_verification_token_idx').on(table.verificationToken),
    verificationCodeIdx: index('users_verification_code_idx').on(table.verificationCode),
    passwordResetTokenIdx: index('users_password_reset_token_idx').on(table.passwordResetToken),
    passwordResetCodeIdx: index('users_password_reset_code_idx').on(table.passwordResetCode)
  })
);
