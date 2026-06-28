export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

async function fetchQrPng(url: string): Promise<Uint8Array | null> {
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(url)}`;
    const res = await fetch(qrUrl);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch { return null; }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const assoc = await prisma.association.findFirst({ where: { tenantId: gala.tenantId } });

  const donUrl = `${process.env.NEXTAUTH_URL}/gala/${id}/don`;
  const [pr, pg, pb] = hexToRgb(gala.couleurPrimaire);
  const [sr, sg, sb] = hexToRgb(gala.couleurSecondaire);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Fond couleur principale
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(pr, pg, pb) });

  // Bandeau blanc haut
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: rgb(1, 1, 1) });

  // Nom association
  const assocNom = assoc?.nom || "Notre association";
  const assocFontSize = assocNom.length > 30 ? 18 : 22;
  page.drawText(assocNom, {
    x: 40, y: height - 55,
    size: assocFontSize, font: fontBold,
    color: rgb(pr, pg, pb),
  });

  if (assoc?.adresse || assoc?.ville) {
    const adresseLine = [assoc.adresse, assoc.codePostal, assoc.ville].filter(Boolean).join(" ");
    page.drawText(adresseLine, {
      x: 40, y: height - 80,
      size: 11, font: fontReg,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Titre gala
  const titre = gala.titre;
  const titreFontSize = titre.length > 35 ? 26 : titre.length > 20 ? 32 : 38;
  page.drawText(titre, {
    x: 40, y: height - 185,
    size: titreFontSize, font: fontBold,
    color: rgb(sr, sg, sb),
  });

  // Date et lieu
  const dateStr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(gala.dateEvenement));
  page.drawText(dateStr, {
    x: 40, y: height - 230,
    size: 16, font: fontReg,
    color: rgb(sr, sg, sb),
  });
  if (gala.lieu) {
    page.drawText(gala.lieu, {
      x: 40, y: height - 255,
      size: 14, font: fontReg,
      color: rgb(sr, sg, sb),
    });
  }

  // Objectif
  const objectifStr = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(gala.objectif);
  page.drawText(`Objectif : ${objectifStr}`, {
    x: 40, y: height - 300,
    size: 20, font: fontBold,
    color: rgb(sr, sg, sb),
  });

  // Description
  if (gala.description) {
    const words = gala.description.split(" ");
    let line = "";
    let y = height - 345;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (fontReg.widthOfTextAtSize(test, 13) > width - 80) {
        page.drawText(line, { x: 40, y, size: 13, font: fontReg, color: rgb(sr, sg, sb) });
        y -= 20;
        line = word;
        if (y < 380) break;
      } else {
        line = test;
      }
    }
    if (line) page.drawText(line, { x: 40, y, size: 13, font: fontReg, color: rgb(sr, sg, sb) });
  }

  // QR code
  const qrBytes = await fetchQrPng(donUrl);
  if (qrBytes) {
    const qrImg = await pdfDoc.embedPng(qrBytes);
    page.drawImage(qrImg, { x: width / 2 - 100, y: 160, width: 200, height: 200 });
  }

  // Texte sous QR
  page.drawText("Scannez pour faire un don", {
    x: width / 2 - 95, y: 140,
    size: 13, font: fontBold,
    color: rgb(sr, sg, sb),
  });

  // Lien URL
  const urlFontSize = donUrl.length > 50 ? 9 : 11;
  page.drawText(donUrl, {
    x: width / 2 - fontReg.widthOfTextAtSize(donUrl, urlFontSize) / 2,
    y: 115,
    size: urlFontSize, font: fontReg,
    color: rgb(sr, sg, sb),
  });

  // Pied de page
  page.drawRectangle({ x: 0, y: 0, width, height: 80, color: rgb(1, 1, 1) });
  page.drawText("Faire un don en ligne :", {
    x: 40, y: 50, size: 11, font: fontBold,
    color: rgb(pr, pg, pb),
  });
  page.drawText(donUrl, {
    x: 40, y: 30, size: 10, font: fontReg,
    color: rgb(0.3, 0.3, 0.3),
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="affiche-${gala.titre.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
