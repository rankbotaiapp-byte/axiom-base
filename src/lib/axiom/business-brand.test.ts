import assert from "node:assert/strict";
import test from "node:test";
import {
  BUSINESS_PAGE_CAP,
  BUSINESS_PAGE_DEFAULT,
  clampPageLimit,
  decodePageCursor,
  encodePageCursor,
  mapBusinessToTemplateBrand,
  pageWindow,
  parseBusinessRef,
  parseKeyList,
  previewUrlForBusiness,
  slugPrefixBounds,
  type BusinessBrandRecord,
} from "./business-brand.ts";

function sample(overrides: Partial<BusinessBrandRecord> = {}): BusinessBrandRecord {
  return {
    id: "lead_abc123",
    slug: "glass-eddy",
    businessName: "Glass Eddy",
    category: "guide",
    categoryLabel: "Guide services",
    city: "Merlin",
    county: "Josephine County",
    nicheSlug: "guide",
    location: "Merlin · Josephine County",
    phone: "555-010-0199",
    email: "desk@example.com",
    contactName: "Ada Quinn",
    logoUrl: null,
    accent: null,
    ...overrides,
  };
}

test("mapper keeps hex accents and drops css", () => {
  const hex = mapBusinessToTemplateBrand(sample({ accent: "#abc" }));
  assert.equal(hex.accent, "#AABBCC");
  assert.equal(hex.businessName, "Glass Eddy");
  assert.equal(hex.category, "guide");
  assert.equal(hex.contactPhone, "555-010-0199");
  assert.equal(mapBusinessToTemplateBrand(sample({ accent: "red" })).accent, null);
  assert.equal(mapBusinessToTemplateBrand(sample({ accent: "expression(alert(1))" })).accent, null);
  assert.equal(mapBusinessToTemplateBrand(sample({ accent: "#12345" })).accent, null);
  assert.equal(mapBusinessToTemplateBrand(sample()).accent, null);
});

test("mapper drops unsafe logos and control characters", () => {
  const brand = mapBusinessToTemplateBrand(
    sample({
      logoUrl: "javascript:alert(1)",
      businessName: "Glass\u0000Eddy",
      contactName: "Ada\nQuinn",
    }),
  );
  assert.equal(brand.logoUrl, "");
  assert.equal(brand.businessName, "GlassEddy");
  assert.equal(brand.contactName, "AdaQuinn");
  assert.equal(mapBusinessToTemplateBrand(sample({ logoUrl: "/media/mark.png" })).logoUrl, "/media/mark.png");
});

test("page size defaults to 50 and caps at 100", () => {
  assert.equal(clampPageLimit(undefined), BUSINESS_PAGE_DEFAULT);
  assert.equal(clampPageLimit(""), 50);
  assert.equal(clampPageLimit(40), 40);
  assert.equal(clampPageLimit("80"), 80);
  assert.equal(clampPageLimit(1000), BUSINESS_PAGE_CAP);
  assert.equal(clampPageLimit(0), 1);
  assert.equal(clampPageLimit("nope"), 50);
});

test("id batches over 100 are rejected", () => {
  const ids = Array.from({ length: 101 }, (_, index) => `lead_${index}`);
  assert.throws(() => parseKeyList(ids, "id"), /capped at 100/);
  assert.deepEqual(parseKeyList(["lead_a", "lead_a", ""], "id"), ["lead_a"]);
  assert.throws(() => parseKeyList(["not a slug"], "slug"), /Unknown business/);
});

test("preview urls use the desk b param and omit contact lines", () => {
  const url = new URL(previewUrlForBusiness("https://axiom.example/", sample()));
  assert.equal(url.origin, "https://axiom.example");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("b"), "glass-eddy");
  assert.equal(url.searchParams.get("lead"), "lead_abc123");
  assert.equal(url.searchParams.get("utm_source"), "desk");
  assert.equal(url.searchParams.get("biz"), "Glass Eddy");
  assert.equal(url.searchParams.get("county"), "Josephine County");
  assert.equal(url.searchParams.get("city"), "Merlin");
  assert.equal(url.searchParams.get("trade"), "Guide services");
  assert.equal(url.searchParams.get("phone"), null);
  assert.equal(url.searchParams.get("email"), null);
  assert.equal(url.searchParams.has("logo"), false);
});

test("slug prefix bounds stay on the lead_slug index range", () => {
  const bounds = slugPrefixBounds("glass");
  assert.ok(bounds);
  if (!bounds) return;
  assert.equal(bounds.start, "glass");
  assert.equal("glass-eddy" >= bounds.start && "glass-eddy" < bounds.end, true);
  assert.equal("glast" < bounds.end, false);
  assert.equal(slugPrefixBounds("Glass Eddy"), null);
  assert.equal(slugPrefixBounds("../secret"), null);
});

test("cursors are tied to the sort column and pages stop at the cap", () => {
  assert.equal(encodePageCursor("id", "lead_abc"), "id:lead_abc");
  assert.equal(decodePageCursor("id:lead_abc", "id"), "lead_abc");
  assert.equal(decodePageCursor("slug:glass-eddy", "id"), null);
  assert.equal(decodePageCursor("id:has space", "id"), null);
  const rows = [
    { id: "a", slug: "alpha" },
    { id: "b", slug: "beta" },
    { id: "c", slug: "gamma" },
  ];
  const page = pageWindow(rows, 2, "id");
  assert.deepEqual(page.rows.map((row) => row.id), ["a", "b"]);
  assert.equal(page.nextCursor, "id:b");
  assert.equal(pageWindow(rows, 50, "slug").nextCursor, null);
  const ref = parseBusinessRef({ slug: "glass-eddy" });
  assert.equal("slug" in ref ? ref.slug : "", "glass-eddy");
  assert.throws(() => parseBusinessRef({ id: "lead_a", slug: "glass-eddy" }), /id or a slug/);
});
