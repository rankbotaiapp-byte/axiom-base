import assert from "node:assert/strict";
import test from "node:test";
import { conditionalForwardingCodes, forwardingNationalNumber } from "./call-forwarding.ts";

test("conditional forwarding dial strings pre-fill the Axiom 10-digit number", () => {
  const codes = conditionalForwardingCodes("+15415550148");
  assert.equal(forwardingNationalNumber("+1 (541) 555-0148"), "5415550148");
  assert.equal(codes.length, 3);
  assert.deepEqual(
    codes.map((row) => row.code),
    ["*71", "*92", "*61"],
  );
  assert.equal(codes[0]?.dial, "*715415550148");
  assert.equal(codes[1]?.dial, "*925415550148");
  assert.equal(codes[2]?.dial, "*615415550148");
  assert.ok(codes.every((row) => row.dial.startsWith(row.code)));
  assert.equal(conditionalForwardingCodes("555").length, 0);
  assert.equal(conditionalForwardingCodes("").length, 0);
});
