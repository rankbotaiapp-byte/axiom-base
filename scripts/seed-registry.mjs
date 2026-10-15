/**
 * Stream one full state registry into preloaded_leads, 1,000 rows at a time.
 * Texas and Florida hubs were filed before later niches were added, so those
 * scripts start at row 12,000. Starting them at 0 would mint a second copy
 * of the hub businesses. California, Pennsylvania, and New York match the
 * current filing list and start at 0.
 */
import { runCaliforniaSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";
import { runFloridaSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";
import { runNewYorkSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";
import { runPennsylvaniaSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";
import { runSupplementSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";
import { runTexasSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";

const runners = {
  california: runCaliforniaSweepBatch,
  florida: runFloridaSweepBatch,
  newyork: runNewYorkSweepBatch,
  pennsylvania: runPennsylvaniaSweepBatch,
  texas: runTexasSweepBatch,
  supplement: runSupplementSweepBatch,
};

const state = process.argv[2];
const run = runners[state];
if (!run) {
  console.error(`[registry] use one of: ${Object.keys(runners).join(", ")}`);
  process.exit(1);
}

const start = Number(process.argv[3] ?? 0);
const started = Date.now();
let offset = Number.isFinite(start) && start > 0 ? Math.floor(start) : 0;
let inserted = 0;
let updated = 0;
let unchanged = 0;

function dropped(err) {
  const message = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|Connection terminated|timeout/i.test(message);
}

for (;;) {
  let next;
  for (let attempt = 1; ; attempt += 1) {
    try {
      next = await run(offset);
      break;
    } catch (err) {
      if (!dropped(err) || attempt >= 6) throw err;
      console.error(`[${state}] connection dropped at ${offset.toLocaleString()}, retry ${attempt}`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  inserted += next.inserted;
  updated += next.updated;
  unchanged += next.unchanged;
  console.log(
    `[${state}] ${next.county} · ${next.nextOffset.toLocaleString()} of ${next.total.toLocaleString()} · inserted ${next.inserted} · updated ${next.updated}`,
  );
  if (next.done || next.nextOffset <= offset) break;
  offset = next.nextOffset;
}

console.log(
  `[${state}] done in ${Math.round((Date.now() - started) / 1000)}s · inserted ${inserted} · updated ${updated} · unchanged ${unchanged}`,
);
process.exit(0);
