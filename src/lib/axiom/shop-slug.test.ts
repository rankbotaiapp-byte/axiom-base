import assert from "node:assert/strict";
import test from "node:test";
import { publicShopSlug } from "./shop-slug.ts";

test("malformed shop addresses never reach SQL", () => {
  assert.equal(publicShopSlug("ridge-bow"), "ridge-bow");
  assert.equal(publicShopSlug("  Ridge-Bow  "), "ridge-bow");
  assert.equal(publicShopSlug("../etc/passwd"), null);
  assert.equal(publicShopSlug("shop' or 1=1"), null);
  assert.equal(publicShopSlug(""), null);
  assert.equal(publicShopSlug("a".repeat(81)), null);
  assert.equal(publicShopSlug("has space"), null);
  assert.equal(publicShopSlug(null), null);
});
