import assert from "node:assert/strict";
import test from "node:test";
import { parseTradeProfile } from "./trade-layout.ts";
import { CRAFT_LOOP_SECONDS, craftKindFor } from "./studio-craft.ts";
import {
  generateStudioIdentity,
  isStudioPlate,
  parseStudioIdentity,
  studioLogo,
  studioPlateLayout,
  STUDIO_PLATE,
} from "./studio-identity.ts";

test("a name, trade, and color lock a logo and three sponsor marks", () => {
  const identity = generateStudioIdentity({
    businessName: "  North Frame  ",
    niche: "contractor",
    nicheLabel: "General contractor",
    paletteId: "copper",
    badges: ["Licensed", "Insured", "Local crew", "Extra"],
  });
  assert.equal(identity.locked, true);
  assert.equal(identity.animated, false);
  assert.equal(identity.businessName, "North Frame");
  assert.equal(identity.niche, "contractor");
  assert.equal(identity.accent, "#E7B48A");
  assert.equal(identity.badges.length, 3);
  assert.equal(identity.badges[2]?.label, "Local crew");
  const logo = studioLogo(identity);
  assert.equal(logo.startsWith("data:image/svg+xml"), true);
  assert.equal(logo.includes("<script"), false);
  const hostile = generateStudioIdentity({
    businessName: "<script>alert(1)</script>",
    niche: "clean",
    paletteId: "signal",
  });
  assert.equal(studioLogo(hostile).includes("<script"), false);
  assert.equal(decodeURIComponent(studioLogo(hostile)).includes("&lt;script&gt;"), true);
});

test("an unknown color or a blank name does not lock", () => {
  assert.throws(() => generateStudioIdentity({ businessName: "A", niche: "clean", paletteId: "signal" }), /Name the business/);
  assert.throws(() => generateStudioIdentity({ businessName: "Harbor Wash", niche: "clean", paletteId: "purple" }), /Pick a color/);
  const junk = parseStudioIdentity({
    locked: true,
    businessName: "Harbor Wash",
    niche: "clean",
    paletteId: "nope",
    animated: true,
    accent: "red",
  });
  assert.equal(junk.locked, false);
  assert.equal(junk.animated, false);
});

test("the tenant profile keeps a locked identity and drops a bad palette", () => {
  const identity = generateStudioIdentity({
    businessName: "Harbor Wash",
    niche: "clean",
    nicheLabel: "Cleaning",
    paletteId: "signal",
  });
  const saved = parseTradeProfile("clean", { studioIdentity: { ...identity, animated: true } });
  assert.equal(saved.studioIdentity.locked, true);
  assert.equal(saved.studioIdentity.animated, true);
  assert.equal(saved.studioIdentity.businessName, "Harbor Wash");
  assert.equal(saved.studioIdentity.badges.length, 3);
  assert.equal(parseTradeProfile("clean", {}).studioIdentity.locked, false);
});

test("sponsor chips sit inside the plate", () => {
  const layout = studioPlateLayout(3);
  assert.equal(layout.badges.length, 3);
  for (const badge of layout.badges) {
    assert.ok(badge.x > 40 && badge.x < STUDIO_PLATE.width - 40);
    assert.ok(badge.y > 40 && badge.y < STUDIO_PLATE.height - 40);
  }
  assert.equal(studioPlateLayout(0).badges.length, 0);
  assert.equal(isStudioPlate("/api/hero/brand/shop_abc?v=1"), true);
  assert.equal(isStudioPlate("data:image/jpeg;base64,aaa"), true);
  assert.equal(isStudioPlate("/media/heroes/clean.jpg"), false);
});

test("service buttons pick a three second craft from the trade", () => {
  assert.equal(CRAFT_LOOP_SECONDS, 3);
  assert.equal(craftKindFor("contractor", "Deck framing"), "saw");
  assert.equal(craftKindFor("contractor", "Rough cut"), "saw");
  assert.equal(craftKindFor("clean", "Deep clean"), "wash");
  assert.equal(craftKindFor("detailer", "Pressure wash"), "wash");
  assert.equal(craftKindFor("salon", "Haircut"), "shear");
  assert.equal(craftKindFor("landscaper", "Weekly mow"), "blade");
  assert.equal(craftKindFor("locksmith", "Rekey"), "key");
  assert.equal(craftKindFor("tattoo", "Flash"), "needle");
});
