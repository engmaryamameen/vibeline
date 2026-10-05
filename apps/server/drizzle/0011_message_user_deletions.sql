CREATE TABLE IF NOT EXISTS "message_user_deletions" (
  "message_id" text NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "deleted_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_user_deletions_message_user_uq" ON "message_user_deletions" ("message_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_user_deletions_user_message_idx" ON "message_user_deletions" ("user_id", "message_id");
