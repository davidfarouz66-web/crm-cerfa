import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant, rejectIfReadOnly } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST() {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;
  const ro = rejectIfReadOnly(t);
  if (ro) return ro;

  await prisma.goCardlessConnection.deleteMany({ where: { tenantId: t.tenantId } });

  return NextResponse.json({ ok: true });
}
