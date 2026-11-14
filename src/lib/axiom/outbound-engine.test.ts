import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MASTER_FUNNELS, renderOutreachMessage } from "./funnel.ts";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  ENGINE_DATASET_BATCH_MAX,
  ENGINE_DATASET_BATCH_SIZE,
  EngineBatchTimeoutError,
  aggregateEngineBatch,
  chunkArray,
  clampDailyCap,
  clickThroughRate,
  coerceEngineBatch,
  defaultEngineState,
  deliveryRate,
  emptyEngineBatch,
  engineBatchHasMore,
  engineSupabaseRange,
  engineTickLine,
  parseDatasetBatchSize,
  parseDatasetOffset,
  parseEnginePaging,
  parseEngineStrategy,
  pickEngineChannel,
  regionForCounty,
  remainingCap,
  throttleCount,
  withBatchTimeout,
} from "./outbound-engine.ts";
import { outreachMayCallProviders, parseOutreachMode } from "./outreach-queue.ts";

test("master funnels keep three ranked angles", () => {
  assert.equal(MASTER_FUNNELS.length, 3);
  assert.deepEqual(
    MASTER_FUNNELS.map((item) => item.letter),
    ["A", "B", "C"],
  );
  assert.equal(MASTER_FUNNELS[0]?.id, "visual-hook");
  assert.equal(MASTER_FUNNELS[1]?.id, "speed-to-lead");
  assert.equal(MASTER_FUNNELS[2]?.id, "staff-portfolio");
});

test("double-brace funnel tokens fill business, city, and preview", () => {
  const message = renderOutreachMessage("{{business_name}} in {{city}}\n{{preview_link}}", {
    business: "Rogue Iron",
    url: "https://axiom.example/demo/auto?preview=true",
    city: "Medford",
  });
  assert.equal(message, "Rogue Iron in Medford\nhttps://axiom.example/demo/auto?preview=true");
});

test("daily caps clamp and remaining room never goes negative", () => {
  assert.equal(clampDailyCap(-4, DEFAULT_SMS_DAILY_CAP), 0);
  assert.equal(clampDailyCap(900, DEFAULT_EMAIL_DAILY_CAP), 500);
  assert.equal(clampDailyCap("nope", 40), 40);
  assert.equal(remainingCap(12, 40), 28);
  assert.equal(remainingCap(80, 40), 0);
  assert.equal(throttleCount(5, 2), 2);
  assert.equal(throttleCount(5, 0), 0);
});

test("delivery and CTR stay in range", () => {
  assert.equal(deliveryRate(8, 2), 0.8);
  assert.equal(deliveryRate(0, 0), 0);
  assert.equal(clickThroughRate(5, 10), 0.5);
  assert.equal(clickThroughRate(20, 10), 1);
  assert.equal(clickThroughRate(3, 0), 0);
});

test("simulation logs never call providers; live is an exact token", () => {
  assert.equal(parseOutreachMode(undefined), "simulation");
  assert.equal(parseOutreachMode("true"), "simulation");
  assert.equal(parseOutreachMode("prod"), "simulation");
  assert.equal(parseOutreachMode("live"), "live");
  assert.equal(outreachMayCallProviders(parseOutreachMode("simulation")), false);
  assert.equal(outreachMayCallProviders(parseOutreachMode("live")), true);
  assert.equal(engineTickLine({ live: false, channel: "sms", business: "Rogue Iron" }).status, "logged");
  assert.match(engineTickLine({ live: false, channel: "sms", business: "Rogue Iron" }).summary, /simulation/);
  assert.equal(engineTickLine({ live: true, channel: "email", business: "Rogue Iron" }).status, "queued");
  assert.equal(throttleCount(5, remainingCap(38, 40)), 2);
});

test("engine starts paused on the visual hook", () => {
  const state = defaultEngineState();
  assert.equal(state.paused, true);
  assert.equal(state.strategyId, "visual-hook");
  assert.equal(parseEngineStrategy("staff-portfolio"), "staff-portfolio");
  assert.equal(parseEngineStrategy("unknown"), "visual-hook");
});

test("counties map onto Oregon Texas Florida", () => {
  assert.equal(regionForCounty("Jackson County"), "Oregon");
  assert.equal(regionForCounty("Harris County"), "Texas");
  assert.equal(regionForCounty("Miami-Dade"), "Florida");
  assert.equal(regionForCounty("King County"), "Other");
});

test("dataset dispatch pages 20,330 records into 100–250 row ranges", () => {
  assert.equal(parseDatasetOffset(-4), 0);
  assert.equal(parseDatasetOffset("200"), 200);
  assert.equal(parseDatasetBatchSize(undefined), ENGINE_DATASET_BATCH_SIZE);
  assert.equal(parseDatasetBatchSize(0), 1);
  assert.equal(parseDatasetBatchSize(900), ENGINE_DATASET_BATCH_MAX);
  assert.deepEqual(engineSupabaseRange(0, 100), { from: 0, to: 99 });
  assert.deepEqual(engineSupabaseRange(200, 100), { from: 200, to: 299 });
  assert.equal(engineBatchHasMore(101, 100), true);
  assert.equal(engineBatchHasMore(100, 100), false);
});

