import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const email = "davidfarouz66@gmail.com";
const newPassword = "Admin1234!";

const hash = await bcrypt.hash(newPassword, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { password: hash },
  create: { email, password: hash, name: "Admin", role: "admin" },
});

console.log(`✓ Compte prêt pour ${user.email}`);
console.log(`  Nouveau mot de passe : ${newPassword}`);
await prisma.$disconnect();
