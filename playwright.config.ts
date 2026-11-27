import { defineConfig, devices } from "playwright/test";

/**
 * E2E against the already-running Next app.
 * Does not start a webServer — leave `npm run dev` alone.
 *
 * Default browser is Playwright's bundled Chromium (fast-fail, no Chrome hang).
 * Opt into a system browser with PW_CHANNEL=chrome|msedge.
 */
const channel = process.env.PW_CHANNEL?.trim() || undefined;

const launchOptions = {
  timeout: 20_000,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--no-first-run",
    "--no-default-browser-check",
  ],
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: true,
    launchOptions,
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        ...(channel ? { channel } : {}),
        launchOptions,
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        ...(channel ? { channel } : {}),
        launchOptions,
      },
    },
  ],
});
