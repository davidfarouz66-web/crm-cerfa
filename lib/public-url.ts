export const CANONICAL_PUBLIC_ORIGIN = "https://www.trouma-pro.fr";

export function getPublicBaseUrl(origin?: string | null) {
  const configured = CANONICAL_PUBLIC_ORIGIN;
  const raw = configured || CANONICAL_PUBLIC_ORIGIN;
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  const normalized = url.replace(/\/+$/, "");
  if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) {
    return CANONICAL_PUBLIC_ORIGIN;
  }
  return normalized;
}

export function getPublicDonationUrl(galaId: string, origin?: string | null) {
  return `${getPublicBaseUrl(origin)}/campagnes/${galaId}/don`;
}
