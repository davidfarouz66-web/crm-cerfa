import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { recordPaidGalaDonation } from "@/lib/gala-donations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const stripeKey = await prisma.settings.findUnique({ where: { key: "stripe_secret_key" } });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey?.value) return NextResponse.json({ error: "Stripe non configuré" }, { status: 400 });

  const stripe = new Stripe(stripeKey.value);

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch {
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    if (meta.galaId) {
      const montant = parseFloat(meta.montant || "0");
      await recordPaidGalaDonation({
        galaId: meta.galaId,
        montant,
        nomAffiche: meta.nomAffiche || null,
        anonyme: meta.anonyme === "true",
        message: meta.message || null,
        type: meta.type || "particulier",
        prenom: meta.prenom || null,
        nom: meta.nom || null,
        raisonSociale: meta.raisonSociale || null,
        siret: meta.siret || null,
        email: meta.email || null,
        adresse: meta.adresse || null,
        codePostal: meta.codePostal || null,
        ville: meta.ville || null,
        cerfaDemande: meta.cerfaDemande === "true",
        modePaiement: "stripe",
        stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
