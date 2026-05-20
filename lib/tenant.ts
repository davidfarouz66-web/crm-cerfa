import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

type SessionUser = { id?: string; role?: string; tenantId?: string };

/** Retourne le tenantId du user connecté, ou une réponse 401 si non authentifié. */
export async function requireTenant(): Promise<{ tenantId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as SessionUser)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return { tenantId };
}
