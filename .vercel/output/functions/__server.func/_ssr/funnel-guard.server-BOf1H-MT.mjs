import { c as setCookie$1, s as getRequest } from "./ssr.mjs";
import { t as env } from "./env.server-wS9zOhV6.mjs";
import { n as hashStopToken, s as tokenHashMatches, t as funnelBucketOpen } from "./funnel-guard-BnfVmfEx.mjs";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/funnel-guard.server-BOf1H-MT.js
var COOKIE = "axiom_funnel";
var PASS_MS = 18e5;
function funnelSecret() {
	const configured = env("BETTER_AUTH_SECRET") ?? env("FUNNEL_HIT_SECRET");
	if (configured) return configured;
	const host = globalThis;
	host.__axiomFunnelSecret ??= randomBytes(32).toString("hex");
	return host.__axiomFunnelSecret;
}
function signFunnelPass(now = Date.now()) {
	const exp = String(now + PASS_MS);
	return `${exp}.${createHmac("sha256", funnelSecret()).update(exp).digest("hex")}`;
}
function verifyFunnelPass(token, now = Date.now()) {
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
function readCookie(request) {
	const part = (request.headers.get("cookie") ?? "").split(";").map((piece) => piece.trim()).find((piece) => piece.startsWith(`${COOKIE}=`));
	if (!part) return "";
	try {
		return decodeURIComponent(part.slice(13));
	} catch {
		return "";
	}
}
function requestHasFunnelSession(request, now = Date.now()) {
	return verifyFunnelPass(readCookie(request), now);
}
function clientKey(request) {
	const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "") || request.headers.get("x-real-ip")?.trim() || "local";
	return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}
/** Issue the httpOnly pass the homepage must echo before a visit is stored. */
function ensureFunnelCookie() {
	const request = getRequest();
	if (requestHasFunnelSession(request)) return;
	const secure = new URL(request.url).protocol === "https:";
	setCookie$1(COOKIE, signFunnelPass(), {
		path: "/",
		httpOnly: true,
		secure,
		sameSite: "lax",
		maxAge: PASS_MS / 1e3
	});
}
function countOf(rows) {
	const value = rows[0]?.n;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
async function funnelHitAllowed(sql, key, slug) {
	const byClient = await sql`
    select count(*)::int as n from funnel_visits
    where client_key = ${key}
      and created_at > now() - interval '10 minutes'
  `;
	if (!funnelBucketOpen(countOf(byClient), 30)) return false;
	if (!slug) return true;
	const bySlug = await sql`
    select count(*)::int as n from funnel_visits
    where lead_slug = ${slug}
      and created_at > now() - interval '10 minutes'
  `;
	return funnelBucketOpen(countOf(bySlug), 60);
}
/** Stop only the sequences whose message carried this token. */
async function stopSequencesForToken(sql, slug, token) {
	if (!slug || !token) return 0;
	const hash = await hashStopToken(token);
	const ids = (await sql`
    select id, stop_token_hash from outreach_sequences
    where status = 'active' and lead_slug = ${slug} and stop_token_hash <> ''
  `).filter((row) => tokenHashMatches(hash, row.stop_token_hash)).map((row) => row.id);
	if (ids.length === 0) return 0;
	const list = ids.join(",");
	await sql`
    update outreach_sequences
    set status = 'stopped', stopped_reason = 'clicked'
    where id = any(string_to_array(${list}, ','))
      and status = 'active'
  `;
	await sql`
    update outreach_touches
    set status = 'skipped'
    where status = 'scheduled'
      and sequence_id = any(string_to_array(${list}, ','))
  `;
	return ids.length;
}
//#endregion
export { clientKey, ensureFunnelCookie, funnelHitAllowed, requestHasFunnelSession, stopSequencesForToken };
