export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordPaidGalaDonation } from "@/lib/gala-donations";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  const don = await recordPaidGalaDonation({
    galaId: id,
    montant: parseFloat(body.montant),
    anonyme: !!body.anonyme,
    nomAffiche: body.anonyme ? null : (body.nomAffiche || null),
    message: body.message || null,
    type: body.type || "particulier",
    prenom: body.prenom || null,
    nom: body.nom || null,
    raisonSociale: body.raisonSociale || null,
    siret: body.siret || null,
    email: body.email || null,
    adresse: body.adresse || null,
    codePostal: body.codePostal || null,
    ville: body.ville || null,
    cerfaDemande: !!body.cerfaDemande,
    modePaiement: body.modePaiement || "manuel",
  });

  return NextResponse.json(don);
}
