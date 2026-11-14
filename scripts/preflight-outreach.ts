/**
 * Production-readiness diagnostic for Twilio + Resend outreach.
 * Auth pings only — this script never sends a message.
 *
 *   node --env-file=.env ./node_modules/ts-node/dist/bin-esm.js scripts/preflight-outreach.ts
 */
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

const SMS_CAP = Number(process.env.OUTREACH_SMS_DAILY_CAP) || 40;
const EMAIL_CAP = Number(process.env.OUTREACH_EMAIL_DAILY_CAP) || 80;
const TENANT_SLUG = (process.env.PREFLIGHT_SHOP_SLUG || "axiom-auto").trim();

type Row = { ok: boolean; warn?: boolean; label: string; detail: string };
const rows: Row[] = [];

function pass(label: string, detail: string) {
  rows.push({ ok: true, label, detail });
}
function fail(label: string, detail: string) {
  rows.push({ ok: false, label, detail });
}
function warn(label: string, detail: string) {
  rows.push({ ok: true, warn: true, label, detail });
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function supabaseCreds(): { url: string; key: string } | null {
  const url = (env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL") || env("VITE_SUPABASE_URL")).replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SERVICE_KEY") || env("SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return { url, key };
}

async function rest<T>(url: string, key: string, path: string): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      Prefer: "count=exact",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 180)}`);
  return JSON.parse(text) as T;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "(unset)";
  return `***${digits.slice(-4)}`;
}

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at < 1) return "(unset)";
  return `${value.slice(0, 1)}***@${value.slice(at + 1)}`;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1")) || (value.trim().startsWith("+") && digits.length >= 10);
}

async function pingTwilio(): Promise<void> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER");
  if (!sid || !token) {
    fail("Twilio credentials", "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing");
    return;
  }
  if (!from) warn("Twilio from number", "TWILIO_FROM_NUMBER unset — auth may still pass");
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 200) {
    const body = (await res.json()) as { status?: string; friendly_name?: string };
    pass("Twilio API auth", `account ${body.status || "active"} · from ${maskPhone(from)} · no message sent`);
    return;
  }
  fail("Twilio API auth", `HTTP ${res.status} — credentials rejected`);
}

async function pingResend(): Promise<void> {
  const key = env("RESEND_API_KEY");
  const fromRaw = env("RESEND_FROM");
  const from = fromRaw.replace(/.*</, "").replace(/>.*/, "").trim();
  if (!key) {
    fail("Resend credentials", "RESEND_API_KEY missing");
    return;
  }
  if (!from || !isEmail(from)) {
    warn("Resend from", "RESEND_FROM missing or not an address — auth ping still runs");
  }
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 200) {
    pass("Resend API auth", `key accepted · from ${maskEmail(from)} · no email sent`);
    return;
  }
  fail("Resend API auth", `HTTP ${res.status} — key rejected`);
}

async function checkQueue(): Promise<void> {
  const sb = supabaseCreds();
  if (!sb) {
    fail("Supabase", "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for queue hydration");
    return;
  }
  try {
    const pending = await rest<Array<{ id: string; scheduled_for: string; status: string }>>(
      sb.url,
      sb.key,
      "outreach_queue?select=id,scheduled_for,status&status=eq.pending",
    );
    const now = Date.now();
    const due = pending.filter((row) => {
      const t = Date.parse(row.scheduled_for);
      return Number.isFinite(t) && t <= now;
    });
    const future = pending.length - due.length;
    pass(
      "Queue hydration",
      `${pending.length} pending · ${due.length} due for the next cron tick · ${future} still scheduled`,
    );
    if (due.length > SMS_CAP + EMAIL_CAP) {
      warn("Queue volume", `due count ${due.length} exceeds combined daily caps ${SMS_CAP + EMAIL_CAP} — extras will rate-limit`);
    }
  } catch (err) {
    fail("Queue hydration", err instanceof Error ? err.message : "query failed");
  }
}

function checkMode(): void {
  const raw = env("OUTREACH_MODE");
  const live = raw.toLowerCase() === "live";
  const label = live ? "live" : "simulation";
  if (live) {
    warn("OUTREACH_MODE", `live — Twilio/Resend will send on the next queue drain · caps ${SMS_CAP} SMS / ${EMAIL_CAP} email`);
  } else {
    pass("OUTREACH_MODE", `${label} (default unless exactly "live") · caps ${SMS_CAP} SMS / ${EMAIL_CAP} email`);
  }
}

async function checkTenant(): Promise<void> {
  const sb = supabaseCreds();
  if (!sb) {
    fail("Tenant shop", "Supabase creds missing — cannot read shops");
    return;
  }
  try {
    const shops = await rest<
      Array<{
        slug: string;
        notification_phone?: string | null;
        notification_email?: string | null;
        notify_phone?: string | null;
        notify_email?: string | null;
        notify_sms_enabled?: boolean | null;
        notify_email_enabled?: boolean | null;
      }>
    >(
      sb.url,
      sb.key,
      `shops?select=slug,notification_phone,notification_email,notify_phone,notify_email,notify_sms_enabled,notify_email_enabled&slug=eq.${encodeURIComponent(TENANT_SLUG)}&limit=1`,
    );
    const shop = shops[0];
    if (!shop) {
      fail("Tenant shop", `no shops.slug = ${TENANT_SLUG}`);
      return;
    }
    const phone = String(shop.notification_phone || shop.notify_phone || "").trim();
    const email = String(shop.notification_email || shop.notify_email || "").trim();
    const smsOff = shop.notify_sms_enabled === false;
    const emailOff = shop.notify_email_enabled === false;
    if (!isPhone(phone)) {
      fail("Tenant notification_phone", `${TENANT_SLUG} has no routable phone — owner SMS will skip`);
    } else if (smsOff) {
      warn("Tenant notification_phone", `${TENANT_SLUG} ${maskPhone(phone)} but SMS alerts are off`);
    } else {
      pass("Tenant notification_phone", `${TENANT_SLUG} ${maskPhone(phone)}`);
    }
    if (!isEmail(email)) {
      fail("Tenant notification_email", `${TENANT_SLUG} has no routable email — owner email will skip`);
    } else if (emailOff) {
      warn("Tenant notification_email", `${TENANT_SLUG} ${maskEmail(email)} but email alerts are off`);
    } else {
      pass("Tenant notification_email", `${TENANT_SLUG} ${maskEmail(email)}`);
    }
  } catch (err) {
    fail("Tenant shop", err instanceof Error ? err.message : "query failed");
  }
}

function printReport(): number {
  console.log("");
  console.log(`${BOLD}${CYAN}Axiom outreach pre-flight${RESET}`);
  console.log(`${DIM}Auth pings only. No SMS or email is sent.${RESET}`);
  console.log("");
  let failed = 0;
  let warned = 0;
  for (const row of rows) {
    const tag = !row.ok ? `${RED}FAIL${RESET}` : row.warn ? `${YELLOW}WARN${RESET}` : `${GREEN}PASS${RESET}`;
    console.log(`  ${tag}  ${BOLD}${row.label}${RESET}`);
    console.log(`        ${DIM}${row.detail}${RESET}`);
    if (!row.ok) failed += 1;
    if (row.warn) warned += 1;
  }
  console.log("");
  if (failed) {
    console.log(`${RED}${failed} check(s) failed.${RESET} Do not flip OUTREACH_MODE=live.`);
  } else if (warned) {
    console.log(`${YELLOW}All required checks passed with ${warned} warning(s).${RESET}`);
  } else {
    console.log(`${GREEN}All green.${RESET} Live fire still needs a dedicated test destination and a queue drain cron.`);
  }
  console.log(`${DIM}Queue drain is GET /api/autopilot/cron (not GET /api/master/autopilot, which only ticks shop autopilot).${RESET}`);
  console.log("");
  return failed;
}

async function main(): Promise<void> {
  await pingTwilio();
  await pingResend();
  checkMode();
  await checkQueue();
  await checkTenant();
  const failed = printReport();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}preflight crashed${RESET}`, err instanceof Error ? err.message : err);
  process.exit(1);
});
