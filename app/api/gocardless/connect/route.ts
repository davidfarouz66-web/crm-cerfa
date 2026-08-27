import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildGoCardlessOAuthUrl } from "@/lib/gocardless";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t);
  if (ro) return ro;

  try {
    const association = await prisma.association.findFirst({
      where: { tenantId: t.tenantId },
      select: { nom: true, email: true },
    });

    const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const redirectUri = `${origin}/api/gocardless/callback`;
    const url = buildGoCardlessOAuthUrl({
      tenantId: t.tenantId,
      redirectUri,
      associationEmail: association?.email,
      associationNom: association?.nom,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion GoCardless impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
