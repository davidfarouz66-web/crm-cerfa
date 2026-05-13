import { prisma } from "./db";
import bcrypt from "bcryptjs";

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@crm-cerfa.fr" } });
  if (!existing) {
    const hash = await bcrypt.hash("Admin1234!", 10);
    await prisma.user.create({
      data: { email: "admin@crm-cerfa.fr", password: hash, name: "Administrateur", role: "admin" },
    });
    console.log("✅ Utilisateur admin créé : admin@crm-cerfa.fr / Admin1234!");
  }

  const assoc = await prisma.association.findFirst();
  if (!assoc) {
    await prisma.association.create({
      data: {
        nom: "Mon Association",
        adresse: "1 rue de la Paix",
        codePostal: "75001",
        ville: "Paris",
        objetSocial: "Soutien aux personnes en difficulté",
        representant: "Jean Dupont",
      },
    });
    console.log("✅ Association créée");
  }

  console.log("✅ Seed terminé");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
