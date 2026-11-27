import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  paramsFromUrlSearch,
  twilioSignatureDigest,
  verifyTwilioSignature,
} from "./twilio-signature.ts";

const TOKEN = "test_twilio_auth_token";
const WEBHOOK_URL = "https://www.rankbotapp.com/api/webhooks/twilio/sms";

test("Twilio HMAC accepts the matching signature and rejects a forged one", () => {
  const params = { Body: "BOOK", From: "+15415550199", To: "+15415550000", MessageSid: "SM1" };
  const signature = twilioSignatureDigest(TOKEN, WEBHOOK_URL, params);
  assert.equal(verifyTwilioSignature({ authToken: TOKEN, signature, url: WEBHOOK_URL, params }), true);
  assert.equal(
    verifyTwilioSignature({ authToken: TOKEN, signature: "AAAA", url: WEBHOOK_URL, params }),
    false,
  );
  assert.equal(verifyTwilioSignature({ authToken: "", signature, url: WEBHOOK_URL, params }), false);
});

test("webhook route fail-closes unsigned requests with JSON 403 and never static-imports booking", () => {
  const src = readFileSync(new URL("../../app/api/webhooks/twilio/sms/route.ts", import.meta.url), "utf8");
  assert.match(src, /verifyTwilioSignature/);
  assert.match(src, /TWILIO_SIGNATURE/);
  assert.match(src, /jsonError\("TWILIO_SIGNATURE", "Forbidden", 403\)/);
  assert.match(src, /WEBHOOK_ERROR/);
  assert.doesNotMatch(src, /from "@\/lib\/axiom\/twilio-booking.server"/);
});

test("paramsFromUrlSearch copies POST fields Twilio signed", () => {
  const form = new URLSearchParams({ Body: "STOP", From: "+1555" });
  assert.deepEqual(paramsFromUrlSearch(form), { Body: "STOP", From: "+1555" });
});
