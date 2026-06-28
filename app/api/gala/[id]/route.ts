export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gala = await prisma.gala.findUnique({
    where: { id },
    include: {
      dons: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!gala) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(gala);
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
      description: body.description,
      objectif: body.objectif ? parseFloat(body.objectif) : undefined,
      dateEvenement: body.dateEvenement ? new Date(body.dateEvenement) : undefined,
      lieu: body.lieu,
      langue: body.langue,
      couleurPrimaire: body.couleurPrimaire,
      couleurSecondaire: body.couleurSecondaire,
      actif: body.actif !== undefined ? body.actif : undefined,
    },
  });
  return NextResponse.json(gala);
}
