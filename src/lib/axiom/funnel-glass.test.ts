import assert from "node:assert/strict";
import test from "node:test";
import { funnelOfferings, funnelShards, glassArmedForLead, leadGlassCopy } from "./funnel-glass.ts";

test("glass stays off until a verified preloaded lead is on file", () => {
  assert.equal(glassArmedForLead(null), false);
  assert.equal(glassArmedForLead(undefined), false);
  assert.equal(leadGlassCopy(null).armed, false);
  assert.equal(
    glassArmedForLead({ id: "lead_missing", slug: "", businessName: "Night Key" }),
    false,
  );
  assert.equal(
    glassArmedForLead({ id: "", slug: "night-key", businessName: "Night Key" }),
    false,
  );
  assert.equal(
    glassArmedForLead({ id: "lead_ok", slug: "night-key", businessName: "   " }),
    false,
  );
  const verified = leadGlassCopy({
    id: "lead_ok",
    slug: "night-key",
    businessName: "Night Key Mobile",
    city: "Medford",
    county: "Jackson County",
    categoryLabel: "Locksmith",
  });
  assert.equal(verified.armed, true);
  assert.equal(verified.businessName, "Night Key Mobile");
  assert.equal(verified.city, "Medford");
  assert.equal(verified.hint, "Locksmith");
});

test("shards carry the shop, the city, and the trade offerings", () => {
  const shards = funnelShards({
    businessName: "North Timber",
    city: "Medford",
    county: "Jackson County",
    niche: "landscaper",
  });
  assert.equal(shards[0]?.title, "North Timber");
  assert.equal(shards.some((shard) => shard.title === "Medford"), true);
  assert.equal(shards.some((shard) => shard.title === "Defensible space"), true);
  assert.equal(shards.some((shard) => shard.title === "AI lead capture"), true);
  assert.equal(funnelOfferings("counsel").includes("Billing pipelines"), true);
});
