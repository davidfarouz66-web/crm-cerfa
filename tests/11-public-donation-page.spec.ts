import { expect, test } from "@playwright/test";

const campaignId = "cmtj8rao3000004l41t2zn3rc";
const campaign = {
  id: campaignId,
  titre: "Son père ne sera pas là sous la ‘Houppa… Soyons là pour elle",
  description: "Texte historique de la campagne",
  videoUrl: null,
  objectif: 15000,
  totalCollecte: 938,
  dateEvenement: "2026-11-01T17:30:00.000Z",
  lieu: "Israël",
  typeProjet: "mariage",
  couleurPrimaire: "#1e3a8a",
  couleurSecondaire: "#ffffff",
  logoUrl: "https://shghfpusxlcvhstywvgq.supabase.co/storage/v1/object/public/crm-images/ccc64e216899709715e82408/campaign-1789516491323.png",
  actif: true,
  promesseEnabled: false,
  mensualiteEnabled: true,
  publicDonationUrl: `https://www.trouma-pro.fr/campagnes/${campaignId}/don`,
  paymentMethods: { stripeReady: true, gocardlessReady: true },
  organizer: {
    nom: "Association vérifiée",
    presentation: "Présentation publique vérifiée.",
    email: "contact@example.org",
    telephone: null,
    remiseFondsDescription: "Circuit de remise des fonds vérifié.",
    organismeEligibleMecenat: true,
  },
  dons: [
    { id: "1", montant: 18, nomAffiche: null, anonyme: true, message: null, createdAt: "2026-10-01T19:59:45.385Z" },
    { id: "2", montant: 50, nomAffiche: "Chanaelle", anonyme: false, message: "Mazal Tov", createdAt: "2026-09-24T22:47:52.561Z" },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/gala/**", async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(campaign) });
      return;
    }
    await route.abort();
  });
  await page.goto(`/campagnes/${campaignId}/don`);
});

test("affiche la campagne et un formulaire accessible sans montant présélectionné", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Aidons une jeune orpheline à préparer son mariage" })).toBeVisible();
  await expect(page.getByText("Mariage prévu le 1er novembre 2026")).toBeVisible();
  await expect(page.getByText("Objectif 15 000 €")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choisir un montant" })).toBeDisabled();
  await expect(page.getByText("Le vrai prélèvement mensuel GoCardless sera branché dans l’étape suivante.")).toHaveCount(0);
  await expect(page.getByText("25%")).toHaveCount(0);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/trouma-donation-desktop.png", fullPage: false });
});

test("sélectionne les montants, ouvre les options et conserve les moyens actifs", async ({ page }) => {
  const amount = page.getByRole("button", { name: "36 €", exact: true });
  await amount.click();
  await expect(amount).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Donner 36 €" })).toBeEnabled();

  await page.getByText("Personnaliser mon don").click();
  await expect(page.getByText("Ne pas afficher mon nom publiquement")).toBeVisible();
  await expect(page.getByRole("button", { name: /Carte bancaire/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pay by Bank/ })).toBeVisible();
});

test("demande l’adresse uniquement pour le reçu fiscal", async ({ page }) => {
  await expect(page.getByLabel("Adresse")).toHaveCount(0);
  await page.getByText("Je souhaite recevoir un reçu fiscal").click();
  await expect(page.getByLabel("Adresse")).toBeVisible();
  await expect(page.getByLabel("Code postal")).toBeVisible();
  await expect(page.getByLabel("Ville")).toBeVisible();
});

test("place le formulaire avant le récit sur mobile et ne déborde pas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const formTop = await page.locator("form").evaluate(element => element.getBoundingClientRect().top + window.scrollY);
  const storyTop = await page.getByRole("heading", { name: "Pourquoi cette collecte ?" }).evaluate(element => element.getBoundingClientRect().top + window.scrollY);
  expect(formTop).toBeLessThan(storyTop);
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/trouma-donation-mobile.png", fullPage: true });
});
