import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "awake",
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[keepalive] Database ping failed", error);
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        ts: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
