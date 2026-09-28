import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  verificationCode: text('verification_code'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});


export const authProvider = pgEnum('auth_provider', ['google', 'github']);

export const passwordCredentials = pgTable('password_credentials', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  passwordResetToken: text('password_reset_token'),
  passwordResetCode: text('password_reset_code'),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const externalIdentities = pgTable('external_identities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: authProvider('provider').notNull(),
  providerSubject: text('provider_subject').notNull(),
  providerEmail: text('provider_email'),
  providerEmailVerified: boolean('provider_email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('external_identities_provider_subject_uq').on(table.provider, table.providerSubject),
  uniqueIndex('external_identities_user_provider_uq').on(table.userId, table.provider)
]);

export const conversationType = pgEnum('conversation_type', ['direct', 'group']);
export const conversationMemberRole = pgEnum('conversation_member_role', ['owner', 'admin', 'member']);
export const assistantGenerationStatus = pgEnum('assistant_generation_status', ['pending', 'running', 'completed', 'failed']);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('sessions_user_active_idx').on(table.userId, table.expiresAt)]);

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  type: conversationType('type').notNull().default('group'),
  directKey: text('direct_key'),
  title: text('title'),
  nextMessageSequence: integer('next_message_sequence').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('conversations_direct_key_uq').on(table.directKey),
  check('conversations_direct_shape_ck', sql`(${table.type} = 'direct' AND ${table.directKey} IS NOT NULL AND ${table.title} IS NULL) OR (${table.type} = 'group' AND ${table.directKey} IS NULL)`),
  check('conversations_next_sequence_ck', sql`${table.nextMessageSequence} >= 1`)
]);

export const conversationMembers = pgTable('conversation_members', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: conversationMemberRole('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  joinedSequence: integer('joined_sequence').notNull().default(1),
  leftAt: timestamp('left_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('conversation_members_active_uq').on(table.conversationId, table.userId).where(sql`${table.leftAt} IS NULL`),
  index('conversation_members_user_active_idx').on(table.userId, table.conversationId).where(sql`${table.leftAt} IS NULL`)
]);

export const conversationAssistants = pgTable('conversation_assistants', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  joinedSequence: integer('joined_sequence').notNull(),
  createdByUserId: text('created_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('conversation_assistants_conversation_uq').on(table.conversationId),
  check('conversation_assistants_joined_sequence_ck', sql`${table.joinedSequence} >= 1`)
]);

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'restrict' }),
  assistantId: text('assistant_id').references(() => conversationAssistants.id, { onDelete: 'restrict' }),
  clientMessageId: text('client_message_id').notNull(),
  sequence: integer('sequence').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('messages_conversation_sequence_uq').on(table.conversationId, table.sequence),
  uniqueIndex('messages_conversation_sender_client_id_uq').on(table.conversationId, table.senderId, table.clientMessageId).where(sql`${table.senderId} IS NOT NULL`),
  uniqueIndex('messages_conversation_assistant_client_id_uq').on(table.conversationId, table.assistantId, table.clientMessageId).where(sql`${table.assistantId} IS NOT NULL`),
  index('messages_conversation_history_idx').on(table.conversationId, table.sequence),
  check('messages_sequence_positive_ck', sql`${table.sequence} >= 1`),
  check('messages_deleted_body_ck', sql`${table.deletedAt} IS NULL OR ${table.body} = ''`),
  check('messages_single_author_ck', sql`((${table.senderId} IS NOT NULL)::int + (${table.assistantId} IS NOT NULL)::int) = 1`)
]);

export const assistantGenerations = pgTable('assistant_generations', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  assistantId: text('assistant_id').notNull().references(() => conversationAssistants.id, { onDelete: 'cascade' }),
  requestedByUserId: text('requested_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  clientRequestId: text('client_request_id').notNull(),
  status: assistantGenerationStatus('status').notNull().default('pending'),
  provider: text('provider'),
  model: text('model'),
  finalMessageId: text('final_message_id').references(() => messages.id, { onDelete: 'set null' }),
  inputTokens: integer('input_tokens'), outputTokens: integer('output_tokens'), totalTokens: integer('total_tokens'),
  latencyMs: integer('latency_ms'), errorCode: text('error_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }), completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('assistant_generations_request_uq').on(table.conversationId, table.requestedByUserId, table.clientRequestId),
  index('assistant_generations_conversation_created_idx').on(table.conversationId, table.createdAt)
]);
