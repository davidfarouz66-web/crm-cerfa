export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const galas = await prisma.gala.findMany({
    where: { tenantId: t.tenantId },
    include: { _count: { select: { dons: true } } },
    orderBy: { dateEvenement: "desc" },
  });
  return NextResponse.json(galas);
}

export async function POST(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const body = await req.json();
  const gala = await prisma.gala.create({
    data: {
      tenantId: t.tenantId,
      titre: body.titre,
      description: body.description || null,
      logoUrl: body.logoUrl || null,
      objectif: parseFloat(body.objectif),
      dateEvenement: new Date(body.dateEvenement),
      lieu: body.lieu || null,
      langue: body.langue || "fr",
      couleurPrimaire: body.couleurPrimaire || "#1e3a8a",
      couleurSecondaire: body.couleurSecondaire || "#ffffff",
      promesseEnabled: body.promesseEnabled || false,
    },
  });
  return NextResponse.json(gala);
}
