import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCerfaPDF } from "@/lib/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const SAMPLE_DATA = {
  numeroCerfa: "A2026/00001",
  donateur: {
    type: "particulier", civilite: "M", nom: "MARTIN", prenom: "Jean",
    raisonSociale: null, adresse: "15 avenue de la République",
    codePostal: "75011", ville: "Paris",
  },
  dateDon:      new Date("2026-01-15"),
  montant:      150,
  modePaiement: "virement",
  objetDon:     null,
  dateEmission: new Date("2026-01-15"),
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1";

  const association = await prisma.association.findFirst();
  const assoc = association ?? {
    nom: "Association Test CERFA",
    adresse: "40 rue Perronet", codePostal: "92200", ville: "Neuilly-sur-Seine",
    siret: "000 000 000 00000", rna: "W922003899",
    objetSocial: "Assurer la pérennité et le fonctionnement du culte islamique dans le respect des lois françaises",
    qualiteOrganisme: "Oeuvre ou organisme d'intérêt général",
    representant: "Ahmed BENALI, Président",
    logoUrl: null, signatureUrl: null,
  };

  const pdfBytes = await generateCerfaPDF({ ...SAMPLE_DATA, association: assoc });

  if (debug) {
    const doc = await PDFDocument.load(pdfBytes);
    const [page] = doc.getPages();
    const { width, height } = page.getSize();
    const F = await doc.embedFont(StandardFonts.Helvetica);
    const GRID = rgb(0.7, 0.7, 1);
    const step = 50;
    for (let x = 0; x <= width; x += step) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.3, color: GRID });
      page.drawText(String(x), { x: x + 1, y: 5, size: 5, font: F, color: GRID });
    }
    for (let y = 0; y <= height; y += step) {
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.3, color: GRID });
      page.drawText(String(y), { x: 2, y: y + 1, size: 5, font: F, color: GRID });
    }
    return new NextResponse(Buffer.from(await doc.save()), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="cerfa-debug.pdf"' },
    });
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="cerfa-preview.pdf"' },
  });
}
