import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MASTER_HERO_DEFAULTS } from "./MasterHeroDefaults.ts";
import { NICHE_REGISTRY, masterCategoryFor } from "./NicheRegistry.ts";
import {
  AUTOPILOT_LOOP_MAX,
  AUTOPILOT_LOOP_MIN,
  composeAutopilotClip,
  defaultAutopilotLoops,
  masterLoopForNiche,
  parseShopConfig,
  pickAutopilotLoop,
  resolveAutopilotLoops,
  sanitizeAutopilotLoops,
  tradeCopyForNiche,
} from "./AutopilotContentEngine.ts";

describe("autopilot content engine", () => {
  it("defaults to the pinned storefront film plus the category master loop", () => {
    const loops = defaultAutopilotLoops({
      pinnedHeroUrl: "/media/tiger-hero-animation.mp4",
      niche: "plumbing",
    });
    assert.equal(loops.includes("/media/tiger-hero-animation.mp4"), true);
    assert.equal(loops.includes("/media/otter-hero-animation.mp4"), true);
    assert.equal(loops.length >= AUTOPILOT_LOOP_MIN, true);
    assert.equal(loops.length <= AUTOPILOT_LOOP_MAX, true);
  });

  it("keeps the master cinematic category loop even when a tenant subset is pinned", () => {
    const picked = [
      "/media/apex-launch-hero-animation.mp4",
      "/media/leopard-hero-path.mp4",
      "/media/shark-hero-animation.mp4",
    ];
    const loops = resolveAutopilotLoops({
      shopConfig: { selectedAutopilotLoops: picked },
      pinnedHeroUrl: "/media/tiger-hero-animation.mp4",
      niche: "auto",
    });
    assert.equal(loops.includes(masterLoopForNiche("auto")), true);
    assert.equal(loops.includes("/media/apex-launch-hero-animation.mp4"), true);
    assert.equal(loops.length <= AUTOPILOT_LOOP_MAX, true);
  });

  it("pairs every registered niche to its master category loop without manual maps", () => {
    for (const niche of Object.keys(NICHE_REGISTRY)) {
      const category = masterCategoryFor(niche);
      assert.equal(masterLoopForNiche(niche), MASTER_HERO_DEFAULTS[category].src);
      const copy = tradeCopyForNiche(niche);
      assert.ok(copy.tradeLabel.length > 0);
      assert.ok(copy.tradeLine.length > 0);
      const resolved = resolveAutopilotLoops({ niche, pinnedHeroUrl: null });
      assert.equal(resolved.includes(MASTER_HERO_DEFAULTS[category].src), true);
    }
  });

  it("cycles sequentially and composites shop name, trade copy, city, and booking CTA", () => {
    const loops = ["/media/apex-launch-hero-animation.mp4", "/media/otter-hero-animation.mp4"];
    assert.equal(pickAutopilotLoop(loops, 0).loopUrl, loops[0]);
    assert.equal(pickAutopilotLoop(loops, 1).loopUrl, loops[1]);
    assert.equal(pickAutopilotLoop(loops, 2).loopUrl, loops[0]);
    const clip = composeAutopilotClip({
      loopUrl: loops[0]!,
      shopName: "Rogue Detail",
      city: "Medford",
      bookUrl: "/rogue-detail/book",
      niche: "auto",
    });
    assert.match(clip.caption, /Rogue Detail/);
    assert.match(clip.caption, /Medford/);
    assert.match(clip.caption, /Auto/);
    assert.match(clip.caption, /Book in Medford/);
    assert.equal(clip.masterLoopUrl, masterLoopForNiche("auto"));
    const ashland = composeAutopilotClip({
      loopUrl: loops[0]!,
      shopName: "Ashland Barber Co",
      city: "Ashland",
      bookUrl: "/ashland-barber-co/book",
      niche: "barber",
    });
    assert.match(ashland.caption, /Barber/);
    assert.match(ashland.caption, /Ashland/);
    assert.match(ashland.posterSvg, /Barber/);
    assert.match(clip.posterSvg, /Rogue Detail/);
    assert.equal(sanitizeAutopilotLoops([...pickedOverflow()]).length, AUTOPILOT_LOOP_MAX);
    assert.equal(parseShopConfig({ shopConfig: { selectedAutopilotLoops: loops } }).selectedAutopilotLoops?.length, 2);
    const mixed = parseShopConfig({
      shopConfig: { selectedAutopilotLoops: loops, autopilotLoopCursor: 1 },
      frontendTemplate: { brandName: "Ashland Heat", selectedAutopilotLoops: ["/media/shark-hero-animation.mp4"] },
    });
    assert.deepEqual(mixed.selectedAutopilotLoops, loops);
    assert.equal(mixed.autopilotLoopCursor, 1);
  });
});

function pickedOverflow() {
  return [
    "/media/apex-launch-hero-animation.mp4",
    "/media/otter-hero-animation.mp4",
    "/media/leopard-hero-path.mp4",
    "/media/polar-bear-hero-animation.mp4",
    "/media/shark-hero-animation.mp4",
  ];
}
