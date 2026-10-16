import assert from "node:assert/strict";
import test from "node:test";
import {
  estimateJob,
  formatAuditReport,
  impactScore,
  offerModel,
  parseLayout,
  quoteProfile,
  serviceLane,
  shelfFor,
} from "./storefront.ts";

test("an estimate stays inside the shop's own prices", () => {
  assert.deepEqual(estimateJob([4500, 12000], "residential"), { low: 4500, high: 12000 });
  assert.deepEqual(estimateJob([10000], "emergency"), { low: 13500, high: 13500 });
  assert.equal(estimateJob([0], "commercial"), null);
});

test("layout keeps every block and drops junk", () => {
  assert.deepEqual(parseLayout('["menu","staff"]'), ["menu", "staff", "estimate"]);
  assert.deepEqual(parseLayout("nope"), ["staff", "estimate", "menu"]);
});

test("job lanes read the service line", () => {
  assert.equal(serviceLane("Event detail", "The night of the event"), "commercial");
  assert.equal(serviceLane("Same day call", "Urgent"), "emergency");
  assert.equal(serviceLane("Signature cut", "The house standard"), "residential");
});

test("each niche quotes the way that trade actually sells", () => {
  assert.deepEqual(
    quoteProfile("contractor").lanes.map((lane) => lane.label),
    ["Residential", "Commercial", "Emergency"],
  );
  assert.equal(quoteProfile("salon").photo, "required");
  assert.deepEqual(
    quoteProfile("salon").lanes.map((lane) => lane.label),
    ["Cut", "Color", "Correction"],
  );
  assert.deepEqual(
    quoteProfile("clean").lanes.map((lane) => lane.label),
    ["Standard", "Deep clean", "Move-out"],
  );
  assert.deepEqual(
    quoteProfile("guide").lanes.map((lane) => lane.label),
    ["Shared", "Private", "Charter"],
  );
  assert.equal(quoteProfile("wellness").photo, "off");
  assert.equal(offerModel("location"), "service");
  assert.equal(offerModel("retail"), "product");
  const shelf = shelfFor("retail");
  assert.equal(shelf.length, 3);
  assert.ok(shelf.every((item) => item.stock > 0 && item.imageUrl === "/media/heroes/retail.svg"));
  assert.equal(shelfFor("salon").length, 0);
});

test("an audit report tags the bracket without the photo", () => {
  assert.equal(impactScore(1.45, 2800, 5200), 73);
  const body = formatAuditReport({
    name: "Ada",
    channel: "text",
    contact: "541-555-0100",
    lane: "Color",
    lowCents: 2800,
    highCents: 5200,
    impact: 73,
  });
  assert.match(body, /Lane Color/);
  assert.match(body, /Text the report to 541-555-0100/);
  assert.match(body, /photo stayed on their device/);
});
