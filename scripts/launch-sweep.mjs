/**
 * Pre-launch audit. Does not send SMS, email, or create Stripe charges.
 * Run: node scripts/launch-sweep.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`pass  ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${message}`);
    console.log(`FAIL  ${name}\n      ${message}`);
  }
}

const catalogMod = await import(pathToFileURL(join(root, "src/config/catalog.ts")).href);
const actionsMod = await import(pathToFileURL(join(root, "src/config/niche-actions.ts")).href);
const rosterMod = await import(pathToFileURL(join(root, "src/lib/axiom/regional-roster.ts")).href);
const { CATALOG, CATALOG_NICHES, EXTRA_HERO_LOOPS, catalogFilmUrl, assertCatalogNiche, isCatalogNiche } = catalogMod;
const { NICHE_ACTION_MAP, getNicheActions } = actionsMod;

check("21 catalog niches each resolve a unique hero mp4 on disk", () => {
  assert.equal(CATALOG_NICHES.length, 21);
  const urls = CATALOG.map((row) => catalogFilmUrl(row.id));
  assert.equal(new Set(urls).size, 21);
  for (const row of CATALOG) {
    const url = catalogFilmUrl(row.id);
    assert.match(url, /^\/media\/[a-z0-9-]+-hero-animation\.mp4$/);
    const file = join(root, "public", url.slice(1));
    assert.equal(existsSync(file), true, `${row.id} missing ${url}`);
  }
  const onDisk = readdirSync(join(root, "public/media")).filter((name) => name.endsWith(".mp4"));
  assert.equal(onDisk.length, CATALOG.length + EXTRA_HERO_LOOPS.length);
  assert.equal(onDisk.includes("otter-hero-animation.mp4"), true);
  for (const name of onDisk) {
    assert.match(name, /-hero-animation\.mp4$/);
    assert.equal(name.endsWith(".mp4.mp4"), false);
  }
});

check("niche actions cover every catalog niche and refuse generic fallbacks", () => {
  assert.deepEqual(Object.keys(NICHE_ACTION_MAP).sort(), [...CATALOG_NICHES].sort());
  const primaries = new Set();
  for (const niche of CATALOG_NICHES) {
    const actions = getNicheActions(niche);
    assert.ok(actions, niche);
    assert.equal(actions.primaryCta.toLowerCase().includes("book now"), false);
    assert.equal(actions.primaryCta === "Book", false);
    assert.ok(actions.secondaryCta.length > 8);
    assert.ok(actions.badge.length > 2);
    assert.equal(actions.services.length, 3);
    primaries.add(actions.primaryCta);
  }
  assert.equal(primaries.size, 21);
  assert.equal(getNicheActions("fitness"), undefined);
  assert.equal(getNicheActions("wellness"), undefined);
  assert.equal(getNicheActions(""), undefined);
  assert.match(getNicheActions("bow-tech").primaryCta, /archery tuning/i);
  assert.match(getNicheActions("auto").primaryCta, /diagnostic sweep/i);
  assert.match(getNicheActions("electrical").secondaryCta, /high-voltage grid/i);
  assert.throws(() => assertCatalogNiche("massage"), /unknown catalog niche/i);
  assert.equal(isCatalogNiche("salon"), false);
});

check("each niche storefront resolves its own catalog loop", () => {
  const film = read("src/lib/axiom/hero-studio-state.ts");
  assert.match(film, /catalogFilmUrl\(resolveCatalogNiche\(input\.niche\)\)/);
  const glass = read("src/lib/axiom/funnel-glass.ts");
  assert.match(glass, /export function leadGlassCopy/);
  const media = read("src/lib/axiom/media.ts");
  assert.equal((media.match(/function isOutdoorGuideNiche/g) ?? []).length, 1);
});

check("storefront reads niche actions and does not invent a Book fallback", () => {
  const page = read("src/app/[shopSlug]/page.tsx");
  assert.match(page, /getNicheActions\(data\.shop\.niche\)/);
  assert.match(page, /actions\.primaryCta/);
  assert.match(page, /actions\.secondaryCta/);
  assert.match(page, /actions\.badge/);
  assert.match(page, /actions\.services/);
  assert.doesNotMatch(page, />Book</);
});

check("shop create validates the catalog and pins the matching film", () => {
  const route = read("src/routes/api/shops.create.ts");
  assert.match(route, /assertCatalogNiche/);
  assert.match(route, /catalogFilmUrl\(niche\)/);
  assert.match(route, /unknown catalog niche/);
  assert.match(route, /status: 401/);
  const provision = read("src/lib/axiom/shop-server.server.ts");
  assert.match(provision, /assertCatalogNiche/);
  assert.match(provision, /normalizeShopNiche/);
});

check("hosted database outages defer instead of throwing an unhandled 500", () => {
  const db = read("src/lib/db.ts");
  assert.match(db, /function deferHostedDatabase/);
  assert.match(db, /Local development is staying up without it/);
  assert.match(db, /if \(deferHostedDatabase\(err\)\) return/);
  const studio = read("src/lib/axiom/hero-studio-state.ts");
  assert.match(studio, /if \(!url \|\| !key \|\| !shopSlug\) return "skipped"/);
  assert.match(studio, /catch \{\s*return "skipped"/);
});

check("regional roster and cron stay inside Jackson, Josephine, and Douglas", () => {
  assert.deepEqual([...rosterMod.HOME_REGION_COUNTIES], [
    "Jackson County",
    "Josephine County",
    "Douglas County",
  ]);
  const cron = read("src/lib/axiom/outreach-cron.server.ts");
  assert.match(cron, /OUTREACH_CRON_SECRET/);
  assert.match(cron, /status: 404/);
  assert.match(cron, /status: 403/);
  assert.match(cron, /drainOutreachQueue/);
  const queue = read("src/lib/axiom/outreach-queue.server.ts");
  assert.match(queue, /No provider call/);
  assert.match(queue, /deliverOutreachMessage/);
  assert.match(queue, /isHomePreviewCounty/);
  const bulk = read("src/lib/axiom/bulk-import.ts");
  assert.match(bulk, /export function parseLeadCsv/);
  assert.match(bulk, /IMPORT_BATCH = 1000/);
});

check("Twilio and Resend payloads carry tenant fields and skip when unset", () => {
  const notify = read("src/lib/axiom/notify.server.ts");
  assert.match(notify, /api\.resend\.com\/emails/);
  assert.match(notify, /from, to: \[to\], subject, text: body/);
  assert.match(notify, /Accounts\/\$\{sid\}\/Messages\.json/);
  assert.match(notify, /To: to, From: from, Body: body\.slice\(0, 640\)/);
  assert.match(notify, /Email provider is not configured/);
  assert.match(notify, /SMS provider is not configured/);
  const master = read("src/lib/axiom/master.server.ts");
  assert.match(master, /business: lead\.businessName/);
  assert.match(master, /county: lead\.county/);
  assert.match(master, /city: lead\.city/);
  assert.match(master, /if \(config\.mode === "live"\)/);
  assert.match(master, /missingOutreachCredentials/);
});

check("Stripe verifies signatures, settles territory, and retries are idempotent", () => {
  const payments = read("src/lib/axiom/payments.server.ts");
  assert.match(payments, /function verifyStripeSignature/);
  assert.match(payments, /timingSafeEqual/);
  assert.match(payments, /age > 300/);
  assert.match(payments, /Invalid signature/);
  assert.match(payments, /checkout\.session\.completed/);
  assert.match(payments, /settleTerritorySession/);
  assert.match(payments, /already: true/);
  const territory = read("src/lib/axiom/territory.server.ts");
  assert.match(territory, /on conflict \(lead_slug\) do nothing/);
  assert.match(territory, /already: !inserted\[0\]/);
  assert.match(territory, /This territory is already live/);
  const webhook = read("src/routes/api/webhooks.stripe.ts");
  assert.match(webhook, /handleStripeWebhook/);
  const media = read("src/lib/axiom/media.ts");
  const declarations = media.match(/function isOutdoorGuideNiche/g) ?? [];
  assert.equal(declarations.length, 1);
});

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nlaunch sweep passed");
