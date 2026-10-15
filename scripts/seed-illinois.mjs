/**
 * Load the Illinois hub filings into preloaded_leads.
 * Batches of 1,000 match the desk import. Oregon, Texas, Florida, California, Pennsylvania, and New York rows are left alone.
 */
import { runIllinoisSweepBatch } from "../src/lib/axiom/bulk-import.server.ts";

const started = Date.now();
let offset = 0;
let inserted = 0;
let updated = 0;
let unchanged = 0;

for (;;) {
  const next = await runIllinoisSweepBatch(offset);
  inserted += next.inserted;
  updated += next.updated;
  unchanged += next.unchanged;
  console.log(
    `[illinois] ${next.county} · ${next.nextOffset.toLocaleString()} of ${next.total.toLocaleString()} · inserted ${next.inserted} · updated ${next.updated}`,
  );
  if (next.done || next.nextOffset <= offset) break;
  offset = next.nextOffset;
}

console.log(
  `[illinois] done in ${Math.round((Date.now() - started) / 1000)}s · inserted ${inserted} · updated ${updated} · unchanged ${unchanged}`,
);
process.exit(0);
