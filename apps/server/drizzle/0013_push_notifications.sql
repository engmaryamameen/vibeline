CREATE TABLE "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "push_subscriptions_endpoint_uq" ON "push_subscriptions" ("endpoint");
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");

CREATE TABLE "notification_preferences" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "enabled" boolean DEFAULT true NOT NULL,
  "messages_enabled" boolean DEFAULT true NOT NULL,
  "connections_enabled" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
