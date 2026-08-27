-- AlterTable
ALTER TABLE "DonGala" ADD COLUMN "gocardlessBillingRequestId" TEXT;
ALTER TABLE "DonGala" ADD COLUMN "gocardlessPaymentId" TEXT;

-- CreateTable
CREATE TABLE "GoCardlessConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "organisationId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoCardlessConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoCardlessPaymentIntent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "galaId" TEXT NOT NULL,
    "billingRequestId" TEXT NOT NULL,
    "billingRequestFlowId" TEXT,
    "paymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "donorPayload" JSONB NOT NULL,
    "authorisationUrl" TEXT,
    "donGalaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoCardlessPaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonGala_gocardlessBillingRequestId_key" ON "DonGala"("gocardlessBillingRequestId");
CREATE UNIQUE INDEX "DonGala_gocardlessPaymentId_key" ON "DonGala"("gocardlessPaymentId");
CREATE UNIQUE INDEX "GoCardlessConnection_tenantId_key" ON "GoCardlessConnection"("tenantId");
CREATE UNIQUE INDEX "GoCardlessPaymentIntent_billingRequestId_key" ON "GoCardlessPaymentIntent"("billingRequestId");
CREATE UNIQUE INDEX "GoCardlessPaymentIntent_billingRequestFlowId_key" ON "GoCardlessPaymentIntent"("billingRequestFlowId");
CREATE UNIQUE INDEX "GoCardlessPaymentIntent_paymentId_key" ON "GoCardlessPaymentIntent"("paymentId");
CREATE INDEX "GoCardlessPaymentIntent_tenantId_idx" ON "GoCardlessPaymentIntent"("tenantId");
CREATE INDEX "GoCardlessPaymentIntent_galaId_idx" ON "GoCardlessPaymentIntent"("galaId");

-- AddForeignKey
ALTER TABLE "GoCardlessPaymentIntent" ADD CONSTRAINT "GoCardlessPaymentIntent_galaId_fkey" FOREIGN KEY ("galaId") REFERENCES "Gala"("id") ON DELETE CASCADE ON UPDATE CASCADE;
