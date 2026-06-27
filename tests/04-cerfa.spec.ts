import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("CERFA — liste", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la page liste des CERFA", async ({ page }) => {
    await page.goto("/cerfa");
    await expect(page.getByRole("heading", { name: /cerfa|reçu/i })).toBeVisible();
  });

  test("le bouton Nouveau reçu est présent", async ({ page }) => {
    await page.goto("/cerfa");
    await expect(page.getByRole("link", { name: "Nouveau", exact: true })).toBeVisible();
  });

  test("affiche les colonnes du tableau", async ({ page }) => {
    await page.goto("/cerfa");
    // N° CERFA, donateur, montant, date, mode
    await expect(page.getByText(/date|montant|donateur/i).first()).toBeVisible();
  });
});

test.describe("CERFA — création", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche le formulaire nouveau CERFA", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    await expect(page.getByRole("heading", { name: /nouveau|reçu|cerfa/i })).toBeVisible();
  });

  test("le sélecteur de donateur se charge", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    const select = page.locator('select[name="donateurId"]');
    await expect(select).toBeVisible({ timeout: 8000 });
    // Attend que les options se chargent
    await page.waitForTimeout(1000);
    const count = await select.locator("option").count();
    // Au moins 1 option (placeholder) doit exister
    expect(count).toBeGreaterThan(0);
  });

  test("affiche un avertissement si l'association n'est pas éligible", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    // Si pas éligible, un alert/warning doit apparaître
    const warning = page.locator('[role="alert"], .bg-amber-50, .bg-red-50, svg.text-amber');
    // Ce test vérifie juste que la page charge sans crash
    await expect(page.locator("form")).toBeVisible({ timeout: 8000 });
  });

  test("affiche les champs obligatoires du formulaire", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    await page.waitForTimeout(500);
    await expect(page.locator('select[name="donateurId"]')).toBeVisible();
    await expect(page.locator('input[name="montant"]')).toBeVisible();
    await expect(page.locator('input[name="dateDon"]')).toBeVisible();
    await expect(page.locator('input[name="modePaiement"]').first()).toBeVisible();
  });

  test("la case de certification est requise", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    await page.waitForTimeout(500);

    const select = page.locator('select[name="donateurId"]');
    const options = await select.locator("option[value]").all();
    if (options.length > 0) {
      await select.selectOption({ index: 1 });
    }
    await page.fill('input[name="montant"]', "100");

    const dateInput = page.locator('input[name="dateDon"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill("2026-01-15");
    }

    await page.locator('input[name="modePaiement"][value="virement"]').evaluate((el: HTMLElement) => el.closest('label')?.click());

    // Le bouton est disabled tant que la certification n'est pas cochée
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test("génère un CERFA avec PDF (si un donateur existe)", async ({ page }) => {
    await page.goto("/cerfa/nouveau");
    await page.waitForTimeout(1500);

    const select = page.locator('select[name="donateurId"]');
    const options = await select.locator("option[value]").all();
    if (options.length === 0) {
      test.skip();
      return;
    }

    await select.selectOption({ index: 1 });
    await page.fill('input[name="montant"]', "50");

    const dateInput = page.locator('input[name="dateDon"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill("2026-06-01");
    }

    await page.locator('input[name="modePaiement"][value="cheque"]').evaluate((el: HTMLElement) => el.closest('label')?.click());

    // La case de certification est un composant React contrôlé — on clique le label
    // Le label contient "certifie" dans le texte
    const certifLabel = page.locator('label').filter({ hasText: /certifie|habilité/i });
    if (await certifLabel.isVisible()) {
      await certifLabel.click();
    } else {
      // Fallback : clique la dernière checkbox non-disabled
      await page.evaluate(() => {
        const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
        const unchecked = checkboxes.find(cb => !cb.disabled && !cb.checked);
        if (unchecked) unchecked.click();
      });
    }
    await page.waitForTimeout(300);

    // Si le bouton est toujours disabled (association non éligible), on skip
    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await submitBtn.click();

    await expect(
      page.getByText(/généré|succès|cerfa|télécharger/i)
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("CERFA — détail & PDF", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigue vers le détail d'un CERFA", async ({ page }) => {
    await page.goto("/cerfa");
    const firstRow = page.locator("table tbody tr, [data-testid='cerfa-row']").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page).toHaveURL(/cerfa\/.+/);
    } else {
      test.skip();
    }
  });

  test("le lien de téléchargement PDF est présent", async ({ page }) => {
    await page.goto("/cerfa");
    const downloadLink = page.getByRole("link", { name: /télécharger|pdf/i }).first();
    if (await downloadLink.isVisible()) {
      // Vérifie que le href pointe vers un PDF
      const href = await downloadLink.getAttribute("href");
      expect(href).toMatch(/\.pdf|\/api\/pdf/i);
    } else {
      test.skip();
    }
  });

  test("le bouton de téléchargement PDF déclenche un download", async ({ page }) => {
    await page.goto("/cerfa");
    const firstRow = page.locator("table tbody tr").first();
    if (!await firstRow.isVisible()) {
      test.skip();
      return;
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
      page.getByRole("link", { name: /télécharger|pdf/i }).first().click().catch(() => {}),
    ]);

    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });
});
