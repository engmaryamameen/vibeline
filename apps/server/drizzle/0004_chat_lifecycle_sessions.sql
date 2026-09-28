CREATE TYPE "conversation_type" AS ENUM ('direct', 'group');
CREATE TYPE "conversation_member_role" AS ENUM ('owner', 'admin', 'member');

ALTER TABLE "conversations" ADD COLUMN "type" "conversation_type" NOT NULL DEFAULT 'group';
ALTER TABLE "conversations" ADD COLUMN "direct_key" text;
ALTER TABLE "conversations" ADD COLUMN "archived_at" timestamptz;
CREATE UNIQUE INDEX "conversations_direct_key_uq" ON "conversations" ("direct_key");

ALTER TABLE "conversation_members" ADD COLUMN "role" "conversation_member_role" NOT NULL DEFAULT 'member';

ALTER TABLE "messages" ADD COLUMN "edited_at" timestamptz;
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamptz;

CREATE TABLE "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "sessions_user_active_idx" ON "sessions" ("user_id", "expires_at");
DROP INDEX IF EXISTS "conversation_members_user_id_idx";
CREATE INDEX "conversation_members_user_id_idx" ON "conversation_members" ("user_id", "conversation_id");
