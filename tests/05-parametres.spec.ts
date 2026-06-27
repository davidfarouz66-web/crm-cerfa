import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Paramètres association", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la page paramètres", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.getByRole("heading", { name: /association|paramètre/i })).toBeVisible();
  });

  test("affiche les champs du formulaire association", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.locator('input[name="nom"]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('input[name="adresse"]')).toBeVisible();
    await expect(page.locator('input[name="ville"]')).toBeVisible();
  });

  test("le bouton Enregistrer est présent", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.getByRole("button", { name: /enregistrer|sauvegarder/i })).toBeVisible({ timeout: 6000 });
  });

  test("modifie et enregistre le nom de l'association", async ({ page }) => {
    await page.goto("/parametres");
    await page.waitForTimeout(1000);

    const nomInput = page.locator('input[name="nom"]');
    await nomInput.clear();
    await nomInput.fill("Association Test Playwright");

    await page.getByRole("button", { name: /enregistrer|sauvegarder/i }).click();
    await expect(
      page.getByText(/enregistré|sauvegardé|succès/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test("la section éligibilité mécénat est présente", async ({ page }) => {
    await page.goto("/parametres");
    await expect(
      page.getByText(/éligib|mécénat|article/i).first()
    ).toBeVisible({ timeout: 6000 });
  });

  test("l'upload de logo est disponible", async ({ page }) => {
    await page.goto("/parametres");
    const uploadBtn = page.locator('input[type="file"]').first();
    await expect(uploadBtn).toBeAttached({ timeout: 6000 });
  });
});
