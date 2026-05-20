import { writeFileSync } from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline minimal version of generateMecenaPDF for testing
// We'll import via tsx instead
import { execSync } from "child_process";

const script = `
import { generateMecenaPDF } from "../lib/pdf-mecena";
import { writeFileSync } from "fs";

const data = {
  numeroCerfa: "A2026/00001",
  donateur: {
    type: "entreprise",
    nom: "ACME",
    raisonSociale: "ACME SAS",
    formeJuridique: "SAS",
    siretDonateur: "123 456 789",
    adresse: "10 rue de la Paix",
    codePostal: "75001",
    ville: "Paris",
  },
  dateDon: new Date("2026-05-01"),
  montant: 5000,
  modePaiement: "virement",
  objetDon: "Soutien aux actions humanitaires",
  dateEmission: new Date("2026-05-18"),
  association: {
    nom: "Association Humanitaire Example",
    adresse: "5 avenue des Droits",
    codePostal: "69001",
    ville: "Lyon",
    siret: "987 654 321 00012",
    rna: "W691234567",
    objetSocial: "Aide aux personnes en situation de précarité",
    qualiteOrganisme: "Oeuvre ou organisme d'intérêt général",
    representant: "Jean Dupont, Président",
    logoUrl: null,
    signatureUrl: null,
  },
};

const bytes = await generateMecenaPDF(data);
writeFileSync("/tmp/test-mecena.pdf", bytes);
console.log("PDF généré : /tmp/test-mecena.pdf");
`;

writeFileSync("/tmp/gen-mecena.ts", script);
execSync("cd /Users/davidfarouz/Documents/site/crm-cerfa && npx tsx /tmp/gen-mecena.ts", { stdio: "inherit" });
