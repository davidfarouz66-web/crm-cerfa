import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  if (!gala.promesseEnabled) return NextResponse.json({ error: "Promesses désactivées" }, { status: 400 });

  const promesse = await prisma.promesseDon.create({
    data: {
      galaId: id,
      montant: parseFloat(body.montant),
      nomAffiche: body.nomAffiche || null,
      anonyme: body.anonyme || false,
      type: body.type || "particulier",
      prenom: body.prenom || null,
      nom: body.nom || null,
      raisonSociale: body.raisonSociale || null,
      siret: body.siret || null,
      telephone: body.telephone || null,
      email: body.email || null,
      adresse: body.adresse || null,
      codePostal: body.codePostal || null,
      ville: body.ville || null,
      cerfaDemande: body.cerfaDemande || false,
      dateRappel: new Date(body.dateRappel),
    },
  });

  return NextResponse.json(promesse, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promesses = await prisma.promesseDon.findMany({
    where: { galaId: id },
    orderBy: { dateRappel: "asc" },
  });
  return NextResponse.json(promesses);
}
