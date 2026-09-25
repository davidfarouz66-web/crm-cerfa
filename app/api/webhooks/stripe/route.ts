import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { recordPaidGalaDonation } from "@/lib/gala-donations";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/secret-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const settings = await prisma.settings.findMany({
    where: { key: { in: ["stripe_secret_key", "stripe_webhook_secret"] } },
  });
  if (!sig) return NextResponse.json({ error: "Signature Stripe manquante" }, { status: 400 });

  const byTenant = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const values = byTenant.get(setting.tenantId) || {};
    values[setting.key] = setting.value;
    byTenant.set(setting.tenantId, values);
  }

  let event: Stripe.Event | null = null;
  let verifiedTenantId = "";
  let lastError: unknown;
  for (const [tenantId, values] of byTenant) {
    const webhookSecret = values.stripe_webhook_secret;
    if (!values.stripe_secret_key || !webhookSecret) continue;
    try {
      const stripe = new Stripe(decryptSecret(values.stripe_secret_key));
      event = stripe.webhooks.constructEvent(body, sig, decryptSecret(webhookSecret));
      verifiedTenantId = tenantId;
      const plaintextSettings = settings.filter(
        (s) => s.tenantId === tenantId && s.value && !isEncryptedSecret(s.value),
      );
      if (plaintextSettings.length) {
        await prisma.$transaction(plaintextSettings.map((s) => prisma.settings.update({
          where: { id: s.id },
          data: { value: encryptSecret(s.value) },
        })));
      }
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!verifiedTenantId || !event) {
    console.error("[stripe webhook verification]", lastError);
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    if (meta.galaId && (!meta.tenantId || meta.tenantId === verifiedTenantId)) {
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
