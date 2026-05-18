export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNumeroCerfa } from "@/lib/utils";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { uploadPDF } from "@/lib/storage";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const annee = searchParams.get("annee");

  const cerfas = await prisma.cerfa.findMany({
    where: {
      ...(q && {
        OR: [
          { numeroCerfa: { contains: q } },
          { donateur: { nom: { contains: q } } },
          { donateur: { prenom: { contains: q } } },
        ],
      }),
      ...(annee && {
        dateDon: {
          gte: new Date(`${annee}-01-01`),
          lte: new Date(`${annee}-12-31`),
        },
      }),
    },
    include: { donateur: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cerfas);
}

export async function POST(req: Request) {
  const body = await req.json();

  const annee = new Date(body.dateDon).getFullYear();

  const association = await prisma.association.findFirst();
  if (!association) {
    return NextResponse.json({ error: "Association non configurée" }, { status: 400 });
  }

  // Calcul du prochain numéro de séquence pour l'année
  const lastForYear = await prisma.cerfa.findFirst({
    where: { numeroCerfa: { startsWith: `A${annee}/` } },
    orderBy: { numeroCerfa: "desc" },
  });
  let nextSeq = 1;
  if (lastForYear) {
    const parts = lastForYear.numeroCerfa.split("/");
    nextSeq = parseInt(parts[1], 10) + 1;
  }
  // Respecte le numéro de départ configuré par l'association
  if (association.cerfaSequence > 0 && nextSeq < association.cerfaSequence) {
    nextSeq = association.cerfaSequence;
  }
  const numeroCerfa = generateNumeroCerfa(annee, nextSeq);

  const donateur = await prisma.donateur.findUnique({ where: { id: body.donateurId } });
  if (!donateur) {
    return NextResponse.json({ error: "Donateur introuvable" }, { status: 404 });
  }

  const cerfa = await prisma.cerfa.create({
    data: {
      numeroCerfa,
      donateurId: body.donateurId,
      dateDon: new Date(body.dateDon),
      montant: parseFloat(body.montant),
      modePaiement: body.modePaiement,
      objetDon: body.objetDon || null,
      dateEmission: new Date(),
    },
  });

  const pdfData = {
    numeroCerfa,
    donateur,
    dateDon: new Date(body.dateDon),
    montant: parseFloat(body.montant),
    modePaiement: body.modePaiement,
    objetDon: body.objetDon || null,
    dateEmission: new Date(),
    association,
  };
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = donateur.type === "entreprise"
      ? await generateMecenaPDF(pdfData)
      : await generateCerfaPDF(pdfData);
  } catch (pdfErr) {
    console.error("[PDF generation error]", pdfErr);
    return NextResponse.json({ error: `Erreur génération PDF: ${String(pdfErr)}` }, { status: 500 });
  }

  const fileName = `${numeroCerfa.replace("/", "-")}.pdf`;
  await uploadPDF(fileName, pdfBytes);

  const updatedCerfa = await prisma.cerfa.update({
    where: { id: cerfa.id },
    data: { pdfPath: `/api/pdf/${fileName}` },
    include: { donateur: true },
  });

  return NextResponse.json(updatedCerfa, { status: 201 });
}
