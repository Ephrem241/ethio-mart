import { defineConfig, devices } from "@playwright/test"

// End-to-end tests run against the PRODUCTION build (`npm run build`), in a real
// browser, against the real Supabase project named in .env. The specs create
// their own throwaway accounts (e2e-*@example.com) and remove them afterwards;
// see e2e/support/ for the safety rules. The service-role key in .env is used
// by the test SETUP only — it never reaches the app.
try {
  process.loadEnvFile(".env")
} catch {
  // No .env file: CI supplies the variables directly.
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  // The tests share one database and one shop, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  // A single retry absorbs a network blip between this machine and Supabase.
  retries: 1,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  use: {
    baseURL,
    // The Chrome already installed on the machine, so nothing has to be
    // downloaded. Set E2E_BROWSER_CHANNEL="" to use Playwright's own Chromium
    // (after `npx playwright install chromium`).
    channel: process.env.E2E_BROWSER_CHANNEL === "" ? undefined : (process.env.E2E_BROWSER_CHANNEL ?? "chrome"),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // English is the default language; specs that need Amharic set the cookie themselves.
    locale: "en-US",
  },
  // Started for you unless E2E_BASE_URL points at an already-running deployment.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // The guest shopping flow and the language switch, on a phone. (The quality audit
    // drives its own desktop, tablet and phone viewports.)
    {
      name: "mobile",
      testMatch: /flow-(1|5)-.*\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
})
