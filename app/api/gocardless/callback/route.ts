import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeGoCardlessCode, getGoCardlessEnvironment, verifyGoCardlessState } from "@/lib/gocardless";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t);
  if (ro) return ro;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = process.env.NEXTAUTH_URL || url.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/parametres?tab=paiements&gocardless=refused`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${origin}/parametres?tab=paiements&gocardless=missing`);
  }

  try {
    const verifiedState = verifyGoCardlessState(state);
    if (verifiedState.tenantId !== t.tenantId) {
      throw new Error("Cette connexion GoCardless ne correspond pas à l'association active");
    }

    const redirectUri = `${origin}/api/gocardless/callback`;
    const token = await exchangeGoCardlessCode(code, redirectUri);

    await prisma.goCardlessConnection.upsert({
      where: { tenantId: t.tenantId },
      update: {
        accessToken: token.access_token,
        organisationId: token.organisation_id || null,
        environment: getGoCardlessEnvironment(),
        status: "connected",
        connectedAt: new Date(),
      },
      create: {
        tenantId: t.tenantId,
        accessToken: token.access_token,
        organisationId: token.organisation_id || null,
        environment: getGoCardlessEnvironment(),
        status: "connected",
      },
    });

    await prisma.settings.upsert({
      where: { key: "gocardless_enabled" },
      update: { value: "true" },
      create: { key: "gocardless_enabled", value: "true" },
    });

    return NextResponse.redirect(`${origin}/parametres?tab=paiements&gocardless=connected`);
  } catch (error) {
    console.error("[gocardless callback]", error);
    return NextResponse.redirect(`${origin}/parametres?tab=paiements&gocardless=error`);
  }
}
