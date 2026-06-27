import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Import donateurs", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la page d'import", async ({ page }) => {
    await page.goto("/import");
    await expect(page.getByRole("heading", { name: "Import CERFA" })).toBeVisible();
  });

  test("le champ upload de fichier CSV/XLSX est présent", async ({ page }) => {
    await page.goto("/import");
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 6000 });
  });

  test("affiche les instructions de format attendu", async ({ page }) => {
    await page.goto("/import");
    await expect(
      page.getByText(/csv|xlsx|colonnes|format/i).first()
    ).toBeVisible({ timeout: 6000 });
  });
});
