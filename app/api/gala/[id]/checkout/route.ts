import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createGoCardlessPaymentLink } from "@/lib/gocardless";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Gala introuvable" }, { status: 404 });

  const origin = process.env.NEXTAUTH_URL || req.headers.get("origin") || new URL(req.url).origin;
  const nomDonateur = body.type === "societe"
    ? body.raisonSociale
    : `${body.prenom || ""} ${body.nom || ""}`.trim();

  if (body.modePaiement === "sepa" || body.modePaiement === "gocardless") {
    if (Number(body.nbFois || 1) > 1) {
      return NextResponse.json({ error: "GoCardless en plusieurs fois n'est pas encore activé" }, { status: 400 });
    }

    const gcEnabled = await prisma.settings.findUnique({ where: { key: "gocardless_enabled" } });
    if (gcEnabled?.value !== "true") {
      return NextResponse.json({ error: "GoCardless non activé" }, { status: 400 });
    }

    const connection = await prisma.goCardlessConnection.findUnique({
      where: { tenantId: gala.tenantId },
    }).catch(error => {
      console.error("[gocardless checkout status]", error);
      return null;
    });
    if (!connection || connection.status !== "connected") {
      return NextResponse.json({ error: "Le compte GoCardless de l'association n'est pas connecté" }, { status: 400 });
    }

    try {
      const idempotencyKey = crypto.randomUUID();
      const link = await createGoCardlessPaymentLink({
        accessToken: connection.accessToken,
        origin,
        galaId: id,
        galaTitre: gala.titre,
        tenantId: gala.tenantId,
        payload: body,
        idempotencyKey,
      });

      await prisma.goCardlessPaymentIntent.create({
        data: {
          tenantId: gala.tenantId,
          galaId: id,
          billingRequestId: link.billingRequest.id,
          billingRequestFlowId: link.flow.id,
          paymentId: link.billingRequest.links?.payment_request || null,
          amount: parseFloat(body.montant),
          currency: "EUR",
          status: link.billingRequest.status || "pending",
          donorPayload: body as Prisma.InputJsonValue,
          authorisationUrl: link.flow.authorisation_url,
        },
      });

      return NextResponse.json({ provider: "gocardless", url: link.flow.authorisation_url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lien GoCardless impossible";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const stripeKey = await prisma.settings.findUnique({ where: { key: "stripe_secret_key" } });
  if (!stripeKey?.value) return NextResponse.json({ error: "Stripe non configuré" }, { status: 400 });

  const stripe = new Stripe(stripeKey.value);

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
