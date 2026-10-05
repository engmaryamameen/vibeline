CREATE TYPE "public"."connection_request_status" AS ENUM('pending', 'accepted', 'rejected');
CREATE TABLE "connection_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "requester_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "addressee_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "connection_request_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "responded_at" timestamp with time zone,
  CONSTRAINT "connection_requests_not_self_ck" CHECK ("requester_id" <> "addressee_id")
);
CREATE UNIQUE INDEX "connection_requests_pair_uq" ON "connection_requests" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));
CREATE INDEX "connection_requests_addressee_status_idx" ON "connection_requests" ("addressee_id", "status", "created_at");
CREATE INDEX "connection_requests_requester_status_idx" ON "connection_requests" ("requester_id", "status", "created_at");
