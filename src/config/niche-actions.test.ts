import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG_NICHES } from "./catalog.ts";
import { assertNicheActionMap, getNicheActions, NICHE_ACTION_MAP } from "./niche-actions.ts";

test("every catalog niche has explicit actions", () => {
  assertNicheActionMap();
  assert.equal(Object.keys(NICHE_ACTION_MAP).length, CATALOG_NICHES.length);
  for (const id of CATALOG_NICHES) {
    const actions = getNicheActions(id);
    assert.ok(actions, id);
    assert.notEqual(actions.primaryCta, "Book");
    assert.equal(actions.services.length, 3);
  }
  assert.equal(getNicheActions("bow-tech")?.primaryCta, "Book archery tuning");
  assert.equal(getNicheActions("auto")?.services[0]?.title, "Diagnostic sweep");
  assert.match(getNicheActions("electrical")?.secondaryCta ?? "", /high-voltage grid/i);
  assert.equal(getNicheActions("fitness"), undefined);
  assert.equal(getNicheActions("wellness"), undefined);
  assert.equal(getNicheActions(""), undefined);
});
