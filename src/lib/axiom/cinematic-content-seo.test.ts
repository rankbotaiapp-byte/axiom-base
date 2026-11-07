import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CINEMATIC_HERO_VIDEO,
  buildAutonomousContentPlan,
  cinematicLandingMeta,
} from "./cinematic-content-seo.ts";

describe("cinematic content + SEO architecture", () => {
  it("pins the underwater leopard asset path", () => {
    assert.match(CINEMATIC_HERO_VIDEO, /underwater-leapord-hero-animation\.mp4$/);
  });

  it("builds an autonomous multi-channel plan with local SEO schema", () => {
    const plan = buildAutonomousContentPlan({
      niche: "plumbing",
      city: "Medford",
      businessName: "Rogue Rapid Plumbing",
      origin: "https://axiom.example",
    });
    assert.match(plan.seoTitle, /Medford/);
    assert.match(plan.seoDescription, /Rogue Rapid Plumbing/);
    assert.ok(plan.keywords.some((k) => /medford/i.test(k)));
    assert.equal(plan.posts.length, 5);
    assert.ok(plan.posts.every((p) => p.channel && p.cadence && p.caption));
    assert.equal(plan.localBusinessJsonLd["@type"], "ProfessionalService");
    assert.equal(plan.localBusinessJsonLd.areaServed, "Medford");
    assert.equal(plan.breadcrumbJsonLd["@type"], "BreadcrumbList");
    assert.ok(plan.posts.every((p) => p.assetUrl.startsWith("/media/")));
    assert.ok(plan.posts[0]?.caption.includes("Rogue Rapid Plumbing"));
  });

  it("emits head meta for the cinematic landing", () => {
    const plan = buildAutonomousContentPlan({ niche: "auto", city: "Grants Pass" });
    const meta = cinematicLandingMeta(plan);
    assert.ok(meta.some((m) => "title" in m));
    assert.ok(meta.some((m) => "name" in m && m.name === "description"));
    assert.ok(meta.some((m) => "property" in m && m.property === "og:title"));
  });
});
