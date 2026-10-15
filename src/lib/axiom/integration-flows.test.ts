import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyTrade } from "./directory.ts";
import { FUNNEL_IP_LIMIT, funnelBucketOpen, nurtureReleasePlan } from "./funnel-guard.ts";
import { connectStanding, dueNowCents, type MerchantPrice } from "./merchant-pricing.ts";
import {
  outreachMayCallProviders,
  parseOutreachMode,
  parseTrickleSeconds,
  planTrickleChunks,
  trickleMayRelease,
} from "./outreach-queue.ts";
import { modeAfterCheckout, territoryPlan, territorySessionSettled } from "./pricing.ts";
import { texasSweepSlice } from "./registry-sweep.ts";

const deposit: MerchantPrice = {
  id: "price_1",
  shopSlug: "ridge",
  serviceName: "Service call",
  pricingType: "deposit",
  priceAmount: 40,
  activeDealsBanner: "",
  collectionMode: "online",
  updatedAt: "2026-10-14T00:00:00.000Z",
};

test("connect standing and card quotes fall back when a merchant price is absent", () => {
  assert.equal(connectStanding({ accountId: null, chargesEnabled: false }), "none");
  assert.equal(connectStanding({ accountId: "acct_1", chargesEnabled: false }), "pending");
  assert.equal(connectStanding({ accountId: "acct_1", chargesEnabled: true }), "active");
  assert.equal(dueNowCents(deposit, 12900), 4000);
  assert.equal(dueNowCents({ ...deposit, collectionMode: "in_person" }, 12900), 0);
  assert.equal(dueNowCents(null, 12900), 12900);

  const payments = readFileSync(new URL("./payments.server.ts", import.meta.url), "utf8");
  const server = readFileSync(new URL("./server.ts", import.meta.url), "utf8");
  const pricing = readFileSync(new URL("./merchant-pricing.server.ts", import.meta.url), "utf8");
  assert.match(payments, /stripe_connect_status/);
  assert.match(payments, /set stripe_account_id = \$\{accountId\}, updated_at = now\(\)/);
  assert.match(payments, /set stripe_charges_enabled = \$\{chargesEnabled\}, updated_at = now\(\)/);
  assert.match(server, /from merchant_pricing_settings/);
  assert.match(server, /merchant_pricing_settings\|collection_mode\|does not exist/);
  assert.match(pricing, /merchant_pricing_settings\|collection_mode\|does not exist/);
});

test("niche keywords and area codes select filings in memory and do not send them", () => {
  assert.equal(classifyTrade("Plumbing").tradeType, "contractor");
  assert.equal(classifyTrade("Private hunting guide").tradeType, "hunting");
  assert.equal(classifyTrade("AI prompt engineering and creation").tradeType, "prompt");

  const firstCounty = texasSweepSlice(0, 46);
  const nextCounty = texasSweepSlice(2000, 46);
  const hvac = firstCounty.find((row) => row.trade === "HVAC");
  const hunting = firstCounty.find((row) => row.trade === "Private hunting guide");
  const nextHvac = nextCounty.find((row) => row.trade === "HVAC");
  assert.ok(hvac?.phone && hunting?.phone && nextHvac?.phone);
  assert.equal(classifyTrade(hvac.trade ?? "").tradeType, "contractor");
  assert.equal(classifyTrade(hunting.trade ?? "").tradeType, "hunting");
  assert.match(hvac.phone, /^\d{3}-555-/);
  assert.equal(hunting.phone.slice(0, 3), hvac.phone.slice(0, 3));
  assert.notEqual(nextHvac.phone.slice(0, 3), hvac.phone.slice(0, 3));
  assert.equal(hvac.email?.endsWith("@sweep.example"), true);
  assert.equal(outreachMayCallProviders(parseOutreachMode("simulation")), false);
});

test("trickle spacing and plan tiers hold outreach unless the plan and mode allow it", () => {
  assert.equal(parseTrickleSeconds("1"), 30);
  assert.equal(parseTrickleSeconds("120"), 60);
  const start = new Date("2026-10-14T15:00:00.000Z");
  const chunks = planTrickleChunks(["a", "b", "c", "d"], {
    chunkSize: 2,
    intervalSeconds: 45,
    start,
  });
  assert.equal(chunks.length, 2);
  assert.equal(chunks[1]?.scheduledAt, "2026-10-14T15:00:45.000Z");
  assert.equal(trickleMayRelease(chunks[0]?.scheduledAt ?? null, new Date("2026-10-14T15:00:20.000Z"), 45), false);

  const trial = territoryPlan("trial");
  const growth = territoryPlan("growth");
  const lifetime = territoryPlan("lifetime");
  assert.ok(trial && growth && lifetime);
  assert.equal(territorySessionSettled(trial, "no_payment_required"), true);
  assert.equal(territorySessionSettled(growth, "unpaid"), false);
  assert.equal(territorySessionSettled(lifetime, "paid"), true);
  assert.equal(modeAfterCheckout(), "live");
  assert.equal(nurtureReleasePlan("simulation", true), "log");
  assert.equal(nurtureReleasePlan("live", false), "hold");
  assert.equal(nurtureReleasePlan("live", true), "send");
  assert.equal(funnelBucketOpen(FUNNEL_IP_LIMIT - 1, FUNNEL_IP_LIMIT), true);
  assert.equal(funnelBucketOpen(FUNNEL_IP_LIMIT, FUNNEL_IP_LIMIT), false);
});

test("database queries retry three times and both webhook routes return JSON", async () => {
  const db = readFileSync(new URL("../db.ts", import.meta.url), "utf8");
  assert.match(db, /for \(let attempt = 0; attempt < 3; attempt\+\+\)/);
  assert.match(db, /const res = await pool\.query\(text, params\)/);
  assert.match(db, /code === "57014"/);
  assert.match(db, /await withDbRetry\(\(\) => pool\.connect\(\)\)/);

  for (const path of ["/api/webhooks/stripe", "/api/stripe/webhook"]) {
    const res = await fetch(`http://127.0.0.1:8080${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const text = await res.text();
    assert.equal(res.headers.get("content-type")?.includes("application/json"), true, path);
    assert.doesNotThrow(() => JSON.parse(text), path);
    const body = JSON.parse(text) as { error?: string };
    assert.equal(typeof body.error, "string", path);
    assert.equal(res.status === 400 || res.status === 503, true, `${path} ${res.status}`);
  }
});
