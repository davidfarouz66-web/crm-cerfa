import { Page } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL || "davidfarouz66@gmail.com";
export const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}
