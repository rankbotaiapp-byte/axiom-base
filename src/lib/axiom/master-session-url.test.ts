import assert from "node:assert/strict";
import test from "node:test";
import { stripMasterKeyFromHref } from "./master-session-url.ts";

test("strips key immediately while keeping other params and hash", () => {
  const { key, next } = stripMasterKeyFromHref(
    "https://axiom.local/master?tab=leads&key=preview-session-xx&ref=desk#pulse",
  );
  assert.equal(key, "preview-session-xx");
  assert.equal(next, "/master?tab=leads&ref=desk#pulse");
});

test("no-op when key is absent", () => {
  const { key, next } = stripMasterKeyFromHref("https://axiom.local/master?tab=leads#pulse");
  assert.equal(key, "");
  assert.equal(next, "/master?tab=leads#pulse");
});

test("strips a lone key query", () => {
  const { key, next } = stripMasterKeyFromHref("https://axiom.local/master?key=aaaaaaaaaaaaaaaa");
  assert.equal(key, "aaaaaaaaaaaaaaaa");
  assert.equal(next, "/master");
});
