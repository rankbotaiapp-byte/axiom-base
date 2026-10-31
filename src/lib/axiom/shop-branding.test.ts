import assert from "node:assert/strict";
import test from "node:test";
import { brandDnaComplete, brandPromptLayer, parseBrandDna } from "./shop-branding.ts";

test("brand DNA requires a logo, palette, and tagline before generation", () => {
  const empty = parseBrandDna({});
  assert.equal(brandDnaComplete(empty), false);
  const locked = parseBrandDna({
    logoDataUrl: "data:image/png;base64,aaaa",
    primary: "#1a2b3c",
    secondary: "nope",
    font: "mono",
    tagline: "Same-day service",
  });
  assert.equal(locked.primary, "#1A2B3C");
  assert.equal(locked.secondary, "#F3F1EB");
  assert.equal(locked.font, "mono");
  assert.equal(locked.locked, true);
  assert.equal(brandDnaComplete(locked), true);
  assert.match(brandPromptLayer(locked, "Ridge Cut"), /Ridge Cut/);
  assert.match(brandPromptLayer(locked, "Ridge Cut"), /#1A2B3C/);
});
