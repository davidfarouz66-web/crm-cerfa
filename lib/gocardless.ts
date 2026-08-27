import crypto from "crypto";

type GoCardlessEnvironment = "sandbox" | "live";

type GoCardlessOAuthToken = {
  access_token: string;
  organisation_id?: string;
};

type GoCardlessBillingRequest = {
  id: string;
  status?: string;
  links?: {
    payment_request?: string;
  };
};

type GoCardlessBillingRequestFlow = {
  id: string;
  authorisation_url: string;
  links?: {
    billing_request?: string;
  };
};

type DonorPayload = {
  montant: string;
  type?: string;
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  email?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
};

export function getGoCardlessEnvironment(): GoCardlessEnvironment {
  return process.env.GOCARDLESS_ENVIRONMENT === "sandbox" ? "sandbox" : "live";
}

function getConnectBase() {
  return getGoCardlessEnvironment() === "sandbox"
    ? "https://connect-sandbox.gocardless.com"
    : "https://connect.gocardless.com";
}

function getApiBase() {
  return getGoCardlessEnvironment() === "sandbox"
    ? "https://api-sandbox.gocardless.com"
    : "https://api.gocardless.com";
}

function stateSecret() {
  return process.env.GOCARDLESS_OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function sign(value: string) {
  const secret = stateSecret();
  if (!secret) throw new Error("Secret OAuth GoCardless manquant");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createGoCardlessState(tenantId: string) {
  const payload = Buffer.from(JSON.stringify({
    tenantId,
    nonce: crypto.randomBytes(12).toString("hex"),
    ts: Date.now(),
  })).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyGoCardlessState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature || sign(payload) !== signature) {
    throw new Error("Connexion GoCardless invalide");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    tenantId?: string;
    ts?: number;
  };

  if (!decoded.tenantId || !decoded.ts || Date.now() - decoded.ts > 30 * 60 * 1000) {
    throw new Error("Connexion GoCardless expirée");
  }

  return { tenantId: decoded.tenantId };
}

export function buildGoCardlessOAuthUrl(params: {
  tenantId: string;
  redirectUri: string;
  associationEmail?: string | null;
  associationNom?: string | null;
}) {
  const clientId = process.env.GOCARDLESS_CLIENT_ID;
  if (!clientId) throw new Error("GOCARDLESS_CLIENT_ID manquant");

  const url = new URL("/oauth/authorize", getConnectBase());
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("initial_view", "signup");
  url.searchParams.set("language", "fr");
  url.searchParams.set("prefill[country_code]", "FR");
  url.searchParams.set("state", createGoCardlessState(params.tenantId));

  if (params.associationEmail) url.searchParams.set("prefill[email]", params.associationEmail);
  if (params.associationNom) url.searchParams.set("prefill[organisation_name]", params.associationNom);

  return url.toString();
}

export async function exchangeGoCardlessCode(code: string, redirectUri: string) {
  const clientId = process.env.GOCARDLESS_CLIENT_ID;
  const clientSecret = process.env.GOCARDLESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Identifiants app GoCardless manquants");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(new URL("/oauth/access_token", getConnectBase()), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Connexion GoCardless refusée");
  }

  return json as GoCardlessOAuthToken;
}

export async function gocardlessRequest<T>(
  accessToken: string,
  path: string,
  options: { method?: string; body?: unknown; idempotencyKey?: string } = {},
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "GoCardless-Version": "2015-07-06",
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const res = await fetch(new URL(path, getApiBase()), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || json?.error?.errors?.[0]?.message || "Erreur GoCardless";
    throw new Error(message);
  }

  return json as T;
}

export async function createGoCardlessPaymentLink(params: {
  accessToken: string;
  origin: string;
  galaId: string;
  galaTitre: string;
  tenantId: string;
  payload: DonorPayload;
  idempotencyKey: string;
}) {
  const amount = Math.round(parseFloat(params.payload.montant) * 100);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Montant invalide");

  const billingRequest = await gocardlessRequest<{ billing_requests: GoCardlessBillingRequest }>(
    params.accessToken,
    "/billing_requests",
    {
      method: "POST",
      idempotencyKey: `${params.idempotencyKey}:request`,
      body: {
        billing_requests: {
          payment_request: {
            amount,
            currency: "EUR",
            description: `Don - ${params.galaTitre}`.slice(0, 255),
            metadata: {
              tenant_id: params.tenantId,
              gala_id: params.galaId,
            },
          },
        },
      },
    },
  );

  const prefilledCustomer: Record<string, string> = {
    country_code: "FR",
    language: "fr",
  };
  if (params.payload.email) prefilledCustomer.email = params.payload.email;
  if (params.payload.adresse) prefilledCustomer.address_line1 = params.payload.adresse;
  if (params.payload.codePostal) prefilledCustomer.postal_code = params.payload.codePostal;
  if (params.payload.ville) prefilledCustomer.city = params.payload.ville;

  if (params.payload.type === "societe") {
    if (params.payload.raisonSociale) prefilledCustomer.company_name = params.payload.raisonSociale;
    if (params.payload.prenom) prefilledCustomer.given_name = params.payload.prenom;
    if (params.payload.nom) prefilledCustomer.family_name = params.payload.nom;
  } else {
    if (params.payload.prenom) prefilledCustomer.given_name = params.payload.prenom;
    if (params.payload.nom) prefilledCustomer.family_name = params.payload.nom;
  }

  const flow = await gocardlessRequest<{ billing_request_flows: GoCardlessBillingRequestFlow }>(
    params.accessToken,
    "/billing_request_flows",
    {
      method: "POST",
      idempotencyKey: `${params.idempotencyKey}:flow`,
      body: {
        billing_request_flows: {
          auto_fulfil: true,
          redirect_uri: `${params.origin}/gala/${params.galaId}/don/merci?provider=gocardless`,
          exit_uri: `${params.origin}/gala/${params.galaId}/don`,
          prefilled_customer: prefilledCustomer,
          links: {
            billing_request: billingRequest.billing_requests.id,
          },
        },
      },
    },
  );

  return {
    billingRequest: billingRequest.billing_requests,
    flow: flow.billing_request_flows,
  };
}

export function verifyGoCardlessWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
