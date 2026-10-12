#!/usr/bin/env node
/**
 * Four-stage check against the Supabase database for new-era-barbershop.
 * 1. Clear that shop's tenant_leads queue.
 * 2. Scan today's consumer_prospects for the barbershop trade.
 * 3. Scan again and confirm no duplicate rows are added.
 * 4. Mark every new lead contacted, then confirm a second pass changes nothing.
 *
 * The barbershop niche is stored as "location". Prospects labeled "barbershop"
 * are included too.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const SLUG = "new-era-barbershop";
const TRADE = "barbershop";
const TRADE_NICHES = ["barbershop", "location"];

function databaseUrl() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const line = text.split(/\r?\n/).find((row) => row.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL missing");
  return line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
}

function placeFromAddress(address) {
  const parts = String(address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts.length >= 2 ? parts[1] : (parts[0] ?? "");
  return city.split("·")[0].trim();
}

function fail(stage, message) {
  console.error(`stage ${stage} failed: ${message}`);
  process.exitCode = 1;
}

const pool = new pg.Pool({
  connectionString: databaseUrl(),
  ssl: { rejectUnauthorized: false },
});

try {
  const shop = await pool.query(
    `select slug, niche, address from shops where slug = $1 limit 1`,
    [SLUG],
  );
  const row = shop.rows[0];
  if (!row) {
    fail(1, `no shop at ${SLUG}`);
    process.exit(1);
  }
  const city = placeFromAddress(row.address);
  if (!city) {
    fail(2, "shop address has no city");
    process.exit(1);
  }
  if (row.niche !== "location" && row.niche !== TRADE) {
    fail(2, `${SLUG} niche is ${row.niche}, expected the barbershop trade`);
    process.exit(1);
  }

  const cleared = await pool.query(`delete from tenant_leads where tenant_slug = $1`, [SLUG]);
  const empty = await pool.query(
    `select count(*)::int as n from tenant_leads where tenant_slug = $1`,
    [SLUG],
  );
  if (empty.rows[0].n !== 0) {
    fail(1, `queue still has ${empty.rows[0].n} rows`);
    process.exit(1);
  }
  console.log(`1 clear  removed ${cleared.rowCount}  queue 0`);

  const scanSql = `
    insert into tenant_leads (
      tenant_slug, business_name, category, phone, email, status,
      prospect_id, consumer_contact, note, scanned_on, niche, city
    )
    select $1, p.consumer_name, p.niche,
           case when position('@' in p.consumer_contact) = 0 then p.consumer_contact else null end,
           case when position('@' in p.consumer_contact) > 0 then p.consumer_contact else null end,
           'new', p.id, p.consumer_contact, p.note, current_date, p.niche, p.city
    from consumer_prospects p
    where lower(p.niche) = any($2::text[])
      and lower(btrim(split_part(p.city, '·', 1))) = lower($3)
      and p.batch_date = current_date
      and not exists (
        select 1 from tenant_leads t
        where t.tenant_slug = $1 and t.prospect_id = p.id
      )
    order by p.created_at
    limit 25
    returning id
  `;
  const niches = TRADE_NICHES.map((niche) => niche.toLowerCase());
  const first = await pool.query(scanSql, [SLUG, niches, city]);
  if (first.rowCount < 1) {
    fail(2, `no fresh ${TRADE} prospects for ${city} today`);
    process.exit(1);
  }
  const afterScan = await pool.query(
    `select count(*)::int as n from tenant_leads where tenant_slug = $1 and status = 'new'`,
    [SLUG],
  );
  if (afterScan.rows[0].n !== first.rowCount) {
    fail(2, `scan returned ${first.rowCount} but the queue has ${afterScan.rows[0].n} new rows`);
    process.exit(1);
  }
  console.log(`2 scan   added ${first.rowCount} for ${TRADE} in ${city}`);

  const second = await pool.query(scanSql, [SLUG, niches, city]);
  const afterDedupe = await pool.query(
    `select count(*)::int as n, count(distinct prospect_id)::int as prospects
     from tenant_leads where tenant_slug = $1`,
    [SLUG],
  );
  if (second.rowCount !== 0 || afterDedupe.rows[0].n !== first.rowCount) {
    fail(3, `second scan added ${second.rowCount}; queue is ${afterDedupe.rows[0].n}`);
    process.exit(1);
  }
  if (afterDedupe.rows[0].prospects !== afterDedupe.rows[0].n) {
    fail(3, "queue has repeated prospect ids");
    process.exit(1);
  }
  console.log(`3 dedupe added 0  queue stays ${afterDedupe.rows[0].n}`);

  const contacted = await pool.query(
    `update tenant_leads
     set status = 'contacted'
     where tenant_slug = $1 and coalesce(status, 'new') = 'new'
     returning id`,
    [SLUG],
  );
  const again = await pool.query(
    `update tenant_leads
     set status = 'contacted'
     where tenant_slug = $1 and coalesce(status, 'new') = 'new'
     returning id`,
    [SLUG],
  );
  const final = await pool.query(
    `select
       count(*) filter (where status = 'contacted')::int as contacted,
       count(*) filter (where coalesce(status, 'new') = 'new')::int as fresh
     from tenant_leads where tenant_slug = $1`,
    [SLUG],
  );
  if (contacted.rowCount !== first.rowCount || again.rowCount !== 0 || final.rows[0].fresh !== 0) {
    fail(
      4,
      `contacted ${contacted.rowCount}, second pass ${again.rowCount}, still new ${final.rows[0].fresh}`,
    );
    process.exit(1);
  }
  console.log(`4 send   contacted ${final.rows[0].contacted}  still new 0`);
} finally {
  await pool.end();
}
