CREATE TABLE "conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text,
  "next_message_sequence" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "conversation_members" (
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("conversation_id", "user_id")
);
CREATE INDEX "conversation_members_user_id_idx" ON "conversation_members" ("user_id");
CREATE TABLE "messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "client_message_id" text NOT NULL,
  "sequence" integer NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "messages_conversation_sequence_uq" ON "messages" ("conversation_id", "sequence");
CREATE UNIQUE INDEX "messages_conversation_sender_client_id_uq" ON "messages" ("conversation_id", "sender_id", "client_message_id");
CREATE INDEX "messages_conversation_history_idx" ON "messages" ("conversation_id", "sequence");
