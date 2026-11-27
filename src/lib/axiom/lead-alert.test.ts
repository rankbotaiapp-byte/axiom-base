import assert from "node:assert/strict";
import test from "node:test";
import { composeLeadAlertCopy, formatLeadPhone } from "./lead-alert.ts";

test("lead alerts format contact details and omit empty email/name slots", () => {
  assert.equal(formatLeadPhone("+15415550148"), "(541) 555-0148");
  const copy = composeLeadAlertCopy({
    shopName: "Cascade Electric",
    guestPhone: "+15415550148",
    guestMessage: "Panel is tripping",
    holdUntil: "2026-11-26T20:00:00.000Z",
    city: "Medford",
    service: "Outage",
  });
  assert.match(copy.subject, /Cascade Electric/);
  assert.match(copy.subject, /\(541\) 555-0148/);
  assert.match(copy.body, /Phone: \(541\) 555-0148/);
  assert.match(copy.body, /Service: Outage/);
  assert.match(copy.body, /Area: Medford/);
  assert.match(copy.body, /Panel is tripping/);
  assert.doesNotMatch(copy.body, /^Name:/m);
  assert.doesNotMatch(copy.body, /^Email:/m);
  assert.doesNotMatch(copy.body, /From: \s*$/m);

  const named = composeLeadAlertCopy({
    shopName: "Ridge Air",
    guestPhone: "5415550199",
    guestName: "Lena P.",
    guestEmail: "lena@example.com",
    guestMessage: "Furnace down",
  });
  assert.match(named.body, /Name: Lena P\./);
  assert.match(named.body, /Email: lena@example.com/);
});
