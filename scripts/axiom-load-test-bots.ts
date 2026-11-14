/**
 * Concurrent public-traffic bots for landing, showcase, tenant sites,
 * checkout/provisioning, Stripe webhook activation, and abuse hardening.
 *
 *   npx tsx --env-file=.env scripts/axiom-load-test-bots.ts
 */
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHOWCASE, showcaseSrc } from "../src/lib/axiom-landing/showcase.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = (process.env.AXIOM_PREVIEW_ORIGIN || process.env.AXIOM_DEV_ORIGIN || "http://127.0.0.1:8080").replace(
  /\/$/,
  "",
);
const CONCURRENCY = Math.max(4, Number(process.env.AXIOM_BOT_CONCURRENCY || 10) || 10);
const HTML_TIMEOUT_MS = 12_000;
const ASSET_TIMEOUT_MS = 20_000;
const ASSETS_PER_PAGE = 18;
const TRAFFIC_ROUNDS = 2;

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

type Hit = {
  endpoint: string;
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
  bytes?: number;
};

const hits: Hit[] = [];
const checks: { ok: boolean; section: string; label: string; detail?: string }[] = [];

function pass(section: string, label: string, detail?: string) {
  checks.push({ ok: true, section, label, detail });
}
function fail(section: string, label: string, detail?: string) {
  checks.push({ ok: false, section, label, detail });
}

