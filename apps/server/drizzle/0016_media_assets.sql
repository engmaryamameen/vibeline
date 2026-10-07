CREATE TABLE "media_assets" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "storage_key" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "original_filename" text,
  "status" text DEFAULT 'ready' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "media_assets_size_ck" CHECK ("size_bytes" > 0),
  CONSTRAINT "media_assets_status_ck" CHECK ("status" IN ('ready','attached'))
);
CREATE UNIQUE INDEX "media_assets_storage_key_uq" ON "media_assets" ("storage_key");
CREATE INDEX "media_assets_owner_idx" ON "media_assets" ("owner_user_id", "created_at");

CREATE TABLE "message_attachments" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "media_asset_id" text NOT NULL REFERENCES "media_assets"("id") ON DELETE RESTRICT,
  "position" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "message_attachments_position_ck" CHECK ("position" >= 0)
);
CREATE UNIQUE INDEX "message_attachments_message_asset_uq" ON "message_attachments" ("message_id", "media_asset_id");
CREATE UNIQUE INDEX "message_attachments_message_position_uq" ON "message_attachments" ("message_id", "position");
CREATE INDEX "message_attachments_asset_idx" ON "message_attachments" ("media_asset_id");
