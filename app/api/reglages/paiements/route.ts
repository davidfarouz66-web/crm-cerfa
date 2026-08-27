export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

const KEYS = [
  "stripe_enabled",
  "stripe_public_key",
  "stripe_secret_key",
  "gocardless_enabled",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const settings = await prisma.settings.findMany({ where: { key: { in: KEYS } } });
  const connection = await prisma.goCardlessConnection.findUnique({
    where: { tenantId: t.tenantId },
    select: { organisationId: true, environment: true, status: true, connectedAt: true },
  }).catch(error => {
    console.error("[paiements gocardless status]", error);
    return null;
  });
  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;
  result.gocardless_connected = String(connection?.status === "connected");
  if (connection?.organisationId) result.gocardless_organisation_id = connection.organisationId;
  if (connection?.environment) result.gocardless_environment = connection.environment;
  if (connection?.connectedAt) result.gocardless_connected_at = connection.connectedAt.toISOString();
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t);
  if (ro) return ro;

  const body = await req.json();

  for (const key of KEYS) {
    if (key in body) {
      await prisma.settings.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]) },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
