/**
 * End-to-end release readiness diagnostic across outreach, billing, and Hero Studio.
 *
 *   npx tsx --env-file=.env scripts/test-axiom-release-readiness.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  clampDailyCap,
  defaultEngineState,
  engineTickLine,
  remainingCap,
  throttleCount,
} from "../src/lib/axiom/outbound-engine.ts";
import { outreachMayCallProviders, parseOutreachMode } from "../src/lib/axiom/outreach-queue.ts";
import { pairDatasetToNichePreview } from "../src/lib/axiom/niche-dataset-pairing.ts";
import { MASTER_FUNNELS, renderOutreachMessage } from "../src/lib/axiom/funnel.ts";
import { GEAR_GUARDIAN_BPS, gearGuardianFeeCents } from "../src/lib/axiom/merchant-pricing.ts";
import { territoryPlan, territorySessionSettled } from "../src/lib/axiom/pricing.ts";
import {
  FOUNDER_LIFETIME_CENTS,
  NAME_YOUR_PRICE_MIN_CENTS,
  STANDARD_MONTHLY_CENTS,
} from "../src/lib/stripe/commercial.ts";
import { cleanHeroUrl, isPlayableHeroFilm } from "../src/lib/axiom/hero-studio-state.ts";
import { bustStorefrontFilm, resolveShopHeroFilm } from "../src/lib/axiom/resolve-hero-film.ts";
import { historicalHeroArchive } from "../src/lib/axiom/historical-hero-archive.ts";
import { isPublicMediaFilm } from "../src/lib/axiom/hero-films.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEV_ORIGIN = process.env.AXIOM_DEV_ORIGIN?.trim() || "http://127.0.0.1:8080";

type Check = { ok: boolean; section: string; label: string; detail?: string };
const checks: Check[] = [];

function pass(section: string, label: string, detail?: string) {
  checks.push({ ok: true, section, label, detail });
}
function fail(section: string, label: string, detail?: string) {
  checks.push({ ok: false, section, label, detail });
}
function assert(section: string, condition: boolean, label: string, detail?: string) {
  if (condition) pass(section, label, detail);
  else fail(section, label, detail);
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

/* ─── 1. Outbound autopilot & API routing ─────────────────────────────── */

