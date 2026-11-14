import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  parseVapiCompletion,
  vapiSignatureMatches,
} from "./vapi-webhook.ts";

const payload = {
  message: {
    type: "end-of-call-report",
    call: { id: "call_abc123", customer: { number: "5415550100", name: "" } },
    artifact: {
      transcript: "User: Hi my name is Jordan Hale. I need a diagnostic.\nAssistant: I can take that.",
      messages: [
        { role: "user", message: "Hi my name is Jordan Hale. I need a diagnostic." },
        { role: "assistant", message: "I can take that." },
      ],
    },
    analysis: {
      structuredData: {
        name: "Jordan Hale",
        service: "Diagnostic",
        phone: "5415550100",
      },
    },
  },
};

test("end-of-call reports extract name, phone, service, and transcript", () => {
  const row = parseVapiCompletion(payload);
  assert.equal(row?.callId, "call_abc123");
  assert.equal(row?.callerName, "Jordan Hale");
  assert.equal(row?.callerPhone, "+15415550100");
  assert.equal(row?.requestedService, "Diagnostic");
  assert.match(row?.transcript ?? "", /diagnostic/i);
});

test("status pings are ignored", () => {
  assert.equal(parseVapiCompletion({ message: { type: "status-update" } }), null);
  assert.equal(parseVapiCompletion({}), null);
});

test("webhook signatures accept the shared secret or an HMAC of the body", () => {
  const body = JSON.stringify(payload);
  const secret = "vapi-test-secret";
  assert.equal(vapiSignatureMatches(body, secret, secret), true);
  assert.equal(vapiSignatureMatches(body, "nope", secret), false);
  const hmac = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(vapiSignatureMatches(body, hmac, secret), true);
  assert.equal(vapiSignatureMatches(body, `sha256=${hmac}`, secret), true);
});
