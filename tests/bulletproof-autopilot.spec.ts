/**
 * Launch-readiness E2E — desktop + mobile Chromium (bundled, not system Chrome).
 */
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "playwright/test";

function loadWebhookSecret(): string {
  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) return process.env.STRIPE_WEBHOOK_SECRET.trim();
  const root = process.cwd();
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const line = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .find((row) => row.startsWith("STRIPE_WEBHOOK_SECRET="));
    if (!line) continue;
    return line.slice("STRIPE_WEBHOOK_SECRET=".length).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const SHOP = "cascade-electric";

async function visitStorefront(page: Page) {
  const res = await page.goto(`/t/${SHOP}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator(".cmf-frame").first()).toBeVisible();
  await expect(page.locator("body")).not.toHaveText(/replicate\.delivery/i);
  const slider = page.getByTestId("proof-compare-slider").first();
  await expect(slider).toBeVisible();
  await slider.evaluate((el) => {
    const input = el as HTMLInputElement;
    input.value = "80";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(slider).toHaveValue("80");
}

test("storefront cinematic frame + proof slider, welcome, and admin", async ({ page }) => {
  await visitStorefront(page);

  const welcome = await page.goto(`/t/${SHOP}/welcome`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(welcome?.ok()).toBeTruthy();
  await expect(page.locator("body")).toContainText(/Axiom|welcome|number|storefront/i);

  const admin = await page.goto(`/${SHOP}/admin`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(admin?.status() ?? 0).toBeLessThan(500);
});

test("vCard endpoint is valid vCard or an explicit unassigned 404", async ({ request }) => {
  const res = await request.get(`/api/storefront/vcard?slug=${SHOP}`);
  expect([200, 404]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.text();
    expect(body).toMatch(/BEGIN:VCARD/);
    expect(body).toMatch(/TEL;TYPE=WORK,VOICE:/);
    expect(body).toMatch(/END:VCARD/);
  } else {
    const json = (await res.json()) as { error?: string };
    expect(json.error ?? "").toMatch(/not assigned/i);
  }
});

test("unsigned Stripe webhook is rejected; signed invoice.paid is replay-safe", async ({ request }) => {
  const unsigned = await request.post("/api/webhooks/stripe", {
    data: {
      id: "evt_e2e_unsigned",
      type: "checkout.session.completed",
      data: { object: { id: "cs_e2e", metadata: { kind: "storefront_unlock" } } },
    },
  });
  expect(unsigned.status()).toBe(400);

  const secret = loadWebhookSecret();
  if (!secret) return;
  const payload = JSON.stringify({
    id: `evt_e2e_paid_${Date.now()}`,
    type: "invoice.paid",
    data: { object: { id: "in_e2e", metadata: {} } },
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const headers = { "content-type": "application/json", "stripe-signature": `t=${timestamp},v1=${v1}` };
  const paid = await request.post("/api/webhooks/stripe", { headers, data: payload });
  expect(paid.status()).toBe(200);
  expect(((await paid.json()) as { received?: boolean }).received).toBe(true);

  const replay = await request.post("/api/webhooks/stripe", { headers, data: payload });
  expect(replay.status()).toBe(200);
  expect(((await replay.json()) as { duplicate?: boolean }).duplicate).toBe(true);
});

test("non-owner MMS cannot mutate Proof-of-Work media", async ({ request }) => {
  const res = await request.post("/api/twilio/inbound", {
    form: {
      From: "+15415550999",
      To: "+15415550100",
      Body: "job photo",
      MessageSid: "SM_e2e_non_owner",
      NumMedia: "1",
      MediaUrl0: "https://example.invalid/job.jpg",
      MediaContentType0: "image/jpeg",
    },
  });
  expect(res.status()).toBeLessThan(500);
  expect((await res.text()).toLowerCase()).not.toContain("proof-of-work photo");
});
