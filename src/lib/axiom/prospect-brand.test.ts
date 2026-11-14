import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAccent, sanitizeLogoUrl } from "./prospect-brand.ts";

test("accent accepts only hex and expands short form", () => {
  assert.equal(sanitizeAccent("#abc"), "#AABBCC");
  assert.equal(sanitizeAccent("  #c8f54a "), "#C8F54A");
  assert.equal(sanitizeAccent("red"), "");
  assert.equal(sanitizeAccent("javascript:alert(1)"), "");
  assert.equal(sanitizeAccent("#12345"), "");
});

test("logo accepts a site path or http(s) and drops the rest", () => {
  assert.equal(sanitizeLogoUrl("/media/mark.png"), "/media/mark.png");
  assert.equal(sanitizeLogoUrl("https://cdn.example/logo.png"), "https://cdn.example/logo.png");
  assert.equal(sanitizeLogoUrl("//cdn.example/logo.png"), "");
  assert.equal(sanitizeLogoUrl("/../secret"), "");
  assert.equal(sanitizeLogoUrl("javascript:alert(1)"), "");
});