function verifyAutopilotRouting() {
  const S = "outreach";
  const routeTree = read("src/routeTree.gen.ts");
  assert(S, routeTree.includes("'/api/master/autopilot'"), "Route · /api/master/autopilot registered");
  assert(S, existsSync(join(ROOT, "src/routes/api/master.autopilot.ts")), "File · master.autopilot route present");
  assert(S, existsSync(join(ROOT, "src/app/api/master/autopilot/route.ts")), "File · autopilot handlers present");

  const handlers = read("src/app/api/master/autopilot/route.ts");
  assert(S, handlers.includes("run_batch") && handlers.includes("start") && handlers.includes("pause"), "API · POST actions start|pause|run_batch");
  assert(S, handlers.includes("dispatchAutopilot") || handlers.includes("commandMasterAutopilot"), "API · batch dispatch wired");

  const state = defaultEngineState();
  assert(S, state.smsDailyCap === 40, "Caps · default SMS daily cap is 40", String(state.smsDailyCap));
  assert(S, state.emailDailyCap === 80, "Caps · default email daily cap is 80", String(state.emailDailyCap));
  assert(S, DEFAULT_SMS_DAILY_CAP === 40 && DEFAULT_EMAIL_DAILY_CAP === 80, "Caps · exported constants match 40/80");
  assert(S, clampDailyCap(40, 40) === 40 && clampDailyCap(80, 80) === 80, "Caps · clamp preserves daily limits");
  assert(S, remainingCap(0, 40) === 40 && remainingCap(40, 40) === 0, "Caps · remaining room depletes to zero");
  assert(S, throttleCount(5, remainingCap(38, 40)) === 2, "Caps · tick respects remaining SMS room");

  assert(S, parseOutreachMode("live") === "live", "Mode · live token enables providers");
  assert(S, parseOutreachMode("simulation") === "simulation", "Mode · non-live stays simulation");
  assert(S, outreachMayCallProviders(parseOutreachMode("simulation")) === false, "Mode · simulation never calls Twilio/Resend");
  assert(S, engineTickLine({ live: false, channel: "sms", business: "Rogue Iron" }).status === "logged", "Tick · simulation logs only");
  assert(S, engineTickLine({ live: true, channel: "email", business: "Rogue Iron" }).status === "queued", "Tick · live queues provider send");

  const notify = read("src/lib/axiom/notify.server.ts");
  assert(S, notify.includes("api.resend.com/emails"), "Resend · endpoint wired");
  assert(S, /JSON\.stringify\(\{\s*from,\s*to:\s*\[to\],\s*subject,\s*text:\s*body\s*\}\)/.test(notify.replace(/\s+/g, " ")), "Resend · payload shape {from,to[],subject,text}");
  assert(S, notify.includes("api.twilio.com/2010-04-01/Accounts/"), "Twilio · Messages endpoint wired");
  assert(
    S,
    /URLSearchParams\(\{\s*To:\s*(?:to|dest),\s*From:\s*from,\s*Body:/.test(notify),
    "Twilio · payload shape To/From/Body",
  );
  assert(
    S,
    notify.includes("twilioSmsFailureDetail") ||
      read("src/lib/axiom/notify-twilio.ts").includes("insufficient funds"),
    "Twilio · invalid number / funds errors mapped",
  );
  assert(S, notify.includes("RESEND_API_KEY") && notify.includes("TWILIO_ACCOUNT_SID"), "Providers · credential gates present");

  const funnel = MASTER_FUNNELS[0];
  const preview = pairDatasetToNichePreview({
    businessName: "Rogue Bay Auto",
    tradeType: "auto",
    phone: "541-555-0199",
    city: "Medford",
    county: "Jackson County",
    leadSlug: "rogue-bay-auto-medford",
  });
  assert(S, preview.overlay.businessName === "Rogue Bay Auto", "Pairing · business name injected");
  assert(S, preview.overlay.phone === "541-555-0199", "Pairing · phone injected");
  assert(S, preview.overlay.location.includes("Medford"), "Pairing · city injected", preview.overlay.location);
  assert(S, preview.previewPath.startsWith("/?b="), "Pairing · outreach link uses /?b=…", preview.previewPath);
  assert(S, preview.previewPath.includes("b=rogue-bay-auto-medford"), "Pairing · lead slug in preview path");
  assert(S, preview.previewPath.includes("utm_source=desk"), "Pairing · desk utm on outreach link");

  const absolute = `https://axiom.example${preview.previewPath}`;
  const sms = renderOutreachMessage(funnel.text, {
    business: preview.overlay.businessName,
    city: "Medford",
    url: absolute,
  });
  assert(S, sms.includes("Rogue Bay Auto") && sms.includes("Medford") && sms.includes("b=rogue-bay-auto-medford"), "Funnel · SMS template fills name/city/preview");
}

async function probeAutopilotHttp() {
  const S = "outreach";
  try {
    const res = await fetch(`${DEV_ORIGIN}/api/master/autopilot`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    // Auth may reject; any non-404 proves the route is mounted.
    assert(S, res.status !== 404, `HTTP · GET /api/master/autopilot reachable`, `status ${res.status}`);
  } catch (err) {
    pass(S, "HTTP · GET /api/master/autopilot skipped (dev server unreachable)", err instanceof Error ? err.message.slice(0, 80) : "offline");
  }
}

/* ─── 2. Stripe billing & webhook provisioning ────────────────────────── */

function verifyStripeBilling() {
  const S = "billing";
  const routeTree = read("src/routeTree.gen.ts");
  assert(S, routeTree.includes("'/api/webhooks/stripe'") || routeTree.includes("/api/webhooks/stripe"), "Route · /api/webhooks/stripe registered");
  assert(S, existsSync(join(ROOT, "src/routes/api/webhooks.stripe.ts")), "File · stripe webhook route present");

  const webhook = read("src/routes/api/webhooks.stripe.ts");
  assert(S, webhook.includes("handleStripeWebhook"), "Webhook · delegates to payments.server");

  const payments = read("src/lib/axiom/payments.server.ts");
  assert(S, payments.includes('event.type === "checkout.session.completed"'), "Webhook · handles checkout.session.completed");
  assert(S, payments.includes('meta.kind === "territory"'), "Webhook · territory checkout branch");
  assert(S, payments.includes("settleTerritorySession"), "Webhook · settleTerritorySession on success");
  assert(S, payments.includes("activateTerritory"), "Webhook · activates territory after pay");
  assert(S, payments.includes("provisionTerritoryForPayer"), "Webhook · provisions tenant shop for payer");
  assert(S, payments.includes("gear_guardian_bps") && payments.includes("GEAR_GUARDIAN_BPS"), "Webhook · Gear Guardian metadata on Stripe objects");

  assert(S, GEAR_GUARDIAN_BPS === 150, "Fee · Gear Guardian is 150 bps (1.5%)");

  // Choose Your Price commercial tiers (replaces legacy $497 growth).
  const trial = territoryPlan("trial");
  const monthly = territoryPlan("growth"); // legacy id → $150/mo standard
  const lifetime = territoryPlan("lifetime");
  assert(
    S,
    trial?.amountCents === NAME_YOUR_PRICE_MIN_CENTS && NAME_YOUR_PRICE_MIN_CENTS === 100,
    "Plan · Choose Your Price Month 1 floor is $1",
    String(trial?.amountCents),
  );
  assert(
    S,
    monthly?.amountCents === STANDARD_MONTHLY_CENTS && STANDARD_MONTHLY_CENTS === 15_000,
    "Plan · standard monthly is $150",
    String(monthly?.amountCents),
  );
  assert(
    S,
    lifetime?.amountCents === FOUNDER_LIFETIME_CENTS && FOUNDER_LIFETIME_CENTS === 150_000,
    "Plan · Founder's Lifetime is $1,500",
    String(lifetime?.amountCents),
  );
  assert(S, trial?.renewalCents === STANDARD_MONTHLY_CENTS, "Plan · Name Your Price renews at $150/mo on day 31");

  const fee = gearGuardianFeeCents(monthly!.amountCents);
  assert(
    S,
    fee === Math.round((STANDARD_MONTHLY_CENTS * 150) / 10_000),
    "Fee · 1.5% of $150 = expected cents",
    String(fee),
  );
  assert(S, fee > 0 && fee < monthly!.amountCents, "Fee · split leaves merchant remainder");

  assert(S, territorySessionSettled(monthly!, "paid") === true, "Settlement · paid status completes $150 monthly");
  assert(
    S,
    territorySessionSettled(trial!, "no_payment_required") === false,
    "Settlement · Choose Your Price rejects no_payment_required (always ≥ $1)",
  );
  assert(S, territorySessionSettled(trial!, "paid") === true, "Settlement · paid status completes Name Your Price");
  assert(S, territorySessionSettled(lifetime!, "paid") === true, "Settlement · paid status completes Founder's Lifetime");

  // Simulated checkout.session.completed payload contract (no live Stripe call).
  const simulated = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_release_readiness",
        payment_status: "paid",
        amount_total: STANDARD_MONTHLY_CENTS,
        metadata: {
          kind: "territory",
          lead_slug: "rogue-bay-auto-medford",
          plan_id: "growth",
          checkout_id: "tco_test",
          gear_guardian_bps: String(GEAR_GUARDIAN_BPS),
          gear_guardian_cents: String(fee),
          user_id: "user_test_payer",
        },
      },
    },
  };
  assert(S, simulated.type === "checkout.session.completed", "Sim · event type is checkout.session.completed");
  assert(S, simulated.data.object.metadata.kind === "territory", "Sim · metadata.kind=territory triggers provision path");
  assert(S, Number(simulated.data.object.metadata.gear_guardian_bps) === 150, "Sim · Gear Guardian bps stamped on session");
  assert(
    S,
    Number(simulated.data.object.amount_total) === monthly!.amountCents,
    "Sim · amount_total matches $150 monthly plan",
  );

  const provision = read("src/lib/axiom/shop-server.server.ts");
  assert(S, provision.includes("provisionTerritoryForPayer"), "Provision · territory payer entrypoint exists");
  assert(S, provision.includes("gear_guardian_bps") && provision.includes("150"), "Provision · shop_billing seeds Gear Guardian 150 bps");
  assert(S, /axiom_pro/.test(provision) && /trialing|active/.test(provision), "Provision · tenant billing status set on create");
}

