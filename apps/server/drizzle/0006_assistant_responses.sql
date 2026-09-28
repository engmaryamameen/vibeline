CREATE TYPE "assistant_generation_status" AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE "conversation_assistants" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "display_name" text NOT NULL,
  "joined_sequence" integer NOT NULL,
  "created_by_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "conversation_assistants_joined_sequence_ck" CHECK ("joined_sequence" >= 1)
);
CREATE UNIQUE INDEX "conversation_assistants_conversation_uq" ON "conversation_assistants" ("conversation_id");

ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL;
ALTER TABLE "messages" ADD COLUMN "assistant_id" text REFERENCES "conversation_assistants"("id") ON DELETE RESTRICT;
DROP INDEX "messages_conversation_sender_client_id_uq";
CREATE UNIQUE INDEX "messages_conversation_sender_client_id_uq" ON "messages" ("conversation_id", "sender_id", "client_message_id") WHERE "sender_id" IS NOT NULL;
CREATE UNIQUE INDEX "messages_conversation_assistant_client_id_uq" ON "messages" ("conversation_id", "assistant_id", "client_message_id") WHERE "assistant_id" IS NOT NULL;
ALTER TABLE "messages" ADD CONSTRAINT "messages_single_author_ck" CHECK (("sender_id" IS NOT NULL)::int + ("assistant_id" IS NOT NULL)::int = 1);

CREATE TABLE "assistant_generations" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "assistant_id" text NOT NULL REFERENCES "conversation_assistants"("id") ON DELETE CASCADE,
  "requested_by_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "client_request_id" text NOT NULL,
  "status" "assistant_generation_status" DEFAULT 'pending' NOT NULL,
  "provider" text,
  "model" text,
  "final_message_id" text REFERENCES "messages"("id") ON DELETE SET NULL,
  "input_tokens" integer,
  "output_tokens" integer,
  "total_tokens" integer,
  "latency_ms" integer,
  "error_code" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);
CREATE UNIQUE INDEX "assistant_generations_request_uq" ON "assistant_generations" ("conversation_id", "requested_by_user_id", "client_request_id");
CREATE INDEX "assistant_generations_conversation_created_idx" ON "assistant_generations" ("conversation_id", "created_at");
