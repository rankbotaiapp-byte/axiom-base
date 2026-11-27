/**
 * Deploy-time Postgres URL + SSL helpers for `scripts/migrate.mjs`.
 * Prefer an IPv4 Session pooler URL over the IPv6-only `db.<ref>.supabase.co` host.
 */

const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DIRECT_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];

/**
 * @param {string} value
 * @returns {URL | null}
 */
export function parsePostgresUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string[]}
 */
export function collectDatabaseUrls(env = process.env) {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const key of URL_KEYS) {
    const value = env[key]?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * Lower is better. Session pooler :5432 ranks first (IPv4 on Vercel).
 * Direct `db.*.supabase.co` ranks last (IPv6-only from many build machines).
 * @param {string} value
 */
export function ipv4Preference(value) {
  const parsed = parsePostgresUrl(value);
  if (!parsed) return 80;
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port || "5432";
  if (host.includes("pooler.supabase.com") && port === "5432") return 0;
  if (host.includes("pooler.supabase.com")) return 10;
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) return 90;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return 20;
  return 40;
}

/**
 * @param {string[]} urls
 * @returns {string}
 */
export function preferIpv4DatabaseUrl(urls) {
  if (!urls.length) return "";
  return [...urls].sort((a, b) => ipv4Preference(a) - ipv4Preference(b) || urls.indexOf(a) - urls.indexOf(b))[0] ?? "";
}

/**
 * @param {string} value
 */
export function isLocalPostgresHost(value) {
  const parsed = parsePostgresUrl(value);
  if (!parsed) return /localhost|127\.0\.0\.1/i.test(value);
  const host = parsed.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Hosted Postgres (Supabase pooler / Neon) needs TLS. Local docker does not.
 * @param {string} connectionString
 */
export function pgPoolOptions(connectionString) {
  const local = isLocalPostgresHost(connectionString);
  return {
    connectionString,
    max: 1,
    connectionTimeoutMillis: 15_000,
    ssl: local ? false : { rejectUnauthorized: false },
  };
}

/**
 * @param {unknown} err
 * @returns {{ code: string, message: string }}
 */
export function errorBits(err) {
  const seen = new Set();
  /** @type {string[]} */
  const codes = [];
  /** @type {string[]} */
  const messages = [];

  /**
   * @param {unknown} value
   * @param {number} depth
   */
  function walk(value, depth) {
    if (value == null || depth > 5 || seen.has(value)) return;
    if (typeof value === "object") seen.add(value);
    if (value instanceof Error) messages.push(value.message);
    else if (typeof value === "string") messages.push(value);
    if (value && typeof value === "object" && "code" in value) {
      codes.push(String(/** @type {{ code?: unknown }} */ (value).code ?? ""));
    }
    if (value && typeof value === "object" && "cause" in value) {
      walk(/** @type {{ cause?: unknown }} */ (value).cause, depth + 1);
    }
  }
  walk(err, 0);
  return { code: codes.filter(Boolean).join(" "), message: messages.join(" ") };
}

/**
 * Connect failures from Vercel IPv6 routing to `db.*.supabase.co`.
 * @param {unknown} err
 */
export function isIpv6OrUnreachableNetworkError(err) {
  const { code, message } = errorBits(err);
  const blob = `${code} ${message}`;
  if (/\bENETUNREACH\b|\bEHOSTUNREACH\b/.test(blob)) return true;
  return /db\.[a-z0-9]+\.supabase\.co/i.test(blob) && /connect|ECONN|network|unreachable|AAAA|ENETUNREACH|EHOSTUNREACH/i.test(blob);
}

/**
 * Preview-only skip: never hide SQL errors, never skip Production connect failures.
 * @param {unknown} err
 * @param {NodeJS.ProcessEnv} [env]
 */
export function shouldSkipUnreachablePreview(err, env = process.env) {
  return env.VERCEL === "1" && env.VERCEL_ENV === "preview" && isIpv6OrUnreachableNetworkError(err);
}

export const PREVIEW_POOLER_HINT =
  "[migrate] Vercel Preview cannot reach Postgres (ENETUNREACH / IPv6). Set Preview DATABASE_URL to the Supabase IPv4 Session pooler (*.pooler.supabase.com:5432), not db.<project-ref>.supabase.co. Skipping migrations so this deploy can finish.";
