/**
 * Axiom 500-lead canary rollout.
 *
 * Usage:
 *   node --env-file=.env scripts/canary-rollout.mjs --dry-run
 *   node --env-file=.env scripts/canary-rollout.mjs
 *   node --env-file=.env scripts/canary-rollout.mjs --limit=100 --rps=5
 *
 * Dry-run validates DB selection + payload rendering without Twilio/Resend.
 * Live mode sends at a capped rate (default 5 req/s) and writes a run log.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

const root = join(import.meta.dirname, "..");
const BATCH_SIZE = 500;
const DEFAULT_RPS = 5;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || args.has("-n");
const limitArg = [...args].find((a) => a.startsWith("--limit="));
const rpsArg = [...args].find((a) => a.startsWith("--rps="));
const LIMIT = Math.min(
  BATCH_SIZE,
  Math.max(1, Number(limitArg?.split("=")[1] ?? BATCH_SIZE) || BATCH_SIZE),
);
const RPS = Math.max(1, Number(rpsArg?.split("=")[1] ?? DEFAULT_RPS) || DEFAULT_RPS);
const INTERVAL_MS = Math.ceil(1000 / RPS);

const HOME_COUNTIES = ["Jackson County", "Josephine County", "Douglas County"];

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function env(key) {
  const v = process.env[key]?.trim();
  return v || undefined;
}

function resolvePublicAppOrigin() {
  const configured = [env("NEXT_PUBLIC_APP_URL"), env("VITE_APP_URL"), env("APP_URL")];
  for (const raw of configured) {
    if (!raw) continue;
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
    try {
      const url = new URL(withScheme);
      if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname) && process.env.NODE_ENV === "production") {
        continue;
      }
      return url.origin;
    } catch {
      /* try next */
    }
  }
  const vercel = env("VERCEL_URL");
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Set NEXT_PUBLIC_APP_URL (or deploy with VERCEL_URL) before canary live sends.");
  }
  return "http://127.0.0.1:8080";
}

function redact(value) {
  const text = String(value ?? "");
  if (text.includes("@")) {
    const [name, host] = text.split("@");
    return `${(name || "?").slice(0, 1)}***@${host || "?"}`;
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10) return `***${digits.slice(-2)}`;
  return text ? "set" : "";
}

function render(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

async function loadHelpers() {
  const preview = await import(pathToFileURL(join(root, "src/lib/axiom/preview-link.ts")).href);
  const funnel = await import(pathToFileURL(join(root, "src/lib/axiom/funnel.ts")).href);
  const legal = await import(pathToFileURL(join(root, "src/lib/axiom/legal-notices.ts")).href);
  return { preview, funnel, legal };
}

async function loadLeads(client, limit) {
  const result = await client.query(
    `
    select id, lead_slug, business_name, city, county, trade_type,
           contact_email, contact_phone
    from preloaded_leads
    where claimed = false
      and county = any(string_to_array($1, '|'))
      and (
        btrim(coalesce(contact_email, '')) <> ''
        or btrim(coalesce(contact_phone, '')) <> ''
      )
    order by county asc, lead_slug asc
    limit $2
    `,
    [HOME_COUNTIES.join("|"), limit],
  );
  return result.rows;
}

function pickChannel(row) {
  const phone = String(row.contact_phone ?? "").replace(/\D/g, "");
  const email = String(row.contact_email ?? "").trim();
  if (phone.length >= 10) return "sms";
  if (email.includes("@")) return "email";
  return null;
}

async function sendEmail({ to, subject, body }) {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) {
    return { ok: false, status: 0, detail: "Email provider is not configured", receipt: null };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text: body }),
    signal: AbortSignal.timeout(12000),
  });
  let receipt = null;
  try {
    receipt = await res.json();
  } catch {
    receipt = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    detail: res.ok ? "sent" : "Email provider rejected the message",
    receipt,
  };
}

