import assert from "node:assert/strict";
import test from "node:test";
import { companionAllowed, companionMessages, companionSpeechText, parseCompanionAsk } from "./companion-desk.ts";

test("a storefront ask keeps the owner's pricing and clips a long greeting", () => {
  const parsed = parseCompanionAsk({
    profileId: "nyx-vale",
    mode: "storefront",
    kind: "customer",
    message: "Can you come out tonight?",
    desk: { businessName: "North Frame", greeting: "x".repeat(900), pricing: "Diagnostic $89", instructions: "Ask for the gate code." },
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.ask.desk.greeting.length, 400);
  const system = companionMessages(parsed.ask)[0]?.content ?? "";
  assert.match(system, /Diagnostic \$89/);
  assert.match(system, /Nyx Vale/);
  assert.match(system, /Ask for the gate code/);
  assert.equal(companionMessages(parsed.ask).at(-1)?.content, "Can you come out tonight?");
});

test("mindset prompts are fixed tasks and empty pricing cannot be invented", () => {
  const parsed = parseCompanionAsk({ profileId: "idris-cho", mode: "mentor", kind: "stress-reset", desk: {} });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const messages = companionMessages(parsed.ask);
  assert.match(messages[0]?.content ?? "", /Do not invent a price/);
  assert.match(messages.at(-1)?.content ?? "", /stress reset/);
  assert.equal(parseCompanionAsk({ profileId: "missing", mode: "storefront", message: "Hi" }).ok, false);
  assert.equal(parseCompanionAsk({ profileId: "nyx-vale", mode: "mentor", kind: "customer" }).ok, false);
});

test("voice text is clipped and the companion rate limit holds", () => {
  assert.equal(companionSpeechText({ text: "  Hello   there  " }), "Hello there");
  assert.equal(companionSpeechText({ text: "y".repeat(500) }).length, 240);
  const caller = `test-${Date.now()}`;
  for (let i = 0; i < 6; i += 1) assert.equal(companionAllowed(caller, 1_700_000_000_000), true);
  assert.equal(companionAllowed(caller, 1_700_000_000_000), false);
});