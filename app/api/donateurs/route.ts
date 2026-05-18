export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const donateurs = await prisma.donateur.findMany({
    where: q
      ? {
          OR: [
            { nom: { contains: q } },
            { prenom: { contains: q } },
            { raisonSociale: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {},
    include: { _count: { select: { cerfas: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(donateurs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    const donateur = await prisma.donateur.create({
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
    return NextResponse.json(donateur, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
