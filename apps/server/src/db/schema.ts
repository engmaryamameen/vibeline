import { boolean, check, date, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),
  phoneNumber: text('phone_number'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  verificationCode: text('verification_code'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});


export const authProvider = pgEnum('auth_provider', ['google']);

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
export const assistantGenerationAttemptStatus = pgEnum('assistant_generation_attempt_status', ['running', 'succeeded', 'failed', 'abandoned']);

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

export const messageUserDeletions = pgTable('message_user_deletions', {
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('message_user_deletions_message_user_uq').on(table.messageId, table.userId),
  index('message_user_deletions_user_message_idx').on(table.userId, table.messageId)
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
  ownerToken: text('owner_token'),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  attemptCount: integer('attempt_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }), completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('assistant_generations_request_uq').on(table.conversationId, table.requestedByUserId, table.clientRequestId),
  index('assistant_generations_conversation_created_idx').on(table.conversationId, table.createdAt),
  index('assistant_generations_running_lease_idx').on(table.leaseExpiresAt).where(sql`${table.status} = 'running'`),
  check('assistant_generations_attempt_count_ck', sql`${table.attemptCount} >= 0`)
]);

export const assistantGenerationAttempts = pgTable('assistant_generation_attempts', {
  id: text('id').primaryKey(),
  generationId: text('generation_id').notNull().references(() => assistantGenerations.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull(),
  ownerToken: text('owner_token').notNull(),
  status: assistantGenerationAttemptStatus('status').notNull().default('running'),
  provider: text('provider'),
  model: text('model'),
  inputTokens: integer('input_tokens'), outputTokens: integer('output_tokens'), totalTokens: integer('total_tokens'),
  latencyMs: integer('latency_ms'), errorCode: text('error_code'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('assistant_generation_attempts_number_uq').on(table.generationId, table.attemptNumber),
  uniqueIndex('assistant_generation_attempts_owner_uq').on(table.generationId, table.ownerToken),
  index('assistant_generation_attempts_generation_idx').on(table.generationId, table.claimedAt),
  check('assistant_generation_attempts_number_ck', sql`${table.attemptNumber} >= 1`)
]);


export const connectionRequestStatus = pgEnum('connection_request_status', ['pending', 'accepted', 'rejected']);

export const connectionRequests = pgTable('connection_requests', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addresseeId: text('addressee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: connectionRequestStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true })
}, (table) => [
  uniqueIndex('connection_requests_pair_uq').on(sql`LEAST(${table.requesterId}, ${table.addresseeId})`, sql`GREATEST(${table.requesterId}, ${table.addresseeId})`),
  index('connection_requests_addressee_status_idx').on(table.addresseeId, table.status, table.createdAt),
  index('connection_requests_requester_status_idx').on(table.requesterId, table.status, table.createdAt),
  check('connection_requests_not_self_ck', sql`${table.requesterId} <> ${table.addresseeId}`)
]);

export const userPresence = pgTable('user_presence', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow()
});

export const conversationMemberReceipts = pgTable('conversation_member_receipts', {
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deliveredSequence: integer('delivered_sequence').notNull().default(0),
  readSequence: integer('read_sequence').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('conversation_member_receipts_pk').on(table.conversationId, table.userId),
  check('conversation_member_receipts_sequences_ck', sql`${table.readSequence} <= ${table.deliveredSequence} AND ${table.readSequence} >= 0`)
]);


export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('push_subscriptions_endpoint_uq').on(table.endpoint),
  index('push_subscriptions_user_idx').on(table.userId)
]);

export const notificationPreferences = pgTable('notification_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(true),
  messagesEnabled: boolean('messages_enabled').notNull().default(true),
  connectionsEnabled: boolean('connections_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
