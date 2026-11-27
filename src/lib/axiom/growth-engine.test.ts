import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyBanditReward,
  clickToUnlockRate,
  climateRegionForState,
  dropOffPoint,
  emptyFunnelCounts,
  parseFunnelEvent,
  PUBLIC_FUNNEL_EVENTS,
  pickSeasonalNiche,
  revenueForEvent,
  revenuePerLead,
  seasonalTrades,
  thompsonPick,
  treasuryDecision,
  type BanditArm,
} from "./growth-engine.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test("funnel telemetry rates, drop-off, and revenue per lead", () => {
  assert.ok(PUBLIC_FUNNEL_EVENTS.includes("checkout_opened"));
  assert.equal(parseFunnelEvent("dollar_unlocked"), "dollar_unlocked");
  assert.equal(parseFunnelEvent("nope"), null);
  assert.equal(revenueForEvent("dollar_unlocked"), 100);
  assert.equal(revenueForEvent("mrr_active"), 15000);
  const counts = {
    ...emptyFunnelCounts(),
    sent: 100,
    clicked: 20,
    checkout_opened: 8,
    dollar_unlocked: 4,
    mrr_active: 1,
    revenueCents: 400 + 15000,
    leads: 20,
  };
  assert.equal(clickToUnlockRate(counts), 0.2);
  assert.equal(dropOffPoint(counts), "clicked");
  assert.ok(revenuePerLead(counts) > 700);
});

test("winter OR/PA/NY prioritize plumbing and heating; TX/FL/CA stay warm-weather trades", () => {
  assert.equal(climateRegionForState("OR"), "cold");
  assert.equal(climateRegionForState("TX"), "warm");
  const jan = new Date(Date.UTC(2026, 0, 15));
  const jul = new Date(Date.UTC(2026, 6, 15));
  assert.deepEqual(seasonalTrades(jan, "OR").slice(0, 2), ["plumbing", "hvac"]);
  assert.deepEqual(seasonalTrades(jan, "PA").slice(0, 2), ["plumbing", "hvac"]);
  assert.ok(seasonalTrades(jul, "TX").includes("hvac"));
  assert.ok(seasonalTrades(jul, "FL")[0] === "hvac" || seasonalTrades(jul, "CA")[0] === "hvac");
  assert.equal(pickSeasonalNiche(jan, ["OR", "NY", "PA"]), "plumbing");
});

test("Thompson sampling prefers the converting arm and public ads stay pending_approval", () => {
  const weak: BanditArm = { variantId: "missed_call", alpha: 1, beta: 8, impressions: 8, conversions: 0 };
  const strong: BanditArm = { variantId: "trial_autopilot", alpha: 12, beta: 2, impressions: 12, conversions: 11 };
  const picks = Array.from({ length: 24 }, (_, i) => thompsonPick([weak, strong], rng(i + 3)).variantId);
  const wins = picks.filter((id) => id === "trial_autopilot").length;
  assert.ok(wins >= 16);
  const updated = applyBanditReward(weak, false);
  assert.equal(updated.beta, 9);
  const sql = readFileSync(join(root, "../migrations/0116_growth_treasury.sql"), "utf8");
  assert.match(sql, /pending_approval/);
  assert.match(sql, /lead_funnel_events/);
});

test("treasury watchdog pauses when Twilio/AI spend exceeds caps", () => {
  const ok = treasuryDecision({ twilioCents: 100, resendCents: 50, aiCents: 80, inflowCents: 15000 });
  assert.equal(ok.pause, false);
  const hot = treasuryDecision({ twilioCents: 5000, resendCents: 0, aiCents: 0, inflowCents: 100 });
  assert.equal(hot.pause, true);
  assert.match(hot.reason, /Twilio/);
  const total = treasuryDecision({ twilioCents: 2500, resendCents: 900, aiCents: 2800, inflowCents: 100 });
  assert.equal(total.pause, true);
});
