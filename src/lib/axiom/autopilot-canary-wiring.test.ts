import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseChunkSize, parseOutreachMode, parseTrickleSeconds } from "./outreach-queue.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("cron path ticks shop autopilot, outreach drain, and outbound engine together", () => {
  const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
  const route = readFileSync(join(root, "src/routes/api/autopilot.cron.ts"), "utf8");
  const queueServer = readFileSync(join(root, "src/lib/axiom/outreach-queue.server.ts"), "utf8");
  assert.match(route, /handleOutreachCron/);
  assert.match(route, /GET:/);
  assert.match(cron, /drainOutreachQueue/);
  assert.match(cron, /drainNurtureTouches/);
  assert.match(cron, /tickShopAutopilot/);
  const masterRoute = readFileSync(join(root, "src/app/api/master/autopilot/route.ts"), "utf8");
  assert.match(masterRoute, /tick_content/);
  assert.match(masterRoute, /cronTokenValid/);
  assert.match(masterRoute, /tickShopAutopilot/);
  assert.match(cron, /tickOutboundFromCron/);
  assert.match(cron, /maybeEvaluateOutreachHealthHourly/);
  assert.match(cron, /requireCronSecret/);
  assert.match(queueServer, /readOutreachConfig/);
  assert.match(queueServer, /OUTREACH_MODE/);
  assert.match(queueServer, /OUTREACH_TRICKLE_SECONDS/);
  assert.match(queueServer, /OUTREACH_CHUNK_SIZE/);
  assert.match(queueServer, /canDispatchNow/);
  assert.match(queueServer, /getNextTrickleDelayMs/);
});

test("simulation is the default outreach mode; live requires an explicit toggle", () => {
  assert.equal(parseOutreachMode(undefined), "simulation");
  assert.equal(parseOutreachMode(""), "simulation");
  assert.equal(parseOutreachMode("LIVE"), "live");
  assert.equal(parseOutreachMode("production"), "simulation");
});

test("queue config parsers expose trickle interval + chunk size for capped canary sends", () => {
  assert.equal(parseTrickleSeconds("45"), 45);
  assert.equal(parseChunkSize("8"), 8);
  assert.ok(parseTrickleSeconds(undefined) >= 1);
  assert.ok(parseChunkSize(undefined) >= 1);
});

test("shop social rotation persists cursor and composites niche trade copy", () => {
  const tick = readFileSync(join(root, "src/lib/axiom/shop-autopilot.server.ts"), "utf8");
  assert.match(tick, /resolveAutopilotLoops/);
  assert.match(tick, /pickAutopilotLoop/);
  assert.match(tick, /composeAutopilotClip/);
  assert.match(tick, /niche: shop\.niche/);
  assert.match(tick, /autopilotLoopCursor/);
  assert.match(tick, /shop_social_posts/);
  assert.match(tick, /sourceBrandedContentForShop/);
  assert.match(tick, /autopilot-content\.server/);
});

test("stock branding module sources legal media and stamps tenant brand plate", () => {
  const pure = readFileSync(join(root, "src/lib/axiom/autopilot-content.ts"), "utf8");
  const server = readFileSync(join(root, "src/lib/axiom/autopilot-content.server.ts"), "utf8");
  const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
  const pixabay = readFileSync(join(root, "src/lib/axiom/pixabay-fetcher.ts"), "utf8");
  assert.match(pure, /tradeKeywordsForNiche/);
  assert.match(pure, /composeBrandedStock/);
  assert.match(pure, /brandOverlayStamp/);
  assert.match(server, /fetchPexelsStock/);
  assert.match(server, /fetchUnsplashStock/);
  assert.match(server, /fetchPixabayTradeVideo/);
  assert.match(server, /tickAutopilotStockBranding/);
  assert.match(server, /sourceBrandedContentForShop/);
  assert.match(pure, /emergencySearchPhrase/);
  assert.match(pure, /tradeHashtags/);
  assert.match(pixabay, /pixabay\.com\/api\/videos/);
  assert.match(cron, /stockBranded/);
});

test("outbound engine respects daily SMS/email caps and OUTREACH_MODE gate", () => {
  const engine = readFileSync(join(root, "src/lib/axiom/outbound-engine.server.ts"), "utf8");
  const scheduler = readFileSync(join(root, "src/lib/axiom/outreach-scheduler.server.ts"), "utf8");
  assert.match(engine, /smsDailyCap/);
  assert.match(engine, /emailDailyCap/);
  assert.match(engine, /remainingCap/);
  assert.match(engine, /parseOutreachMode\(env\("OUTREACH_MODE"\)\)/);
  assert.match(scheduler, /canDispatchNow/);
  assert.match(scheduler, /getNextTrickleDelayMs/);
  assert.match(scheduler, /processOutreachQueue/);
});

test("automate preloads slot queue, enrolls sequences, and stays simulation-safe", () => {
  const autopilot = readFileSync(join(root, "src/lib/axiom/autopilot.server.ts"), "utf8");
  const queueServer = readFileSync(join(root, "src/lib/axiom/outreach-queue.server.ts"), "utf8");
  const card = readFileSync(join(root, "src/components/master/AutopilotCard.tsx"), "utf8");
  assert.match(autopilot, /export async function automateOutreach/);
  assert.match(autopilot, /planSmartSlotChunks/);
  assert.match(autopilot, /outreach_touches/);
  assert.match(autopilot, /followUpSchedule/);
  assert.match(autopilot, /outreachMayCallProviders|mode !== "live"|simulation/);
  assert.match(queueServer, /smsDailyCap/);
  assert.match(queueServer, /Held for daily/);
  assert.match(queueServer, /OUTREACH_TRICKLE_SLOTS/);
  assert.match(card, /Automate/);
  assert.match(card, /action: "automate"/);
});
