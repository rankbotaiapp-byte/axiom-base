import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getRequest, setCookie } from "@/lib/tanstack-start-server-shim";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { FUNNEL_IP_LIMIT, FUNNEL_SLUG_LIMIT, funnelBucketOpen, hashStopToken, tokenHashMatches } from "./funnel-guard";
import { dripHaltStatus, type DripHaltReason } from "./funnel";

type Sql = Awaited<ReturnType<typeof getSql>>;

const COOKIE = "axiom_funnel";
const PASS_MS = 30 * 60 * 1000;

function funnelSecret(): string {
  const configured = env("BETTER_AUTH_SECRET") ?? env("FUNNEL_HIT_SECRET");
  if (configured) return configured;
  const host = globalThis as typeof globalThis & { __axiomFunnelSecret?: string };
  host.__axiomFunnelSecret ??= randomBytes(32).toString("hex");
  return host.__axiomFunnelSecret;
}

export function signFunnelPass(now = Date.now()): string {
  const exp = String(now + PASS_MS);
  const mac = createHmac("sha256", funnelSecret()).update(exp).digest("hex");
  return `${exp}.${mac}`;
}

export function verifyFunnelPass(token: string, now = Date.now()): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const when = Number(exp);
  if (!Number.isFinite(when) || when < now) return false;
  const expected = createHmac("sha256", funnelSecret()).update(exp).digest("hex");
  if (expected.length !== mac.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
}

function readCookie(request: Request): string {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw.split(";").map((piece) => piece.trim()).find((piece) => piece.startsWith(`${COOKIE}=`));
  if (!part) return "";
  try {
    return decodeURIComponent(part.slice(COOKIE.length + 1));
  } catch {
    return "";
  }
}

export function requestHasFunnelSession(request: Request, now = Date.now()): boolean {
  return verifyFunnelPass(readCookie(request), now);
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

/** Issue the httpOnly pass the homepage must echo before a visit is stored. */
export function ensureFunnelCookie(): void {
  const request = getRequest();
  if (requestHasFunnelSession(request)) return;
  const secure = new URL(request.url).protocol === "https:";
  setCookie(COOKIE, signFunnelPass(), {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: PASS_MS / 1000,
  });
}

function countOf(rows: { n: number }[]): number {
  const value = rows[0]?.n;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function funnelHitAllowed(sql: Sql, key: string, slug: string): Promise<boolean> {
  const byClient = await sql<{ n: number }>`
    select count(*)::int as n from funnel_visits
    where client_key = ${key}
      and created_at > now() - interval '10 minutes'
  `;
  if (!funnelBucketOpen(countOf(byClient), FUNNEL_IP_LIMIT)) return false;
  if (!slug) return true;
  const bySlug = await sql<{ n: number }>`
    select count(*)::int as n from funnel_visits
    where lead_slug = ${slug}
      and created_at > now() - interval '10 minutes'
  `;
  return funnelBucketOpen(countOf(bySlug), FUNNEL_SLUG_LIMIT);
}

/** Halt every active drip for this lead. Remaining scheduled touches are skipped. */
export async function haltLeadDrip(sql: Sql, slug: string, reason: DripHaltReason): Promise<number> {
  if (!slug) return 0;
  const status = dripHaltStatus(reason);
  try {
    const rows = await sql<{ id: string }>`
      update outreach_sequences
      set status = ${status}, stopped_reason = ${reason}
      where lead_slug = ${slug} and status = 'active'
      returning id
    `;
    if (rows.length === 0) return 0;
    const list = rows.map((row) => row.id).join(",");
    await sql`
      update outreach_touches
      set status = 'skipped'
      where status = 'scheduled'
        and sequence_id = any(string_to_array(${list}, ','))
    `;
    return rows.length;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/outreach_sequences|outreach_touches/i.test(message) && /does not exist/i.test(message)) return 0;
    throw err;
  }
}

export async function haltDripForShop(sql: Sql, shopId: string, reason: DripHaltReason): Promise<number> {
  const leads = await sql<{ lead_slug: string }>`
    select lead_slug from preloaded_leads
    where shop_id = ${shopId} and lead_slug <> ''
  `.catch(() => [] as { lead_slug: string }[]);
  let halted = 0;
  for (const row of leads) halted += await haltLeadDrip(sql, row.lead_slug, reason);
  return halted;
}

/** Stop only the sequences whose message carried this token. */
export async function stopSequencesForToken(sql: Sql, slug: string, token: string): Promise<number> {
  if (!slug || !token) return 0;
  const hash = await hashStopToken(token);
  const rows = await sql<{ id: string; stop_token_hash: string }>`
    select id, stop_token_hash from outreach_sequences
    where status = 'active' and lead_slug = ${slug} and stop_token_hash <> ''
  `;
  const ids = rows.filter((row) => tokenHashMatches(hash, row.stop_token_hash)).map((row) => row.id);
  if (ids.length === 0) return 0;
  return haltLeadDrip(sql, slug, "replied");
}
