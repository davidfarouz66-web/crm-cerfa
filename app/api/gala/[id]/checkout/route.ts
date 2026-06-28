import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Gala introuvable" }, { status: 404 });

  const stripeKey = await prisma.settings.findUnique({ where: { key: "stripe_secret_key" } });
  if (!stripeKey?.value) return NextResponse.json({ error: "Stripe non configuré" }, { status: 400 });

  const stripe = new Stripe(stripeKey.value);

  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";

  const nomDonateur = body.type === "societe"
    ? body.raisonSociale
    : `${body.prenom || ""} ${body.nom || ""}`.trim();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: {
          name: `Don — ${gala.titre}`,
          description: nomDonateur ? `De la part de : ${nomDonateur}` : undefined,
        },
        unit_amount: Math.round(parseFloat(body.montant) * 100),
      },
      quantity: 1,
    }],
    success_url: `${origin}/gala/${id}/don/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/gala/${id}/don`,
    metadata: {
      galaId: id,
      montant: body.montant,
      nomAffiche: body.nomAffiche || "",
      anonyme: body.anonyme ? "true" : "false",
      message: body.message || "",
      type: body.type || "particulier",
      prenom: body.prenom || "",
      nom: body.nom || "",
      raisonSociale: body.raisonSociale || "",
      siret: body.siret || "",
      email: body.email || "",
      adresse: body.adresse || "",
      codePostal: body.codePostal || "",
      ville: body.ville || "",
      cerfaDemande: body.cerfaDemande ? "true" : "false",
    },
  });

  return NextResponse.json({ url: session.url });
}
