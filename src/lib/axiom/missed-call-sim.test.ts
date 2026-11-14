import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  missedCallScenarioFor,
  nextMissedCallStep,
  renderMissedCallSms,
} from "./missed-call-sim.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("missed-call recovery sim", () => {
  it("picks niche-specific emergency copy", () => {
    const plumbing = missedCallScenarioFor("plumbing");
    assert.match(plumbing.inquiry, /leak/i);
    assert.equal(plumbing.cta, "Test Your Missed Call Recovery");

    const electrical = missedCallScenarioFor("electrical");
    assert.match(electrical.inquiry, /outage|panel/i);

    const lock = missedCallScenarioFor("electrical", "Mobile Locksmith");
    assert.match(lock.inquiry, /locked out/i);
  });

  it("renders SMS with business name and booking link", () => {
    const sms = renderMissedCallSms("{business} caught it — book: {bookUrl}", {
      business: "Ridge Line Plumbing",
      bookUrl: "#guest-book",
    });
    assert.equal(sms, "Ridge Line Plumbing caught it — book: #guest-book");
  });

  it("advances idle → ringing → inquiry → sms → booked", () => {
    assert.equal(nextMissedCallStep("idle"), "ringing");
    assert.equal(nextMissedCallStep("ringing"), "inquiry");
    assert.equal(nextMissedCallStep("inquiry"), "sms");
    assert.equal(nextMissedCallStep("sms"), "booked");
    assert.equal(nextMissedCallStep("booked"), "booked");
  });

  it("wires preload desk + sim into demo and outreach storefronts", () => {
    const storefront = readFileSync(join(root, "src/components/outreach-storefront.tsx"), "utf8");
    const demo = readFileSync(join(root, "src/routes/demo/$niche.tsx"), "utf8");
    const preview = readFileSync(join(root, "src/app/preview-frame.tsx"), "utf8");
    assert.match(storefront, /DemoRetentionStack/);
    assert.match(demo, /DemoRetentionStack/);
    assert.match(preview, /DemoRetentionStack/);
    assert.match(
      readFileSync(join(root, "src/components/missed-call-recovery-sim.tsx"), "utf8"),
      /Test Your Missed Call Recovery|scenario\.cta/,
    );
  });
});
