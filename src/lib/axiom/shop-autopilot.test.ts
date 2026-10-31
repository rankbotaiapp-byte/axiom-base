import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isAutopilotArmed, parseAutopilotActive } from "./shop-autopilot.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("autopilot_active is the armed flag; AI content is a fallback", () => {
  assert.equal(isAutopilotArmed(true), true);
  assert.equal(isAutopilotArmed("true"), true);
  assert.equal(isAutopilotArmed(false), false);
  assert.equal(parseAutopilotActive({ autopilot_active: true, ai_content_autopilot: false }), true);
  assert.equal(parseAutopilotActive({ autopilot_active: false, ai_content_autopilot: true }), true);
  assert.equal(parseAutopilotActive({ autopilot_active: false, ai_content_autopilot: false }), false);
});

test("0075 adds shops.autopilot_active without rewriting leads", () => {
  const sql = readFileSync(join(root, "migrations/0075_autopilot_active.sql"), "utf8");
  assert.match(sql, /add column if not exists autopilot_active boolean/);
  assert.doesNotMatch(sql, /preloaded_leads/);
});
