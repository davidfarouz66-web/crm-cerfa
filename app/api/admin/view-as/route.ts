export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = { role?: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role;
  if (role !== "superadmin") return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { tenantId, nom } = await req.json();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("view_as_tenant", tenantId, { httpOnly: true, sameSite: "lax", maxAge: 3600 });
  res.cookies.set("view_as_nom", encodeURIComponent(nom || tenantId), { httpOnly: false, sameSite: "lax", maxAge: 3600 });
  // Toujours en mode édition
  res.cookies.set("view_as_edit", "true", { httpOnly: false, sameSite: "lax", maxAge: 3600 });
  return res;
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role;
  if (role !== "superadmin") return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { edit } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (edit) {
    res.cookies.set("view_as_edit", "true", { httpOnly: false, sameSite: "lax", maxAge: 3600 });
  } else {
    res.cookies.delete("view_as_edit");
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("view_as_tenant");
  res.cookies.delete("view_as_nom");
  res.cookies.delete("view_as_edit");
  return res;
}
