export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export async function GET() {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const association = await prisma.association.findFirst({ where: { tenantId: t.tenantId } });
  return NextResponse.json(association || {});
}

export async function PUT(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t); if (ro) return ro;

  try {
    const body = await req.json();
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    const data = {
      nom:              str(body.nom) ?? "",
      adresse:          str(body.adresse),
      codePostal:       str(body.codePostal),
      ville:            str(body.ville),
      siret:            str(body.siret),
      rna:              str(body.rna),
      objetSocial:      str(body.objetSocial),
      qualiteOrganisme: str(body.qualiteOrganisme),
      representant:     str(body.representant),
      telephone:        str(body.telephone),
      email:            str(body.email),
      logoUrl:          str(body.logoUrl),
      signatureUrl:     str(body.signatureUrl),
      cerfaSequence:    parseInt(String(body.cerfaSequence ?? 0), 10) || 0,
      organismeEligibleMecenat:    body.organismeEligibleMecenat === true || body.organismeEligibleMecenat === "true",
      articlesFiscauxAutorises:    str(body.articlesFiscauxAutorises) || "200",
      typeOrganisme:               str(body.typeOrganisme),
      dateVerificationEligibilite: body.dateVerificationEligibilite ? new Date(body.dateVerificationEligibilite) : null,
      commentaireEligibilite:      str(body.commentaireEligibilite),
      responsableLegalNom:         str(body.responsableLegalNom),
      responsableLegalFonction:    str(body.responsableLegalFonction),
      dureConservationAnnees:      parseInt(String(body.dureConservationAnnees ?? 10), 10) || 10,
      contactRgpd:                 str(body.contactRgpd),
    };

    const existing = await prisma.association.findFirst({ where: { tenantId: t.tenantId } });
    if (existing) {
      const updated = await prisma.association.update({ where: { id: existing.id }, data });
      return NextResponse.json(updated);
    }
    const created = await prisma.association.create({ data: { ...data, tenantId: t.tenantId } });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[association PUT]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