async function sendSms({ to, body }) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER");
  if (!sid || !token || !from) {
    return { ok: false, status: 0, detail: "SMS provider is not configured", receipt: null };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 640) }),
    signal: AbortSignal.timeout(12000),
  });
  let receipt = null;
  try {
    receipt = await res.json();
  } catch {
    receipt = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    detail: res.ok ? "sent" : "SMS provider rejected the message",
    receipt,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const databaseUrl = env("DATABASE_URL");
  if (!databaseUrl) {
    console.error("DATABASE_URL is required for canary rollout.");
    process.exit(1);
  }

  const origin = resolvePublicAppOrigin();
  if (/localhost|127\.0\.0\.1/i.test(origin) && (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production")) {
    console.error("Refusing canary with loopback origin in production.");
    process.exit(1);
  }

  const { preview, funnel, legal } = await loadHelpers();
  const strategy = funnel.outreachStrategy("done-for-you");
  const startedAt = new Date().toISOString();
  const logPath = join(root, "logs", `canary-run-${stamp()}.json`);
  mkdirSync(join(root, "logs"), { recursive: true });

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 12000,
    idleTimeoutMillis: 5000,
  });
  const client = await pool.connect();

  /** @type {object[]} */
  const events = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const leads = await loadLeads(client, LIMIT);
    if (leads.length === 0) {
      console.error("No uncontacted leads matched the home-county canary filter.");
      process.exit(2);
    }
    if (leads.length < LIMIT) {
      console.warn(`Only ${leads.length} uncontacted leads available (requested ${LIMIT}).`);
    }

    console.log(
      `Canary ${dryRun ? "DRY-RUN" : "LIVE"} · ${leads.length} leads · origin=${origin} · rps=${RPS}`,
    );

    for (let i = 0; i < leads.length; i += 1) {
      const row = leads[i];
      const channel = pickChannel(row);
      const tickStarted = Date.now();
      const event = {
        index: i + 1,
        leadId: row.id,
        leadSlug: row.lead_slug,
        county: row.county,
        channel,
        to: "",
        url: "",
        subject: "",
        bodyPreview: "",
        httpStatus: null,
        receipt: null,
        error: null,
        dryRun,
        at: new Date().toISOString(),
      };

      try {
        if (!channel) {
          skipped += 1;
          event.error = "No usable phone or email";
          events.push(event);
          console.log(`[${i + 1}/${leads.length}] skip ${row.lead_slug}`);
          continue;
        }

        const url = preview.outreachDestination(origin, {
          leadSlug: row.lead_slug,
          leadId: row.id,
          businessName: row.business_name,
          city: row.city,
          county: row.county,
          tradeType: row.trade_type,
          trade: row.trade_type,
        });
        if (/localhost|127\.0\.0\.1/i.test(url) && (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production")) {
          throw new Error(`Refusing localhost outreach URL: ${url}`);
        }

        const vars = {
          business: row.business_name,
          owner: row.business_name,
          url,
          city: row.city,
          county: row.county,
          trade: row.trade_type,
          website: "your current site",
          reviews: "local reviews",
          line: "shop line",
        };

        const subject =
          channel === "email"
            ? render(strategy.emailSubject, vars).slice(0, 200)
            : "";
        const rawBody =
          channel === "email"
            ? render(strategy.emailBody, vars)
            : render(strategy.text, vars);
        const body = legal.finalizeOutreachBody(rawBody, channel);

        event.url = url;
        event.subject = subject;
        event.bodyPreview = body.slice(0, 160);
        event.to = redact(channel === "email" ? row.contact_email : row.contact_phone);

        if (dryRun) {
          skipped += 0;
          sent += 1;
          event.httpStatus = 0;
          event.receipt = { dryRun: true };
          console.log(
            `[${i + 1}/${leads.length}] dry ${channel} → ${event.to} status=0`,
          );
        } else {
          const result =
            channel === "email"
              ? await sendEmail({
                  to: String(row.contact_email).trim(),
                  subject,
                  body,
                })
              : await sendSms({
                  to: String(row.contact_phone).trim(),
                  body,
                });
          event.httpStatus = result.status;
          event.receipt = result.receipt
            ? {
                id: result.receipt.id ?? result.receipt.sid ?? null,
                status: result.receipt.status ?? null,
              }
            : null;
          if (!result.ok) {
            failed += 1;
            event.error = result.detail;
            console.log(
              `[${i + 1}/${leads.length}] FAIL ${channel} → ${event.to} status=${result.status} ${result.detail}`,
            );
          } else {
            sent += 1;
            await client.query(`update preloaded_leads set claimed = true where id = $1`, [row.id]);
            console.log(
              `[${i + 1}/${leads.length}] ok ${channel} → ${event.to} status=${result.status}`,
            );
          }
        }
      } catch (err) {
        failed += 1;
        event.error = err instanceof Error ? err.message : String(err);
        console.log(`[${i + 1}/${leads.length}] ERROR ${row.lead_slug}: ${event.error}`);
      }

      events.push(event);

      const elapsed = Date.now() - tickStarted;
      const wait = INTERVAL_MS - elapsed;
      if (wait > 0 && i < leads.length - 1) await sleep(wait);
    }
  } finally {
    client.release();
    await pool.end();
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun,
    origin,
    requested: LIMIT,
    rps: RPS,
    totals: {
      processed: events.length,
      sent,
      failed,
      skipped,
    },
    events,
  };

  writeFileSync(logPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Wrote ${logPath}`);
  console.log(JSON.stringify(report.totals));

  if (!dryRun && failed > 0 && sent === 0) process.exit(3);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
