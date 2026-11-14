/**
 * Direct Twilio + Resend live-fire. Skips cron hours/trickle gates.
 *
 *   node --env-file=.env ./node_modules/ts-node/dist/bin-esm.js scripts/force-carrier-test.ts
 */
import { Pool } from "pg";

process.env.OUTREACH_MODE = "live";

const ROW_ID = "oq_livefire_1794417296317";
const PHONE = "+15418908126";
const EMAIL = "rankbotaiapp@gmail.com";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function toE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return trimmed;
}

async function sendTwilio(to: string, body: string): Promise<{ http: number; json: unknown }> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !from) {
    return { http: 0, json: { error: "Twilio env missing (SID/token/from)" } };
  }
  const dest = toE164(to);
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: dest, From: from, Body: body.slice(0, 640) }),
    signal: AbortSignal.timeout(20_000),
  });
  let json: unknown = await res.text();
  try {
    json = JSON.parse(String(json));
  } catch {
    /* keep text */
  }
  return { http: res.status, json };
}

async function sendResend(to: string, subject: string, text: string): Promise<{ http: number; json: unknown }> {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) {
    return { http: 0, json: { error: "Resend env missing (API key / from)" } };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(20_000),
  });
  let json: unknown = await res.text();
  try {
    json = JSON.parse(String(json));
  } catch {
    /* keep text */
  }
  return { http: res.status, json };
}

function summarizeTwilio(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const row = json as Record<string, unknown>;
  return `sid=${row.sid ?? "none"} status=${row.status ?? "none"} error=${row.error_message ?? row.message ?? ""}`;
}

function summarizeResend(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const row = json as Record<string, unknown>;
  return `id=${row.id ?? "none"}`;
}

async function main(): Promise<void> {
  console.log(`OUTREACH_MODE=${process.env.OUTREACH_MODE} (forced in-process)`);
  const connectionString = env("DATABASE_URL");
  if (!connectionString) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  const client = await pool.connect();
  let body = "Axiom live-fire: booking page is ready. Reply STOP to opt out.";
  let subject = "Axiom live-fire · booking page ready";
  try {
    const found = await client.query<{
      id: string;
      status: string;
      phone: string;
      email: string;
      business_name: string;
      detail: string;
      channel: string;
    }>(
      `select id, status, phone, email, business_name, detail, channel
       from outreach_queue where id = $1 limit 1`,
      [ROW_ID],
    );
    const row = found.rows[0];
    if (!row) {
      console.log(`DB: ${ROW_ID} not found — sending with hardcoded founder destinations anyway`);
    } else {
      console.log(`DB: ${row.id} status=${row.status} channel=${row.channel} phone=${row.phone} email=${row.email}`);
      body = row.detail?.trim()
        ? `${row.business_name} · ${row.detail}`.slice(0, 640)
        : `Hi — ${row.business_name} has a booking page ready. Reply STOP to opt out.`;
      subject = `${row.business_name} · Axiom live-fire`;
      await client.query(
        `update outreach_queue
         set status = 'pending', scheduled_for = now(), detail = 'reset for force-carrier-test'
         where id = $1`,
        [ROW_ID],
      );
      console.log("DB: status reset to pending, scheduled_for=now()");
    }

    const sms = await sendTwilio(PHONE, body);
    console.log("\n--- Twilio POST /Messages.json ---");
    console.log(`HTTP ${sms.http}`);
    console.log(JSON.stringify(sms.json, null, 2));
    console.log(summarizeTwilio(sms.json));

    const email = await sendResend(EMAIL, subject, body);
    console.log("\n--- Resend POST /emails ---");
    console.log(`HTTP ${email.http}`);
    console.log(JSON.stringify(email.json, null, 2));
    console.log(summarizeResend(email.json));

    const twilioSid =
      sms.json && typeof sms.json === "object" ? String((sms.json as { sid?: string }).sid ?? "") : "";
    const resendId =
      email.json && typeof email.json === "object" ? String((email.json as { id?: string }).id ?? "") : "";
    const smsOk = sms.http >= 200 && sms.http < 300 && Boolean(twilioSid);
    const emailOk = email.http >= 200 && email.http < 300 && Boolean(resendId);

    if (row) {
      await client.query(
        `update outreach_queue
         set status = $2,
             sent_at = case when $2 = 'sent' then now() else sent_at end,
             detail = $3
         where id = $1`,
        [
          ROW_ID,
          smsOk ? "sent" : "failed",
          `force-carrier-test twilio=${twilioSid || sms.http} resend=${resendId || email.http}`.slice(0, 400),
        ],
      );
    }

    console.log("\n" + (smsOk && emailOk ? "GREEN: both carriers accepted the payload." : "RED: one or both carriers rejected."));
    if (smsOk) console.log("Check phone +15418908126 now.");
    if (emailOk) console.log("Check inbox rankbotaiapp@gmail.com now.");
    process.exit(smsOk && emailOk ? 0 : 1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[force-carrier-test]", err instanceof Error ? err.message : err);
  process.exit(1);
});
