/**
 * Oregon already holds every county. This checks that registry and does not rewrite it.
 * A second pass would mint new slugs because those rows were filed before later niches were added.
 */
import pg from "pg";
import { OREGON_COUNTIES } from "../src/lib/axiom/registry-sweep.ts";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const names = OREGON_COUNTIES.map((row) => row.county);
const rows = await pool.query(
  `select county, count(*)::int as n
   from preloaded_leads
   where county = any($1::text[])
   group by county`,
  [names],
);
await pool.end();
const byCounty = new Map(rows.rows.map((row) => [row.county, row.n]));
const short = names.filter((county) => byCounty.get(county) !== 2000);
if (short.length > 0) {
  console.error(`[oregon] ${short.length} counties are not at 2,000 filings`);
  process.exit(1);
}
console.log(`[oregon] already complete · ${names.length} counties · ${names.length * 2000} filings`);
process.exit(0);
