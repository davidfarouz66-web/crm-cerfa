import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNumeroCerfa } from "@/lib/utils";
import { generateCerfaPDF } from "@/lib/pdf";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  const count = await prisma.cerfa.count({
    where: { dateDon: { gte: new Date(`${annee}-01-01`), lte: new Date(`${annee}-12-31`) } },
  });
  const numeroCerfa = generateNumeroCerfa(annee, count + 1);

  const association = await prisma.association.findFirst();
  if (!association) {
    return NextResponse.json({ error: "Association non configurée" }, { status: 400 });
  }

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

  const pdfBytes = await generateCerfaPDF({
    numeroCerfa,
    donateur,
    dateDon: new Date(body.dateDon),
    montant: parseFloat(body.montant),
    modePaiement: body.modePaiement,
    objetDon: body.objetDon || null,
    dateEmission: new Date(),
    association,
  });

  const storageDir = path.join(process.cwd(), "public", "storage", "cerfa");
  await mkdir(storageDir, { recursive: true });
  // Remplace le "/" du numéro (ex: A2026/00001) par "-" pour le nom de fichier
  const fileName = `${numeroCerfa.replace("/", "-")}.pdf`;
  await writeFile(path.join(storageDir, fileName), pdfBytes);

  const updatedCerfa = await prisma.cerfa.update({
    where: { id: cerfa.id },
    data: { pdfPath: `/storage/cerfa/${fileName}` },
    include: { donateur: true },
  });

  return NextResponse.json(updatedCerfa, { status: 201 });
}
