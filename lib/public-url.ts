export function getPublicBaseUrl(origin?: string | null) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    origin ||
    "http://localhost:3000";

  const url = configured.startsWith("http") ? configured : `https://${configured}`;
  return url.replace(/\/+$/, "");
}

export function getPublicDonationUrl(galaId: string, origin?: string | null) {
  return `${getPublicBaseUrl(origin)}/campagnes/${galaId}/don`;
}
