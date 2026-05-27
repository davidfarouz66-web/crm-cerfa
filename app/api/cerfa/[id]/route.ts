export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { uploadPDF } from "@/lib/storage";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";
import { deletePDF } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      dateDon:       new Date(body.dateDon),
      dateEmission:  body.dateEmission ? new Date(body.dateEmission) : undefined,
      montant:       parseFloat(body.montant),
      modePaiement:  body.modePaiement,
      objetDon:      body.objetDon || null,
      natureDon:     body.natureDon     || undefined,
      formeDon:      body.formeDon      || undefined,
      articleFiscal: body.articleFiscal || undefined,
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t); if (ro) return ro;

  const { id } = await params;
  const cerfa = await prisma.cerfa.findFirst({ where: { id, tenantId: t.tenantId } });
  if (!cerfa) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent) {
    // Suppression définitive : réservée aux admins
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (role !== "superadmin") {
      return NextResponse.json({ error: "Réservé aux super-administrateurs" }, { status: 403 });
    }

    // Supprimer le PDF du stockage
    if (cerfa.pdfPath) {
      const filename = cerfa.pdfPath.replace(/^\/api\/pdf\//, "");
      await deletePDF(filename).catch(() => {});
    }

    // Supprimer définitivement de la base
    await prisma.cerfa.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  // Annulation simple (soft delete)
  await prisma.cerfa.update({ where: { id }, data: { status: "annulé" } });
  return NextResponse.json({ ok: true });
}
