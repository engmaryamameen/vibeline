CREATE TYPE "public"."call_media" AS ENUM('audio', 'video');
CREATE TYPE "public"."call_status" AS ENUM('ringing', 'accepted', 'connected', 'ended');
CREATE TYPE "public"."call_end_reason" AS ENUM('completed', 'rejected', 'canceled', 'missed', 'failed', 'busy');
CREATE TYPE "public"."call_participant_role" AS ENUM('caller', 'callee');
CREATE TYPE "public"."call_signal_kind" AS ENUM('offer', 'answer', 'candidate');

CREATE TABLE "calls" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "caller_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "callee_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "media" "call_media" NOT NULL,
  "status" "call_status" DEFAULT 'ringing' NOT NULL,
  "end_reason" "call_end_reason",
  "ended_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "ring_expires_at" timestamp with time zone NOT NULL,
  "heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "accepted_at" timestamp with time zone,
  "connected_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  CONSTRAINT "calls_distinct_parties_ck" CHECK ("caller_id" <> "callee_id"),
  CONSTRAINT "calls_terminal_shape_ck" CHECK (("status" = 'ended') = ("ended_at" IS NOT NULL)),
  CONSTRAINT "calls_end_reason_shape_ck" CHECK (("status" = 'ended') = ("end_reason" IS NOT NULL))
);
CREATE INDEX "calls_conversation_created_idx" ON "calls" ("conversation_id", "created_at" DESC);
CREATE INDEX "calls_caller_created_idx" ON "calls" ("caller_id", "created_at" DESC);
CREATE INDEX "calls_callee_created_idx" ON "calls" ("callee_id", "created_at" DESC);
CREATE INDEX "calls_ringing_expiry_idx" ON "calls" ("ring_expires_at") WHERE "status" = 'ringing';
CREATE INDEX "calls_heartbeat_idx" ON "calls" ("heartbeat_at") WHERE "status" IN ('accepted', 'connected');

CREATE TABLE "call_participants" (
  "call_id" text NOT NULL REFERENCES "calls"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "call_participant_role" NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "joined_at" timestamp with time zone,
  "left_at" timestamp with time zone
);
CREATE UNIQUE INDEX "call_participants_pk" ON "call_participants" ("call_id", "user_id");
CREATE UNIQUE INDEX "call_participants_single_active_uq" ON "call_participants" ("user_id") WHERE "active";
CREATE INDEX "call_participants_call_idx" ON "call_participants" ("call_id");

CREATE TABLE "call_signals" (
  "id" text PRIMARY KEY NOT NULL,
  "call_id" text NOT NULL REFERENCES "calls"("id") ON DELETE CASCADE,
  "sender_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recipient_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" "call_signal_kind" NOT NULL,
  "payload" jsonb NOT NULL,
  "sequence" bigserial NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "call_signals_delivery_idx" ON "call_signals" ("call_id", "recipient_id", "sequence");
