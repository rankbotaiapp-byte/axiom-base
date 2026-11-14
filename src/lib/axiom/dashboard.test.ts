import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_DASHBOARD,
  effectiveDashboard,
  parseDashboardConfig,
} from "./dashboard.ts";

const shop = parseDashboardConfig({ sections: ["schedule", "hours"] });
const employee = parseDashboardConfig({ sections: ["portfolio"] });

describe("dashboard override", () => {
  it("uses the employee layout when the shop override is off", () => {
    assert.deepEqual(effectiveDashboard(false, shop, employee), employee);
  });

  it("replaces every employee layout when the shop override is on", () => {
    assert.deepEqual(effectiveDashboard(true, shop, employee), shop);
  });

  it("keeps an empty employee layout until the override supplies the shop one", () => {
    const empty = parseDashboardConfig({ sections: [] });
    assert.deepEqual(effectiveDashboard(false, shop, empty).sections, []);
    assert.deepEqual(effectiveDashboard(true, shop, empty), shop);
  });

  it("drops unknown sections and duplicate entries", () => {
    const parsed = parseDashboardConfig({
      sections: ["hours", "nope", "hours", "schedule"],
    });
    assert.deepEqual(parsed.sections, ["hours", "schedule"]);
  });

  it("falls back when the stored value is missing", () => {
    assert.deepEqual(parseDashboardConfig(null), DEFAULT_DASHBOARD);
    assert.deepEqual(parseDashboardConfig("{"), DEFAULT_DASHBOARD);
  });
});
