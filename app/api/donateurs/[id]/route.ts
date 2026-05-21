export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { id } = await params;
  const donateur = await prisma.donateur.findFirst({
    where: { id, tenantId: t.tenantId },
    include: { cerfas: { orderBy: { dateDon: "desc" } } },
  });
  if (!donateur) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(donateur);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  try {
    const { id } = await params;
    const body = await req.json();
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    // Vérifie l'appartenance au tenant
    const existing = await prisma.donateur.findFirst({ where: { id, tenantId: t.tenantId } });
    if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const donateur = await prisma.donateur.update({
      where: { id },
      data: {
        type:                    body.type || "particulier",
        civilite:                str(body.civilite),
        nom:                     str(body.nom) ?? str(body.raisonSociale) ?? "",
        prenom:                  str(body.prenom),
        raisonSociale:           str(body.raisonSociale),
        formeJuridique:          str(body.formeJuridique),
        siretDonateur:           str(body.siretDonateur),
        adresse:                 str(body.adresse),
        codePostal:              str(body.codePostal),
        ville:                   str(body.ville),
        pays:                    str(body.pays) || "France",
        email:                   str(body.email),
        telephone:               str(body.telephone),
        notes:                   str(body.notes),
        consentementProspection: body.consentementProspection === true || body.consentementProspection === "true",
        dateConsentement:        body.dateConsentement ? new Date(body.dateConsentement) : null,
        oppositionProspection:   body.oppositionProspection === true || body.oppositionProspection === "true",
        notesRgpd:               str(body.notesRgpd),
      },
    });
    return NextResponse.json(donateur);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { id } = await params;
  const existing = await prisma.donateur.findFirst({ where: { id, tenantId: t.tenantId } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.donateur.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
