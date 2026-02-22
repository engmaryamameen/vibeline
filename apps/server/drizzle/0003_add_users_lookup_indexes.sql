CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
CREATE INDEX IF NOT EXISTS "users_verification_token_idx" ON "users" ("verification_token");
CREATE INDEX IF NOT EXISTS "users_verification_code_idx" ON "users" ("verification_code");
CREATE INDEX IF NOT EXISTS "users_password_reset_token_idx" ON "users" ("password_reset_token");
CREATE INDEX IF NOT EXISTS "users_password_reset_code_idx" ON "users" ("password_reset_code");
