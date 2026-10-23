import assert from "node:assert/strict";
import test from "node:test";
import { compileBrandMark, rippleTheme, themeSurface } from "./brand-studio.ts";
import { connectStanding } from "./merchant-pricing.ts";
import { followUpBody, followUpSchedule } from "./funnel.ts";
import { isShopNiche } from "./types.ts";
import { REGIONAL_VERTICALS } from "./regional-roster.ts";
import {
  appendPreviewLink,
  resolveDemoNiche,
  bodyHasPreviewLink,
  isHomePreviewCounty,
  outreachDestination,
  previewNicheSlug,
  previewStyleId,
  previewThemeId,
  shouldSendUnactivatedFollowUp,
  tenantPreviewUrl,
  unactivatedFollowUpAt,
} from "./preview-link.ts";

const ORIGIN = "https://axiom.example";

test("demo slugs accept niche ids and film names such as auto-repair", () => {
  assert.equal(resolveDemoNiche("auto-repair"), "field");
  assert.equal(resolveDemoNiche("auto_repair.mp4"), "field");
  assert.equal(resolveDemoNiche("photo"), "photo");
  assert.equal(resolveDemoNiche("field"), "field");
  assert.equal(resolveDemoNiche("not-a-real-trade-xyz"), null);
});

test("home counties get a personalized demo preview link", () => {
  for (const county of ["Jackson County", "josephine county", "DOUGLAS COUNTY"]) {
    const url = new URL(
      tenantPreviewUrl(ORIGIN, {
        businessName: "North Frame",
        tradeType: "Photography",
        county,
        leadSlug: "north-frame-medford",
        city: "Medford",
      }) ?? "",
    );
    assert.equal(url.origin, ORIGIN);
    assert.equal(url.pathname, "/demo/photo");
    assert.equal(url.searchParams.get("preview"), "true");
    assert.equal(url.searchParams.get("business"), "North Frame");
    assert.equal(url.searchParams.get("b"), "north-frame-medford");
  }
  assert.equal(
    tenantPreviewUrl(ORIGIN, { businessName: "North Frame", tradeType: "Photography", county: "Grand County" }),
    null,
  );
  assert.equal(isHomePreviewCounty("Lane County"), false);
});

test("a lead outside the home region keeps the homepage funnel", () => {
  const url = new URL(
    outreachDestination(ORIGIN, {
      businessName: "Glass Eddy",
      tradeType: "Guide services",
      county: "Grand County",
      leadSlug: "glass-eddy",
    }),
  );
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("preview"), null);
  assert.equal(url.searchParams.get("b"), "glass-eddy");
});

test("every preloaded category resolves to a demo niche", () => {
  for (const vertical of REGIONAL_VERTICALS) {
    const niche = previewNicheSlug(vertical.category);
    assert.equal(isShopNiche(niche), true, vertical.category);
    const url = new URL(
      tenantPreviewUrl(ORIGIN, {
        businessName: `${vertical.craft} Shop`,
        tradeType: vertical.category,
        county: "Jackson County",
      }) ?? "",
    );
    assert.equal(url.pathname, `/demo/${niche}`);
    assert.equal(url.searchParams.get("preview"), "true");
    assert.equal(url.searchParams.get("business"), `${vertical.craft} Shop`);
  }
});

test("the preview link is appended once to email and SMS bodies", () => {
  const link = "https://axiom.example/demo/photo?preview=true&business=North+Frame";
  const once = appendPreviewLink("The page is ready.", link);
  assert.equal(once, `The page is ready.\n${link}`);
  assert.equal(appendPreviewLink(once, link), once);
  assert.equal(bodyHasPreviewLink(once), true);
  assert.equal(appendPreviewLink("", link), link);
});

test("unactivated follow-up is 48 hours and skips claimed or opened accounts", () => {
  const start = new Date("2026-10-05T12:00:00.000Z");
  assert.equal(unactivatedFollowUpAt(start), "2026-10-07T12:00:00.000Z");
  const plan = followUpSchedule(start);
  assert.equal(plan.find((step) => step.day === 2)?.scheduledAt, "2026-10-07T12:00:00.000Z");
  assert.match(followUpBody(2, "sms", { text: "", emailSubject: "", emailBody: "" }), /\{url\}/);
  assert.match(followUpBody(2, "email", { text: "", emailSubject: "", emailBody: "" }), /unactivated/);
  assert.equal(shouldSendUnactivatedFollowUp({ step: 2, claimed: false, clicked: false }), true);
  assert.equal(shouldSendUnactivatedFollowUp({ step: 2, claimed: true, clicked: false }), false);
  assert.equal(shouldSendUnactivatedFollowUp({ step: 2, claimed: false, clicked: true }), false);
  assert.equal(shouldSendUnactivatedFollowUp({ step: 3, claimed: true, clicked: false }), true);
});

test("a preview link compiles a mark, a ripple theme, and a hero style", () => {
  const theme = rippleTheme(previewThemeId("North Frame"));
  assert.ok(theme);
  const mark = compileBrandMark("North Frame", "Photography · Medford", theme.accent);
  assert.match(mark.svg, /North Frame/);
  assert.equal(mark.svg.includes("<script>"), false);
  const surface = themeSurface(theme);
  assert.ok(surface["--glass-tint"]);
  assert.ok(surface["--ring-color"]);
  assert.ok(previewStyleId("North Frame"));
  assert.equal(previewThemeId("North Frame"), previewThemeId("North Frame"));
});

test("card charges stay locked until Stripe Connect is active", () => {
  assert.equal(connectStanding({ accountId: null, chargesEnabled: true }), "none");
  assert.equal(connectStanding({ accountId: "acct_123", chargesEnabled: false }), "pending");
  assert.equal(connectStanding({ accountId: "acct_123", chargesEnabled: true }), "active");
});
