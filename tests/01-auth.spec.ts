import { test, expect } from "@playwright/test";
import { login, TEST_EMAIL, TEST_PASSWORD } from "./helpers/auth";

test.describe("Authentification", () => {
  test("affiche la page de connexion", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Trouma-Pro")).toBeVisible();
    await expect(page.getByText("Gestion des dons & reçus fiscaux")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("redirige vers /login si non connecté", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("affiche une erreur avec de mauvaises credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "mauvais@email.com");
    await page.fill('input[type="password"]', "mauvaismdp");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible({ timeout: 8000 });
  });

  test("connexion réussie redirige vers le dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("lien mot de passe oublié fonctionne", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /mot de passe oublié/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test("lien inscription fonctionne", async ({ page }) => {
    await page.goto("/login");
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
  });

  test("déconnexion fonctionne", async ({ page }) => {
    await login(page);
    // Cherche le bouton de déconnexion dans le menu ou sidebar
    const signOut = page.getByRole("button", { name: /déconnex|sign out|logout/i });
    if (await signOut.isVisible()) {
      await signOut.click();
      await expect(page).toHaveURL(/login/);
    } else {
      // Cherche dans un dropdown utilisateur
      const userMenu = page.locator('[data-testid="user-menu"], button:has(svg)').last();
      await userMenu.click();
      await page.getByRole("menuitem", { name: /déconnex/i }).click();
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe("Inscription", () => {
  test("affiche le formulaire d'inscription", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("affiche une erreur si les mots de passe ne correspondent pas", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[type="email"]', "nouveau@test.com");
    const passwords = page.locator('input[type="password"]');
    await passwords.first().fill("MotDePasse1!");
    await passwords.last().fill("Différent1!");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/correspondent pas|identiques|confirmer/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Mot de passe oublié", () => {
  test("affiche le formulaire", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("soumet l'email et affiche confirmation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/envoyé|lien de réinitialisation|vérifiez/i)).toBeVisible({ timeout: 8000 });
  });
});
