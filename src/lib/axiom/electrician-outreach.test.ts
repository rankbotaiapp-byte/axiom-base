import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ELECTRICIAN_OUTREACH,
  ELECTRICIAN_GENERIC_NAME,
  ELECTRICIAN_HERO_LOOP,
  ELECTRICIAN_HERO_LOOP_FALLBACK,
  ELECTRICIAN_HERO_POSTER,
  ELECTRICIAN_HERO_POSTER_FALLBACK,
  checkDispatchMobile,
  electricianCampaignPath,
  electricianHeroDefaults,
  isElectricalCampaign,
  liveCallHref,
  mergeElectricianHero,
  resolveElectricianMedia,
  smsBookingHref,
} from "./electrician-outreach.ts";

test("electrician campaign detection does not steal plumbing", () => {
  assert.equal(isElectricalCampaign("electrical"), true);
  assert.equal(isElectricalCampaign("Emergency Electrician"), true);
  assert.equal(isElectricalCampaign("cascade-electric"), true);
  assert.equal(isElectricalCampaign("EV charger install"), true);
  assert.equal(isElectricalCampaign("plumbing"), false);
  assert.equal(isElectricalCampaign("accurate-plumbing"), false);
  assert.equal(isElectricalCampaign("electronics repair"), false);
  assert.equal(isElectricalCampaign(""), false);
  assert.equal(electricianCampaignPath("Cascade Electric!"), "/t/cascadeelectric?niche=electrical&greet=1");
});

test("defaults cover core electrical services, badges, faq, and preferred media", () => {
  assert.equal(electricianHeroDefaults.businessName, ELECTRICIAN_GENERIC_NAME);
  assert.equal(electricianHeroDefaults.videoSrc, ELECTRICIAN_HERO_LOOP);
  assert.equal(electricianHeroDefaults.poster, ELECTRICIAN_HERO_POSTER);
  assert.equal(electricianHeroDefaults.bg, "#050507");
  assert.equal(electricianHeroDefaults.cyan, "#00ffcc");
  assert.equal(electricianHeroDefaults.amber, "#FFE500");
  const ids = DEFAULT_ELECTRICIAN_OUTREACH.services.map((s) => s.id);
  assert.deepEqual(ids, ["panel", "ev", "generator", "commercial", "diagnostics", "emergency"]);
  assert.ok(DEFAULT_ELECTRICIAN_OUTREACH.badges.length >= 4);
  assert.ok(DEFAULT_ELECTRICIAN_OUTREACH.faq.length >= 3);
  assert.ok(DEFAULT_ELECTRICIAN_OUTREACH.hours.length >= 3);
});

test("sparse tenant.hero never clobbers defaults with undefined keys", () => {
  const merged = mergeElectricianHero(
    { tagline: "ON CALL", videoSrc: undefined, poster: undefined, businessName: undefined, phone: undefined },
    undefined,
  );
  assert.equal(merged.tagline, "ON CALL");
  assert.equal(merged.videoSrc, ELECTRICIAN_HERO_LOOP);
  assert.equal(merged.poster, ELECTRICIAN_HERO_POSTER);
  assert.equal(merged.businessName, ELECTRICIAN_GENERIC_NAME);
  assert.equal(merged.phone, "");
  assert.equal(merged.strip, electricianHeroDefaults.strip);
});

test("phone and businessName overrides win over sparse hero", () => {
  const merged = mergeElectricianHero(
    { headline: "Stay live" },
    { businessName: "Cascade Electric", phone: "(541) 890-1234" },
  );
  assert.equal(merged.businessName, "Cascade Electric");
  assert.equal(merged.phone, "(541) 890-1234");
  assert.equal(merged.headline, "Stay live");
});

test("media helper falls back to plumbing hero assets when electrician files are missing", () => {
  const missing = resolveElectricianMedia({ loopAvailable: false, posterAvailable: false });
  assert.equal(missing.videoSrc, ELECTRICIAN_HERO_LOOP_FALLBACK);
  assert.equal(missing.poster, ELECTRICIAN_HERO_POSTER_FALLBACK);
  const present = resolveElectricianMedia({ loopAvailable: true, posterAvailable: true });
  assert.equal(present.videoSrc, ELECTRICIAN_HERO_LOOP);
  assert.equal(present.poster, ELECTRICIAN_HERO_POSTER);
});

test("555 placeholders never become live tel or sms dispatch targets", () => {
  assert.equal(checkDispatchMobile("541-555-0142").ok, false);
  assert.equal(liveCallHref("541-555-0142"), undefined);
  assert.equal(smsBookingHref("541-555-0142", "Book"), undefined);
  assert.equal(liveCallHref("541-890-1234"), "tel:+15418901234");
});
