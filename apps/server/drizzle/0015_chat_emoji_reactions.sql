ALTER TABLE "conversation_members" ADD COLUMN "quick_emoji" text DEFAULT '👍' NOT NULL;

CREATE TABLE "message_reactions" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "emoji" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "message_reactions_message_user_emoji_uq" ON "message_reactions" ("message_id", "user_id", "emoji");
CREATE INDEX "message_reactions_message_idx" ON "message_reactions" ("message_id");
