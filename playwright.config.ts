import { defineConfig, devices } from "playwright/test";

/**
 * Pre-flight E2E against the local Vite preview (`npm run dev` on :8080).
 * Does not start a webServer — keep the app running before `npx playwright test`.
 *
 * Connection drops are NOT from Playwright workers (kept at 1). They came from
 * Better Auth + app each opening a separate `pg` Pool against the same hosted
 * pooler. App code now shares `getHostedPgPool()` (max 2 in local). The suite
 * also stubs `/api/auth/**` so login does not storm the pooler.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      // Prefer the machine's Chrome when Playwright's bundled browser isn't installed
      // (cdn.playwright.dev can fail on flaky networks). Override with PW_CHANNEL=.
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL?.trim() || "chrome",
      },
    },
  ],
});

