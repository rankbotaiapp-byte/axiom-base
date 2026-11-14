/**
 * First-slice public-record import.
 * Josephine County's published assessor taxlots are staged into consumer_leads.
 * preloaded_leads is never read or written.
 */
import pg from "pg";

const SOURCE = "josephine-county-assessor";
const QUERY_URL =
  "https://gis.co.josephine.or.us/arcgis/rest/services/Assessor/Assessor_Taxlots/FeatureServer/0/query";
const TABLE = "consumer_leads";
const COUNTY = "Josephine County";
const FETCH_LIMIT = 80;
const KEEP_LIMIT = 20;
const ORG_NAME =
  /\b(LLC|L\.L\.C|INC|CORP|CO\b|TRUST|COUNTY|CITY|BANK|CHURCH|ASSOC|ASSOCIATION|PARTNERSHIP|DISTRICT|HOUSING|AUTHORITY|ESTATE|LP|LLP)\b/i;

type Parcel = {
  account: string;
  name: string;
  city: string;
  zipCode: string;
  lat: number;
  lng: number;
  situs: string;
};

function arg(name: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index === -1 ? "" : (process.argv[index + 1] ?? "");
  if (!value || value.startsWith("--")) {
    console.error(`[consumer-leads] --${name} is required`);
    process.exit(1);
  }
  return value;
}

function nichesOf(value: string): string[] {
  const niches = [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
  if (niches.length === 0 || niches.some((niche) => !/^[a-z0-9][a-z0-9-]{0,79}$/.test(niche))) {
    console.error("[consumer-leads] niches must be comma-separated keys");
    process.exit(1);
  }
  return niches;
}

function titleCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function centroid(geometry: { rings?: number[][][] } | undefined): { lat: number; lng: number } | null {
  const ring = geometry?.rings?.[0];
  if (!ring || ring.length < 3) return null;
  let lat = 0;
  let lng = 0;
  let count = 0;
  for (const pair of ring) {
    const x = Number(pair[0]);
    const y = Number(pair[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    lng += x;
    lat += y;
    count += 1;
  }
  if (count < 3) return null;
  return { lat: lat / count, lng: lng / count };
}

function inJosephine(point: { lat: number; lng: number }): boolean {
  return point.lat >= 41.9 && point.lat <= 42.85 && point.lng >= -124.2 && point.lng <= -123.0;
}

async function loadParcels(): Promise<Parcel[]> {
  const url = new URL(QUERY_URL);
  url.searchParams.set("where", "SITUS_ZIP='97526' AND IMP_VALUE > 0 AND ACCTSTATUS='A'");
  url.searchParams.set("outFields", "ACCOUNT,NAME,SITUS,SITUS_CITY,SITUS_ZIP");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("orderByFields", "ACCOUNT");
  url.searchParams.set("resultRecordCount", String(FETCH_LIMIT));
  url.searchParams.set("f", "json");
  const payload = (await (await fetch(url)).json()) as {
    error?: { message?: string };
    features?: { attributes?: Record<string, unknown>; geometry?: { rings?: number[][][] } }[];
  };
  if (payload.error) throw new Error(payload.error.message || "Assessor query failed");
  const parcels: Parcel[] = [];
  for (const feature of payload.features ?? []) {
    const account = String(feature.attributes?.ACCOUNT ?? "").trim();
    const name = String(feature.attributes?.NAME ?? "").replace(/\s+/g, " ").trim();
    const zipCode = String(feature.attributes?.SITUS_ZIP ?? "").trim().slice(0, 5);
    const city = titleCity(String(feature.attributes?.SITUS_CITY ?? ""));
    const situs = String(feature.attributes?.SITUS ?? "").replace(/\s+/g, " ").trim();
    const point = centroid(feature.geometry);
    if (!account || !name || !/^\d{5}$/.test(zipCode) || !city || !point || !inJosephine(point)) continue;
    if (ORG_NAME.test(name)) continue;
    parcels.push({ account, name, city, zipCode, lat: point.lat, lng: point.lng, situs });
    if (parcels.length === KEEP_LIMIT) break;
  }
  return parcels;
}

const insertSql = `
  insert into ${TABLE} (
    niche, state, county, city, zip_code, lat, lng,
    homeowner_status, contact_name, contact_email, contact_phone, contact_meta, active
  ) values (
    $1, 'OR', $2, $3, $4, $5, $6,
    'homeowner', $7, '', '', $8::jsonb, true
  )`;

const updateSql = `
  update ${TABLE}
  set county = $3,
      city = $4,
      zip_code = $5,
      lat = $6,
      lng = $7,
      homeowner_status = 'homeowner',
      contact_name = $8,
      active = true,
      contact_meta = $9::jsonb
  where id = $1::uuid
    and niche = $2`;

if (`${insertSql} ${updateSql}`.toLowerCase().includes("preloaded_leads") || TABLE !== "consumer_leads") {
  throw new Error("Consumer import is isolated from preloaded leads");
}

const state = arg("state").trim().toUpperCase();
const niches = nichesOf(arg("niches"));
if (state !== "OR") {
  console.error("[consumer-leads] the first slice stages Oregon only");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("[consumer-leads] DATABASE_URL is required");
  process.exit(1);
}

const parcels = await loadParcels();
if (parcels.length === 0) {
  console.error("[consumer-leads] no Oregon homeowner parcels were staged");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
let inserted = 0;
let updated = 0;
let unchanged = 0;

try {
  await client.query("begin");
  for (const niche of niches) {
    for (const parcel of parcels) {
      const sourceId = `${SOURCE}:${parcel.account}`;
      const meta = JSON.stringify({
        source: SOURCE,
        source_id: sourceId,
        account: parcel.account,
        situs: parcel.situs,
      });
      const found = await client.query<{
        id: string;
        contact_name: string;
        city: string;
        zip_code: string;
        lat: number;
        lng: number;
      }>(
        `select id::text as id, contact_name, city, zip_code, lat, lng
         from consumer_leads
         where niche = $1 and contact_meta->>'source_id' = $2
         limit 1`,
        [niche, sourceId],
      );
      const current = found.rows[0];
      if (!current) {
        await client.query(insertSql, [
          niche,
          COUNTY,
          parcel.city,
          parcel.zipCode,
          parcel.lat,
          parcel.lng,
          parcel.name,
          meta,
        ]);
        inserted += 1;
        continue;
      }
      const same =
        current.contact_name === parcel.name &&
        current.city === parcel.city &&
        current.zip_code === parcel.zipCode &&
        Math.abs(Number(current.lat) - parcel.lat) < 0.00001 &&
        Math.abs(Number(current.lng) - parcel.lng) < 0.00001;
      if (same) {
        unchanged += 1;
        continue;
      }
      await client.query(updateSql, [
        current.id,
        niche,
        COUNTY,
        parcel.city,
        parcel.zipCode,
        parcel.lat,
        parcel.lng,
        parcel.name,
        meta,
      ]);
      updated += 1;
    }
  }
  await client.query("commit");
} catch (err) {
  try {
    await client.query("rollback");
  } catch {
    // Keep the original error when the connection is already closed.
  }
  throw err;
} finally {
  client.release();
  await pool.end();
}

console.log(
  `[consumer-leads] state ${state} · county ${COUNTY} · niches ${niches.join(",")} · parcels ${parcels.length}`,
);
console.log(`[consumer-leads] inserted ${inserted} · updated ${updated} · unchanged ${unchanged}`);
if (inserted + updated + unchanged === 0) process.exit(1);
process.exit(0);
