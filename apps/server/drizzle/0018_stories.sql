CREATE TABLE "stories" (
  "id" text PRIMARY KEY NOT NULL,
  "author_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "media_asset_id" text NOT NULL REFERENCES "media_assets"("id") ON DELETE RESTRICT,
  "caption" text,
  "duration_ms" integer DEFAULT 5000 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "stories_expiry_ck" CHECK ("expires_at" > "created_at"),
  CONSTRAINT "stories_duration_ck" CHECK ("duration_ms" BETWEEN 1000 AND 60000)
);
CREATE UNIQUE INDEX "stories_media_asset_uq" ON "stories" ("media_asset_id");
CREATE INDEX "stories_author_created_idx" ON "stories" ("author_user_id", "created_at" DESC);
CREATE INDEX "stories_live_idx" ON "stories" ("expires_at") WHERE "deleted_at" IS NULL;

CREATE TABLE "story_views" (
  "story_id" text NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
  "viewer_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "story_views_pk" ON "story_views" ("story_id", "viewer_user_id");
CREATE INDEX "story_views_viewer_idx" ON "story_views" ("viewer_user_id", "story_id");
