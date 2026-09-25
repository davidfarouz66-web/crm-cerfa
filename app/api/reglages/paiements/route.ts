export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";
import { encryptSecret, isEncryptedSecret } from "@/lib/secret-store";

const KEYS = [
  "stripe_enabled",
  "stripe_public_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "gocardless_enabled",
];
const SECRET_KEYS = new Set(["stripe_secret_key", "stripe_webhook_secret"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const settings = await prisma.settings.findMany({
    where: { tenantId: t.tenantId, key: { in: KEYS } },
  });
  const connection = await prisma.goCardlessConnection.findUnique({
    where: { tenantId: t.tenantId },
    select: { organisationId: true, environment: true, status: true, connectedAt: true },
  }).catch(error => {
    console.error("[paiements gocardless status]", error);
    return null;
  });
  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;
  const migrations = settings
    .filter((s) => SECRET_KEYS.has(s.key) && s.value && !isEncryptedSecret(s.value))
    .map((s) => prisma.settings.update({ where: { id: s.id }, data: { value: encryptSecret(s.value) } }));
  if (migrations.length) await prisma.$transaction(migrations);
  result.stripe_configured = String(!!result.stripe_secret_key);
  result.stripe_webhook_configured = String(!!(result.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET));
  result.stripe_ready = String(result.stripe_enabled === "true" && !!result.stripe_secret_key);
  delete result.stripe_secret_key;
  delete result.stripe_webhook_secret;
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
      const rawValue = String(body[key] ?? "").trim();
      if (SECRET_KEYS.has(key) && !rawValue) continue;
      const value = SECRET_KEYS.has(key) ? encryptSecret(rawValue) : String(body[key]);
      await prisma.settings.upsert({
        where: { tenantId_key: { tenantId: t.tenantId, key } },
        update: { value },
        create: { tenantId: t.tenantId, key, value },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
