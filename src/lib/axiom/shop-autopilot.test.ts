import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { shopCity } from "./avatar.ts";
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

test("owner test cron tick is session-auth and composites the city token", () => {
  assert.equal(shopCity("12 Main Street, Ashland, OR"), "Ashland");
  assert.equal(shopCity("Ashland, OR"), "Ashland");
  const server = readFileSync(join(root, "src/lib/axiom/server.ts"), "utf8");
  const tick = readFileSync(join(root, "src/lib/axiom/shop-autopilot.server.ts"), "utf8");
  const loops = readFileSync(join(root, "src/components/admin/autopilot-loops.tsx"), "utf8");
  assert.match(server, /runShopAutopilotTick = createServerFn\(\{\s*method: "POST"/);
  assert.match(server, /authMiddleware/);
  assert.match(tick, /shopCity\(shop\.address\)/);
  assert.match(tick, /composeAutopilotClip/);
  assert.match(tick, /caption: clip\.caption/);
  assert.match(tick, /sourceBrandedContentForShop/);
  assert.match(tick, /stockBrand/);
  assert.match(loops, /Run Test Cron Tick/);
  assert.doesNotMatch(tick, /OUTREACH_CRON_SECRET/);
});

test("0075 adds shops.autopilot_active without rewriting leads", () => {
  const sql = readFileSync(join(root, "migrations/0075_autopilot_active.sql"), "utf8");
  assert.match(sql, /add column if not exists autopilot_active boolean/);
  assert.doesNotMatch(sql, /preloaded_leads/);
});
