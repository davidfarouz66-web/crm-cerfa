export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 400 });

  const body = await req.json();
  const { nom, email, currentPassword, newPassword } = body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const updateData: { name?: string; email?: string; password?: string } = {};

  if (nom !== undefined) updateData.name = nom;

  if (email && email !== user.email) {
    const exists = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (exists) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    updateData.email = email;
  }

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(updated);
}
