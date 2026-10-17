CREATE TABLE IF NOT EXISTS "user_presence" (
  "user_id" text PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "last_seen_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "conversation_member_receipts" (
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "delivered_sequence" integer NOT NULL DEFAULT 0,
  "read_sequence" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("conversation_id", "user_id"),
  CONSTRAINT "member_receipts_sequences_ck" CHECK ("read_sequence" <= "delivered_sequence" AND "read_sequence" >= 0)
);
