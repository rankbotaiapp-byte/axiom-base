import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SMS_DRIP_STEPS,
  firstNameFrom,
  fillSmsDripTemplate,
  isOfficeHeavyEmail,
  prioritizeOutreachChannel,
  renderSmsDripBody,
  shouldPauseSmsDrip,
  smsDripHaltReason,
  smsDripSchedule,
  smsDripStorefrontPath,
  splitLeadsByChannelPriority,
} from "./sms-drip.ts";

describe("SMS vs email channel routing", () => {
  it("routes mobile-verified numbers to SMS-first", () => {
    assert.equal(
      prioritizeOutreachChannel({
        email: "mike@rogueplumbing.example",
        phone: "5415550142",
        phoneLine: "mobile",
      }),
      "sms",
    );
  });

  it("routes office/email-heavy leads to email-first", () => {
    assert.equal(
      prioritizeOutreachChannel({
        email: "info@rogueplumbing.example",
        phone: "5415550142",
        phoneLine: "mobile",
      }),
      "email",
    );
    assert.equal(
      prioritizeOutreachChannel({
        email: "office@shop.example",
        phone: "",
        phoneLine: "",
      }),
      "email",
    );
    assert.equal(isOfficeHeavyEmail("Admin@Shop.Example"), true);
  });

  it("splits a batch by channel priority without load-balancing mobiles onto email", () => {
    const split = splitLeadsByChannelPriority([
      { email: "a@x.example", phone: "", phoneLine: "" },
      { email: "b@x.example", phone: "5415550100", phoneLine: "mobile" },
      { email: "info@x.example", phone: "5415550101", phoneLine: "mobile" },
      { email: "", phone: "5415550102", phoneLine: "landline" },
      { email: "", phone: "12", phoneLine: "" },
    ]);
    assert.equal(split.email.length, 2);
    assert.equal(split.sms.length, 2);
    assert.equal(split.sms.some((l) => l.email === "b@x.example"), true);
    assert.equal(split.email.some((l) => l.email.startsWith("info@")), true);
    assert.equal(split.skipped.length, 1);
  });
});

describe("3-step SMS drip engine", () => {
  it("schedules Day 1 immediate, Day 3 check-in, Day 7 missed-call", () => {
    const anchor = new Date("2026-11-07T17:00:00.000Z");
    const plan = smsDripSchedule(anchor);
    assert.deepEqual(
      plan.map((p) => [p.step.day, p.step.id, p.step.offsetDays]),
      [
        [1, "day1-preview", 0],
        [3, "day3-checkin", 3],
        [7, "day7-missed-call", 7],
      ],
    );
    assert.equal(plan[0]?.scheduledAt, anchor.toISOString());
    assert.equal(plan[1]?.scheduledAt, new Date(anchor.getTime() + 3 * 86_400_000).toISOString());
    assert.equal(plan[2]?.scheduledAt, new Date(anchor.getTime() + 7 * 86_400_000).toISOString());
    assert.equal(SMS_DRIP_STEPS.length, 3);
  });

  it("renders dynamic first name, business, and greet=1 storefront URL", () => {
    assert.equal(firstNameFrom("Sarah Jensen", "Rogue Rapid Plumbing"), "Sarah");
    assert.equal(firstNameFrom("", "Rogue Rapid Plumbing"), "Rogue");

    const url = smsDripStorefrontPath({
      niche: "plumbing",
      businessName: "Rogue Rapid Plumbing",
      leadSlug: "rogue-rapid-plumbing",
      city: "Medford",
      county: "Jackson County",
      origin: "https://axiom.example",
    });
    assert.match(url, /^https:\/\/axiom\.example\/t\/rogue-rapid-plumbing\?/);
    assert.match(url, /greet=1/);
    assert.match(url, /b=rogue-rapid-plumbing/);

    const day1 = renderSmsDripBody("day1-preview", {
      firstName: "Sarah",
      business: "Rogue Rapid Plumbing",
      url,
    });
    assert.match(day1, /Hey Sarah/);
    assert.match(day1, /Rogue Rapid Plumbing/);
    assert.match(day1, /greet=1/);
    assert.match(day1, /Reply STOP/i);

    const day7 = fillSmsDripTemplate(SMS_DRIP_STEPS[2]!.template, {
      firstName: "Sarah",
      business: "Rogue Rapid Plumbing",
      url,
    });
    assert.match(day7, /missed call/i);
  });
});

describe("engagement & opt-out pause", () => {
  it("pauses on reply, STOP, and Stripe checkout", () => {
    assert.equal(shouldPauseSmsDrip("reply"), true);
    assert.equal(shouldPauseSmsDrip("opt_out"), true);
    assert.equal(shouldPauseSmsDrip("stripe_checkout"), true);
    assert.equal(shouldPauseSmsDrip("subscribed"), true);
    assert.equal(shouldPauseSmsDrip("noop"), false);
    assert.equal(smsDripHaltReason("reply"), "replied");
    assert.equal(smsDripHaltReason("opt_out"), "replied");
    assert.equal(smsDripHaltReason("stripe_checkout"), "booked");
  });
});
