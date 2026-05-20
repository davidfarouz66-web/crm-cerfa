import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
const createId = () => randomBytes(12).toString("hex");

export async function POST(req: Request) {
  try {
    const { nomAssociation, email, password } = await req.json();

    if (!nomAssociation?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 409 });
    }

    // Génère un tenantId unique pour cette association
    const tenantId = createId();
    const hash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.create({
        data: { email, password: hash, name: nomAssociation, role: "admin", tenantId },
      }),
      prisma.association.create({
        data: { nom: nomAssociation, tenantId },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
