/**
 * Read scripts/states/new-york.config.mjs and upsert New York filings.
 *
 * The config's hubs and county lines must match the geography already stored.
 * Each batch is taken from that same 2,000-row county window, so lead_slug
 * stays the slug already on file. A batch that would mint a new slug stops
 * the run before that write. Claimed rows stay claimed.
 *
 * A filing is kept when it has an email and a phone and classifyFiling
 * returns one of the niches in the config map.
 */
import { HUBS, MORE, NICHE_FILINGS, STATE } from "./new-york.config.mjs";
import { IMPORT_BATCH, prepareBulkImport } from "../../src/lib/axiom/bulk-import.ts";
import { upsertPreloadedLeads } from "../../src/lib/axiom/bulk-import.server.ts";
import { classifyFiling } from "../../src/lib/axiom/directory.ts";
import {
  NEW_YORK_COUNTIES,
  NEW_YORK_HUB_COUNTIES,
  newYorkCountyAt,
  newYorkSweepSlice,
  newYorkSweepTotal,
} from "../../src/lib/axiom/registry-sweep.ts";
import { NEW_YORK_MORE, parseCounties } from "../../src/lib/axiom/state-counties.ts";
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
  if (STATE.code !== "NY" || STATE.key !== "newyork") {
    throw new Error("New York config STATE is not NY");
  }
  if (HUBS.length !== NEW_YORK_HUB_COUNTIES.length) {
    throw new Error(`Expected ${NEW_YORK_HUB_COUNTIES.length} hubs, config has ${HUBS.length}`);
  }
  for (let index = 0; index < HUBS.length; index += 1) {
    if (!samePlace(HUBS[index], NEW_YORK_HUB_COUNTIES[index])) {
      throw new Error(`Hub ${index + 1} does not match the stored New York hub list`);
    }
  }
  const rest = parseCounties(MORE);
  if (rest.length !== NEW_YORK_MORE.length) {
    throw new Error(`Expected ${NEW_YORK_MORE.length} remaining counties, config has ${rest.length}`);
  }
  for (let index = 0; index < rest.length; index += 1) {
    if (!samePlace(rest[index], NEW_YORK_MORE[index])) {
      throw new Error(`County line ${index + 1} does not match the stored New York list`);
    }
  }
  if (NEW_YORK_COUNTIES.length !== HUBS.length + rest.length) {
    throw new Error("Resolved New York county count does not match the config");
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
  const message = err instanceof Error ? `${err.message} ${err.code ?? ""}` : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ENETUNREACH|Connection terminated|timeout/i.test(message);
}

assertConfig();

const total = newYorkSweepTotal();
const started = Date.now();
const start = Number(process.argv[2] ?? 0);
let offset = Number.isFinite(start) && start > 0 ? Math.floor(start) : 0;
if (offset > total) throw new Error(`[newyork] start ${offset.toLocaleString()} is past ${total.toLocaleString()}`);
let inserted = 0;
let updated = 0;
let unchanged = 0;
let skipped = 0;
const sql = await getSql();

for (;;) {
  const county = newYorkCountyAt(offset);
  const slice = newYorkSweepSlice(offset, IMPORT_BATCH);
  if (slice.length === 0) break;
  const kept = slice.filter(keepFiling);
  skipped += slice.length - kept.length;
  const plan = prepareBulkImport(kept);
  if (plan.invalid.length > 0) {
    throw new Error(`[newyork] ${plan.invalid.length} filings in ${county} could not be prepared`);
  }
  const onFile = await slugsOnFile(sql, plan.leads.map((lead) => lead.leadSlug));
  const missing = plan.leads.filter((lead) => !onFile.has(lead.leadSlug));
  if (missing.length > 0) {
    throw new Error(
      `[newyork] ${missing.length} filings in ${county} are not already stored. Stopped before writing so the existing window stays intact.`,
    );
  }
  const written = { inserted: 0, updated: 0, unchanged: 0 };
  for (let index = 0; index < plan.leads.length; index += 200) {
    const piece = plan.leads.slice(index, index + 200);
    let pieceWritten;
    for (let attempt = 1; ; attempt += 1) {
      try {
        pieceWritten = await upsertPreloadedLeads(piece);
        break;
      } catch (err) {
        if (!dropped(err) || attempt >= 6) throw err;
        console.error(`[newyork] connection dropped at ${offset.toLocaleString()}, retry ${attempt}`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
    written.inserted += pieceWritten.inserted;
    written.updated += pieceWritten.updated;
    written.unchanged += pieceWritten.unchanged;
  }
  inserted += written.inserted;
  updated += written.updated;
  unchanged += written.unchanged;
  offset += slice.length;
  console.log(
    `[newyork] ${county} · ${offset.toLocaleString()} of ${total.toLocaleString()} · inserted ${written.inserted} · updated ${written.updated} · unchanged ${written.unchanged}`,
  );
  if (offset >= total) break;
}

console.log(
  `[newyork] done in ${Math.round((Date.now() - started) / 1000)}s · niches ${activeNiches.size} · skipped ${skipped} · inserted ${inserted} · updated ${updated} · unchanged ${unchanged}`,
);
const pool = globalThis.__pgPool__;
if (pool && typeof pool.end === "function") await pool.end();
process.exit(0);
