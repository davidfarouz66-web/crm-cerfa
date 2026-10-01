export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rate = checkRateLimit(`reset:${requestIp(req.headers)}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfter) },
    });
  }
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Mot de passe trop court (8 caractères min.)" }, { status: 400 });
  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, resetToken: null, resetTokenExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
