/**
 * Read-only diagnostic. Confirms the database, Stripe, and core settings.
 * Prints status only. Never prints connection strings or secret values.
 */
import { Pool } from "pg";

type Check = { name: string; pass: boolean; detail: string };

const MASTER_KEY_MIN = 16;

function line(check: Check): void {
  const mark = check.pass ? "GREEN" : "RED";
  console.log(`[check] ${check.name.padEnd(10)} ${mark.padEnd(5)} ${check.detail}`);
}

function redact(text: string): string {
  return text
    .replace(/sk_(?:live|test)_[A-Za-z0-9]+/g, "sk_[redacted]")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[redacted]")
    .replace(/sb_[A-Za-z0-9_]+/g, "sb_[redacted]")
    .replace(/re_[A-Za-z0-9_]+/g, "re_[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .slice(0, 140);
}

async function checkDatabase(): Promise<Check> {
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) return { name: "supabase", pass: false, detail: "DATABASE_URL is not set" };
  let host = "";
  try {
    host = new URL(connectionString).hostname;
  } catch {
    return { name: "supabase", pass: false, detail: "DATABASE_URL is not a valid connection string" };
  }
  if (!host.includes("supabase")) {
    return { name: "supabase", pass: false, detail: "DATABASE_URL does not point at Supabase" };
  }
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  pool.on("error", () => {});
  try {
    const result = await pool.query("select count(*)::int as n from preloaded_leads");
    const count = Number(result.rows[0]?.n ?? 0);
    if (!Number.isFinite(count)) return { name: "supabase", pass: false, detail: "count query returned no number" };
    return { name: "supabase", pass: true, detail: `connected · ${count.toLocaleString("en-US")} preloaded leads` };
  } catch (err) {
    const message = err instanceof Error ? redact(err.message) : "connection failed";
    return { name: "supabase", pass: false, detail: message };
  } finally {
    await pool.end().catch(() => {});
  }
}

async function checkStripe(): Promise<Check> {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return { name: "stripe", pass: false, detail: "STRIPE_SECRET_KEY is not set" };
  if (!/^sk_(?:live|test)_/.test(key)) {
    return { name: "stripe", pass: false, detail: "STRIPE_SECRET_KEY is not in the expected shape" };
  }
  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) {
      return { name: "stripe", pass: false, detail: `API responded ${response.status}` };
    }
    return { name: "stripe", pass: true, detail: "API reachable" };
  } catch (err) {
    const message = err instanceof Error ? redact(err.message) : "request failed";
    return { name: "stripe", pass: false, detail: message };
  }
}

function checkSetting(name: string, label: string, valid: (value: string) => boolean): Check {
  const value = process.env[name]?.trim() ?? "";
  if (!value) return { name: label, pass: false, detail: `${name} is not set` };
  if (!valid(value)) return { name: label, pass: false, detail: `${name} is not in the expected shape` };
  return { name: label, pass: true, detail: `${name} configured` };
}

async function main(): Promise<void> {
  const checks: Check[] = [
    await checkDatabase(),
    await checkStripe(),
    checkSetting("TWILIO_ACCOUNT_SID", "twilio", (value) => /^AC[0-9a-f]{32}$/i.test(value)),
    checkSetting("RESEND_API_KEY", "resend", (value) => /^re_[A-Za-z0-9_]+$/.test(value) && value.length >= 20),
    checkSetting(
      "MASTER_ADMIN_BYPASS_KEY",
      "bypass",
      (value) => value.length >= MASTER_KEY_MIN && value.length <= 200,
    ),
  ];
  for (const check of checks) line(check);
  const failed = checks.filter((check) => !check.pass);
  if (failed.length > 0) {
    console.log(`[check] ${failed.length} failed`);
    process.exit(1);
  }
  console.log("[check] all green");
}

main().catch((err: unknown) => {
  console.error("[check]", err instanceof Error ? redact(err.message) : "diagnostic failed");
  process.exit(1);
});
