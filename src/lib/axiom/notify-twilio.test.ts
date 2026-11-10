import assert from "node:assert/strict";
import test from "node:test";
import { twilioSmsFailureDetail } from "./notify-twilio.ts";

test("twilioSmsFailureDetail maps invalid numbers, funds, and auth", () => {
  assert.equal(twilioSmsFailureDetail(400, { code: 21211 }), "Invalid destination phone number");
  assert.equal(twilioSmsFailureDetail(400, { code: 21614 }), "Invalid destination phone number");
  assert.match(twilioSmsFailureDetail(400, { code: 21608, message: "Account lacks funds" }), /insufficient funds/i);
  assert.match(twilioSmsFailureDetail(401, { code: 20003 }), /credentials/i);
  assert.match(twilioSmsFailureDetail(500, { code: 99999 }), /rejected/i);
});
