import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PLUMBING_OUTREACH_TEMPLATES } from "./outreach-templates.ts";
import { OUTREACH_STRATEGIES, followUpBody } from "./funnel.ts";
import { SMS_DRIP_STEPS } from "./sms-drip.ts";
import { DEFAULT_COMPETITOR_LAND_GRAB } from "./competitor-land-grab.ts";
import { DEFAULT_PLUMBING_STOREFRONT } from "./plumbing-storefront.ts";
import { brandSafeReply } from "./autopilot-engagement.ts";
import { PRICING } from "../axiom-landing/pricing.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const JARGON = /headless|micro-SaaS|API dispatch|tenant provisioning|face-to-camera|shop loop|HeyGen|Live Diagnostic Telemetry|pre-built storefront/i;

function src(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

test("plumber-facing landing and desk copy stays in plain English", () => {
  const surfaces = [
    src("src/components/axiom-landing/Hero.tsx"),
    src("src/components/axiom-landing/HowItWorks.tsx"),
    src("src/components/axiom-landing/BrutalTruth.tsx"),
    src("src/components/axiom-landing/FieldDominanceTiers.tsx"),
    src("src/components/axiom-landing/FaqAndCta.tsx"),
    src("src/components/tenant-dashboard/PlumberTenantDashboard.tsx"),
    src("src/components/tenant-dashboard/dispatch-phone-lock.tsx"),
    src("src/lib/axiom/outreach-templates.ts"),
    src("src/lib/axiom/sms-drip.ts"),
  ];
  for (const file of surfaces) {
    assert.doesNotMatch(file, JARGON);
  }

  const hero = src("src/components/axiom-landing/Hero.tsx");
  assert.match(hero, /24\/7 automated emergency lead capture/);
  assert.match(hero, /Missed-call recovery for your crew/);
  assert.match(hero, /Instant phone alerts when an after-hours job drops/);

  assert.match(PLUMBING_OUTREACH_TEMPLATES.text, /24\/7 automated emergency lead capture/);
  assert.match(PLUMBING_OUTREACH_TEMPLATES.emailBody, /done-for-you social presence/i);
  assert.match(SMS_DRIP_STEPS[0]?.template ?? "", /booking page/);
  assert.match(DEFAULT_COMPETITOR_LAND_GRAB.subhead, /missed-call recovery/);
  assert.match(DEFAULT_PLUMBING_STOREFRONT.landGrab.subhead, /missed-call recovery/);
  assert.match(src("src/lib/axiom/tenant-overlay.ts"), /title: "Camera in the line"/);
  assert.match(PRICING.lifetime.blurb, /missed-call recovery/);
  assert.match(OUTREACH_STRATEGIES[0]?.emailBody ?? "", /Your booking page/);
  assert.doesNotMatch(OUTREACH_STRATEGIES[0]?.emailBody ?? "", /pre-built storefront/);
  assert.match(followUpBody(3, "sms", { text: "sms hook", emailSubject: "", emailBody: "" }), /after-hours jobs/);
});

test("checkout, social, webhook, and live SMS dispatch stay wired", () => {
  const checkout = src("src/lib/axiom/tenant-billing.functions.ts");
  const hook = src("src/components/plumbing/use-plumbing-checkout.ts");
  const tenant = src("src/routes/t/$slug.tsx");
  const publish = src("src/lib/axiom/social-publish.server.ts");
  const compose = src("src/lib/axiom/autopilot-content.ts");
  const engagement = src("src/lib/axiom/autopilot-engagement.server.ts");
  const desk = src("src/components/tenant-dashboard/PlumberTenantDashboard.tsx");
  const lock = src("src/lib/axiom/dispatch.server.ts");

  assert.match(checkout, /export const startTenantStorefrontCheckout/);
  assert.match(hook, /startTenantStorefrontCheckout/);
  assert.match(tenant, /leadSlug/);
  assert.match(publish, /persistDeliveryToSupabase/);
  assert.match(compose, /composeSocialPublishJob/);
  assert.match(publish, /graph\.facebook\.com|googleapis\.com/);
  assert.match(engagement, /classifyWithGrok|notifyShop|brandSafeReply/);
  assert.match(engagement, /Booking page /);
  assert.match(desk, /TestLiveDispatchButton/);
  assert.match(desk, /tenant-preview-bar/);
  assert.match(lock, /notify_phone/);
  assert.match(lock, /Skip sample numbers like 555/);

  const reply = brandSafeReply({
    shopName: "Accurate Plumbing",
    slug: "accurate-plumbing",
    origin: "https://axiom.example",
    intent: "booking",
  });
  assert.match(reply, /\/t\/accurate-plumbing/);
  assert.match(reply, /crew gets a text/);
});
