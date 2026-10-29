import assert from "node:assert/strict";
import test from "node:test";
import {
  ambienceFor,
  balanceChannels,
  fetchClientStorefront,
  formulateProposal,
  hasListedPhone,
  localStorefront,
  parseClientStorefront,
  sanitizeAccent,
} from "./autopilot.ts";

test("a listed phone needs ten digits", () => {
  assert.equal(hasListedPhone("541-555-0100"), true);
  assert.equal(hasListedPhone("555"), false);
});

test("both-channel leads fill the smaller side", () => {
  const split = balanceChannels([
    { email: "a@sweep.example", phone: "" },
    { email: "b@sweep.example", phone: "5415550100" },
    { email: "", phone: "5415550101" },
    { email: "not-an-email", phone: "12" },
  ]);
  assert.equal(split.email.length, 2);
  assert.equal(split.sms.length, 1);
  assert.equal(split.email.some((lead) => lead.email.startsWith("b@")), true);
});

test("simulation copy says the batch will not send", () => {
  const summary = formulateProposal({
    mode: "simulation",
    totalLeads: 10,
    dailySent: 0,
    remainingQueue: 10,
    county: "Jackson County",
    tradeLabel: "contractor",
    emailCount: 2,
    smsCount: 2,
  });
  assert.match(summary, /does not send email or SMS/);
  assert.match(summary, /Jackson County/);
});

test("local storefronts keep a film and service shards", async () => {
  const river = await fetchClientStorefront("rogue-river-outfitters");
  assert.equal(river?.name, "Rogue River Outfitters");
  assert.equal(river?.heroVideoUrl, "/media/trout-fishin-hero-animation.mp4");
  assert.equal(river?.ambience, "river");
  assert.ok((river?.shards.length ?? 0) >= 2);
  assert.equal(localStorefront("high-desert-wildlife")?.heroVideoUrl, "/media/leopard-hero-animation.mp4");
  assert.equal(localStorefront("night-circuit")?.name, "Night Circuit");
  assert.equal(localStorefront("night-circuit")?.heroVideoUrl, "/media/auto-hero-animation.mp4");
  assert.equal(localStorefront("ashland-barber")?.tagline, "A straight cut, a hot towel, and the chair by the front window.");
  assert.equal(localStorefront("rogue-contractor")?.address, "Grants Pass, Oregon");
  assert.equal(localStorefront("cascade-weld")?.niche, "welding");
  assert.equal(localStorefront("meridian-ink")?.accent, "#FF4FD8");
  assert.equal(await fetchClientStorefront("missing-shop"), null);
  assert.equal(sanitizeAccent("#abc"), "#2EE6D6");
  assert.equal(ambienceFor("wildlife"), "forest");
  const parsed = parseClientStorefront(
    {
      shop_slug: "night-key",
      business_name: "Night Key",
      tagline: "Locks after dark",
      accent_color: "nope",
      hero_video_url: "/media/electrician-hero-animation.mp4",
      niche: "locksmith",
      service_shards: [{ label: "Rekey", meta: "Call", blurb: "The van rolls.", price: 89 }],
    },
    "supabase",
  );
  assert.equal(parsed?.shards[0]?.priceCents, 8900);
  assert.equal(parsed?.accent, "#2EE6D6");
});
