export function getDatabaseUrl() {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!raw) {
    throw new Error("DATABASE_URL est manquant.");
  }

  if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
    return raw;
  }

  if (raw.includes("@") && raw.includes(":")) {
    return `postgresql://${raw}`;
  }

  return raw;
}

export function isLocalDatabaseUrl(url = getDatabaseUrl()) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}
