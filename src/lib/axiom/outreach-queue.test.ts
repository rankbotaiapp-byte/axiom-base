import assert from "node:assert/strict";
import test from "node:test";
import {
  insideSendWindow,
  nextSendInstant,
  outreachMayCallProviders,
  parseChunkSize,
  parseOutreachMode,
  parseTrickleSeconds,
  planSmartChunks,
  planTrickleChunks,
  planWindowedChunks,
  timingProfileFor,
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

test("weekday window holds nights and weekends until Monday morning Pacific", () => {
  const mondayMorning = new Date("2026-10-05T15:00:00.000Z");
  const mondayNoon = new Date("2026-10-05T19:00:00.000Z");
  const mondayClose = new Date("2026-10-06T02:00:00.000Z");
  const fridayAfternoon = new Date("2026-10-09T22:00:00.000Z");
  const winterFriday = new Date("2026-01-09T20:00:00.000Z");

  assert.equal(insideSendWindow(mondayMorning, "immediate", "general"), true);
  assert.equal(insideSendWindow(mondayNoon, "immediate", "general"), true);
  assert.equal(insideSendWindow(mondayClose, "immediate", "general"), false);
  assert.equal(insideSendWindow(fridayAfternoon, "immediate", "general"), false);
  assert.equal(nextSendInstant(mondayNoon, "immediate", "general").toISOString(), mondayNoon.toISOString());
  assert.equal(nextSendInstant(fridayAfternoon, "immediate", "general").toISOString(), "2026-10-12T15:00:00.000Z");
  assert.equal(nextSendInstant(mondayClose, "immediate", "general").toISOString(), "2026-10-06T15:00:00.000Z");
  assert.equal(nextSendInstant(winterFriday, "immediate", "general").toISOString(), "2026-01-12T16:00:00.000Z");

  const held = planWindowedChunks(["a", "b"], {
    chunkSize: 1,
    intervalSeconds: 45,
    start: fridayAfternoon,
    timing: "immediate",
    profile: "general",
  });
  assert.equal(held[0]?.scheduledAt, "2026-10-12T15:00:00.000Z");
  assert.equal(held[1]?.scheduledAt, "2026-10-12T15:00:45.000Z");

  const late = new Date("2026-10-09T01:59:00.000Z");
  const rolled = planWindowedChunks(["a", "b", "c"], {
    chunkSize: 1,
    intervalSeconds: 45,
    start: late,
    timing: "immediate",
    profile: "general",
  });
  assert.equal(rolled[0]?.scheduledAt, late.toISOString());
  assert.equal(rolled[1]?.scheduledAt, "2026-10-09T01:59:45.000Z");
  assert.equal(rolled[2]?.scheduledAt, "2026-10-12T15:00:00.000Z");
});

test("smart timing uses niche windows and keeps a mixed list on separate clocks", () => {
  assert.equal(timingProfileFor("hvac"), "trades");
  assert.equal(timingProfileFor("plumbing"), "trades");
  assert.equal(timingProfileFor("contractor"), "trades");
  assert.equal(timingProfileFor("air-conditioning"), "trades");
  assert.equal(timingProfileFor("salon"), "salon");
  assert.equal(timingProfileFor("beauty"), "salon");
  assert.equal(timingProfileFor("trade"), "general");
  assert.equal(timingProfileFor("photo"), "general");

  const mondayNine = new Date("2026-10-05T16:00:00.000Z");
  assert.equal(insideSendWindow(mondayNine, "smart", "trades"), false);
  assert.equal(insideSendWindow(new Date("2026-10-05T14:30:00.000Z"), "smart", "trades"), true);
  assert.equal(nextSendInstant(mondayNine, "smart", "trades").toISOString(), "2026-10-05T23:30:00.000Z");
  assert.equal(insideSendWindow(mondayNine, "smart", "salon"), true);
  assert.equal(insideSendWindow(new Date("2026-10-06T18:00:00.000Z"), "smart", "salon"), false);
  assert.equal(nextSendInstant(new Date("2026-10-07T17:00:00.000Z"), "smart", "salon").toISOString(), "2026-10-12T15:00:00.000Z");
  assert.equal(nextSendInstant(mondayNine, "smart", "general").toISOString(), "2026-10-05T17:00:00.000Z");
  assert.equal(insideSendWindow(new Date("2026-10-05T21:00:00.000Z"), "smart", "general"), false);

  const morning = new Date("2026-10-05T15:29:00.000Z");
  const trades = planWindowedChunks(["a", "b", "c"], {
    chunkSize: 1,
    intervalSeconds: 45,
    start: morning,
    timing: "smart",
    profile: "trades",
  });
  assert.equal(trades[2]?.scheduledAt, "2026-10-05T23:30:00.000Z");

  const mixed = planSmartChunks(
    [
      { tradeType: "hvac", id: "h" },
      { tradeType: "salon", id: "s" },
      { tradeType: "trade", id: "g" },
    ],
    { chunkSize: 5, intervalSeconds: 45, start: mondayNine, timing: "smart" },
  );
  assert.deepEqual(
    mixed.map((chunk) => chunk.profile),
    ["salon", "general", "trades"],
  );
  assert.equal(mixed[0]?.scheduledAt, mondayNine.toISOString());
  assert.equal(mixed[1]?.scheduledAt, "2026-10-05T17:00:00.000Z");
  assert.equal(mixed[2]?.scheduledAt, "2026-10-05T23:30:00.000Z");

  const immediate = planSmartChunks(
    [
      { tradeType: "hvac", id: "h" },
      { tradeType: "salon", id: "s" },
    ],
    { chunkSize: 5, intervalSeconds: 45, start: mondayNine, timing: "immediate" },
  );
  assert.equal(immediate.length, 1);
  assert.equal(immediate[0]?.scheduledAt, mondayNine.toISOString());
});
