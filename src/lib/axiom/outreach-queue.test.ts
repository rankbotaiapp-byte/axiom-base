import assert from "node:assert/strict";
import test from "node:test";
import {
  outreachMayCallProviders,
  parseChunkSize,
  parseOutreachMode,
  parseTrickleSeconds,
  planTrickleChunks,
  trickleMayRelease,
} from "./outreach-queue.ts";

test("outreach mode defaults to simulation unless the value is live", () => {
  assert.equal(parseOutreachMode(undefined), "simulation");
  assert.equal(parseOutreachMode(""), "simulation");
  assert.equal(parseOutreachMode("simulation"), "simulation");
  assert.equal(parseOutreachMode("SIM"), "simulation");
  assert.equal(parseOutreachMode(" live "), "live");
  assert.equal(outreachMayCallProviders("simulation"), false);
  assert.equal(outreachMayCallProviders("live"), true);
});

test("trickle spacing stays inside 30 to 60 seconds and chunks do not dump together", () => {
  assert.equal(parseTrickleSeconds(undefined), 45);
  assert.equal(parseTrickleSeconds("10"), 30);
  assert.equal(parseTrickleSeconds("90"), 60);
  assert.equal(parseTrickleSeconds("45"), 45);
  assert.equal(parseChunkSize(undefined), 5);
  assert.equal(parseChunkSize("0"), 1);
  assert.equal(parseChunkSize("100"), 20);

  const start = new Date("2026-10-05T12:00:00.000Z");
  const chunks = planTrickleChunks(["a", "b", "c", "d", "e", "f", "g"], {
    chunkSize: 3,
    intervalSeconds: 45,
    start,
  });
  assert.equal(chunks.length, 3);
  assert.deepEqual(chunks[0]?.items, ["a", "b", "c"]);
  assert.deepEqual(chunks[2]?.items, ["g"]);
  assert.equal(chunks[0]?.scheduledAt, "2026-10-05T12:00:00.000Z");
  assert.equal(chunks[1]?.scheduledAt, "2026-10-05T12:00:45.000Z");
  assert.equal(chunks[2]?.scheduledAt, "2026-10-05T12:01:30.000Z");
  assert.equal(planTrickleChunks([], { chunkSize: 5, intervalSeconds: 45, start }).length, 0);

  const now = new Date("2026-10-05T12:00:44.000Z");
  assert.equal(trickleMayRelease("2026-10-05T12:00:00.000Z", now, 45), false);
  assert.equal(trickleMayRelease("2026-10-05T12:00:00.000Z", new Date("2026-10-05T12:00:45.000Z"), 45), true);
  assert.equal(trickleMayRelease(null, now, 45), true);
});
