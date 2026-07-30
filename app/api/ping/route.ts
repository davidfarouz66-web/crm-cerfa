import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function pingSupabaseApi() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  });

  return response.ok;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pingDatabase();
    return NextResponse.json({
      ok: true,
      database: "awake",
      supabase: "not-needed",
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[keepalive] Database ping failed", error);

    try {
      const supabaseAwake = await pingSupabaseApi();

      if (supabaseAwake) {
        return NextResponse.json({
          ok: true,
          database: "unreachable",
          supabase: "awake",
          ts: new Date().toISOString(),
        });
      }
    } catch (supabaseError) {
      console.error("[keepalive] Supabase API ping failed", supabaseError);
    }

    return NextResponse.json({
      ok: false,
      database: "unreachable",
      supabase: "unreachable",
      ts: new Date().toISOString(),
    });
  }
}
