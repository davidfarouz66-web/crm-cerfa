-- Synchronise les champs Gala utilises par le Prisma Client actuel.
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "langue" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "couleurPrimaire" TEXT NOT NULL DEFAULT '#1e3a8a';
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "couleurSecondaire" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "actif" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "totalCollecte" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "promesseEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "mensualiteEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "mensualiteOptions" TEXT NOT NULL DEFAULT '2,3,6,12';
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "mensualiteDebutMode" TEXT NOT NULL DEFAULT 'immediat';
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "mensualiteDebutDate" TIMESTAMP(3);
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "PromesseDon" (
    "id" TEXT NOT NULL,
    "galaId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "nomAffiche" TEXT,
    "anonyme" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'particulier',
    "prenom" TEXT,
    "nom" TEXT,
    "raisonSociale" TEXT,
    "siret" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "datePromesse" TIMESTAMP(3),
    "dateRappel" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromesseDon_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PromesseDon_galaId_fkey'
  ) THEN
    ALTER TABLE "PromesseDon"
      ADD CONSTRAINT "PromesseDon_galaId_fkey"
      FOREIGN KEY ("galaId") REFERENCES "Gala"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
