import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGoCardlessEnvironment } from "@/lib/gocardless";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  try {
    const connection = await prisma.goCardlessConnection.findUnique({
      where: { tenantId: t.tenantId },
      select: {
        organisationId: true,
        environment: true,
        status: true,
        connectedAt: true,
      },
    });

    return NextResponse.json({
      configured: !!process.env.GOCARDLESS_CLIENT_ID && !!process.env.GOCARDLESS_CLIENT_SECRET,
      environment: connection?.environment || getGoCardlessEnvironment(),
      connected: connection?.status === "connected",
      organisationId: connection?.organisationId || null,
      connectedAt: connection?.connectedAt || null,
      migrationRequired: false,
    });
  } catch (error) {
    console.error("[gocardless status]", error);
    return NextResponse.json({
      configured: !!process.env.GOCARDLESS_CLIENT_ID && !!process.env.GOCARDLESS_CLIENT_SECRET,
      environment: getGoCardlessEnvironment(),
      connected: false,
      organisationId: null,
      connectedAt: null,
      migrationRequired: true,
    });
  }
}
