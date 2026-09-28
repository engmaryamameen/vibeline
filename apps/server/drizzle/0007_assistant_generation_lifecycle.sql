CREATE TYPE "assistant_generation_attempt_status" AS ENUM ('running', 'succeeded', 'failed', 'abandoned');

ALTER TABLE "assistant_generations" ADD COLUMN "owner_token" text;
ALTER TABLE "assistant_generations" ADD COLUMN "lease_expires_at" timestamp with time zone;
ALTER TABLE "assistant_generations" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "assistant_generations" ADD CONSTRAINT "assistant_generations_attempt_count_ck" CHECK ("attempt_count" >= 0);
CREATE INDEX "assistant_generations_running_lease_idx" ON "assistant_generations" ("lease_expires_at") WHERE "status" = 'running';

CREATE TABLE "assistant_generation_attempts" (
  "id" text PRIMARY KEY NOT NULL,
  "generation_id" text NOT NULL REFERENCES "assistant_generations"("id") ON DELETE CASCADE,
  "attempt_number" integer NOT NULL,
  "owner_token" text NOT NULL,
  "status" "assistant_generation_attempt_status" DEFAULT 'running' NOT NULL,
  "provider" text,
  "model" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "total_tokens" integer,
  "latency_ms" integer,
  "error_code" text,
  "claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "lease_expires_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "assistant_generation_attempts_number_ck" CHECK ("attempt_number" >= 1)
);
CREATE UNIQUE INDEX "assistant_generation_attempts_number_uq" ON "assistant_generation_attempts" ("generation_id", "attempt_number");
CREATE UNIQUE INDEX "assistant_generation_attempts_owner_uq" ON "assistant_generation_attempts" ("generation_id", "owner_token");
CREATE INDEX "assistant_generation_attempts_generation_idx" ON "assistant_generation_attempts" ("generation_id", "claimed_at");
