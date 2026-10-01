import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rate = checkRateLimit(`promesse:${requestIp(req.headers)}:${id}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfter) },
    });
  }
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  if (!gala.actif) return NextResponse.json({ error: "Cette campagne n'est pas active" }, { status: 403 });
  if (!gala.promesseEnabled) return NextResponse.json({ error: "Promesses désactivées" }, { status: 400 });

  const montant = Number(body.montant);
  const dateRappel = new Date(body.dateRappel);
  if (!Number.isFinite(montant) || montant <= 0 || montant > 1_000_000) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (!body.dateRappel || Number.isNaN(dateRappel.getTime())) {
    return NextResponse.json({ error: "Date de rappel invalide" }, { status: 400 });
  }

  const promesse = await prisma.promesseDon.create({
    data: {
      galaId: id,
      montant,
      nomAffiche: String(body.nomAffiche || "").slice(0, 120) || null,
      anonyme: body.anonyme || false,
      type: body.type || "particulier",
      prenom: String(body.prenom || "").slice(0, 100) || null,
      nom: String(body.nom || "").slice(0, 100) || null,
      raisonSociale: String(body.raisonSociale || "").slice(0, 200) || null,
      siret: String(body.siret || "").slice(0, 20) || null,
      telephone: String(body.telephone || "").slice(0, 30) || null,
      email: String(body.email || "").slice(0, 254) || null,
      adresse: String(body.adresse || "").slice(0, 250) || null,
      codePostal: String(body.codePostal || "").slice(0, 20) || null,
      ville: String(body.ville || "").slice(0, 120) || null,
      cerfaDemande: body.cerfaDemande || false,
      dateRappel,
    },
  });

  return NextResponse.json(promesse, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const { id } = await params;
  const gala = await prisma.gala.findFirst({ where: { id, tenantId: t.tenantId }, select: { id: true } });
  if (!gala) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  const promesses = await prisma.promesseDon.findMany({
    where: { galaId: id },
    orderBy: { dateRappel: "asc" },
  });
  return NextResponse.json(promesses);
}
