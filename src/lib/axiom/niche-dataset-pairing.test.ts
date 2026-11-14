import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bindingForTrade,
  pairDatasetToNichePreview,
  resolveProvisionFilm,
  verifiedPrimaryLoop,
} from "./niche-dataset-pairing.ts";

describe("niche dataset pairing", () => {
  it("maps water systems to otter and plumbing to the emergency cinematic", () => {
    const water = bindingForTrade("water-systems");
    assert.equal(water.primaryLoop, "/media/otter-hero-animation.mp4");
    assert.ok(water.alternateLoops.includes("/media/shark-hero-animation.mp4"));
    assert.equal(verifiedPrimaryLoop("plumbing"), "/media/axio-plumber-hero.mp4");
    assert.equal(verifiedPrimaryLoop("Emergency Plumbing"), "/media/axio-plumber-hero.mp4");
  });

  it("maps fabrication to polar-bear (universal is not on disk)", () => {
    const bind = bindingForTrade("fabrication", "Custom weld shop");
    assert.equal(bind.primaryLoop, "/media/polar-bear-hero-animation.mp4");
    assert.ok(bind.alternateLoops.some((url) => url.includes("polar-bear")));
  });

  it("maps auto to auto-hero", () => {
    assert.equal(verifiedPrimaryLoop("auto"), "/media/auto-hero-animation.mp4");
    assert.equal(verifiedPrimaryLoop("Mobile mechanic"), "/media/auto-hero-animation.mp4");
  });

  it("maps taxidermy to leopard/raptor loops", () => {
    const bind = bindingForTrade("taxidermy");
    assert.equal(bind.primaryLoop, "/media/leopard-hero-animation.mp4");
    assert.ok(bind.alternateLoops.includes("/media/raptor-hero-animation.mp4"));
  });

  it("overlays business name, phone, and location onto the template preview", () => {
    const preview = pairDatasetToNichePreview({
      businessName: "Rogue Bay Auto",
      tradeType: "auto repair",
      phone: "541-555-0100",
      city: "Medford",
      county: "Jackson County",
      leadSlug: "rogue-bay-auto-medford",
    });
    assert.equal(preview.niche, "auto");
    assert.equal(preview.heroVideoUrl, "/media/auto-hero-animation.mp4");
    assert.equal(preview.overlay.businessName, "Rogue Bay Auto");
    assert.equal(preview.overlay.phone, "541-555-0100");
    assert.equal(preview.overlay.location, "Medford · Jackson County");
    assert.match(preview.previewPath, /b=rogue-bay-auto-medford/);
    assert.match(preview.previewPath, /utm_source=desk/);
  });

  it("pins an explicit film when provisioning", () => {
    assert.equal(
      resolveProvisionFilm({ niche: "plumbing", heroFilm: "/media/plumbers-hero-animation.mp4" }),
      "/media/plumbers-hero-animation.mp4",
    );
    assert.equal(resolveProvisionFilm({ niche: "taxidermy" }), "/media/leopard-hero-animation.mp4");
  });
});
