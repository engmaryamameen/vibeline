-- Phase 1: separate account identity from authentication methods and preserve membership history.
CREATE UNIQUE INDEX "users_email_normalized_uq" ON "users" (lower("email"));

CREATE TYPE "auth_provider" AS ENUM ('google', 'github');

CREATE TABLE "password_credentials" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "password_hash" text NOT NULL,
  "password_reset_token" text,
  "password_reset_code" text,
  "password_reset_token_expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "password_credentials" ("user_id", "password_hash", "password_reset_token", "password_reset_code", "password_reset_token_expires_at")
SELECT "id", "password_hash", "password_reset_token", "password_reset_code", "password_reset_token_expires_at"
FROM "users"
WHERE "password_hash" <> '';

CREATE TABLE "external_identities" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" "auth_provider" NOT NULL,
  "provider_subject" text NOT NULL,
  "provider_email" text,
  "provider_email_verified" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "external_identities_provider_subject_uq" ON "external_identities" ("provider", "provider_subject");
CREATE UNIQUE INDEX "external_identities_user_provider_uq" ON "external_identities" ("user_id", "provider");

ALTER TABLE "users" DROP COLUMN "password_hash";
ALTER TABLE "users" DROP COLUMN "password_reset_token";
ALTER TABLE "users" DROP COLUMN "password_reset_code";
ALTER TABLE "users" DROP COLUMN "password_reset_token_expires_at";

ALTER TABLE "conversation_members" ADD COLUMN "left_at" timestamptz;
ALTER TABLE "conversation_members" ADD COLUMN "joined_sequence" integer NOT NULL DEFAULT 1;
ALTER TABLE "conversation_members" DROP CONSTRAINT "conversation_members_pkey";
ALTER TABLE "conversation_members" ADD COLUMN "id" text;
UPDATE "conversation_members" SET "id" = md5("conversation_id" || ':' || "user_id" || ':' || "joined_at"::text);
ALTER TABLE "conversation_members" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "conversation_members" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX "conversation_members_active_uq" ON "conversation_members" ("conversation_id", "user_id") WHERE "left_at" IS NULL;
DROP INDEX IF EXISTS "conversation_members_user_id_idx";
CREATE INDEX "conversation_members_user_active_idx" ON "conversation_members" ("user_id", "conversation_id") WHERE "left_at" IS NULL;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_shape_ck" CHECK (
  ("type" = 'direct' AND "direct_key" IS NOT NULL AND "title" IS NULL)
  OR ("type" = 'group' AND "direct_key" IS NULL)
);
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_next_sequence_ck" CHECK ("next_message_sequence" >= 1);
ALTER TABLE "messages" ADD CONSTRAINT "messages_sequence_positive_ck" CHECK ("sequence" >= 1);
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_body_ck" CHECK ("deleted_at" IS NULL OR "body" = '');

-- Cross-row conversation invariants are checked at transaction commit so creation/ownership transfer can be atomic.
CREATE OR REPLACE FUNCTION enforce_conversation_membership_invariants() RETURNS trigger AS $$
DECLARE
  cid text := COALESCE(NEW.conversation_id, OLD.conversation_id);
  ctype conversation_type;
  is_archived boolean;
  active_count integer;
  owner_count integer;
BEGIN
  SELECT type, archived_at IS NOT NULL INTO ctype, is_archived FROM conversations WHERE id = cid;
  IF NOT FOUND OR is_archived THEN RETURN NULL; END IF;
  SELECT count(*), count(*) FILTER (WHERE role = 'owner') INTO active_count, owner_count
    FROM conversation_members WHERE conversation_id = cid AND left_at IS NULL;
  IF ctype = 'direct' AND active_count <> 2 THEN
    RAISE EXCEPTION 'direct conversation % must have exactly two active members', cid USING ERRCODE = '23514';
  END IF;
  IF ctype = 'group' AND owner_count <> 1 THEN
    RAISE EXCEPTION 'group conversation % must have exactly one active owner', cid USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "conversation_membership_invariants"
AFTER INSERT OR UPDATE OR DELETE ON "conversation_members"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_conversation_membership_invariants();
