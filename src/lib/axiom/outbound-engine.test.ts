import assert from "node:assert/strict";
import test from "node:test";
import { MASTER_FUNNELS, renderOutreachMessage } from "./funnel.ts";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  clampDailyCap,
  clickThroughRate,
  defaultEngineState,
  deliveryRate,
  engineTickLine,
  parseEngineStrategy,
  regionForCounty,
  remainingCap,
  throttleCount,
} from "./outbound-engine.ts";
import { outreachMayCallProviders, parseOutreachMode } from "./outreach-queue.ts";

test("master funnels keep three ranked angles", () => {
  assert.equal(MASTER_FUNNELS.length, 3);
  assert.deepEqual(
    MASTER_FUNNELS.map((item) => item.letter),
    ["A", "B", "C"],
  );
  assert.equal(MASTER_FUNNELS[0]?.id, "visual-hook");
  assert.equal(MASTER_FUNNELS[1]?.id, "speed-to-lead");
  assert.equal(MASTER_FUNNELS[2]?.id, "staff-portfolio");
});

test("double-brace funnel tokens fill business, city, and preview", () => {
  const message = renderOutreachMessage("{{business_name}} in {{city}}\n{{preview_link}}", {
    business: "Rogue Iron",
    url: "https://axiom.example/demo/auto?preview=true",
    city: "Medford",
  });
  assert.equal(message, "Rogue Iron in Medford\nhttps://axiom.example/demo/auto?preview=true");
});

test("daily caps clamp and remaining room never goes negative", () => {
  assert.equal(clampDailyCap(-4, DEFAULT_SMS_DAILY_CAP), 0);
  assert.equal(clampDailyCap(900, DEFAULT_EMAIL_DAILY_CAP), 500);
  assert.equal(clampDailyCap("nope", 40), 40);
  assert.equal(remainingCap(12, 40), 28);
  assert.equal(remainingCap(80, 40), 0);
  assert.equal(throttleCount(5, 2), 2);
  assert.equal(throttleCount(5, 0), 0);
});

test("delivery and CTR stay in range", () => {
  assert.equal(deliveryRate(8, 2), 0.8);
  assert.equal(deliveryRate(0, 0), 0);
  assert.equal(clickThroughRate(5, 10), 0.5);
  assert.equal(clickThroughRate(20, 10), 1);
  assert.equal(clickThroughRate(3, 0), 0);
});

test("simulation logs never call providers; live is an exact token", () => {
  assert.equal(parseOutreachMode(undefined), "simulation");
  assert.equal(parseOutreachMode("true"), "simulation");
  assert.equal(parseOutreachMode("prod"), "simulation");
  assert.equal(parseOutreachMode("live"), "live");
  assert.equal(outreachMayCallProviders(parseOutreachMode("simulation")), false);
  assert.equal(outreachMayCallProviders(parseOutreachMode("live")), true);
  assert.equal(engineTickLine({ live: false, channel: "sms", business: "Rogue Iron" }).status, "logged");
  assert.match(engineTickLine({ live: false, channel: "sms", business: "Rogue Iron" }).summary, /simulation/);
  assert.equal(engineTickLine({ live: true, channel: "email", business: "Rogue Iron" }).status, "queued");
  assert.equal(throttleCount(5, remainingCap(38, 40)), 2);
});

test("engine starts paused on the visual hook", () => {
  const state = defaultEngineState();
  assert.equal(state.paused, true);
  assert.equal(state.strategyId, "visual-hook");
  assert.equal(parseEngineStrategy("staff-portfolio"), "staff-portfolio");
  assert.equal(parseEngineStrategy("unknown"), "visual-hook");
});

test("counties map onto Oregon Texas Florida", () => {
  assert.equal(regionForCounty("Jackson County"), "Oregon");
  assert.equal(regionForCounty("Harris County"), "Texas");
  assert.equal(regionForCounty("Miami-Dade"), "Florida");
  assert.equal(regionForCounty("King County"), "Other");
});
