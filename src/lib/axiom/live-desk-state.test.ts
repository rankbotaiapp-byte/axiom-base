import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decorateLiveDeskPayload, liveDeskState } from "./live-desk-state.ts";

test("live desk state is only paused, caps, and sentToday from live rows", () => {
  const state = liveDeskState({
    paused: true,
    smsDailyCap: 40,
    emailDailyCap: 80,
    smsSentToday: 1,
    emailSentToday: 3,
  });
  assert.deepEqual(state, { paused: true, caps: 120, sentToday: 4 });
  assert.equal(liveDeskState({}).caps, 0);
  assert.equal(liveDeskState({ smsDailyCap: 40, emailDailyCap: 80 }).caps, 120);
});

test("decorateLiveDeskPayload parks engine fields off the KPI state object", () => {
  const payload = decorateLiveDeskPayload({
    state: {
      paused: false,
      smsDailyCap: 40,
      emailDailyCap: 80,
      smsSentToday: 2,
      emailSentToday: 5,
      smsTemplate: "hello",
    },
    metrics: { queued: 12 },
  });
  assert.deepEqual(payload.state, { paused: false, caps: 120, sentToday: 7 });
  const engine = payload.engine as { smsTemplate?: string; smsDailyCap?: number };
  assert.equal(engine.smsTemplate, "hello");
  assert.equal(engine.smsDailyCap, 40);
});

test("outbound-engine GET uses the live desk decorator and never mocks caps", () => {
  const route = readFileSync(new URL("../../app/api/master/outbound-engine/route.ts", import.meta.url), "utf8");
  assert.match(route, /decorateLiveDeskPayload/);
  assert.match(route, /shopSlug/);
  assert.doesNotMatch(route, /caps:\s*500/);
  assert.doesNotMatch(route, /sentToday:\s*120/);
  assert.doesNotMatch(route, /state: ['"]ready['"]/);
});