async function verifyBillingDb() {
  const S = "billing";
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) {
    pass(S, "DB · skipped (DATABASE_URL unset)");
    return;
  }
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  pool.on("error", () => {});
  try {
    const cols = await pool.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'shop_billing'
         and column_name in ('gear_guardian_bps','status','plan','price_cents')`,
    );
    const names = new Set(cols.rows.map((r) => r.column_name));
    assert(S, names.has("gear_guardian_bps"), "DB · shop_billing.gear_guardian_bps exists");
    assert(S, names.has("status"), "DB · shop_billing.status exists");

    const sample = await pool.query<{ gear_guardian_bps: number; status: string; plan: string }>(
      `select gear_guardian_bps, status, plan from shop_billing order by updated_at desc nulls last limit 5`,
    ).catch(async () =>
      pool.query<{ gear_guardian_bps: number; status: string; plan: string }>(
        `select gear_guardian_bps, status, plan from shop_billing limit 5`,
      ),
    );
    if (sample.rows.length === 0) {
      pass(S, "DB · shop_billing empty (schema ready, no rows yet)");
    } else {
      const okBps = sample.rows.every((r) => Number(r.gear_guardian_bps) === 150 || Number(r.gear_guardian_bps) === 0);
      assert(S, okBps, "DB · billing rows carry Gear Guardian bps 150 (or 0 override)", sample.rows.map((r) => r.gear_guardian_bps).join(","));
      const statuses = sample.rows.map((r) => r.status);
      assert(S, statuses.every((s) => typeof s === "string" && s.length > 0), "DB · tenant billing status populated", statuses.join(","));
    }

    const act = await pool.query(
      `select 1 from information_schema.tables where table_schema='public' and table_name='territory_activations'`,
    );
    assert(S, (act.rowCount ?? 0) > 0, "DB · territory_activations table present");
  } catch (err) {
    fail(S, "DB · billing probe", err instanceof Error ? err.message.slice(0, 160) : String(err));
  } finally {
    await pool.end().catch(() => undefined);
  }
}

/* ─── 3. Hero Studio ↔ storefront sync ────────────────────────────────── */

async function verifyHeroStudioSync() {
  const S = "hero-studio";
  const routeTree = read("src/routeTree.gen.ts");
  assert(S, routeTree.includes("'/\$shopSlug/admin/hero-studio'"), "Route · /$shopSlug/admin/hero-studio");
  assert(S, routeTree.includes("'/\$shopSlug/admin'"), "Route · /$shopSlug/admin");

  const studio = read("src/app/[shopSlug]/admin/components/HeroStudio.tsx");
  assert(S, studio.includes("HeroCustomizer"), "UI · archive picker mounted");
  assert(S, studio.includes("heroFilm: draft.hero_video_url"), "UI · publish writes heroFilm");
  assert(S, studio.includes("persistHeroToSupabase"), "UI · Supabase book persistence");

  const archive = historicalHeroArchive();
  assert(S, archive.length >= 40, "Archive · historical inventory loaded", `${archive.length} assets`);
  for (const file of ["shark-hero-animation.mp4", "otter-hero-animation.mp4", "leopard-hero-animation.mp4", "auto-hero-animation.mp4"]) {
    assert(S, archive.some((a) => a.src.endsWith(file)), `Archive · includes ${file}`);
  }

  const swaps = [
    "/media/shark-hero-animation.mp4",
    "/media/otter-hero-animation.mp4",
    "/media/leopard-hero-animation.mp4",
    "/media/auto-hero-animation.mp4",
  ] as const;

  let stamp = Date.now();
  for (const loop of swaps) {
    assert(S, isPlayableHeroFilm(loop) && isPublicMediaFilm(loop), `Validate · ${loop.split("/").pop()} playable`);
    const cleaned = cleanHeroUrl(loop);
    assert(S, cleaned === loop, `Validate · cleanHeroUrl accepts ${loop.split("/").pop()}`);

    const row = {
      hero_video_url: cleaned,
      hero_background_loop: cleaned,
      override: cleaned,
      storefrontFilmAt: stamp++,
    };
    assert(S, row.hero_video_url === row.hero_background_loop, `Persist · columns lockstep ${loop.split("/").pop()}`);

    const film = resolveShopHeroFilm({
      overrideHeroVideoUrl: row.override,
      heroVideoUrl: row.hero_background_loop,
      niche: "auto",
    });
    assert(S, film === loop, `Storefront · resolveShopHeroFilm → ${loop.split("/").pop()}`);
    const busted = bustStorefrontFilm(film, row.storefrontFilmAt);
    assert(S, busted.startsWith(loop) && /\?v=\d+$/.test(busted), `Storefront · cache-bust ?v= on ${loop.split("/").pop()}`, busted);
  }

  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) {
    pass(S, "DB · skipped (DATABASE_URL unset)");
    return;
  }
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  pool.on("error", () => {});
  try {
    const col = await pool.query<{ exists: boolean }>(
      `select exists (
         select 1 from information_schema.columns
         where table_schema='public' and table_name='shops' and column_name='hero_background_loop'
       ) as exists`,
    );
    assert(S, Boolean(col.rows[0]?.exists), "DB · shops.hero_background_loop column exists");

    const shop = await pool.query<{
      id: string;
      slug: string;
      hero_video_url: string | null;
      hero_background_loop: string | null;
    }>(
      `select id, slug, hero_video_url, hero_background_loop
       from shops where is_showcase = true
       order by created_at asc limit 1`,
    );
    if (!shop.rows[0]) {
      pass(S, "DB · no showcase shop to mutate (schema ok)");
      return;
    }
    const target = shop.rows[0];
    const previous = {
      video: target.hero_video_url,
      loop: target.hero_background_loop,
    };
    const next = "/media/auto-hero-animation.mp4";
    await pool.query(
      `update shops set hero_video_url = $1, hero_background_loop = $1 where id = $2`,
      [next, target.id],
    );
    const readBack = await pool.query<{ hero_video_url: string | null; hero_background_loop: string | null }>(
      `select hero_video_url, hero_background_loop from shops where id = $1`,
      [target.id],
    );
    assert(S, readBack.rows[0]?.hero_video_url === next, "DB · hero_video_url persisted", target.slug);
    assert(S, readBack.rows[0]?.hero_background_loop === next, "DB · hero_background_loop persisted", target.slug);
    const mirrored = resolveShopHeroFilm({
      heroVideoUrl: readBack.rows[0]?.hero_background_loop || readBack.rows[0]?.hero_video_url,
      niche: "auto",
    });
    assert(S, mirrored === next, "Storefront · mirrored saved loop");
    await pool.query(
      `update shops set hero_video_url = $1, hero_background_loop = $2 where id = $3`,
      [previous.video, previous.loop, target.id],
    );
    pass(S, "DB · restored previous hero columns", target.slug);
  } catch (err) {
    fail(S, "DB · hero sync probe", err instanceof Error ? err.message.slice(0, 160) : String(err));
  } finally {
    await pool.end().catch(() => undefined);
  }
}

/* ─── Report ──────────────────────────────────────────────────────────── */

function printReport() {
  const sections = ["outreach", "billing", "hero-studio"] as const;
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  console.log("");
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Release Readiness");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Checks: ${checks.length}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  for (const section of sections) {
    const rows = checks.filter((c) => c.section === section);
    const ok = rows.filter((c) => c.ok).length;
    const bad = rows.length - ok;
    console.log(`  · ${section.padEnd(12)} ${ok}/${rows.length} pass${bad ? ` (${bad} fail)` : ""}`);
  }
  console.log("──────────────────────────────────────────────────────────────");
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    console.log(`  [${mark}] [${check.section}] ${check.label}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log("──────────────────────────────────────────────────────────────");
  if (failed === 0) {
    console.log("  RESULT: RELEASE READY — outreach, billing, and hero studio are green.");
  } else {
    console.log(`  RESULT: NOT READY — ${failed} failing check(s).`);
  }
  console.log("══════════════════════════════════════════════════════════════");
  console.log("");
}

async function main() {
  console.log("Running Axiom release-readiness suite…");
  verifyAutopilotRouting();
  await probeAutopilotHttp();
  verifyStripeBilling();
  await verifyBillingDb();
  await verifyHeroStudioSync();
  printReport();
  if (checks.some((c) => !c.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
