import assert from "node:assert/strict";
import test from "node:test";
import { cameraMotion, parseIntroPreset, presentationForIntro } from "./intro.ts";
import { parseTradeProfile } from "./trade-layout.ts";
import {
  RIPPLE_THEMES,
  compileBrandMark,
  parseBrandStudio,
  rippleTheme,
  themeSurface,
} from "./brand-studio.ts";

test("a header and tagline compile a fused initial mark", () => {
  const mark = compileBrandMark("North Frame", "Field notes", "#3D7EFF");
  assert.equal(mark.initials, "NF");
  assert.equal(mark.svg.includes("<script"), false);
  assert.equal(mark.svg.includes("North Frame"), true);
  assert.equal(mark.svg.includes("Field notes"), true);
  assert.equal(mark.svg.includes(">N<"), true);
  assert.equal(mark.svg.includes(">F<"), true);
  assert.equal(mark.dataUrl.startsWith("data:image/svg+xml"), true);
  const hostile = compileBrandMark("<script>alert(1)</script>", "ok");
  assert.equal(hostile.svg.includes("<script"), false);
  assert.equal(hostile.svg.includes("&lt;script&gt;"), true);
});

test("ripple themes bind the ring, the glass, and the touch accent", () => {
  assert.deepEqual(
    RIPPLE_THEMES.map((theme) => theme.label),
    ["Electric Blue Metallic", "Fuchsia Neon", "Metallic Silver", "Gold/Amber", "Crimson Red"],
  );
  for (const theme of RIPPLE_THEMES) {
    const surface = themeSurface(theme);
    assert.equal(surface["--neon"], theme.accent);
    assert.equal(surface["--ring-color"], theme.ring);
    assert.equal(surface["--glass-tint"], theme.metal);
    assert.equal(surface["--ripple"], theme.accent);
    assert.notEqual(surface["--neon"], surface["--ring-color"]);
  }
  assert.equal(rippleTheme("nope"), null);
});

test("a branding payload keeps the mark text and drops an unknown theme", () => {
  const studio = parseBrandStudio({
    header: "  Ridge Outfitters  ",
    tagline: "Night hunt",
    theme: "crimson",
    presentation: "hud-lock",
  });
  assert.equal(studio.header, "Ridge Outfitters");
  assert.equal(studio.tagline, "Night hunt");
  assert.equal(studio.theme, "crimson");
  assert.equal(studio.presentation, "hud-lock");
  const junk = parseBrandStudio({ header: "<b>Hi</b>", theme: "purple", presentation: "spin" });
  assert.equal(junk.theme, "");
  assert.equal(junk.presentation, "");
  const saved = parseTradeProfile("photo", { studio });
  assert.equal(saved.studio.header, "Ridge Outfitters");
  assert.equal(saved.studio.theme, "crimson");
  assert.equal(compileBrandMark(saved.studio.header, saved.studio.tagline, "#E0233A").initials, "RO");
});

test("presentation styles save as intro presets and move differently", () => {
  assert.equal(parseIntroPreset("hud-lock"), "hud-lock");
  assert.equal(parseIntroPreset("orbital-pulse"), "orbital-pulse");
  assert.equal(parseIntroPreset("kenburns"), "kenburns");
  assert.equal(presentationForIntro("kenburns"), "cinematic-pan");
  const motions = ["cinematic-pan", "hud-lock", "split-velocity", "orbital-pulse"].map((id) =>
    JSON.stringify(cameraMotion(parseIntroPreset(id), 45)),
  );
  assert.equal(new Set(motions).size, 4);
});
