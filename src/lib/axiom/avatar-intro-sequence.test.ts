import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { demoStorefrontPath } from "./outreach-niche-batch.ts";
import { plumbingCampaignTokens } from "./outreach-templates.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("avatar intro sequence", () => {
  it("locks HeyGen axiom-greeting as the primary pre-roll asset", () => {
    const founder = readFileSync(join(root, "src/components/founder-welcome-stage.tsx"), "utf8");
    assert.match(founder, /FOUNDER_WELCOME_SRC = "\/media\/axiom-greeting\.mp4"/);
    assert.match(founder, /FOUNDER_WELCOME_SRC_FALLBACK = "\/media\/welcome-to-axiom\.mp4"/);
    assert.match(founder, /FOUNDER_WELCOME_POSTER = "\/media\/axiom-greeting-poster\.jpg"/);
    assert.match(founder, /data-axiom-pre-roll="avatar-greeting"/);
  });

  it("keeps FounderWelcomeStage above the niche trade stage in outreach layout", () => {
    const tenant = readFileSync(join(root, "src/routes/t/$slug.tsx"), "utf8");
    assert.match(tenant, /greet=\{Boolean\(search\.greet\)\}/);
    assert.match(tenant, /PlumberOutreachLive/);
    const landing = readFileSync(join(root, "src/components/plumbing/plumber-outreach-landing.tsx"), "utf8");
    assert.match(landing, /src="\/media\/axiom-greeting\.mp4"/);
    assert.match(landing, /src="\/media\/axio-plumber-hero\.mp4"|HERO_FILM = "\/media\/axio-plumber-hero\.mp4"/);
  });

  it("keeps avatar greeting above the emergency plumbing storefront", () => {
    const demo = readFileSync(join(root, "src/routes/demo/plumbing.tsx"), "utf8");
    assert.match(demo, /PlumberOutreachLive/);
    assert.match(demo, /greet=\{Boolean\(search\.greet\)\}/);
    assert.doesNotMatch(demo, /EmergencyPlumbingStorefront/);
    assert.doesNotMatch(demo, /OutreachStorefront/);
  });

  it("injects greet=1 on every demo storefront outreach URL", () => {
    const path = demoStorefrontPath({
      niche: "plumbing",
      businessName: "Rogue Rapid Plumbing",
      leadSlug: "rogue-rapid",
      city: "Medford",
    });
    assert.match(path, /greet=1/);
    assert.match(path, /hero=%2Fmedia%2Faxio-plumber-hero\.mp4/);

    const tokens = plumbingCampaignTokens({
      origin: "https://axiom.example",
      businessName: "Rogue Rapid Plumbing",
      city: "Medford",
      county: "Jackson County",
    });
    assert.match(tokens.url, /greet=1/);
  });
});