test("outbound-engine route pages the dataset and logs batch failures", () => {
  const route = readFileSync(new URL("../../app/api/master/outbound-engine/route.ts", import.meta.url), "utf8");
  assert.match(route, /ENGINE_ROUTE_TIMEOUT_MS/);
  assert.match(route, /hasMore/);
  assert.match(route, /console\.error/);
  assert.match(route, /failingRowIds/);
  assert.match(route, /coerceEngineBatch/);
  assert.match(route, /parseEnginePaging/);
  assert.match(route, /elapsedMs/);
  assert.match(route, /status: "idle"/);
  assert.match(route, /ready: true/);
  assert.match(route, /decorateLiveDeskPayload/);
  assert.match(route, /liveDeskState/);
  assert.match(route, /totalCatalog/);
  assert.doesNotMatch(route, /state: ['"]ready['"]/);
  assert.doesNotMatch(route, /from '@tanstack\/start'/);
  const server = readFileSync(new URL("./outbound-engine.server.ts", import.meta.url), "utf8");
  assert.match(server, /offset \$\{from\}/);
  assert.match(server, /dispatchDatasetBatch/);
  assert.match(server, /Promise\.allSettled/);
  assert.doesNotMatch(server, /select \* from preloaded_leads/i);
});

test("batch aggregation advances nextOffset past failed rows and reports leftover pages", () => {
  const full = aggregateEngineBatch({
    offset: 0,
    batchSize: 100,
    catalogSize: 20_330,
    fetched: 101,
    visited: 100,
    queued: 98,
    failed: 2,
    errors: [
      { rowId: "a", message: "timeout" },
      { rowId: "b", message: "twilio" },
    ],
  });
  assert.equal(full.processed, 100);
  assert.equal(full.queued, 98);
  assert.equal(full.failed, 2);
  assert.equal(full.nextOffset, 100);
  assert.equal(full.hasMore, true);
  assert.equal(full.remaining, 20_230);
  assert.equal(full.ok, false);

  const capped = aggregateEngineBatch({
    offset: 0,
    batchSize: 100,
    catalogSize: 20_330,
    fetched: 100,
    visited: 40,
    queued: 40,
    failed: 0,
  });
  assert.equal(capped.hasMore, true);
  assert.equal(capped.nextOffset, 40);
  assert.equal(capped.ok, true);

  const last = aggregateEngineBatch({
    offset: 20_300,
    batchSize: 100,
    catalogSize: 20_330,
    fetched: 30,
    visited: 30,
    queued: 30,
    failed: 0,
  });
  assert.equal(last.hasMore, false);
  assert.equal(last.nextOffset, 20_330);
  assert.equal(last.remaining, 0);
});

test("paging reads offset/limit from body or query and maps to a supabase range", () => {
  const fromQuery = parseEnginePaging(new Request("https://axiom.shop/api/master/outbound-engine?offset=200&limit=250"));
  assert.equal(fromQuery.offset, 200);
  assert.equal(fromQuery.limit, 250);
  assert.deepEqual(fromQuery.range, { from: 200, to: 449 });
  const fromBody = parseEnginePaging(new Request("https://axiom.shop/api/master/outbound-engine"), { offset: 0, limit: 900 });
  assert.equal(fromBody.limit, ENGINE_DATASET_BATCH_MAX);
  assert.deepEqual(fromBody.range, { from: 0, to: 249 });
});

test("channel picker and micro-chunks never scan the full catalog", () => {
  assert.equal(pickEngineChannel({ canSms: true, canEmail: true, smsRemaining: 40, emailRemaining: 80 }), "email");
  assert.equal(pickEngineChannel({ canSms: true, canEmail: false, smsRemaining: 1, emailRemaining: 80 }), "sms");
  assert.equal(pickEngineChannel({ canSms: false, canEmail: false, smsRemaining: 10, emailRemaining: 10 }), null);
  assert.equal(chunkArray(Array.from({ length: 250 }, (_, i) => i), 25).length, 10);
  const coerced = coerceEngineBatch(
    { dispatch: { processed: 100, queued: 90, failed: 1, remaining: 20230, hasMore: true, nextOffset: 100 } },
    emptyEngineBatch(),
  );
  assert.equal(coerced.processed, 100);
  assert.equal(coerced.hasMore, true);
  assert.equal(coerced.nextOffset, 100);
});

test("per-batch timeout rejects a hung query without swallowing the label", async () => {
  await assert.rejects(
    () => withBatchTimeout(new Promise(() => undefined), 20, "loadLeads.range"),
    (err: unknown) => {
      assert.ok(err instanceof EngineBatchTimeoutError);
      assert.match(err.message, /loadLeads\.range/);
      return true;
    },
  );
  assert.equal(await withBatchTimeout(Promise.resolve(7), 50, "ok"), 7);
  assert.equal(await withBatchTimeout(async () => 9, 50, "fn"), 9);
});
