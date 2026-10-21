import assert from "node:assert/strict";
import test from "node:test";
import { buildFunnelPost } from "./funnel-post.ts";

const PAGE = "https://axiom.example/axiom-auto";

test("a contractor post names the city and the trade, and stays within 280", () => {
  const piece = buildFunnelPost({ niche: "contractor", city: "Grants Pass", pageUrl: PAGE });
  assert.match(piece.post, /Grants Pass/);
  assert.match(piece.post, /contractor/i);
  assert.ok(piece.post.length <= 280);
  assert.equal(piece.post.includes(PAGE), false);
  assert.match(piece.hashtags, /#GrantsPass/);
  assert.match(piece.hashtags, /#/);
});

test("a field shop uses the field preset voice", () => {
  const piece = buildFunnelPost({ niche: "field", city: "Grants Pass", pageUrl: PAGE });
  assert.match(piece.post, /van rolls/i);
  assert.match(piece.post, /Grants Pass/);
});
