import crypto from "crypto";

const PREFIX = "enc:v1:";

function encryptionKey() {
  const source = process.env.PAYMENT_SECRETS_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!source) throw new Error("Clé de chiffrement des secrets absente");
  return crypto.createHash("sha256").update(source).digest();
}

export function isEncryptedSecret(value: string) {
  return value.startsWith(PREFIX);
}

export function encryptSecret(value: string) {
  if (!value || isEncryptedSecret(value)) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string) {
  if (!value || !isEncryptedSecret(value)) return value;
  const payload = value.slice(PREFIX.length).split(".");
  if (payload.length !== 3) throw new Error("Secret chiffré invalide");
  const [iv, tag, encrypted] = payload.map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
