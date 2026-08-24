-- AlterTable
ALTER TABLE "DonGala" ADD COLUMN "cerfaId" TEXT;
ALTER TABLE "DonGala" ADD COLUMN "cerfaSentAt" TIMESTAMP(3);
ALTER TABLE "DonGala" ADD COLUMN "cerfaError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DonGala_stripePaymentId_key" ON "DonGala"("stripePaymentId");
CREATE UNIQUE INDEX "DonGala_cerfaId_key" ON "DonGala"("cerfaId");

-- AddForeignKey
ALTER TABLE "DonGala" ADD CONSTRAINT "DonGala_cerfaId_fkey" FOREIGN KEY ("cerfaId") REFERENCES "Cerfa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
