export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const annee = new Date().getFullYear();
  const debut = new Date(`${annee}-01-01`);
  const fin   = new Date(`${annee}-12-31`);

  const base  = { tenantId: t.tenantId };
  const actif = { ...base, status: "actif" };

  const [totalCerfa, totalDons, cerfasAnnee, totalDonateurs, derniersCerfa, parMois, parMode] = await Promise.all([
    prisma.cerfa.count({ where: actif }),
    prisma.cerfa.aggregate({ _sum: { montant: true }, where: { ...actif, dateDon: { gte: debut, lte: fin } } }),
    prisma.cerfa.count({ where: { ...actif, dateDon: { gte: debut, lte: fin } } }),
    prisma.donateur.count({ where: base }),
    prisma.cerfa.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: actif,
      include: { donateur: true },
    }),
    prisma.cerfa.groupBy({
      by: ["dateDon"],
      _sum: { montant: true },
      _count: true,
      where: { ...actif, dateDon: { gte: debut, lte: fin } },
    }),
    prisma.cerfa.groupBy({
      by: ["modePaiement"],
      _sum: { montant: true },
      _count: true,
      where: { ...actif, dateDon: { gte: debut, lte: fin } },
    }),
  ]);

  const parMoisAgrege: Record<number, { total: number; count: number }> = {};
  for (const c of parMois) {
    const mois = new Date(c.dateDon).getMonth();
    if (!parMoisAgrege[mois]) parMoisAgrege[mois] = { total: 0, count: 0 };
    parMoisAgrege[mois].total += c._sum.montant || 0;
    parMoisAgrege[mois].count += c._count;
  }

  const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const chartMois = moisLabels.map((nom, i) => ({
    mois: nom,
    total: parMoisAgrege[i]?.total || 0,
    count: parMoisAgrege[i]?.count || 0,
  }));

  return NextResponse.json({
    totalCerfa,
    totalDonsAnnee: totalDons._sum.montant || 0,
    cerfasAnnee,
    totalDonateurs,
    derniersCerfa,
    chartMois,
    parMode,
    annee,
  });
}
