import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Mobile — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la barre de navigation mobile en bas", async ({ page }) => {
    await page.goto("/dashboard");
    // La nav mobile est visible (md:hidden = visible sur mobile)
    const mobileNav = page.locator("nav.mobile-nav");
    await expect(mobileNav).toBeVisible();
  });

  test("les 4 onglets principaux sont visibles", async ({ page }) => {
    await page.goto("/dashboard");
    const mobileNav = page.locator("nav.mobile-nav");
    await expect(mobileNav.getByText("Dashboard")).toBeVisible();
    await expect(mobileNav.getByText("Donateurs")).toBeVisible();
    await expect(mobileNav.getByText("Nouveau")).toBeVisible();
    await expect(mobileNav.getByText("CERFA")).toBeVisible();
  });

  test("le bouton '...' ouvre le menu plus", async ({ page }) => {
    await page.goto("/dashboard");
    const moreBtn = page.locator("nav.mobile-nav button").last();
    await moreBtn.click();
    // Le menu contextuel apparaît
    await expect(page.getByText("Bilan")).toBeVisible({ timeout: 3000 });
    // Cibler le lien Paramètres dans le menu contextuel (pas la sidebar)
    await expect(page.locator(".fixed.bottom-14").getByText("Paramètres")).toBeVisible();
    await expect(page.locator(".fixed.bottom-14").getByText("Déconnexion")).toBeVisible();
  });

  test("navigation mobile vers Donateurs fonctionne", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav.mobile-nav").getByText("Donateurs").click();
    await expect(page).toHaveURL(/donateurs/);
  });

  test("navigation mobile vers Nouveau CERFA fonctionne", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav.mobile-nav").getByText("Nouveau").click();
    await expect(page).toHaveURL(/cerfa\/nouveau/);
  });

  test("navigation mobile vers CERFA fonctionne", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav.mobile-nav").getByText("CERFA").click();
    await expect(page).toHaveURL(/\/cerfa$/);
  });

  test("navigation mobile vers Bilan via menu '...'", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav.mobile-nav button").last().click();
    await page.getByText("Bilan").click();
    await expect(page).toHaveURL(/recapitulatif/);
  });

  test("navigation mobile vers Paramètres via menu '...'", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav.mobile-nav button").last().click();
    await page.locator(".fixed.bottom-14").getByText("Paramètres").click();
    await expect(page).toHaveURL(/parametres/);
  });
});

test.describe("Mobile — Mise en page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("la sidebar desktop est masquée sur mobile", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside.sidebar");
    // Sur mobile, la sidebar est cachée (md:block)
    await expect(sidebar).toBeHidden();
  });

  test("le dashboard s'affiche correctement sur mobile", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
    // Pas de débordement horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test("la liste des donateurs s'affiche sur mobile", async ({ page }) => {
    await page.goto("/donateurs");
    await expect(page.getByRole("heading", { name: /donateur/i })).toBeVisible();
  });

  test("le formulaire nouveau donateur est utilisable sur mobile", async ({ page }) => {
    await page.goto("/donateurs/nouveau");
    await expect(page.getByRole("heading", { name: /nouveau donateur/i })).toBeVisible();
    await expect(page.locator('input[name="nom"]')).toBeVisible();
    // Le formulaire ne dépasse pas l'écran
    const formWidth = await page.locator("form").evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(formWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test("le formulaire nouveau CERFA est utilisable sur mobile", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    await expect(page.locator('select[name="donateurId"]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('input[name="montant"]')).toBeVisible();
  });

  test("la page paramètres s'affiche sur mobile", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.getByRole("heading", { name: /association|paramètre/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toBeVisible({ timeout: 6000 });
  });

  test("la page réglages s'affiche sur mobile", async ({ page }) => {
    await page.goto("/reglages");
    await expect(page.getByRole("heading", { name: /réglage/i })).toBeVisible();
  });
});

test.describe("Mobile — Authentification", () => {
  test("la page de connexion s'affiche correctement sur mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Trouma-Pro")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("connexion fonctionne sur mobile", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    // La nav mobile est bien présente après connexion
    await expect(page.locator("nav.mobile-nav")).toBeVisible();
  });
});
