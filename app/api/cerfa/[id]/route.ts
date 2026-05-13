import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCerfaPDF } from "@/lib/pdf";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cerfa = await prisma.cerfa.findUnique({ where: { id }, include: { donateur: true } });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(cerfa);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const cerfa = await prisma.cerfa.findUnique({ where: { id }, include: { donateur: true } });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const association = await prisma.association.findFirst();
  if (!association) return NextResponse.json({ error: "Association non configurée" }, { status: 400 });

  const updated = await prisma.cerfa.update({
    where: { id },
    data: {
      dateDon:      new Date(body.dateDon),
      montant:      parseFloat(body.montant),
      modePaiement: body.modePaiement,
      objetDon:     body.objetDon || null,
    },
    include: { donateur: true },
  });

  // Regénère le PDF avec les nouvelles données
  const pdfBytes = await generateCerfaPDF({
    numeroCerfa:  updated.numeroCerfa,
    donateur:     updated.donateur,
    dateDon:      updated.dateDon,
    montant:      updated.montant,
    modePaiement: updated.modePaiement,
    objetDon:     updated.objetDon,
    dateEmission: updated.dateEmission,
    association,
  });

  const storageDir = path.join(process.cwd(), "public", "storage", "cerfa");
  await mkdir(storageDir, { recursive: true });
  const fileName = `${updated.numeroCerfa.replace("/", "-")}.pdf`;
  await writeFile(path.join(storageDir, fileName), pdfBytes);

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cerfa = await prisma.cerfa.findUnique({ where: { id } });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (cerfa.pdfPath) {
    const filePath = path.join(process.cwd(), "public", cerfa.pdfPath);
    if (existsSync(filePath)) await unlink(filePath).catch(() => {});
  }

  await prisma.cerfa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
