import assert from "node:assert/strict";
import test from "node:test";
import {
  OUTREACH_ACTIVE_VERTICAL,
  OUTREACH_DAILY_NICHE_SCHEDULE,
  PLUMBING_CAMPAIGN_GREETING,
  PLUMBING_CAMPAIGN_HERO,
  PLUMBING_CAMPAIGN_TEMPLATE,
  PLUMBING_LEAD_DATASET_SIZE,
  demoStorefrontPath,
  nicheForScheduleDay,
  nextScheduledNiche,
  outreachNicheHero,
  outreachNicheLabel,
  pickNextNicheBatch,
  plumbingStorefrontHref,
  scheduleDayForNiche,
  tenantPreviewSlug,
  trimBatchToDailyCaps,
} from "./outreach-niche-batch.ts";

test("live campaign slate is plumbing-only", () => {
  assert.equal(OUTREACH_ACTIVE_VERTICAL, "plumbing");
  assert.equal(PLUMBING_LEAD_DATASET_SIZE, 20_330);
  assert.deepEqual([...OUTREACH_DAILY_NICHE_SCHEDULE], ["plumbing"]);
  assert.equal(nicheForScheduleDay(0), "plumbing");
  assert.equal(nicheForScheduleDay(99), "plumbing");
  assert.equal(scheduleDayForNiche("plumbing"), 1);
  assert.equal(nextScheduledNiche("plumbing"), "plumbing");
  assert.equal(nextScheduledNiche("electrical"), "plumbing");
});

test("Emergency Plumbing locks to axio-plumber-hero", () => {
  assert.equal(outreachNicheHero("plumbing"), PLUMBING_CAMPAIGN_HERO);
  assert.equal(outreachNicheHero("plumbing"), "/media/axio-plumber-hero.mp4");
  assert.equal(outreachNicheHero("Emergency Plumbing"), "/media/axio-plumber-hero.mp4");
  assert.equal(PLUMBING_CAMPAIGN_GREETING, "/media/axiom-greeting.mp4");
  assert.equal(PLUMBING_CAMPAIGN_TEMPLATE, "/t/{slug}?niche=plumbing&greet=1");
  assert.equal(plumbingStorefrontHref("rogue-pipe-co"), "/t/rogue-pipe-co?niche=plumbing&greet=1");
  assert.match(outreachNicheLabel("plumbing"), /Plumbing/);
});

test("demo storefront path carries niche, business inlay, and plumbing hero pin", () => {
  const path = demoStorefrontPath({
    niche: "plumbing",
    businessName: "Rogue Pipe Co",
    leadSlug: "rogue-pipe-co-medford",
    city: "Medford",
    county: "Jackson County",
  });
  assert.match(path, /^\/t\/rogue-pipe-co-medford\?/);
  assert.match(path, /niche=plumbing/);
  assert.match(path, /business=Rogue\+Pipe\+Co/);
  assert.match(path, /b=rogue-pipe-co-medford/);
  assert.match(path, /hero=%2Fmedia%2Faxio-plumber-hero\.mp4/);
  assert.match(path, /greet=1/);
  assert.match(path, /utm_source=desk/);
});

test("plumbing preview slug feeds /t/{slug} tenant routes", () => {
  assert.equal(tenantPreviewSlug("rogue-rapid-plumbing", "Ignored"), "rogue-rapid-plumbing");
  assert.equal(tenantPreviewSlug("", "Rogue Rapid Plumbing"), "rogue-rapid-plumbing");
});

test("pickNextNicheBatch never leaves plumbing for another vertical", () => {
  const ready = [
    { niche: "electrical", ready: 12 },
    { niche: "plumbing", ready: 4 },
    { niche: "auto", ready: 9 },
  ];
  assert.equal(pickNextNicheBatch(ready, "plumbing")?.niche, "plumbing");
  assert.equal(pickNextNicheBatch(ready, "electrical")?.niche, "plumbing");
  assert.equal(pickNextNicheBatch([{ niche: "auto", ready: 3 }], "plumbing"), null);
  assert.equal(pickNextNicheBatch([], null), null);
});

test("trimBatchToDailyCaps never exceeds remaining SMS/email room", () => {
  const split = {
    email: ["a", "b", "c", "d"],
    sms: ["1", "2", "3"],
  };
  const trimmed = trimBatchToDailyCaps(split, { emailRemaining: 2, smsRemaining: 1 });
  assert.deepEqual(trimmed.email, ["a", "b"]);
  assert.deepEqual(trimmed.sms, ["1"]);
});
