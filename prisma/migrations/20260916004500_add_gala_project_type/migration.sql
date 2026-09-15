-- Classe les campagnes par type de projet pour organiser les pages de dons.
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "typeProjet" TEXT NOT NULL DEFAULT 'general';
