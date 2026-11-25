import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NICHE_MEDIA } from "./media.ts";
import { applyDepthStudio, BLUR_STEPS, DAMP_STEPS, DEFAULT_HUD, DEPTH_STEPS, FORCE_STEPS, hudVars, parseHud, RADIUS_STEPS, sanitizeGradient, setHeroLayer } from "./hud.ts";

test("a saved headline line stays on the subheadline layer", () => {
  const hud = parseHud({ headline: "Night hunt", fade: 44 });
  assert.equal(hud.headline, "Night hunt");
  assert.equal(hud.layers.subheadline.text, "Night hunt");
  assert.equal(hud.layers.headline.text, "");
  assert.equal(hud.layers.cta_button.effect, "none");
  assert.equal(hud.fade, 44);
});

test("a text layer keeps its canvas position, font, gradient, and effect", () => {
  const hud = parseHud({
    layers: {
      headline: {
        text: "Ridge",
        position: { x: 12.24, y: 140 },
        fontFamily: "Playfair Display",
        colorMode: "gradient",
        solidColor: "112233",
        gradientCss: "linear-gradient(90deg, #112233 0%, #ffffff 100%)",
        effect: "flicker",
      },
      cta_button: { text: "Book", effect: "nope", fontFamily: "Comic Sans" },
    },
  });
  assert.equal(hud.layers.headline.text, "Ridge");
  assert.equal(hud.layers.headline.position.x, 12.2);
  assert.equal(hud.layers.headline.position.y, 100);
  assert.equal(hud.layers.headline.fontFamily, "Playfair Display");
  assert.equal(hud.layers.headline.colorMode, "gradient");
  assert.equal(hud.layers.headline.solidColor, "#F3F1EB");
  assert.equal(hud.layers.headline.effect, "flicker");
  assert.equal(hud.layers.cta_button.text, "Book");
  assert.equal(hud.layers.cta_button.fontFamily, "Outfit");
  assert.equal(hud.layers.cta_button.effect, "none");
});

test("gradient css stays a gradient function", () => {
  assert.equal(
    sanitizeGradient("linear-gradient(90deg, #112233, #ffffff)", "fallback"),
    "linear-gradient(90deg, #112233, #ffffff)",
  );
  assert.equal(sanitizeGradient("linear-gradient(90deg, red, url(https://evil))", "fallback"), "fallback");
  assert.equal(sanitizeGradient("red; background:url(x)", "fallback"), "fallback");
});

test("the five depth films open with a stronger studio look", () => {
  const tattoo = applyDepthStudio(DEFAULT_HUD, "tattoo");
  assert.equal(tattoo.wash, "ember");
  assert.equal(FORCE_STEPS[tattoo.force], 20);
  assert.equal(RADIUS_STEPS[tattoo.radius], 170);
  assert.equal(BLUR_STEPS[tattoo.blur], 40);
  assert.equal(DEPTH_STEPS[tattoo.depth], 1.25);
  assert.equal(DAMP_STEPS[tattoo.damp], 20);
  assert.equal(tattoo.rim, true);
  assert.equal(tattoo.scan, true);
  assert.equal(tattoo.glow, 75);
  assert.equal(applyDepthStudio(DEFAULT_HUD, "field").wash, "obsidian");
  assert.equal(applyDepthStudio(DEFAULT_HUD, "contractor").wash, "tide");
  assert.equal(applyDepthStudio(DEFAULT_HUD, "events").wash, "copper");
  assert.equal(applyDepthStudio(DEFAULT_HUD, "location").wash, "obsidian");
  assert.equal(applyDepthStudio(DEFAULT_HUD, "music").wash, DEFAULT_HUD.wash);
  assert.equal(tattoo.layers, DEFAULT_HUD.layers);
});

test("the five industry heroes bind their film and studio depth together", () => {
  const cases = ["contractor", "plumbing", "auto", "barber", "hvac"] as const;
  const catalog = readFileSync(new URL("./niches.ts", import.meta.url), "utf8");
  assert.match(catalog, /export const PUBLIC_NICHE_ORDER[\s\S]*CORE_PUBLIC_NICHES/);
  for (const niche of cases) {
    assert.match(NICHE_MEDIA[niche].heroVideoUrl, /\.mp4$/);
    const hud = applyDepthStudio(DEFAULT_HUD, niche);
    assert.equal(typeof hud.wash, "string");
    assert.equal(hud.rim, true);
    assert.equal(hud.scan, true);
    const vars = hudVars(hud, "") as Record<string, string>;
    assert.ok(vars["--displace"]);
    assert.ok(vars["--prox"]);
  }
});

test("editing the subheadline keeps the legacy headline field", () => {
  const next = setHeroLayer(DEFAULT_HUD, "subheadline", { ...DEFAULT_HUD.layers.subheadline, text: "Book the gate" });
  assert.equal(next.headline, "Book the gate");
  assert.equal(next.layers.headline.text, "");
  assert.notEqual(next.layers, DEFAULT_HUD.layers);
});
