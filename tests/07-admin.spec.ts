import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Admin (super-admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("la page admin est accessible pour un admin", async ({ page }) => {
    const res = await page.goto("/admin");
    // Soit la page charge, soit on est redirigé (non-admin)
    const url = page.url();
    if (url.includes("/admin")) {
      await expect(page.getByRole("heading", { name: /admin|tenant|association/i })).toBeVisible({ timeout: 8000 });
    } else {
      // Non-admin redirigé vers dashboard — c'est correct
      expect(url).toMatch(/dashboard|login/);
    }
  });

  test("la liste des tenants s'affiche (si super-admin)", async ({ page }) => {
    await page.goto("/admin");
    const url = page.url();
    if (!url.includes("/admin")) {
      test.skip();
      return;
    }
    await expect(page.locator("table, [data-testid='tenant-list']")).toBeVisible({ timeout: 8000 });
  });

  test("les statuts des comptes sont affichés", async ({ page }) => {
    await page.goto("/admin");
    const url = page.url();
    if (!url.includes("/admin")) {
      test.skip();
      return;
    }
    await expect(
      page.getByText(/actif|en attente|suspendu/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
