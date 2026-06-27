import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche les 4 cartes de statistiques", async ({ page }) => {
    await page.goto("/dashboard");
    // Cartes : Total CERFA, Dons de l'année, CERFA de l'année, Donateurs
    await expect(page.getByText(/reçu|cerfa/i).first()).toBeVisible();
    await expect(page.getByText(/donateur/i).first()).toBeVisible();
    await expect(page.getByText(/don|euro|€/i).first()).toBeVisible();
  });

  test("affiche le graphique mensuel", async ({ page }) => {
    await page.goto("/dashboard");
    // Recharts génère un SVG
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 8000 });
  });

  test("affiche la liste des derniers CERFA", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/dernier|récent/i)).toBeVisible({ timeout: 6000 });
  });

  test("les liens de navigation du sidebar fonctionnent", async ({ page }) => {
    await page.goto("/dashboard");
    const links = [
      { pattern: /donateur/, url: /donateurs/ },
      { pattern: /cerfa|reçu/i, url: /cerfa/ },
      { pattern: /paramètre|association/i, url: /param/ },
    ];
    for (const { pattern, url } of links) {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(url);
        await page.goBack();
      }
    }
  });
});
