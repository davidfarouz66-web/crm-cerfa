export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { getPublicDonationUrl } from "@/lib/public-url";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gala = await prisma.gala.findUnique({
    where: { id },
    include: {
      dons: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!gala) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [settings, gcConnection] = await Promise.all([
    prisma.settings.findMany({
      where: { key: { in: ["stripe_enabled", "stripe_secret_key", "gocardless_enabled"] } },
    }),
    prisma.goCardlessConnection.findUnique({
      where: { tenantId: gala.tenantId },
      select: { status: true },
    }).catch(() => null),
  ]);
  const values = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return NextResponse.json({
    ...gala,
    publicDonationUrl: getPublicDonationUrl(id),
    paymentMethods: {
      stripeReady: values.stripe_enabled === "true" && !!values.stripe_secret_key,
      gocardlessReady: values.gocardless_enabled === "true" && (gcConnection?.status === "connected" || !!process.env.GOCARDLESS_ACCESS_TOKEN),
    },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const { id } = await params;
  const body = await req.json();
  const gala = await prisma.gala.update({
    where: { id, tenantId: t.tenantId },
    data: {
      titre: body.titre,
      description: body.description || null,
      logoUrl: body.logoUrl || null,
      videoUrl: body.videoUrl || null,
      objectif: body.objectif ? parseFloat(body.objectif) : undefined,
      dateEvenement: body.dateEvenement ? new Date(body.dateEvenement) : undefined,
      lieu: body.lieu || null,
      typeProjet: body.typeProjet || undefined,
      langue: body.langue,
      couleurPrimaire: body.couleurPrimaire,
      couleurSecondaire: body.couleurSecondaire,
      actif: body.actif !== undefined ? body.actif : undefined,
      promesseEnabled: body.promesseEnabled !== undefined ? body.promesseEnabled : undefined,
      mensualiteEnabled: body.mensualiteEnabled !== undefined ? body.mensualiteEnabled : undefined,
      mensualiteOptions: body.mensualiteOptions || undefined,
      mensualiteDebutMode: body.mensualiteDebutMode || undefined,
      mensualiteDebutDate: body.mensualiteDebutDate ? new Date(body.mensualiteDebutDate) : null,
    },
  });
  return NextResponse.json(gala);
}
