import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  catalogSpeechLine,
  formatPriceSpeech,
  matchServiceFromSpeech,
  quoteCentsFromBook,
  tradeDefaultCatalog,
  type PriceBookItem,
} from "./price-book.ts";
import {
  buildConversationRelayTwiml,
  buildGatherTwiml,
  nextVoiceReply,
  parseSlotChoice,
  shouldFallbackToMissedCallSms,
  voiceSpendExceeded,
  VOICE_TURN_CENTS,
} from "./voice-receptionist.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const leak: PriceBookItem = {
  id: "svc_leak",
  shopId: "shop_1",
  name: "Leak or burst pipe",
  trade: "plumbing",
  description: "Find it, stop it.",
  pricingMode: "range",
  baseCents: 18000,
  minCents: 18000,
  maxCents: 45000,
  depositCents: 7500,
  durationMin: 120,
  sortOrder: 1,
  active: true,
};

test("voice quote grounding stays inside the tenant price book", () => {
  const spoken = formatPriceSpeech(leak);
  assert.match(spoken, /Leak or burst pipe/);
  assert.match(spoken, /\$180/);
  assert.match(spoken, /\$450/);
  assert.match(catalogSpeechLine([leak]), /\$180/);
  const match = matchServiceFromSpeech([leak], "my water line is leaking in the garage");
  assert.equal(match?.id, "svc_leak");
  const quote = quoteCentsFromBook(leak);
  assert.equal(quote.quoteCents, 18000);
  assert.equal(quote.depositCents, 7500);
  const plumbing = tradeDefaultCatalog("plumbing");
  assert.ok(plumbing.some((row) => /heater/i.test(row.name)));
});

test("live slot confirm from speech locks window 1 and requests a deposit SMS", () => {
  const windows = [
    {
      index: 1 as const,
      employeeId: "emp_1",
      startsAt: "2026-11-27T20:00:00.000Z",
      endsAt: "2026-11-27T22:00:00.000Z",
      label: "Today 2:00 PM",
    },
    {
      index: 2 as const,
      employeeId: "emp_1",
      startsAt: "2026-11-27T23:00:00.000Z",
      endsAt: "2026-11-28T01:00:00.000Z",
      label: "Today 4:30 PM",
    },
  ];
  const quoted = nextVoiceReply({
    speech: "burst pipe in the garage",
    shopName: "Miller Plumbing",
    catalog: [leak],
    windows,
    state: { stage: "greet" },
  });
  assert.equal(quoted.action, "continue");
  assert.equal(quoted.state.serviceId, "svc_leak");
  assert.equal(quoted.state.depositCents, 7500);
  const booked = nextVoiceReply({
    speech: "1",
    shopName: "Miller Plumbing",
    catalog: [leak],
    windows,
    state: quoted.state,
  });
  assert.equal(booked.action, "book");
  assert.equal(booked.state.windowIndex, 1);
  assert.equal(booked.state.stage, "booked");
  assert.match(booked.say, /deposit/i);
  assert.equal(parseSlotChoice("the second one"), 2);
});

test("daily spend-cap and early disconnect fall back to missed-call 1/2 SMS", () => {
  assert.equal(voiceSpendExceeded(2490, 2500), true);
  assert.equal(voiceSpendExceeded(100, 2500), false);
  assert.ok(VOICE_TURN_CENTS > 0);
  assert.equal(
    shouldFallbackToMissedCallSms({ booked: true, capped: true, disconnected: true, turns: 1 }),
    false,
  );
  assert.equal(
    shouldFallbackToMissedCallSms({ booked: false, capped: true, disconnected: false, turns: 1 }),
    true,
  );
  assert.equal(
    shouldFallbackToMissedCallSms({ booked: false, capped: false, disconnected: true, turns: 2 }),
    true,
  );
});

test("ConversationRelay TwiML and gather loop are signed-ready", () => {
  const xml = buildConversationRelayTwiml({
    wssUrl: "wss://relay.example/axiom",
    welcome: "Thanks for calling Miller Plumbing.",
    shopId: "shop_1",
    callSid: "CA123",
    actionPath: "/api/webhooks/twilio/voice?step=relay-end",
  });
  assert.match(xml, /<ConversationRelay /);
  assert.match(xml, /wss:\/\/relay\.example\/axiom/);
  assert.match(xml, /shopId/);
  const gather = buildGatherTwiml({
    say: "What's going on today?",
    actionPath: "/api/webhooks/twilio/voice?step=ai",
  });
  assert.match(gather, /input="speech dtmf"/);
  const voice = readFileSync(join(root, "lib/axiom/twilio-booking.server.ts"), "utf8");
  const route = readFileSync(join(root, "app/api/webhooks/twilio/voice/route.ts"), "utf8");
  const handler = readFileSync(join(root, "lib/axiom/voice-receptionist.server.ts"), "utf8");
  const lock = readFileSync(join(root, "lib/axiom/closed-job.server.ts"), "utf8");
  assert.match(route, /verifyTwilioSignature/);
  assert.match(voice, /startVoiceReceptionist/);
  assert.match(handler, /createConnectCheckout/);
  assert.match(handler, /fallbackMissedCallIfNeeded/);
  assert.match(handler, /lockCalendarSlot/);
  assert.match(lock, /is_simulated/);
});
