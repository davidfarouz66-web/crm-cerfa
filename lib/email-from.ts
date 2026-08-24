const DEFAULT_FROM = "Trouma Pro <contact@trouma-pro.fr>";
const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.fr",
  "icloud.com",
  "me.com",
  "msn.com",
  "aol.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "laposte.net",
  "sfr.fr",
];

function extractEmailDomain(from: string) {
  const match = from.match(/@([^>\s]+)>?$/);
  return match?.[1]?.toLowerCase() || null;
}

function isPublicEmailSender(from: string) {
  const domain = extractEmailDomain(from);
  return !!domain && PUBLIC_EMAIL_DOMAINS.includes(domain);
}

export function getSenderEmail() {
  const configuredFrom = process.env.RESEND_FROM_EMAIL || process.env.BREVO_FROM_EMAIL;
  if (!configuredFrom || isPublicEmailSender(configuredFrom)) {
    return DEFAULT_FROM;
  }

  return process.env.BREVO_FROM_NAME && configuredFrom === process.env.BREVO_FROM_EMAIL
    ? `${process.env.BREVO_FROM_NAME} <${configuredFrom}>`
    : configuredFrom;
}
