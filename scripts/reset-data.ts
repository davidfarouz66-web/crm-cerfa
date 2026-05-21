/**
 * Reset all test data — keeps only the superadmin account
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🗑️  Suppression des données de test...");

  // 1. Audit logs
  const logs = await prisma.auditLog.deleteMany({});
  console.log(`  ✓ AuditLog: ${logs.count} supprimés`);

  // 2. CERFA
  const cerfas = await prisma.cerfa.deleteMany({});
  console.log(`  ✓ Cerfa: ${cerfas.count} supprimés`);

  // 3. Donateurs
  const donateurs = await prisma.donateur.deleteMany({});
  console.log(`  ✓ Donateurs: ${donateurs.count} supprimés`);

  // 4. Association
  const assoc = await prisma.association.deleteMany({});
  console.log(`  ✓ Association: ${assoc.count} supprimée(s)`);

  // 5. Settings
  const settings = await prisma.settings.deleteMany({});
  console.log(`  ✓ Settings: ${settings.count} supprimé(s)`);

  // 6. Users — garde uniquement le superadmin
  const users = await prisma.user.deleteMany({
    where: { role: { not: "superadmin" } },
  });
  console.log(`  ✓ Users (hors superadmin): ${users.count} supprimés`);

  // Vérification finale
  const remaining = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("\n✅ CRM remis à zéro. Comptes restants :");
  remaining.forEach((u) => console.log(`   - ${u.email} (${u.role})`));
}

main()
  .catch((e) => { console.error("❌ Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
