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

// PATCH /api/admin/users  { tenantId, status: "active" | "suspended" | "pending" }
export async function PATCH(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { tenantId, status } = await req.json();
  if (!tenantId || !["active", "suspended", "pending"].includes(status)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await prisma.user.updateMany({
    where: { tenantId },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
