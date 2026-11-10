import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  connectStanding,
  dueNowCents,
  GEAR_GUARDIAN_BPS,
  gearGuardianFeeCents,
  priceForService,
  type MerchantPrice,
} from "./merchant-pricing.ts";

const row: MerchantPrice = {
  id: "1",
  shopSlug: "ridge",
  serviceName: "Haircut",
  pricingType: "deposit",
  priceAmount: 25,
  activeDealsBanner: "Weekday special",
  collectionMode: "online",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("merchant pricing", () => {
  it("marks a connected account that cannot charge as pending", () => {
    assert.equal(connectStanding({ accountId: "acct_1", chargesEnabled: false }), "pending");
    assert.equal(connectStanding({ accountId: "acct_1", chargesEnabled: true }), "active");
    assert.equal(connectStanding({ accountId: null, chargesEnabled: false }), "none");
  });

  it("matches a service name and charges the deposit online", () => {
    const hit = priceForService([row], " haircut ");
    assert.equal(hit?.pricingType, "deposit");
    assert.equal(dueNowCents(hit, 8000), 2500);
  });

  it("collects nothing online when the visit is in person", () => {
    assert.equal(dueNowCents({ ...row, collectionMode: "in_person" }, 8000), 0);
    assert.equal(dueNowCents(null, 4200), 4200);
  });

  it("takes 1.5 percent Gear Guardian on online due-now and never the full amount", () => {
    assert.equal(GEAR_GUARDIAN_BPS, 150);
    assert.equal(gearGuardianFeeCents(10_000), 150);
    assert.equal(gearGuardianFeeCents(100), 2);
    assert.equal(gearGuardianFeeCents(0), 0);
    assert.ok(gearGuardianFeeCents(50) < 50);
  });
});
