import assert from "node:assert/strict";
import test from "node:test";
import {
  BARBER_HERO,
  BARBER_MASK,
  BARBER_PLACEHOLDER_TEL,
  DEFAULT_BARBER_OUTREACH,
  barberCampaignPath,
  barberHeroDefaults,
  checkDispatchMobile,
  isBarberCampaign,
  mergeBarberHero,
} from "./barber-outreach.ts";

test("barber campaign detection covers barber niches only", () => {
  assert.equal(isBarberCampaign("barber"), true);
  assert.equal(isBarberCampaign("Ashland Barber Co"), true);
  assert.equal(isBarberCampaign("fade-masters-barbershop"), true);
  assert.equal(isBarberCampaign("plumbing"), false);
  assert.equal(isBarberCampaign("electrical"), false);
  assert.equal(isBarberCampaign(""), false);
  assert.equal(barberCampaignPath("Ashland Barber!"), "/t/ashlandbarber?niche=barber&greet=1");
});

test("defaults match the barbershop handoff wording, menu, hours, and media", () => {
  assert.equal(barberHeroDefaults.poster, BARBER_HERO);
  assert.equal(barberHeroDefaults.mask, BARBER_MASK);
  assert.equal(barberHeroDefaults.badge, "WALK-INS WELCOME · ROGUE VALLEY");
  assert.equal(barberHeroDefaults.tagline, "BARBER · EST. 2026");
  assert.equal(barberHeroDefaults.headline, "Look sharp.");
  assert.equal(barberHeroDefaults.headlineAccent, "Leave legendary.");
  assert.equal(barberHeroDefaults.phone, BARBER_PLACEHOLDER_TEL);
  assert.deepEqual(
    DEFAULT_BARBER_OUTREACH.services.map((s) => s.price),
    ["$35", "$40", "$35", "$55", "$25"],
  );
  assert.deepEqual(DEFAULT_BARBER_OUTREACH.slots, ["10:00", "11:30", "1:00", "2:30", "3:15", "4:00", "5:30", "6:15"]);
  assert.equal(DEFAULT_BARBER_OUTREACH.footer, "Built by New Era Apps");
});

test("sparse tenant.hero never clobbers defaults with undefined keys", () => {
  const merged = mergeBarberHero({ badge: "WALK-INS WELCOME · MEDFORD", poster: undefined, phone: undefined }, undefined);
  assert.equal(merged.badge, "WALK-INS WELCOME · MEDFORD");
  assert.equal(merged.poster, BARBER_HERO);
  assert.equal(merged.tagline, barberHeroDefaults.tagline);
  assert.equal(merged.phone, BARBER_PLACEHOLDER_TEL);
});

test("businessName overlay and phone overrides win", () => {
  const merged = mergeBarberHero({ tagline: "BARBER · EST. 2018" }, { businessName: "Ashland Barber Co.", phone: "(541) 890-1234" });
  assert.equal(merged.businessName, "Ashland Barber Co.");
  assert.equal(merged.phone, "(541) 890-1234");
  assert.equal(merged.tagline, "BARBER · EST. 2018");
});

test("555 placeholder shop line is not a live dispatch mobile", () => {
  assert.equal(checkDispatchMobile("541-555-0142").ok, false);
});
