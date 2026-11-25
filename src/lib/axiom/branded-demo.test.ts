import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoStillCandidates, renderBrandedPlateSvg } from "./branded-demo.ts";
import { resolveDemoLoop } from "./branded-demo-loop.ts";

describe("branded demo assets", () => {
  it("uses a business override, then the exact niche card, then a clean fallback", () => {
    const plumbing = demoStillCandidates({ niche: "plumbing", slot: "hero" });
    assert.equal(plumbing[0]?.source, "registry");
    assert.equal(plumbing[0]?.url, "/media/heroes/plumbing.jpg");
    assert.equal(plumbing.at(-1)?.source, "fallback");
    assert.equal(plumbing.at(-1)?.url, "/media/heroes/contractor.jpg");
    assert.ok(plumbing.some((item) => item.source === "stock" && /plumber|plumbing/i.test(item.query)));

    const named = demoStillCandidates({
      niche: "electrical",
      slot: "hero",
      overrideUrl: "/media/heroes/electrical.jpg",
    });
    assert.equal(named[0]?.source, "override");
    assert.equal(named[0]?.url, "/media/heroes/electrical.jpg");

    const proof = demoStillCandidates({
      niche: "plumbing",
      slot: "proof",
      overrideUrl: "/media/custom-hero.jpg",
    });
    assert.notEqual(proof[0]?.source, "override");
  });

  it("keeps niche mp4 loops and does not use a wildlife film as the trade fallback", () => {
    assert.equal(resolveDemoLoop("plumbing"), "/media/axio-plumber-hero.mp4");
    assert.equal(resolveDemoLoop("taxidermy"), "/media/infrastructure-hero-animation.mp4");
    assert.equal(resolveDemoLoop("contractor").includes("bear"), false);
    assert.equal(resolveDemoLoop("contractor").includes("leopard"), false);
  });

  it("paints the business into the plate instead of a slot label", () => {
    const svg = renderBrandedPlateSvg({
      businessName: "North Glass",
      niche: "electrical",
      accent: "#00ffcc",
      city: "Medford",
      imageHref: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    });
    assert.match(svg, /North Glass/);
    assert.match(svg, /Electrical/);
    assert.match(svg, /Medford/);
    assert.match(svg, /data:image\/gif/);
    assert.doesNotMatch(svg, /HERO SLOT|PROOF-OF-WORK SLOT/);
  });
});
