/**
 * Read scripts/states/california.config.mjs and upsert California filings.
 *
 * The config's hubs and county lines must match the geography already stored.
 * Each batch is taken from that same 2,000-row county window, so lead_slug
 * stays the slug already on file. A batch that would mint a new slug stops
 * the run before that write. Claimed rows stay claimed.
 *
 * A filing is kept when it has an email and a phone and classifyFiling
 * returns one of the niches in the config map.
 */
import { HUBS, MORE, NICHE_FILINGS, STATE } from "./california.config.mjs";
import { IMPORT_BATCH, prepareBulkImport } from "../../src/lib/axiom/bulk-import.ts";
import { upsertPreloadedLeads } from "../../src/lib/axiom/bulk-import.server.ts";
import { classifyFiling } from "../../src/lib/axiom/directory.ts";
import {
  CALIFORNIA_COUNTIES,
  CALIFORNIA_HUB_COUNTIES,
  californiaCountyAt,
  californiaSweepSlice,
  californiaSweepTotal,
} from "../../src/lib/axiom/registry-sweep.ts";
import { CALIFORNIA_MORE, parseCounties } from "../../src/lib/axiom/state-counties.ts";
import { getSql } from "../../src/lib/db.ts";

const activeNiches = new Set(NICHE_FILINGS.map((row) => row.niche));

function samePlace(left, right) {
  return (
    left.county === right.county &&
    left.areaCode === right.areaCode &&
    left.cities.join("|") === [...right.cities].join("|")
  );
}

function assertConfig() {
  if (STATE.code !== "CA" || STATE.key !== "california") {
    throw new Error("California config STATE is not CA");
  }
  if (HUBS.length !== CALIFORNIA_HUB_COUNTIES.length) {
    throw new Error(`Expected ${CALIFORNIA_HUB_COUNTIES.length} hubs, config has ${HUBS.length}`);
  }
  for (let index = 0; index < HUBS.length; index += 1) {
    if (!samePlace(HUBS[index], CALIFORNIA_HUB_COUNTIES[index])) {
      throw new Error(`Hub ${index + 1} does not match the stored California hub list`);
    }
  }
  const rest = parseCounties(MORE);
  if (rest.length !== CALIFORNIA_MORE.length) {
    throw new Error(`Expected ${CALIFORNIA_MORE.length} remaining counties, config has ${rest.length}`);
  }
  for (let index = 0; index < rest.length; index += 1) {
    if (!samePlace(rest[index], CALIFORNIA_MORE[index])) {
      throw new Error(`County line ${index + 1} does not match the stored California list`);
    }
  }
  if (CALIFORNIA_COUNTIES.length !== HUBS.length + rest.length) {
    throw new Error("Resolved California county count does not match the config");
  }
}

function keepFiling(row) {
  if (!row.email || !row.phone) return false;
  const hit = classifyFiling(row.name ?? "", row.trade ?? "");
  return activeNiches.has(hit.tradeType);
}

async function slugsOnFile(sql, slugs) {
  const rows = await sql.query(
    "select lead_slug from preloaded_leads where lead_slug = any($1::text[])",
    [slugs],
  );
  return new Set(rows.map((row) => row.lead_slug));
}

function dropped(err) {
  const message = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|Connection terminated|timeout/i.test(message);
}

assertConfig();

const total = californiaSweepTotal();
const started = Date.now();
let offset = 0;
let inserted = 0;
let updated = 0;
let unchanged = 0;
let skipped = 0;
const sql = await getSql();

for (;;) {
  const county = californiaCountyAt(offset);
  const slice = californiaSweepSlice(offset, IMPORT_BATCH);
  if (slice.length === 0) break;
  const kept = slice.filter(keepFiling);
  skipped += slice.length - kept.length;
  const plan = prepareBulkImport(kept);
  if (plan.invalid.length > 0) {
    throw new Error(`[california] ${plan.invalid.length} filings in ${county} could not be prepared`);
  }
  const onFile = await slugsOnFile(sql, plan.leads.map((lead) => lead.leadSlug));
  const missing = plan.leads.filter((lead) => !onFile.has(lead.leadSlug));
  if (missing.length > 0) {
    throw new Error(
      `[california] ${missing.length} filings in ${county} are not already stored. Stopped before writing so the existing window stays intact.`,
    );
  }
  let written;
  for (let attempt = 1; ; attempt += 1) {
    try {
      written = await upsertPreloadedLeads(plan.leads);
      break;
    } catch (err) {
      if (!dropped(err) || attempt >= 6) throw err;
      console.error(`[california] connection dropped at ${offset.toLocaleString()}, retry ${attempt}`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  inserted += written.inserted;
  updated += written.updated;
  unchanged += written.unchanged;
  offset += slice.length;
  console.log(
    `[california] ${county} · ${offset.toLocaleString()} of ${total.toLocaleString()} · inserted ${written.inserted} · updated ${written.updated} · unchanged ${written.unchanged}`,
  );
  if (offset >= total) break;
}

console.log(
  `[california] done in ${Math.round((Date.now() - started) / 1000)}s · niches ${activeNiches.size} · skipped ${skipped} · inserted ${inserted} · updated ${updated} · unchanged ${unchanged}`,
);
process.exit(0);