function classify(url: string): string {
  try {
    const u = new URL(url, ORIGIN);
    const p = u.pathname;
    if (p === "/") return "GET /";
    if (p.startsWith("/showcase/")) return "GET /showcase/*";
    if (p.startsWith("/t/")) return "GET /t/*";
    if (p.startsWith("/api/tenants/") && !p.endsWith("/tenants")) return "GET /api/tenants/:slug";
    if (p === "/api/tenants") return `${"POST"} /api/tenants`;
    if (p === "/api/lead") return "POST /api/lead";
    if (p === "/api/leads") return "POST /api/leads";
    if (p === "/api/stripe/webhook" || p === "/api/webhooks/stripe") return "POST stripe webhook";
    if (p.startsWith("/media/") || /\.(mp4|webm)$/i.test(p)) return "asset media";
    if (/\.(woff2?|ttf|otf)$/i.test(p)) return "asset font";
    if (/\.(js|mjs|css|png|jpe?g|webp|svg|ico)$/i.test(p)) return "asset static";
    return `GET ${p.slice(0, 48)}`;
  } catch {
    return url.slice(0, 48);
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function timedFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ res: Response | null; ms: number; error?: string }> {
  const timeoutMs = init.timeoutMs ?? HTML_TIMEOUT_MS;
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const { timeoutMs: _t, ...rest } = init;
    const res = await fetch(url, { ...rest, signal: ctrl.signal, redirect: "follow" });
    return { res, ms: Date.now() - started };
  } catch (err) {
    return { res: null, ms: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

function record(endpoint: string, ok: boolean, status: number, ms: number, extra?: { error?: string; bytes?: number }) {
  hits.push({ endpoint, ok, status, ms, error: extra?.error, bytes: extra?.bytes });
}

async function getOk(pathOrUrl: string, timeoutMs = HTML_TIMEOUT_MS): Promise<{
  ok: boolean;
  status: number;
  ms: number;
  text?: string;
  headers?: Headers;
}> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${ORIGIN}${pathOrUrl}`;
  const { res, ms, error } = await timedFetch(url, { timeoutMs });
  const endpoint = classify(url);
  if (!res) {
    record(endpoint, false, 0, ms, { error });
    return { ok: false, status: 0, ms };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ok = res.status >= 200 && res.status < 400;
  record(endpoint, ok, res.status, ms, { bytes: buf.length });
  const ct = res.headers.get("content-type") || "";
  const text = /text|json|javascript|xml|svg/i.test(ct) ? buf.toString("utf8") : undefined;
  return { ok, status: res.status, ms, text, headers: res.headers };
}

function extractAssets(html: string, pageUrl: string): string[] {
  const found = new Set<string>();
  const push = (raw: string) => {
    const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("mailto:") || trimmed.startsWith("javascript:")) {
      return;
    }
    try {
      const abs = new URL(trimmed, pageUrl);
      if (abs.origin !== ORIGIN && !trimmed.startsWith("/")) return;
      if (abs.origin !== ORIGIN && abs.origin.startsWith("http")) return;
      const path = abs.pathname;
      if (
        /\.(mp4|webm|woff2?|ttf|otf|css|js|mjs|png|jpe?g|webp|svg|ico|gif)$/i.test(path) ||
        path.startsWith("/media/") ||
        path.startsWith("/fonts/")
      ) {
        found.add(abs.pathname + abs.search);
      }
    } catch {
      /* ignore */
    }
  };
  for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) push(m[1]!);
  for (const m of html.matchAll(/url\(([^)]+)\)/gi)) push(m[1]!);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1]!.split(",")) push(part.trim().split(/\s+/)[0]!);
  }
  return [...found].slice(0, ASSETS_PER_PAGE);
}

async function hitPageWithAssets(path: string, section: string, label: string) {
  const page = await getOk(path);
  if (!page.ok) {
    fail(section, label, `status ${page.status} in ${page.ms}ms`);
    return;
  }
  pass(section, label, `${page.status} ${page.ms}ms`);
  const html = page.text || "";
  const assets = extractAssets(html, `${ORIGIN}${path}`);
  if (!assets.length) return;
  await mapPool(assets, CONCURRENCY, async (asset) => {
    const r = await getOk(asset, ASSET_TIMEOUT_MS);
    const kind = classify(`${ORIGIN}${asset}`);
    if (!r.ok) fail(section, `Asset ${asset}`, `status ${r.status}`);
    else if (r.ms > ASSET_TIMEOUT_MS - 50) fail(section, `Asset timeout ${asset}`, `${r.ms}ms`);
    else pass(section, `${kind} ${asset.split("?")[0]}`, `${r.status} ${r.ms}ms`);
    return r;
  });
}

function stripeSignature(payload: string, secret: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

function showcaseTargets(): string[] {
  const paths: string[] = [];
  for (const b of SHOWCASE) {
    const dir = b.dir ?? b.id;
    const entry = showcaseSrc(b, b.entry);
    const disk = join(ROOT, "public", "showcase", dir, b.entry);
    if (!existsSync(disk)) continue;
    paths.push(entry);
    for (const req of b.requires) {
      if (existsSync(join(ROOT, "public", "showcase", dir, req))) {
        paths.push(`/showcase/${dir}/${req}`);
      }
    }
  }
  return [...new Set(paths)];
}

function criticalMedia(): string[] {
  const extra = [
    "/media/axioms-heart.mp4",
    "/media/axioms-heart-poster.jpg",
    "/media/otter-hero-animation.mp4",
    "/media/auto-hero-animation.mp4",
  ];
  return extra.filter((p) => existsSync(join(ROOT, "public", p)));
}

async function probeOrigin(): Promise<boolean> {
  const { res, error, ms } = await timedFetch(ORIGIN + "/", { timeoutMs: 8_000 });
  if (!res) {
    fail("health", "Preview origin reachable", error || "no response");
    return false;
  }
  record("GET /", res.status < 400, res.status, ms);
  if (res.status >= 500) {
    fail("health", "Landing HTTP", String(res.status));
    return false;
  }
  pass("health", "Preview origin reachable", `${ORIGIN} → ${res.status} in ${ms}ms`);
  return true;
}

async function runTraffic(tenantPath: string | null) {
  const pages: string[] = ["/"];
  for (let round = 0; round < TRAFFIC_ROUNDS; round++) pages.push("/");
  pages.push(...showcaseTargets().slice(0, 24));
  if (tenantPath) pages.push(tenantPath, tenantPath);

  await mapPool(pages, CONCURRENCY, async (path) => {
    const section = path === "/" ? "traffic.landing" : path.startsWith("/t/") ? "traffic.tenant" : "traffic.showcase";
    await hitPageWithAssets(path, section, path);
  });

  await mapPool(criticalMedia(), CONCURRENCY, async (path) => {
    const r = await getOk(path, ASSET_TIMEOUT_MS);
    if (r.ok && r.ms < ASSET_TIMEOUT_MS) pass("traffic.media", path, `${r.status} first-byte ${r.ms}ms`);
    else fail("traffic.media", path, r.ok ? `slow ${r.ms}ms` : `status ${r.status}`);
    if (r.ok) {
      const range = await timedFetch(`${ORIGIN}${path}`, {
        timeoutMs: ASSET_TIMEOUT_MS,
        headers: { Range: "bytes=0-1023" },
      });
      const st = range.res?.status ?? 0;
      const okRange = st === 206 || st === 200;
      record("asset media", okRange, st, range.ms);
      if (okRange) pass("traffic.media", `range ${path}`, String(st));
      else fail("traffic.media", `range ${path}`, String(st || range.error));
    }
  });
}

async function runCheckout(): Promise<{ slug: string; id: string } | null> {
  const build = SHOWCASE.find((b) => existsSync(join(ROOT, "public", "showcase", b.dir ?? b.id, b.entry))) ?? SHOWCASE[0];
  if (!build) {
    fail("checkout", "Showcase build available");
    return null;
  }
  const stamp = Date.now().toString(36);
  const business = `Bot Bay ${stamp}`;
  const fd = new FormData();
  fd.set("build_id", build.id);
  fd.set("business_name", business);
  fd.set("owner_name", "Load Bot");
  fd.set("email", `bot.${stamp}@example.test`);
  fd.set("phone", "5415550199");
  fd.set("logo", new Blob([TINY_PNG], { type: "image/png" }), "mark.png");

  const started = Date.now();
  const { res, ms, error } = await timedFetch(`${ORIGIN}/api/tenants`, { method: "POST", body: fd, timeoutMs: 25_000 });
  const status = res?.status ?? 0;
  let body: { ok?: boolean; id?: string; slug?: string; status?: string; siteUrl?: string; error?: string } = {};
  if (res) {
    try {
      body = (await res.json()) as typeof body;
    } catch {
      body = {};
    }
  }
  record("POST /api/tenants", Boolean(res?.ok && body.ok), status, ms, { error: error || body.error });
  if (!res?.ok || !body.ok || !body.slug) {
    fail("checkout", "POST /api/tenants provisions tenant", body.error || error || `HTTP ${status}`);
    return null;
  }
  pass("checkout", "One-screen checkout accepted", `${body.slug} status=${body.status} ${ms}ms`);

  const lookup = await getOk(`/api/tenants/${body.slug}`);
  if (lookup.ok && lookup.text?.includes(body.slug)) pass("checkout", "GET /api/tenants/:slug", String(lookup.status));
  else fail("checkout", "GET /api/tenants/:slug", String(lookup.status));

  const site = await getOk(body.siteUrl || `/t/${body.slug}`);
  if (site.ok && site.text?.includes(business)) pass("checkout", "Pending tenant page shows business name");
  else if (site.ok) pass("checkout", "Tenant route renders", `${site.status}`);
  else fail("checkout", "Tenant route", String(site.status));

  let tenantId = typeof body.id === "string" ? body.id : "";
  if (!tenantId) {
    try {
      const disk = JSON.parse(readFileSync(join(ROOT, ".data", "tenants.json"), "utf8")) as { id: string; slug: string }[];
      tenantId = disk.find((t) => t.slug === body.slug)?.id || "";
    } catch {
      /* supabase-backed stores return id on POST */
    }
  }
  if (!tenantId) {
    fail("checkout", "Tenant UUID for Stripe client_reference_id");
    return { slug: body.slug, id: "" };
  }
  pass("checkout", "Tenant UUID captured", tenantId);
  void started;
  return { slug: body.slug, id: tenantId };
}

async function runWebhook(tenant: { slug: string; id: string } | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const unsigned = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_bot" } } });
  const bad = await timedFetch(`${ORIGIN}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" },
    body: unsigned,
    timeoutMs: 8_000,
  });
  const badStatus = bad.res?.status ?? 0;
  record("POST stripe webhook", badStatus === 400 || badStatus === 401 || badStatus === 503, badStatus, bad.ms);
  if (badStatus === 400 || badStatus === 401 || badStatus === 503) {
    pass("webhook", "Forged / unsigned signature rejected", String(badStatus));
  } else {
    fail("webhook", "Forged signature must not 2xx", String(badStatus || bad.error));
  }

  if (!tenant?.id) {
    fail("webhook", "Skipped signed activation — no tenant id");
    return;
  }
  if (!secret) {
    fail("webhook", "STRIPE_WEBHOOK_SECRET missing — cannot sign checkout.session.completed");
    return;
  }
  if (!/^[0-9a-f-]{36}$/i.test(tenant.id)) {
    fail("webhook", "client_reference_id is not a UUID", tenant.id);
    return;
  }

  const payload = JSON.stringify({
    id: `evt_bot_${Date.now()}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_bot_${Date.now()}`,
        payment_status: "paid",
        amount_total: 199700,
        client_reference_id: tenant.id,
        metadata: { kind: "cinematic" },
      },
    },
  });
  const signed = await timedFetch(`${ORIGIN}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": stripeSignature(payload, secret),
    },
    body: payload,
    timeoutMs: 15_000,
  });
  const st = signed.res?.status ?? 0;
  const text = signed.res ? await signed.res.text() : signed.error || "";
  record("POST stripe webhook", st >= 200 && st < 300, st, signed.ms);
  if (st >= 200 && st < 300 && /received/i.test(text)) pass("webhook", "Signed checkout.session.completed accepted", `${st} ${signed.ms}ms`);
  else fail("webhook", "Signed webhook", `${st} ${text.slice(0, 160)}`);

  const after = await getOk(`/api/tenants/${tenant.slug}`);
  const active = Boolean(after.text?.includes('"status":"active"') || after.text?.includes('"status": "active"'));
  if (active) pass("webhook", "Tenant flipped pending → active", tenant.slug);
  else fail("webhook", "Tenant did not activate", after.text?.slice(0, 180) || String(after.status));

  const site = await getOk(`/t/${tenant.slug}`);
  const branded =
    Boolean(site.text && (site.text.includes("Bot Bay") || /axiom-master|TenantFrame|iframe/i.test(site.text)));
  if (site.ok && branded) pass("webhook", "/t/[slug] renders branding on first load", `${site.status} ${site.ms}ms`);
  else if (site.ok) pass("webhook", "/t/[slug] reachable after pay", `${site.status}`);
  else fail("webhook", "/t/[slug] after activation", String(site.status));
}

async function runSecurity() {
  const malformed = [
    { body: "{", ct: "application/json", label: "truncated JSON" },
    { body: "not-json", ct: "application/json", label: "plain text as JSON" },
    { body: "[]", ct: "application/json", label: "JSON array" },
    { body: JSON.stringify({ business: "x".repeat(5000), name: "n", email: "a@b.c", phone: "123" }), ct: "application/json", label: "oversized + bad phone" },
  ];
  for (const row of malformed) {
    const { res, ms, error } = await timedFetch(`${ORIGIN}/api/lead`, {
      method: "POST",
      headers: { "content-type": row.ct },
      body: row.body,
      timeoutMs: 8_000,
    });
    const st = res?.status ?? 0;
    const held = st === 400 || st === 422 || st === 413 || st === 200;
    record("POST /api/lead", held && st < 500, st, ms, { error });
    if (st >= 500 || !res) fail("security", `Lead ${row.label} must not 500`, String(st || error));
    else pass("security", `Lead ${row.label} contained`, String(st));
  }

  const honeypot = await timedFetch(`${ORIGIN}/api/lead`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      business: "Spam Co",
      name: "Bot",
      email: "spam@example.test",
      phone: "5415550100",
      website: "https://spam.example",
    }),
    timeoutMs: 8_000,
  });
  const hs = honeypot.res?.status ?? 0;
  record("POST /api/lead", hs === 200, hs, honeypot.ms);
  if (hs === 200) pass("security", "Lead honeypot accepted without forwarding crash");
  else fail("security", "Lead honeypot", String(hs || honeypot.error));

  const burst = Array.from({ length: 24 }, (_, i) => i);
  const burstHits = await mapPool(burst, CONCURRENCY, async (i) => {
    const { res, ms, error } = await timedFetch(`${ORIGIN}/api/lead`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ business: `Burst ${i}`, name: "x", email: "nope", phone: "1" }),
      timeoutMs: 8_000,
    });
    const st = res?.status ?? 0;
    record("POST /api/lead", st === 422 || st === 400 || st === 429, st, ms, { error });
    return st;
  });
  const fiveHundreds = burstHits.filter((s) => s >= 500).length;
  if (fiveHundreds === 0) pass("security", "Rapid-fire /api/lead held (no 5xx)", `${burstHits.length} reqs`);
  else fail("security", "Rapid-fire crashed lead route", `${fiveHundreds} × 5xx`);

  const huge = Buffer.concat([TINY_PNG, Buffer.alloc(2 * 1024 * 1024 + 64, 1)]);
  const fd = new FormData();
  fd.set("build_id", SHOWCASE[0]?.id || "ironsight-armory");
  fd.set("business_name", "Too Big Logo LLC");
  fd.set("owner_name", "Bot");
  fd.set("email", "bot@example.test");
  fd.set("phone", "5415550100");
  fd.set("logo", new Blob([huge], { type: "image/png" }), "huge.png");
  const over = await timedFetch(`${ORIGIN}/api/tenants`, { method: "POST", body: fd, timeoutMs: 20_000 });
  const os = over.res?.status ?? 0;
  record("POST /api/tenants", os === 422 || os === 413, os, over.ms);
  if (os === 422 || os === 413) pass("security", "Oversized logo rejected", String(os));
  else if (os >= 500 || !over.res) fail("security", "Oversized logo crashed tenants", String(os || over.error));
  else fail("security", "Oversized logo should 422/413", String(os));

  const junk = new FormData();
  junk.set("build_id", SHOWCASE[0]?.id || "ironsight-armory");
  junk.set("business_name", "Bad Bytes LLC");
  junk.set("email", "bot@example.test");
  junk.set("phone", "5415550100");
  junk.set("logo", new Blob([Buffer.from("not-an-image")], { type: "image/png" }), "x.png");
  const badLogo = await timedFetch(`${ORIGIN}/api/tenants`, { method: "POST", body: junk, timeoutMs: 15_000 });
  const bl = badLogo.res?.status ?? 0;
  record("POST /api/tenants", bl === 422, bl, badLogo.ms);
  if (bl === 422) pass("security", "Non-image logo sniff rejected");
  else fail("security", "Non-image logo", String(bl || badLogo.error));

  const after = await getOk("/");
  if (after.ok) pass("security", "Landing still healthy after abuse", `${after.status} ${after.ms}ms`);
  else fail("security", "Landing died after abuse", String(after.status));
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[i]!;
}

function report() {
  const by = new Map<string, Hit[]>();
  for (const h of hits) {
    const list = by.get(h.endpoint) ?? [];
    list.push(h);
    by.set(h.endpoint, list);
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  const okHits = hits.filter((h) => h.ok).length;

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Load / Bot Traffic Report");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Origin:     ${ORIGIN}`);
  console.log(`  Bots:       ${CONCURRENCY} concurrent workers`);
  console.log(`  Requests:   ${hits.length}  ·  OK ${okHits}  ·  FAIL ${hits.length - okHits}`);
  console.log(`  Checks:     ${checks.length}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("  Endpoint                              n   ok%   avg   p95");
  for (const [name, list] of [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const times = list.map((h) => h.ms);
    const ok = list.filter((h) => h.ok).length;
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const p95 = percentile(times, 95);
    const pct = Math.round((ok / list.length) * 100);
    console.log(
      `  ${name.padEnd(36)} ${String(list.length).padStart(3)}  ${String(pct).padStart(3)}%  ${String(avg).padStart(4)}  ${String(p95).padStart(4)} ms`,
    );
  }
  console.log("──────────────────────────────────────────────────────────────");
  for (const c of checks.filter((x) => !x.ok)) {
    console.log(`  [FAIL] [${c.section}] ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  const hard = failed === 0 && hits.some((h) => h.ok);
  console.log("──────────────────────────────────────────────────────────────");
  console.log(
    hard
      ? "  RESULT: INFRASTRUCTURE HELD — traffic, checkout, webhook, and abuse paths green."
      : `  RESULT: NOT READY — ${failed} check(s) failed, ${hits.length - okHits} request error(s).`,
  );
  console.log("══════════════════════════════════════════════════════════════\n");
  return hard;
}

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Public Traffic Bots");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  ${ORIGIN}  ·  concurrency ${CONCURRENCY}`);
  console.log("──────────────────────────────────────────────────────────────\n");

  const up = await probeOrigin();
  if (!up) {
    report();
    process.exit(1);
  }

  console.log("▶ Checkout & provisioning\n");
  const tenant = await runCheckout();

  console.log("▶ Stripe webhook activation\n");
  await runWebhook(tenant);

  console.log("▶ Concurrent landing / showcase / tenant traffic\n");
  await runTraffic(tenant?.slug ? `/t/${tenant.slug}` : null);

  console.log("▶ Rate-limit & abuse battery\n");
  await runSecurity();

  const ok = report();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
