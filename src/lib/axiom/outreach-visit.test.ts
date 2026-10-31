import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { isOutreachVisit, prospectViewPath, resolveOutreachProspect } from "./outreach-visit.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("outreach visit routing", () => {
  it("treats lead and preview query keys as outreach, not the catalog homepage", () => {
    assert.equal(isOutreachVisit({}), false);
    assert.equal(isOutreachVisit({ utm_source: "regional" }), false);
    assert.equal(isOutreachVisit({ b: "ridge-line-roofing" }), true);
    assert.equal(isOutreachVisit({ preview: true, business: "Valley Air" }), true);
    assert.equal(isOutreachVisit({ greet: true, biz: "Main Street Plumbing" }), true);
  });

  it("injects the verified lead name, trade, and place from the preloaded row", () => {
    const prospect = resolveOutreachProspect(
      { b: "valley-air", city: "Medford" },
      {
        id: "lead_valleyair",
        slug: "valley-air",
        businessName: "Valley Air",
        category: "hvac",
        categoryLabel: "HVAC",
        city: "Medford",
        county: "Jackson County",
        nicheSlug: "hvac",
        location: "Medford · Jackson County",
        phone: "5415550100",
        email: "shop@valleyair.example",
        contactName: "Dana",
        logoUrl: null,
        accent: null,
      },
    );
    assert.equal(prospect.name, "Valley Air");
    assert.equal(prospect.owner, "Dana");
    assert.equal(prospect.niche, "hvac");
    assert.equal(prospect.trade, "HVAC");
    assert.equal(prospect.place, "Medford · Jackson County");
    assert.equal(prospect.phone, "5415550100");
  });

  it("keeps founder welcome and the single-trade HUD off the catalog grid", () => {
    const home = readFileSync(join(root, "src/routes/index.tsx"), "utf8");
    const founder = readFileSync(join(root, "src/components/founder-welcome-stage.tsx"), "utf8");
    const tenant = readFileSync(join(root, "src/app/[shopSlug]/page.tsx"), "utf8");
    const landing = readFileSync(join(root, "src/components/outreach-storefront.tsx"), "utf8");
    assert.match(home, /isOutreachVisit\(search\) && !search\.pitch/);
    assert.match(home, /<OutreachStorefront search=\{search\} \/>/);
    assert.doesNotMatch(landing, /AxiomCatalogHub/);
    assert.doesNotMatch(landing, /IndustryGallery/);
    assert.doesNotMatch(tenant, /AxiomCatalogHub/);
    assert.match(founder, /\/media\/welcome-to-axiom\.mp4/);
    assert.match(tenant, /OutreachTenantPage/);
    assert.match(tenant, /FounderWelcomeStage/);
    assert.match(landing, /OutreachTenantPage/);
    assert.doesNotMatch(landing, /AxiomCatalogHub/);
  });

  it("opens the prospect storefront on the lead slug, not the catalog homepage", () => {
    const path = prospectViewPath({
      leadSlug: "valley-air",
      leadId: "lead_valleyair",
      county: "Jackson County",
      city: "Medford",
      businessName: "Valley Air",
      trade: "HVAC",
    });
    const url = new URL(path, "https://axiom.example/");
    assert.equal(url.pathname, "/valley-air");
    assert.equal(url.searchParams.get("b"), "valley-air");
    assert.equal(url.searchParams.get("preview"), "true");
    assert.equal(url.searchParams.get("greet"), "1");
    assert.equal(url.searchParams.get("biz"), "Valley Air");
    assert.equal(url.searchParams.get("trade"), "HVAC");
    assert.equal(url.searchParams.get("lead"), "lead_valleyair");
    const desk = readFileSync(join(root, "src/components/master-desk.tsx"), "utf8");
    const visit = readFileSync(join(root, "src/lib/axiom/outreach-visit.ts"), "utf8");
    assert.match(desk, /Preview Prospect View/);
    assert.match(desk, /prospectViewPath/);
    assert.match(desk, /leadId: lead\.id/);
    assert.match(desk, /leadId: row\.id/);
    assert.match(desk, /leadId: link\.id/);
    assert.match(visit, /utm_source: "desk"/);
  });
});
