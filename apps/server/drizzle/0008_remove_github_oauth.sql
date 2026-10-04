-- GitHub OAuth has been retired. Refuse to discard existing identities implicitly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "external_identities" WHERE "provider"::text = 'github') THEN
    RAISE EXCEPTION 'Cannot remove GitHub OAuth while GitHub external identities still exist. Migrate or remove those identities explicitly first.';
  END IF;
END $$;

ALTER TABLE "external_identities" ALTER COLUMN "provider" TYPE text USING "provider"::text;
DROP TYPE "auth_provider";
CREATE TYPE "auth_provider" AS ENUM ('google');
ALTER TABLE "external_identities" ALTER COLUMN "provider" TYPE "auth_provider" USING "provider"::"auth_provider";
