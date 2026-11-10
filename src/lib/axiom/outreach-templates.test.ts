import assert from "node:assert/strict";
import test from "node:test";
import {
  PLUMBING_EMERGENCY_HERO,
  PLUMBING_OUTREACH_TEMPLATES,
  outreachTemplatesForNiche,
  plumbingCampaignTokens,
  renderPlumbingOutreach,
} from "./outreach-templates.ts";

test("plumbing templates pin the emergency cinematic and storefront copy", () => {
  const draft = outreachTemplatesForNiche("plumbing");
  assert.equal(draft, PLUMBING_OUTREACH_TEMPLATES);
  assert.match(draft.text, /face-to-camera greeting/i);
  assert.match(draft.emailBody, /Eric greets you face-to-camera first/i);
});

test("plumbing campaign tokens resolve demo URL + greet + hero", () => {
  const tokens = plumbingCampaignTokens({
    origin: "https://axiom.example",
    businessName: "Rogue Rapid Plumbing",
    leadSlug: "rogue-rapid-plumbing-medford",
    city: "Medford",
    county: "Jackson County",
  });
  assert.equal(tokens.heroPath, PLUMBING_EMERGENCY_HERO);
  assert.equal(tokens.video, `https://axiom.example${PLUMBING_EMERGENCY_HERO}`);
  assert.match(tokens.url, /^https:\/\/axiom\.example\/t\/rogue-rapid-plumbing-medford\?/);
  assert.match(tokens.url, /greet=1/);
  assert.match(tokens.url, /hero=%2Fmedia%2Faxiom-plumber-hero\.mp4/);
  const sms = renderPlumbingOutreach("sms", tokens);
  assert.match(sms.body, /Rogue Rapid Plumbing/);
  assert.match(sms.body, /axiom-plumber-hero\.mp4/);
  assert.match(sms.body, /face-to-camera greeting/i);
});
