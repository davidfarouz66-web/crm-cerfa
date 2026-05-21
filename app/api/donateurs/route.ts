export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export async function GET(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { searchParams } = new URL(req.url);
  const q       = searchParams.get("q") || "";
  const page    = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitQs = parseInt(searchParams.get("limit") || "20", 10);
  const noLimit = limitQs === 0;
  const limit   = noLimit ? 20 : limitQs;
  const skip    = (page - 1) * limit;

  const where = {
    tenantId: t.tenantId,
    ...(q && {
      OR: [
        { nom: { contains: q } },
        { prenom: { contains: q } },
        { raisonSociale: { contains: q } },
        { email: { contains: q } },
      ],
    }),
  };

  if (noLimit) {
    const donateurs = await prisma.donateur.findMany({
      where,
      include: { _count: { select: { cerfas: true } } },
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(donateurs);
  }

  const [donateurs, total] = await Promise.all([
    prisma.donateur.findMany({
      where,
      include: { _count: { select: { cerfas: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.donateur.count({ where }),
  ]);

  return NextResponse.json({ data: donateurs, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t); if (ro) return ro;

  try {
    const body = await req.json();
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    const donateur = await prisma.donateur.create({
      data: {
        tenantId:              t.tenantId,
        type:                  body.type || "particulier",
        civilite:              str(body.civilite) || "M",
        nom:                   str(body.nom) ?? str(body.raisonSociale) ?? "",
        prenom:                str(body.prenom),
        raisonSociale:         str(body.raisonSociale),
        formeJuridique:        str(body.formeJuridique),
        siretDonateur:         str(body.siretDonateur),
        adresse:               str(body.adresse),
        codePostal:            str(body.codePostal),
        ville:                 str(body.ville),
        pays:                  str(body.pays) || "France",
        email:                 str(body.email),
        telephone:             str(body.telephone),
        notes:                 str(body.notes),
        consentementProspection: body.consentementProspection === true || body.consentementProspection === "true",
        dateConsentement:        body.dateConsentement ? new Date(body.dateConsentement) : null,
        oppositionProspection:   body.oppositionProspection === true || body.oppositionProspection === "true",
        notesRgpd:               str(body.notesRgpd),
      },
    });
    return NextResponse.json(donateur, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
