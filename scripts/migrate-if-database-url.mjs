import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl === "[SENSITIVE]") {
  console.log("DATABASE_URL/DIRECT_URL absent: Prisma migrate deploy ignoré.");
  process.exit(0);
}

process.env.DATABASE_URL = databaseUrl;

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
