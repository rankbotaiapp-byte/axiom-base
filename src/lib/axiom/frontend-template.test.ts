import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseShopConfig, resolveAutopilotLoops } from "../../config/AutopilotContentEngine.ts";
import { brandedStillPrompt, parseFrontendTemplate } from "./frontend-template.ts";
import { parseOutreachMode } from "./outreach-queue.ts";

describe("immutable frontend template isolation", () => {
  it("stores the public snapshot beside Autopilot loops, not inside them", () => {
    const raw = {
      shopConfig: {
        selectedAutopilotLoops: ["/media/apex-launch-hero-animation.mp4", "/media/otter-hero-animation.mp4"],
        autopilotLoopCursor: 3,
        overrideHeroVideoUrl: "/media/tiger-hero-animation.mp4",
      },
      frontendTemplate: {
        version: 1,
        builtAt: "2026-11-02T00:00:00.000Z",
        brandName: "Ashland Heat",
        primary: "#2EE6D6",
        font: "display",
        city: "Ashland",
        address: "Ashland, OR",
        phone: "5415550100",
        bookPath: "/ashland-heat/book",
        animate: true,
        heroAssetUrl: "https://cdn.example/still.jpg",
        heroVideoUrl: "/media/otter-hero-animation.mp4",
      },
    };
    const template = parseFrontendTemplate(raw);
    const config = parseShopConfig(raw);
    assert.equal(template?.brandName, "Ashland Heat");
    assert.equal(template?.city, "Ashland");
    assert.deepEqual(config.selectedAutopilotLoops, raw.shopConfig.selectedAutopilotLoops);
    assert.equal(config.autopilotLoopCursor, 3);
    const loops = resolveAutopilotLoops({ shopConfig: config, niche: "hvac" });
    assert.deepEqual(loops, raw.shopConfig.selectedAutopilotLoops);
    assert.equal("selectedAutopilotLoops" in (template as object), false);
  });

  it("injects locked brand into the still prompt and keeps outreach simulated by default", () => {
    const prompt = brandedStillPrompt({
      category: "HVAC",
      brand: "Ashland Heat",
      color: "#2EE6D6",
      details: "van in a driveway",
    });
    assert.match(prompt, /Ashland Heat/);
    assert.match(prompt, /#2EE6D6/);
    assert.match(prompt, /HVAC/);
    assert.match(prompt, /van in a driveway/);
    const withLogo = brandedStillPrompt({
      category: "HVAC",
      brand: "Ashland Heat",
      color: "#2EE6D6",
      details: "",
      logoLocked: true,
    });
    assert.match(withLogo, /locked logo/);
    assert.equal(parseOutreachMode(undefined), "simulation");
    assert.equal(parseOutreachMode("simulation"), "simulation");
  });
});
