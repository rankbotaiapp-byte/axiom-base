/**
 * Dry-run of /api/master/autopilot.
 * Reads shops, cues, and home-county leads. Writes outreach_events.
 * Refuses Twilio, Resend, and Stripe hosts.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { buildAutopilotDryRun } from "../src/lib/axiom/autopilot-dry-run.ts";
import { homeRegionLeads } from "../src/lib/axiom/regional-roster.ts";

const BLOCKED = /twilio\.com|resend\.com|api\.stripe\.com/i;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const host = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).host;
  if (BLOCKED.test(host)) throw new Error(`blocked live call to ${host}`);
  return originalFetch(input, init);
};

function redact(value) {
  const text = String(value ?? "");
  if (text.includes("@")) {
    const [name, host] = text.split("@");
    return `${name.slice(0, 1)}***@${host}`;
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10) return `***${digits.slice(-2)}`;
  return text ? "set" : "";
}

function fixture() {
  const sample = [];
  for (const county of ["Jackson County", "Josephine County", "Douglas County"]) {
    const row = homeRegionLeads().find((lead) => lead.county === county && (lead.contactEmail || lead.contactPhone));
    if (!row) continue;
    sample.push({
      id: row.leadSlug,
      leadSlug: row.leadSlug,
      businessName: row.businessName,
      city: row.city,
      county: row.county,
      tradeType: row.tradeType,
      email: row.contactEmail,
      phone: row.contactPhone,
    });
  }
  return buildAutopilotDryRun({
    origin: "http://127.0.0.1:8080",
    shops: [
      { id: "shop_night", slug: "night-circuit", name: "Night Circuit", niche: "auto", billing: "active" },
      { id: "shop_river", slug: "rogue-river-outfitters", name: "Rogue River Outfitters", niche: "forestry", billing: "trialing" },
    ],
    cues: [
      { kind: "social", id: "soc_dry", shopSlug: "night-circuit", county: "", status: "draft", detail: "New hero loop" },
      { kind: "outreach", id: "dsp_dry", shopSlug: "", county: "Josephine County", status: "queued", detail: "sms" },
    ],
    leads: sample,
  });
}

function publicReport(source, run, logged) {
  const counties = ["Jackson County", "Josephine County", "Douglas County"];
  return {
    source,
    mode: run.mode,
    providers: run.providers,
    activeShops: run.shops.map((shop) => ({ slug: shop.slug, niche: shop.niche, billing: shop.billing })),
    cues: run.cues.map((cue) => ({ kind: cue.kind, status: cue.status, county: cue.county, shopSlug: cue.shopSlug })),
    payloads: run.payloads.map((row) => ({
      county: row.county,
      channel: row.channel,
      cue: row.cue,
      leadSlug: row.leadSlug,
      shopSlug: row.shopSlug,
      to: redact(row.to),
      subject: row.subject ? "set" : "",
      bodyHasCounty: row.body.includes(row.county),
      bodyHasUrl: row.body.includes("preview=true"),
    })),
    countiesCovered: counties.every((county) => run.payloads.some((row) => row.county === county)),
    logs: run.logs,
    logged,
    liveCalls: 0,
  };
}

async function fromDatabase(url) {
  const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 8000, max: 1 });
  const client = await pool.connect();
  try {
    const shops = await client.query(`
      select s.id, s.slug, s.name, s.niche, coalesce(b.status, 'trialing') as billing
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where coalesce(b.status, 'trialing') in ('active', 'trialing')
      order by s.slug asc
      limit 40
    `);
    const social = await client.query(`
      select p.id, s.slug, p.caption, p.status
      from shop_social_posts p
      join shops s on s.id = p.shop_id
      where p.status in ('draft', 'pending', 'queued')
      order by p.created_at asc
      limit 24
    `).catch((err) => (missing(err) ? { rows: [] } : Promise.reject(err)));
    const queued = await client.query(`
      select id, county, channel, status
      from outreach_dispatches
      where status = 'queued'
      order by scheduled_at asc
      limit 24
    `).catch((err) => (missing(err) ? { rows: [] } : Promise.reject(err)));
    const leads = await client.query(
      `
      select id, lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and lower(county) = any(string_to_array($1, '|'))
        and (btrim(coalesce(contact_email, '')) <> '' or btrim(coalesce(contact_phone, '')) <> '')
      order by county asc, lead_slug asc
      limit 72
    `,
      ["jackson county|jackson|josephine county|josephine|douglas county|douglas"],
    );
    const run = buildAutopilotDryRun({
      origin: "http://127.0.0.1:8080",
      shops: shops.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        niche: row.niche,
        billing: row.billing,
      })),
      cues: [
        ...social.rows.map((row) => ({
          kind: "social",
          id: row.id,
          shopSlug: row.slug,
          county: "",
          status: row.status,
          detail: String(row.caption ?? "").slice(0, 80),
        })),
        ...queued.rows.map((row) => ({
          kind: "outreach",
          id: row.id,
          shopSlug: "",
          county: row.county,
          status: row.status,
          detail: row.channel,
        })),
      ],
      leads: leads.rows.map((row) => ({
        id: row.id,
        leadSlug: row.lead_slug,
        businessName: row.business_name,
        city: row.city,
        county: row.county,
        tradeType: row.trade_type,
        email: row.contact_email ?? "",
        phone: row.contact_phone ?? "",
      })),
    });
    let logged = 0;
    for (const line of run.logs) {
      const id = `dry_${Date.now().toString(36)}_${logged}`;
      await client.query(
        `insert into outreach_events (id, county, channel, summary, status) values ($1, $2, $3, $4, $5)`,
        [id, line.county, line.channel, line.summary, line.status],
      );
      const written = await client.query(`select id, county, channel, status, summary from outreach_events where id = $1`, [id]);
      if (written.rows[0]?.status !== "simulated") throw new Error(`telemetry row ${id} did not read back`);
      logged += 1;
    }
    return publicReport("database", run, logged);
  } finally {
    client.release();
    await pool.end();
  }
}

function missing(err) {
  return /does not exist|undefined_table|undefined_column/i.test(err instanceof Error ? err.message : String(err));
}

function databaseUrlFromDisk() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const line = text.split(/\r?\n/).find((row) => row.startsWith("DATABASE_URL="));
    if (!line) return "";
    return line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
  } catch {
    return "";
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() || databaseUrlFromDisk();
let report;
if (!databaseUrl) {
  report = publicReport("fixture", fixture(), 0);
  report.telemetry = "no database url; log lines were built and not inserted";
} else {
  try {
    report = await fromDatabase(databaseUrl);
    report.telemetry = "outreach_events rows inserted and read back";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    report = publicReport("fixture", fixture(), 0);
    report.telemetry = "hosted book unreachable; log lines were built and not inserted";
    report.database = /postgres:\/\/|password|@:|DATABASE_URL/i.test(message) ? "unreachable" : message.slice(0, 180);
  }
}

console.log(JSON.stringify(report, null, 2));
