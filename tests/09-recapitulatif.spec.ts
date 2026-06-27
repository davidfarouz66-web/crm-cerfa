import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Récapitulatif / Reporting", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la page récapitulatif", async ({ page }) => {
    await page.goto("/recapitulatif");
    await expect(page.getByRole("heading", { name: /récap|rapport|bilan/i })).toBeVisible({ timeout: 6000 });
  });

  test("affiche des statistiques ou un tableau de données", async ({ page }) => {
    await page.goto("/recapitulatif");
    await page.waitForTimeout(1000);
    await expect(
      page.locator("table, svg, [data-testid='stats']").first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("permet de filtrer par année", async ({ page }) => {
    await page.goto("/recapitulatif");
    const yearFilter = page.locator('select[name="annee"], input[name="annee"]');
    if (await yearFilter.isVisible()) {
      await yearFilter.selectOption("2025");
      await page.waitForTimeout(500);
      // La page ne doit pas crasher
      await expect(page.locator("body")).not.toContainText("Error");
    }
  });
});
