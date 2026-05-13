-- AlterTable
ALTER TABLE "Association" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Association" ADD COLUMN "qualiteOrganisme" TEXT;

-- AlterTable
ALTER TABLE "Donateur" ADD COLUMN "civilite" TEXT DEFAULT 'M';

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
