export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SessionUser = { role?: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role;
  if (role !== "superadmin") return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { tenantId, nom } = await req.json();
  const association = await prisma.association.findFirst({ where: { tenantId }, select: { tenantId: true } });
  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set("view_as_tenant", tenantId, { httpOnly: true, secure, sameSite: "lax", maxAge: 3600 });
  res.cookies.set("view_as_nom", encodeURIComponent(nom || tenantId), { httpOnly: false, secure, sameSite: "lax", maxAge: 3600 });
  // Toujours en mode édition
  res.cookies.set("view_as_edit", "true", { httpOnly: true, secure, sameSite: "lax", maxAge: 3600 });
  return res;
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role;
  if (role !== "superadmin") return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { edit } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (edit) {
    res.cookies.set("view_as_edit", "true", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 3600 });
  } else {
    res.cookies.delete("view_as_edit");
  }
  return res;
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role;
  if (role !== "superadmin") return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("view_as_tenant");
  res.cookies.delete("view_as_nom");
  res.cookies.delete("view_as_edit");
  return res;
}
