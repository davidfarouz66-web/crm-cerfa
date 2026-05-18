-- AlterTable
ALTER TABLE "Association" ADD COLUMN     "articlesFiscauxAutorises" TEXT DEFAULT '200',
ADD COLUMN     "commentaireEligibilite" TEXT,
ADD COLUMN     "contactRgpd" TEXT,
ADD COLUMN     "dateVerificationEligibilite" TIMESTAMP(3),
ADD COLUMN     "dureConservationAnnees" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "organismeEligibleMecenat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsableLegalFonction" TEXT,
ADD COLUMN     "responsableLegalNom" TEXT,
ADD COLUMN     "typeOrganisme" TEXT;

-- AlterTable
ALTER TABLE "Cerfa" ADD COLUMN     "articleFiscal" TEXT NOT NULL DEFAULT '200',
ADD COLUMN     "dateAnnulation" TIMESTAMP(3),
ADD COLUMN     "formeDon" TEXT NOT NULL DEFAULT 'declaration_manuel',
ADD COLUMN     "motifAnnulation" TEXT,
ADD COLUMN     "natureDon" TEXT NOT NULL DEFAULT 'numeraire';

-- AlterTable
ALTER TABLE "Donateur" ADD COLUMN     "consentementProspection" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateConsentement" TIMESTAMP(3),
ADD COLUMN     "notesRgpd" TEXT,
ADD COLUMN     "oppositionProspection" BOOLEAN NOT NULL DEFAULT false;
