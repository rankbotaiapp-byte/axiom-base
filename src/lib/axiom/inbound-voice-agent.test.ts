import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConnectTwiml,
  last10Digits,
  mediaWebsocketUrl,
  normalizeBookInput,
  phonesMatch,
  pricingLine,
  receptionistPrompt,
} from "../../../supabase/functions/inbound-voice-agent/lib.ts";

test("To-number matching uses last 10 digits", () => {
  assert.equal(last10Digits("+15418908126"), "5418908126");
  assert.equal(phonesMatch("(541) 890-8126", "+1 541 890 8126"), true);
  assert.equal(phonesMatch("+15418908126", "+15555550100"), false);
});

test("TwiML Connect opens a bidirectional Stream", () => {
  const xml = buildConnectTwiml({
    greeting: "Connecting you to Apex Plumbing.",
    stream: {
      provider: "elevenlabs",
      url: "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=abc",
      parameters: { tenant_id: "t1", prompt: "You are Apex." },
    },
  });
  assert.match(xml, /<Connect>/);
  assert.match(xml, /<Stream url="wss:\/\/api\.elevenlabs\.io/);
  assert.match(xml, /<Parameter name="tenant_id" value="t1"/);
  assert.match(xml, /<Say voice="Polly.Joanna">Connecting you to Apex Plumbing\.<\/Say>/);
});

test("receptionist prompt injects name, niche, and pricing", () => {
  const prompt = receptionistPrompt({
    tenantId: "t1",
    shopId: "s1",
    slug: "apex",
    businessName: "Apex Plumbing",
    niche: "plumbing",
    phone: "+15551212",
    pricing: pricingLine([{ name: "Drain clear", price_cents: 18900 }]),
  });
  assert.match(prompt, /Apex Plumbing/);
  assert.match(prompt, /plumbing/);
  assert.match(prompt, /Drain clear \$189/);
  assert.match(prompt, /book_appointment/);
});

test("book_appointment payload normalizes E.164 and names", () => {
  const row = normalizeBookInput({
    tenantId: "t1",
    customerName: "Sam",
    customerPhone: "5418908126",
    serviceName: "Leak",
    startsAt: "2026-11-12T17:00:00.000Z",
  });
  assert.equal(row.customerPhone, "+15418908126");
  assert.equal(row.serviceName, "Leak");
});

test("media websocket URL flips http(s) to ws(s)", () => {
  assert.equal(
    mediaWebsocketUrl("https://abc.supabase.co/functions/v1/inbound-voice-agent"),
    "wss://abc.supabase.co/functions/v1/inbound-voice-agent/media",
  );
});
