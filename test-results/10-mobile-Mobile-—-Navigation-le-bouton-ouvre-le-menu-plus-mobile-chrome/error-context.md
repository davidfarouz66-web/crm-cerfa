# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-mobile.spec.ts >> Mobile — Navigation >> le bouton '...' ouvre le menu plus
- Location: tests/10-mobile.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Déconnexion')
Expected: visible
Error: strict mode violation: getByText('Déconnexion') resolved to 2 elements:
    1) <button class="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-all">…</button> aka locator('aside').getByText('Déconnexion')
    2) <button class="flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 w-full">…</button> aka getByRole('button', { name: 'Déconnexion' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Déconnexion')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - main [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - heading "Tableau de bord" [level=1] [ref=e7]
          - paragraph [ref=e8]:
            - generic [ref=e9]: Association Test Playwright ·
            - text: Vue d'ensemble 2026
        - generic [ref=e10]:
          - generic [ref=e11]:
            - img [ref=e13]
            - paragraph [ref=e16]: "0"
            - paragraph [ref=e17]: Total CERFA émis
            - paragraph [ref=e18]: Tous temps
          - generic [ref=e19]:
            - img [ref=e21]
            - paragraph [ref=e24]: "0"
            - paragraph [ref=e25]: CERFA 2026
            - paragraph [ref=e26]: Cette année
          - generic [ref=e27]:
            - img [ref=e29]
            - paragraph [ref=e31]: 0,00 €
            - paragraph [ref=e32]: Dons 2026
            - paragraph [ref=e33]: Cette année
          - generic [ref=e34]:
            - img [ref=e36]
            - paragraph [ref=e41]: "6"
            - paragraph [ref=e42]: Donateurs
            - paragraph [ref=e43]: Enregistrés
        - generic [ref=e44]:
          - generic [ref=e45]:
            - heading "Dons par mois (2026)" [level=2] [ref=e46]
            - application [ref=e49]:
              - generic [ref=e61]:
                - generic [ref=e62]:
                  - generic [ref=e64]: Fév
                  - generic [ref=e66]: Avr
                  - generic [ref=e68]: Jun
                  - generic [ref=e70]: Aoû
                  - generic [ref=e72]: Oct
                  - generic [ref=e74]: Déc
                - generic [ref=e75]:
                  - generic [ref=e77]: 0€
                  - generic [ref=e79]: 1€
                  - generic [ref=e81]: 2€
                  - generic [ref=e83]: 3€
                  - generic [ref=e85]: 4€
          - generic [ref=e86]:
            - heading "Par mode de paiement" [level=2] [ref=e87]
            - paragraph [ref=e89]: Aucune donnée
        - generic [ref=e90]:
          - generic [ref=e91]:
            - heading "Derniers CERFA émis" [level=2] [ref=e92]
            - link "Voir tout" [ref=e93] [cursor=pointer]:
              - /url: /cerfa
              - text: Voir tout
              - img [ref=e94]
          - generic [ref=e97]:
            - paragraph [ref=e98]: Aucun CERFA généré pour l'instant
            - link "Créer le premier CERFA →" [ref=e99] [cursor=pointer]:
              - /url: /cerfa/nouveau
    - generic [ref=e101]:
      - link "Bilan" [ref=e102] [cursor=pointer]:
        - /url: /recapitulatif
        - img [ref=e103]
        - text: Bilan
      - link "Paramètres" [ref=e105] [cursor=pointer]:
        - /url: /parametres
        - img [ref=e106]
        - text: Paramètres
      - link "Administration" [ref=e109] [cursor=pointer]:
        - /url: /admin
        - img [ref=e110]
        - text: Administration
      - button "Déconnexion" [ref=e112]:
        - img [ref=e113]
        - text: Déconnexion
    - navigation [ref=e116]:
      - link "Dashboard" [ref=e117] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e118]
        - text: Dashboard
      - link "Donateurs" [ref=e123] [cursor=pointer]:
        - /url: /donateurs
        - img [ref=e124]
        - text: Donateurs
      - link "Nouveau" [ref=e129] [cursor=pointer]:
        - /url: /cerfa/nouveau
        - img [ref=e130]
        - text: Nouveau
      - link "CERFA" [ref=e133] [cursor=pointer]:
        - /url: /cerfa
        - img [ref=e134]
        - text: CERFA
      - button "Fermer" [active] [ref=e137]:
        - img [ref=e138]
        - text: Fermer
  - button "Open Next.js Dev Tools" [ref=e146] [cursor=pointer]:
    - img [ref=e147]
  - alert [ref=e150]
  - generic [ref=e151]: 0€
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { login } from "./helpers/auth";
  3   | 
  4   | test.describe("Mobile — Navigation", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await login(page);
  7   |   });
  8   | 
  9   |   test("affiche la barre de navigation mobile en bas", async ({ page }) => {
  10  |     await page.goto("/dashboard");
  11  |     // La nav mobile est visible (md:hidden = visible sur mobile)
  12  |     const mobileNav = page.locator("nav.mobile-nav");
  13  |     await expect(mobileNav).toBeVisible();
  14  |   });
  15  | 
  16  |   test("les 4 onglets principaux sont visibles", async ({ page }) => {
  17  |     await page.goto("/dashboard");
  18  |     const mobileNav = page.locator("nav.mobile-nav");
  19  |     await expect(mobileNav.getByText("Dashboard")).toBeVisible();
  20  |     await expect(mobileNav.getByText("Donateurs")).toBeVisible();
  21  |     await expect(mobileNav.getByText("Nouveau")).toBeVisible();
  22  |     await expect(mobileNav.getByText("CERFA")).toBeVisible();
  23  |   });
  24  | 
  25  |   test("le bouton '...' ouvre le menu plus", async ({ page }) => {
  26  |     await page.goto("/dashboard");
  27  |     const moreBtn = page.locator("nav.mobile-nav button").last();
  28  |     await moreBtn.click();
  29  |     // Le menu contextuel apparaît
  30  |     await expect(page.getByText("Bilan")).toBeVisible({ timeout: 3000 });
  31  |     // Cibler le lien Paramètres dans le menu contextuel (pas la sidebar)
  32  |     await expect(page.locator(".fixed.bottom-14").getByText("Paramètres")).toBeVisible();
> 33  |     await expect(page.getByText("Déconnexion")).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  34  |   });
  35  | 
  36  |   test("navigation mobile vers Donateurs fonctionne", async ({ page }) => {
  37  |     await page.goto("/dashboard");
  38  |     await page.locator("nav.mobile-nav").getByText("Donateurs").click();
  39  |     await expect(page).toHaveURL(/donateurs/);
  40  |   });
  41  | 
  42  |   test("navigation mobile vers Nouveau CERFA fonctionne", async ({ page }) => {
  43  |     await page.goto("/dashboard");
  44  |     await page.locator("nav.mobile-nav").getByText("Nouveau").click();
  45  |     await expect(page).toHaveURL(/cerfa\/nouveau/);
  46  |   });
  47  | 
  48  |   test("navigation mobile vers CERFA fonctionne", async ({ page }) => {
  49  |     await page.goto("/dashboard");
  50  |     await page.locator("nav.mobile-nav").getByText("CERFA").click();
  51  |     await expect(page).toHaveURL(/\/cerfa$/);
  52  |   });
  53  | 
  54  |   test("navigation mobile vers Bilan via menu '...'", async ({ page }) => {
  55  |     await page.goto("/dashboard");
  56  |     await page.locator("nav.mobile-nav button").last().click();
  57  |     await page.getByText("Bilan").click();
  58  |     await expect(page).toHaveURL(/recapitulatif/);
  59  |   });
  60  | 
  61  |   test("navigation mobile vers Paramètres via menu '...'", async ({ page }) => {
  62  |     await page.goto("/dashboard");
  63  |     await page.locator("nav.mobile-nav button").last().click();
  64  |     await page.locator(".fixed.bottom-14").getByText("Paramètres").click();
  65  |     await expect(page).toHaveURL(/parametres/);
  66  |   });
  67  | });
  68  | 
  69  | test.describe("Mobile — Mise en page", () => {
  70  |   test.beforeEach(async ({ page }) => {
  71  |     await login(page);
  72  |   });
  73  | 
  74  |   test("la sidebar desktop est masquée sur mobile", async ({ page }) => {
  75  |     await page.goto("/dashboard");
  76  |     const sidebar = page.locator("aside.sidebar");
  77  |     // Sur mobile, la sidebar est cachée (md:block)
  78  |     await expect(sidebar).toBeHidden();
  79  |   });
  80  | 
  81  |   test("le dashboard s'affiche correctement sur mobile", async ({ page }) => {
  82  |     await page.goto("/dashboard");
  83  |     await expect(page.locator("main")).toBeVisible();
  84  |     // Pas de débordement horizontal
  85  |     const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  86  |     const viewportWidth = await page.evaluate(() => window.innerWidth);
  87  |     expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  88  |   });
  89  | 
  90  |   test("la liste des donateurs s'affiche sur mobile", async ({ page }) => {
  91  |     await page.goto("/donateurs");
  92  |     await expect(page.getByRole("heading", { name: /donateur/i })).toBeVisible();
  93  |   });
  94  | 
  95  |   test("le formulaire nouveau donateur est utilisable sur mobile", async ({ page }) => {
  96  |     await page.goto("/donateurs/nouveau");
  97  |     await expect(page.getByRole("heading", { name: /nouveau donateur/i })).toBeVisible();
  98  |     await expect(page.locator('input[name="nom"]')).toBeVisible();
  99  |     // Le formulaire ne dépasse pas l'écran
  100 |     const formWidth = await page.locator("form").evaluate((el) => el.scrollWidth);
  101 |     const viewportWidth = await page.evaluate(() => window.innerWidth);
  102 |     expect(formWidth).toBeLessThanOrEqual(viewportWidth + 5);
  103 |   });
  104 | 
  105 |   test("le formulaire nouveau CERFA est utilisable sur mobile", async ({ page }) => {
  106 |     await page.goto("/cerfa/nouveau");
  107 |     await expect(page.locator('select[name="donateurId"]')).toBeVisible({ timeout: 6000 });
  108 |     await expect(page.locator('input[name="montant"]')).toBeVisible();
  109 |   });
  110 | 
  111 |   test("la page paramètres s'affiche sur mobile", async ({ page }) => {
  112 |     await page.goto("/parametres");
  113 |     await expect(page.getByRole("heading", { name: /association|paramètre/i })).toBeVisible();
  114 |     await expect(page.getByRole("button", { name: /enregistrer/i })).toBeVisible({ timeout: 6000 });
  115 |   });
  116 | 
  117 |   test("la page réglages s'affiche sur mobile", async ({ page }) => {
  118 |     await page.goto("/reglages");
  119 |     await expect(page.getByRole("heading", { name: /réglage/i })).toBeVisible();
  120 |   });
  121 | });
  122 | 
  123 | test.describe("Mobile — Authentification", () => {
  124 |   test("la page de connexion s'affiche correctement sur mobile", async ({ page }) => {
  125 |     await page.goto("/login");
  126 |     await expect(page.getByText("Trouma-Pro")).toBeVisible();
  127 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  128 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  129 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  130 |   });
  131 | 
  132 |   test("connexion fonctionne sur mobile", async ({ page }) => {
  133 |     await login(page);
```