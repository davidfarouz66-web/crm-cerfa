import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["**/10-mobile.spec.ts"],
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: ["**/10-mobile.spec.ts", "**/01-auth.spec.ts", "**/02-dashboard.spec.ts"],
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
      testMatch: ["**/10-mobile.spec.ts"],
    },
  ],
  // Ne lance pas le serveur automatiquement — lancer `npm run dev` avant
});
