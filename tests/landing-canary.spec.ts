import { expect, test } from "playwright/test";

const MILLER =
  "/?b=Miller%20Plumbing&phone=541-555-0192&city=Medford&trade=plumbing";

test.describe("plumbing canary landing @ 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("personalized H1, one plumbing demo, HELP, one-tap $1, no overflow", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.route("**/api/stripe/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, url: "https://checkout.stripe.com/c/pay/canary-test" }),
      });
    });
    await page.goto(MILLER, { waitUntil: "domcontentloaded" });
    const landing = page.frameLocator('iframe[title="AXIOM"]');
    await expect(landing.locator("#heroH1")).toContainText("Miller Plumbing", { timeout: 20_000 });
    await expect(landing.locator("#heroH1")).toContainText("Medford");
    await expect(landing.locator("#heroClaim")).toContainText("Claim Miller Plumbing — $1 Unlock");
    await expect(landing.locator("#heroClaim")).toBeVisible();
    await expect(landing.locator("#openPreview")).toHaveCount(0);

    const demoCount = await landing.locator(".ph iframe").evaluateAll((nodes) =>
      nodes.filter((node) => (node as HTMLIFrameElement).src && !(node as HTMLIFrameElement).src.includes("about:")).length,
    );
    expect(demoCount).toBeLessThanOrEqual(2);

    const plumbing = landing.frameLocator(".ph.front iframe");
    await expect(landing.locator("#helpSim #ax-help")).toBeVisible({ timeout: 20_000 });
    await expect(landing.locator("#helpHost #ax-drawer")).toBeVisible();
    await expect(plumbing.locator("#brand")).toContainText("Miller Plumbing");

    await expect(landing.locator(".ph.front iframe")).toHaveAttribute("src", /poster=1/);
    const autoplayCount = await plumbing.locator("video[autoplay]").count();
    expect(autoplayCount).toBe(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow).toBe(false);
    expect(errors.filter((line) => !/favicon|hydration/i.test(line))).toEqual([]);

    await landing.locator("#heroClaim").click();
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15_000 });
  });
});
