export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { uploadPDF } from "@/lib/storage";
import { requireTenant } from "@/lib/tenant";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { id } = await params;
  const cerfa = await prisma.cerfa.findFirst({
    where: { id, tenantId: t.tenantId },
    include: { donateur: true },
  });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(cerfa);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { id } = await params;
  const body = await req.json();

  const cerfa = await prisma.cerfa.findFirst({
    where: { id, tenantId: t.tenantId },
    include: { donateur: true },
  });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const association = await prisma.association.findFirst({ where: { tenantId: t.tenantId } });
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

  const pdfData = {
    numeroCerfa:  updated.numeroCerfa,
    donateur:     updated.donateur,
    dateDon:      updated.dateDon,
    montant:      updated.montant,
    modePaiement: updated.modePaiement,
    objetDon:     updated.objetDon,
    natureDon:    updated.natureDon,
    formeDon:     updated.formeDon,
    articleFiscal: updated.articleFiscal,
    dateEmission: updated.dateEmission,
    association,
  };

  try {
    const pdfBytes = updated.donateur.type === "entreprise"
      ? await generateMecenaPDF(pdfData)
      : await generateCerfaPDF(pdfData);

    const fileName = `${t.tenantId}-${updated.numeroCerfa.replace("/", "-")}.pdf`;
    await uploadPDF(fileName, pdfBytes);
  } catch (pdfErr) {
    console.error("[PDF regeneration error]", pdfErr);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { id } = await params;
  const cerfa = await prisma.cerfa.findFirst({ where: { id, tenantId: t.tenantId } });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.cerfa.update({ where: { id }, data: { status: "annulé" } });
  return NextResponse.json({ ok: true });
}
