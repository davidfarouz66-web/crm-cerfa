export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordPaidGalaDonation } from "@/lib/gala-donations";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t);
  if (ro) return ro;

  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findFirst({ where: { id, tenantId: t.tenantId } });
  if (!gala) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  const montant = Number(body.montant);
  if (!Number.isFinite(montant) || montant <= 0 || montant > 1_000_000) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const don = await recordPaidGalaDonation({
    galaId: id,
    montant,
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
    cerfaDemande: true,
    modePaiement: body.modePaiement || "manuel",
  });

  return NextResponse.json(don);
}
