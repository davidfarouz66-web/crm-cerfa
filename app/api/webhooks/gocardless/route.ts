import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordPaidGalaDonation } from "@/lib/gala-donations";
import { verifyGoCardlessWebhookSignature } from "@/lib/gocardless";

export const dynamic = "force-dynamic";

type GoCardlessEvent = {
  id: string;
  action: string;
  created_at?: string;
  resource_type: string;
  links?: {
    billing_request?: string;
    payment?: string;
    organisation?: string;
  };
};

type StoredDonorPayload = {
  montant?: string | number;
  nomAffiche?: string | null;
  anonyme?: boolean;
  message?: string | null;
  type?: string | null;
  prenom?: string | null;
  nom?: string | null;
  raisonSociale?: string | null;
  siret?: string | null;
  email?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  cerfaDemande?: boolean;
};

function asDonorPayload(value: Prisma.JsonValue): StoredDonorPayload {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as StoredDonorPayload;
  }
  return {};
}

async function completePaymentIntent(intentId: string, event: GoCardlessEvent) {
  const intent = await prisma.goCardlessPaymentIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.donGalaId) return;

  const payload = asDonorPayload(intent.donorPayload);
  const don = await recordPaidGalaDonation({
    galaId: intent.galaId,
    montant: intent.amount,
    nomAffiche: payload.nomAffiche || null,
    anonyme: !!payload.anonyme,
    message: payload.message || null,
    type: payload.type || "particulier",
    prenom: payload.prenom || null,
    nom: payload.nom || null,
    raisonSociale: payload.raisonSociale || null,
    siret: payload.siret || null,
    email: payload.email || null,
    adresse: payload.adresse || null,
    codePostal: payload.codePostal || null,
    ville: payload.ville || null,
    cerfaDemande: !!payload.cerfaDemande,
    modePaiement: "gocardless",
    gocardlessBillingRequestId: intent.billingRequestId,
    gocardlessPaymentId: event.links?.payment || intent.paymentId || null,
    paymentDate: event.created_at ? new Date(event.created_at) : new Date(),
  });

  await prisma.goCardlessPaymentIntent.update({
    where: { id: intent.id },
    data: {
      status: event.action,
      paymentId: event.links?.payment || intent.paymentId,
      donGalaId: don?.id || null,
    },
  });
}

async function handleEvent(event: GoCardlessEvent) {
  if (event.resource_type === "billing_requests" && ["fulfilled", "completed"].includes(event.action)) {
    const billingRequestId = event.links?.billing_request;
    if (!billingRequestId) return;

    const intent = await prisma.goCardlessPaymentIntent.findUnique({
      where: { billingRequestId },
      select: { id: true },
    });
    if (intent) await completePaymentIntent(intent.id, event);
    return;
  }

  if (event.resource_type === "payments" && ["confirmed", "paid_out", "created"].includes(event.action)) {
    const paymentId = event.links?.payment;
    if (!paymentId) return;

    const intent = await prisma.goCardlessPaymentIntent.findFirst({
      where: { paymentId },
      select: { id: true },
    });
    if (intent) await completePaymentIntent(intent.id, event);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("webhook-signature");
  const secret = process.env.GOCARDLESS_WEBHOOK_ENDPOINT_SECRET;

  if (secret && !verifyGoCardlessWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Signature GoCardless invalide" }, { status: 400 });
  }

  let payload: { events?: GoCardlessEvent[] };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Payload GoCardless invalide" }, { status: 400 });
  }

  for (const event of payload.events || []) {
    try {
      await handleEvent(event);
    } catch (error) {
      console.error("[gocardless webhook]", event.id, error);
    }
  }

  return NextResponse.json({ received: true });
}
