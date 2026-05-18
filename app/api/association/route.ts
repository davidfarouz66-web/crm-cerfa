export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const association = await prisma.association.findFirst();
  return NextResponse.json(association || {});
}

export async function PUT(req: Request) {
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
    };

    const existing = await prisma.association.findFirst();
    if (existing) {
      const updated = await prisma.association.update({ where: { id: existing.id }, data });
      return NextResponse.json(updated);
    }
    const created = await prisma.association.create({ data });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[association PUT]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
