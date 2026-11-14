import assert from "node:assert/strict";
import test from "node:test";
import { SHOP_NICHES } from "./types.ts";
import {
  checkDropZone,
  cordQuote,
  layoutFor,
  matchOffering,
  parseTradeProfile,
} from "./trade-layout.ts";

test("firewood and locksmith keep their own modules", () => {
  assert.deepEqual(layoutFor("firewood").modules, ["workflow", "bulk", "species", "dropzone"]);
  assert.deepEqual(layoutFor("locksmith").modules, ["dispatch", "callout", "radius"]);
  assert.ok(layoutFor("firewood").fields.includes("cords"));
  assert.ok(layoutFor("firewood").fields.includes("dropZones"));
  assert.ok(layoutFor("locksmith").fields.includes("emergencyCents"));
  assert.ok(layoutFor("locksmith").fields.includes("dispatchOn"));
  assert.notDeepEqual(layoutFor("firewood").modules, layoutFor("salon").modules);
  assert.notDeepEqual(layoutFor("locksmith").modules, layoutFor("fitness").modules);
});

test("every niche declares a layout", () => {
  const seen = new Set<string>();
  for (const niche of SHOP_NICHES) {
    const layout = layoutFor(niche);
    assert.ok(layout.modules.length > 0, niche);
    assert.ok(layout.heading.length > 0, niche);
    seen.add(layout.modules.join("|"));
  }
  assert.ok(seen.size > 8);
});

test("a saved profile keeps owner cords and drops junk", () => {
  const profile = parseTradeProfile("firewood", {
    cords: ["half", "nope", "full"],
    species: ["  Maple  ", ""],
    dropZones: ["Grants Pass"],
    radiusMiles: 999,
    deliveryNote: "Stack off the porch.",
  });
  assert.deepEqual(profile.cords, ["full", "half"]);
  assert.deepEqual(profile.species, ["Maple"]);
  assert.deepEqual(profile.dropZones, ["Grants Pass"]);
  assert.equal(profile.radiusMiles, 150);
  assert.equal(profile.deliveryNote, "Stack off the porch.");
  assert.deepEqual(profile.serviceThumbs, ["", "", ""]);
  assert.equal(profile.diagnosticReelUrl, "");
  assert.equal(profile.diagnosticReelEnabled, true);
});

test("plumbing shops can pin a custom diagnostic reel clip", () => {
  const profile = parseTradeProfile("plumbing", {
    diagnosticReelUrl: "/media/drain-clog.mp4",
    diagnosticReelEnabled: false,
  });
  assert.equal(profile.diagnosticReelUrl, "/media/drain-clog.mp4");
  assert.equal(profile.diagnosticReelEnabled, false);
});

test("custom service thumbs survive a trade profile rewrite", () => {
  const profile = parseTradeProfile("hvac", {
    serviceThumbs: ["/api/shop-media/med_one", "", "/api/shop-media/med_three"],
  });
  assert.equal(profile.serviceThumbs[0], "/api/shop-media/med_one");
  assert.equal(profile.serviceThumbs[1], "");
  assert.equal(profile.serviceThumbs[2], "/api/shop-media/med_three");
});

test("cord math and the drop check", () => {
  assert.equal(cordQuote(32000, "full"), 32000);
  assert.equal(cordQuote(32000, "half"), 17600);
  assert.equal(checkDropZone("me", ["Medford"]), "idle");
  assert.equal(checkDropZone("Medford", ["Medford", "Ashland"]), "in");
  assert.equal(checkDropZone("Portland", ["Medford"]), "out");
  assert.equal(matchOffering("Rekey", [{ name: "Rekey" }, { name: "Lockout" }])?.name, "Rekey");
});
