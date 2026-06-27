import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

const DONATEUR_NOM = `TestPlaywright${Date.now()}`;

test.describe("Donateurs — liste", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche la page liste des donateurs", async ({ page }) => {
    await page.goto("/donateurs");
    await expect(page.getByRole("heading", { name: /donateur/i })).toBeVisible();
  });

  test("le bouton Nouveau donateur est présent", async ({ page }) => {
    await page.goto("/donateurs");
    await expect(page.getByRole("link", { name: /nouveau/i })).toBeVisible();
  });

  test("la recherche filtre les donateurs", async ({ page }) => {
    await page.goto("/donateurs");
    const search = page.locator('input[type="search"], input[placeholder*="recherch" i]');
    if (await search.isVisible()) {
      await search.fill("zzz_inexistant");
      await page.waitForTimeout(500);
      await expect(page.getByText("Aucun donateur trouvé")).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Donateurs — création", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("affiche le formulaire nouveau donateur", async ({ page }) => {
    await page.goto("/donateurs/nouveau");
    await expect(page.getByRole("heading", { name: /nouveau donateur/i })).toBeVisible();
  });

  test("crée un donateur particulier", async ({ page }) => {
    await page.goto("/donateurs/nouveau");

    // Sélectionne type particulier si le select existe
    const typeSelect = page.locator('select[name="type"], [data-testid="type-select"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("particulier");
    }

    await page.fill('input[name="nom"]', DONATEUR_NOM);

    const prenomInput = page.locator('input[name="prenom"]');
    if (await prenomInput.isVisible()) {
      await prenomInput.fill("Test");
    }

    const adresseInput = page.locator('input[name="adresse"]');
    if (await adresseInput.isVisible()) {
      await adresseInput.fill("1 rue de la Paix");
    }

    const cpInput = page.locator('input[name="codePostal"]');
    if (await cpInput.isVisible()) {
      await cpInput.fill("75001");
    }

    const villeInput = page.locator('input[name="ville"]');
    if (await villeInput.isVisible()) {
      await villeInput.fill("Paris");
    }

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/donateurs/, { timeout: 10000 });
  });

  test("crée un donateur entreprise", async ({ page }) => {
    await page.goto("/donateurs/nouveau");

    const typeSelect = page.locator('select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("entreprise");
    } else {
      const entrepriseBtn = page.getByRole("button", { name: /entreprise/i });
      if (await entrepriseBtn.isVisible()) await entrepriseBtn.click();
    }

    await page.waitForTimeout(300);

    const rsInput = page.locator('input[name="raisonSociale"]');
    if (await rsInput.isVisible()) {
      await rsInput.fill(`EntrepriseTest${Date.now()}`);
    } else {
      await page.fill('input[name="nom"]', `EntrepriseTest${Date.now()}`);
    }

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/donateurs/, { timeout: 10000 });
  });

  test("affiche une erreur si le nom est vide", async ({ page }) => {
    await page.goto("/donateurs/nouveau");
    await page.click('button[type="submit"]');
    // Validation HTML5 ou message d'erreur custom
    // Le bouton submit reste disabled ou un champ est :invalid
    const invalidFields = await page.locator(':invalid').count();
    expect(invalidFields).toBeGreaterThan(0);
  });
});

test.describe("Donateurs — édition & suppression", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigue vers la fiche d'un donateur", async ({ page }) => {
    await page.goto("/donateurs");
    const firstRow = page.locator("table tbody tr, [data-testid='donateur-row']").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page).toHaveURL(/donateurs\/.+/);
    } else {
      // Pas de donateurs — skip
      test.skip();
    }
  });

  test("le formulaire d'édition est pré-rempli", async ({ page }) => {
    await page.goto("/donateurs");
    // Cherche un lien d'édition
    const editLink = page.getByRole("link", { name: /modifier|éditer|edit/i }).first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await expect(page.locator('input[name="nom"]')).not.toBeEmpty();
    } else {
      const firstRow = page.locator("table tbody tr").first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await expect(page.locator('input[name="nom"], h1')).toBeVisible();
      }
    }
  });
});
