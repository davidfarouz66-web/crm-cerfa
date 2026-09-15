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

  const associations = await prisma.association.findMany({ orderBy: { createdAt: "desc" } });
  const tenantIds = associations.map((assoc) => assoc.tenantId);

  const [
    donateurCounts,
    cerfaStats,
    latestCerfaDates,
    users,
  ] = await Promise.all([
    prisma.donateur.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds } },
      _count: { _all: true },
    }),
    prisma.cerfa.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds }, status: "actif" },
      _count: { _all: true },
      _sum: { montant: true },
    }),
    prisma.cerfa.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds } },
      _max: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { tenantId: { in: tenantIds } },
      orderBy: { createdAt: "asc" },
      select: { tenantId: true, email: true, createdAt: true, status: true },
    }),
  ]);

  const latestDates = latestCerfaDates
    .map((item) => item._max.createdAt)
    .filter((date): date is Date => !!date);

  const latestCerfas = latestDates.length
    ? await prisma.cerfa.findMany({
        where: { createdAt: { in: latestDates }, tenantId: { in: tenantIds } },
        select: { tenantId: true, createdAt: true, numeroCerfa: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const donateurCountByTenant = new Map(donateurCounts.map((item) => [item.tenantId, item._count._all]));
  const cerfaStatsByTenant = new Map(cerfaStats.map((item) => [item.tenantId, item]));
  const latestCerfaByTenant = new Map(latestCerfas.map((item) => [item.tenantId, item]));
  const userByTenant = new Map(users.map((user) => [user.tenantId, user]));

  const result = associations.map((assoc) => {
    const cerfa = cerfaStatsByTenant.get(assoc.tenantId);
    const latestCerfa = latestCerfaByTenant.get(assoc.tenantId);
    const user = userByTenant.get(assoc.tenantId);

    return {
      id: assoc.id,
      tenantId: assoc.tenantId,
      nom: assoc.nom,
      ville: assoc.ville,
      email: user?.email ?? null,
      userStatus: user?.status ?? "active",
      createdAt: user?.createdAt ?? assoc.createdAt,
      nbDonateurs: donateurCountByTenant.get(assoc.tenantId) ?? 0,
      nbCerfas: cerfa?._count._all ?? 0,
      totalDons: cerfa?._sum.montant ?? 0,
      dernierCerfa: latestCerfa?.createdAt ?? null,
      dernierNumero: latestCerfa?.numeroCerfa ?? null,
      eligible: assoc.organismeEligibleMecenat,
    };
  });

  return NextResponse.json(result);
}
