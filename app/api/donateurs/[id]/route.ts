import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donateur = await prisma.donateur.findUnique({
    where: { id },
    include: { cerfas: { orderBy: { dateDon: "desc" } } },
  });
  if (!donateur) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(donateur);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    const donateur = await prisma.donateur.update({
      where: { id },
      data: {
        type:           body.type || "particulier",
        civilite:       str(body.civilite),
        nom:            str(body.nom) ?? str(body.raisonSociale) ?? "",
        prenom:         str(body.prenom),
        raisonSociale:  str(body.raisonSociale),
        formeJuridique: str(body.formeJuridique),
        siretDonateur:  str(body.siretDonateur),
        adresse:        str(body.adresse),
        codePostal:    str(body.codePostal),
        ville:         str(body.ville),
        email:         str(body.email),
        telephone:     str(body.telephone),
        notes:         str(body.notes),
      },
    });
    return NextResponse.json(donateur);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.donateur.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
