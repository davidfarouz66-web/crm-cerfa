export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role !== "superadmin") return null;
  return session;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Toutes les associations avec leurs stats
  const associations = await prisma.association.findMany({
    orderBy: { createdAt: "desc" },
  });

  const result = await Promise.all(
    associations.map(async (assoc) => {
      const [nbDonateurs, nbCerfas, dernierCerfa, totalDons, user] = await Promise.all([
        prisma.donateur.count({ where: { tenantId: assoc.tenantId } }),
        prisma.cerfa.count({ where: { tenantId: assoc.tenantId, status: "actif" } }),
        prisma.cerfa.findFirst({
          where: { tenantId: assoc.tenantId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, numeroCerfa: true },
        }),
        prisma.cerfa.aggregate({
          where: { tenantId: assoc.tenantId, status: "actif" },
          _sum: { montant: true },
        }),
        prisma.user.findFirst({
          where: { tenantId: assoc.tenantId },
          select: { email: true, createdAt: true, status: true },
        }),
      ]);

      return {
        id:            assoc.id,
        tenantId:      assoc.tenantId,
        nom:           assoc.nom,
        ville:         assoc.ville,
        email:         user?.email ?? null,
        userStatus:    user?.status ?? "active",
        createdAt:     assoc.createdAt,
        nbDonateurs,
        nbCerfas,
        totalDons:     totalDons._sum.montant ?? 0,
        dernierCerfa:  dernierCerfa?.createdAt ?? null,
        dernierNumero: dernierCerfa?.numeroCerfa ?? null,
        eligible:      assoc.organismeEligibleMecenat,
      };
    })
  );

  return NextResponse.json(result);
}
