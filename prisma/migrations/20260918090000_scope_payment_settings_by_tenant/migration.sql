ALTER TABLE "Settings" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';

DROP INDEX IF EXISTS "Settings_key_key";

CREATE UNIQUE INDEX "Settings_tenantId_key_key" ON "Settings"("tenantId", "key");
CREATE INDEX "Settings_tenantId_idx" ON "Settings"("tenantId");
