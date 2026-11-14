import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  escapeTwiml,
  extractJsonObject,
  heuristicSmsDecision,
  matchServiceName,
  parseGrokSmsJson,
  parseIsoSlot,
  roundUpHalfHourIso,
} from "./sms-inbound.ts";

test("Grok JSON extracts a future slot and booking intent", () => {
  const now = Date.parse("2026-11-11T18:00:00.000Z");
  const starts = "2026-11-12T17:00:00.000Z";
  const parsed = parseGrokSmsJson(
    `\`\`\`json\n{"intent":"booking","wantsSlot":true,"serviceName":"Drain clear","startsAt":"${starts}","customerName":"Sam","projectSummary":"kitchen backup","reply":"Locked in."}\n\`\`\``,
    heuristicSmsDecision("book me"),
    now,
  );
  assert.equal(parsed.intent, "booking");
  assert.equal(parsed.wantsSlot, true);
  assert.equal(parsed.serviceName, "Drain clear");
  assert.equal(parsed.startsAt, starts);
  assert.equal(parsed.reply, "Locked in.");
});

test("past slots and junk JSON fall back", () => {
  const now = Date.parse("2026-11-11T18:00:00.000Z");
  assert.equal(parseIsoSlot("2026-11-01T00:00:00.000Z", now), null);
  const fallback = heuristicSmsDecision("hello");
  const parsed = parseGrokSmsJson("not json", fallback, now);
  assert.equal(parsed.reply, fallback.reply);
  assert.ok(extractJsonObject('prefix {"a":1} trailing').includes('"a":1'));
});

test("heuristic treats ASAP copy as a booking ask", () => {
  const decision = heuristicSmsDecision("burst pipe ASAP", Date.parse("2026-11-11T18:00:00.000Z"));
  assert.equal(decision.intent, "booking");
  assert.equal(decision.wantsSlot, true);
  assert.ok(decision.startsAt);
  assert.ok(Date.parse(decision.startsAt) > Date.parse("2026-11-11T18:00:00.000Z"));
});

test("round-up slot and service match", () => {
  const iso = roundUpHalfHourIso(new Date("2026-11-11T18:10:00.000Z"));
  assert.match(iso, /T18:30:00|\d{2}:30:00|T19:00:00/);
  const hit = matchServiceName(
    [
      { name: "Burst & leaking pipes" },
      { name: "Drain & sewer clears" },
    ],
    "drain",
  );
  assert.equal(hit?.name, "Drain & sewer clears");
});

test("TwiML escapes markup", () => {
  assert.equal(escapeTwiml(`Leak <burst> & "go"`), "Leak &lt;burst&gt; &amp; &quot;go&quot;");
});

test("inbound handler calls Grok, inserts appointments, and notifies the owner", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const inbound = readFileSync(join(root, "lib/axiom/outreach-inbound.server.ts"), "utf8");
  const route = readFileSync(join(root, "routes/api/outreach.inbound.ts"), "utf8");
  assert.match(route, /handleOutreachInbound/);
  assert.match(inbound, /https:\/\/api\.x\.ai\/v1\/chat\/completions/);
  assert.match(inbound, /grok-4\.5/);
  assert.match(inbound, /insert into appointments/);
  assert.match(inbound, /notifyBookingParties/);
  assert.match(inbound, /notifyShop/);
  assert.match(inbound, /sms_inbound_turns/);
  assert.doesNotMatch(inbound, /<Response>\$\{confirm\}<\/Response>/);
});
