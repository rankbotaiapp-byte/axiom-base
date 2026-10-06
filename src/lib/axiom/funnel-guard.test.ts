import assert from "node:assert/strict";
import test from "node:test";
import {
  funnelBucketOpen,
  FUNNEL_IP_LIMIT,
  hashStopToken,
  isDueNurtureStep,
  newStopToken,
  nurtureReleasePlan,
  splitOutreachEmail,
  tokenHashMatches,
} from "./funnel-guard.ts";

test("a stop token matches only its own hash", async () => {
  const token = newStopToken();
  const hash = await hashStopToken(token);
  assert.equal(tokenHashMatches(hash, hash), true);
  assert.equal(tokenHashMatches(await hashStopToken("other-token"), hash), false);
  assert.equal(tokenHashMatches(hash, ""), false);
  assert.equal(isDueNurtureStep(0), false);
  assert.equal(isDueNurtureStep(3), true);
  assert.equal(isDueNurtureStep(6), true);
});

test("nurture sends only in live mode with credentials, and visits are capped", () => {
  assert.equal(nurtureReleasePlan("simulation", true), "log");
  assert.equal(nurtureReleasePlan("simulation", false), "log");
  assert.equal(nurtureReleasePlan("live", false), "hold");
  assert.equal(nurtureReleasePlan("live", true), "send");
  assert.equal(funnelBucketOpen(FUNNEL_IP_LIMIT - 1, FUNNEL_IP_LIMIT), true);
  assert.equal(funnelBucketOpen(FUNNEL_IP_LIMIT, FUNNEL_IP_LIMIT), false);
  assert.deepEqual(splitOutreachEmail("Subject line\n\nHello there"), {
    subject: "Subject line",
    text: "Hello there",
  });
});
