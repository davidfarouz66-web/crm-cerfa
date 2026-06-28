export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const gala = await prisma.gala.findUnique({ where: { id } });
  if (!gala) return NextResponse.json({ error: "Gala introuvable" }, { status: 404 });

  const don = await prisma.donGala.create({
    data: {
      galaId: id,
      montant: parseFloat(body.montant),
      anonyme: !!body.anonyme,
      nomAffiche: body.anonyme ? null : (body.nomAffiche || null),
      message: body.message || null,
    },
  });

  await prisma.gala.update({
    where: { id },
    data: { totalCollecte: { increment: parseFloat(body.montant) } },
  });

  return NextResponse.json(don);
}
