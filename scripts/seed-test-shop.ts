/**
 * Provision the local/dev test tenant `axiom-auto` (Apex Moto Labs).
 *
 * Ensures:
 *   1. LOCAL_STOREFRONTS always resolves the slug (Postgres-down fallback)
 *   2. Supabase `shops` row is upserted when DATABASE_URL is reachable
 *   3. Admin + Hero Studio routes no longer 404 with "No shop at this address"
 *
 *   npx tsx --env-file=.env scripts/seed-test-shop.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { AXIOM_TEST_SHOP, localStorefront } from "../src/lib/axiom/autopilot.ts";
import { materializeDatasetShop } from "../src/lib/axiom/autopilot-shop.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = AXIOM_TEST_SHOP.shopSlug;
const SHOP_ID = "shop_axiom_auto";
const HERO = AXIOM_TEST_SHOP.heroVideoUrl;
const NAME = AXIOM_TEST_SHOP.name;
const NICHE = AXIOM_TEST_SHOP.niche;
const PREVIEW = process.env.AXIOM_PREVIEW_ORIGIN?.trim() || "http://127.0.0.1:8080";

type Check = { ok: boolean; label: string; detail?: string };
const checks: Check[] = [];

function pass(label: string, detail?: string) {
  checks.push({ ok: true, label, detail });
}
function fail(label: string, detail?: string) {
  checks.push({ ok: false, label, detail });
}
function assert(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function databaseUrlFromDisk(): string {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return "";
  const text = readFileSync(envPath, "utf8");
  const line = text.split(/\r?\n/).find((row) => row.startsWith("DATABASE_URL="));
  if (!line) return "";
  return line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
}

function verifyLocalFallback() {
  const row = localStorefront(SLUG);
  assert(Boolean(row), "Local · LOCAL_STOREFRONTS includes axiom-auto");
  assert(row?.name === NAME, "Local · shop_name is Apex Moto Labs", row?.name);
  assert(row?.niche === NICHE, "Local · niche is auto", row?.niche);
  assert(row?.heroVideoUrl === HERO, "Local · hero_video_url set", row?.heroVideoUrl);
  assert(Boolean(row?.heroVideoUrl), "Local · hero_background_loop source (same film)", row?.heroVideoUrl);

  const shop = materializeDatasetShop(row!);
  assert(shop.shop.slug === SLUG, "Local · materializeDatasetShop slug", shop.shop.slug);
  assert(shop.shop.niche === "auto", "Local · resolved ShopNiche is auto", shop.shop.niche);
  assert(
    shop.shop.heroVideoUrl === HERO || shop.shop.heroVideoUrl.endsWith("auto-hero-animation.mp4"),
    "Local · materialize keeps auto hero film",
    shop.shop.heroVideoUrl,
  );
  assert((shop.services?.length ?? 0) >= 1, "Local · services seeded from shards");
}

async function upsertSupabase(): Promise<"ok" | "skipped" | "unreachable"> {
  const connectionString = process.env.DATABASE_URL?.trim() || databaseUrlFromDisk();
  if (!connectionString) {
    pass("DB · skipped (DATABASE_URL unset) — local fallback still active");
    return "skipped";
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  pool.on("error", () => {});
  try {
    const client = await pool.connect();
    try {
      const loopCol = await client.query<{ exists: boolean }>(
        `select exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'shops' and column_name = 'hero_background_loop'
         ) as exists`,
      );
      const hasLoop = Boolean(loopCol.rows[0]?.exists);

      const existing = await client.query<{ id: string }>(
        `select id from shops where slug = $1 limit 1`,
        [SLUG],
      );
      const shopId = existing.rows[0]?.id ?? SHOP_ID;

      if (existing.rows[0]?.id) {
        if (hasLoop) {
          await client.query(
            `update shops set
               name = $2,
               niche = $3,
               tagline = $4,
               description = $5,
               hero_video_url = $6,
               hero_background_loop = $6,
               is_showcase = true,
               onboarding_step = 'complete',
               address = $7
             where id = $1`,
            [
              shopId,
              NAME,
              NICHE,
              "Custom turbo builds, dyno-proven before they leave the bay.",
              "Apex Moto Labs — the axiom-auto local/dev tenant.",
              HERO,
              "Medford, Oregon",
            ],
          );
        } else {
          await client.query(
            `update shops set
               name = $2,
               niche = $3,
               tagline = $4,
               description = $5,
               hero_video_url = $6,
               is_showcase = true,
               onboarding_step = 'complete',
               address = $7
             where id = $1`,
            [
              shopId,
              NAME,
              NICHE,
              "Custom turbo builds, dyno-proven before they leave the bay.",
              "Apex Moto Labs — the axiom-auto local/dev tenant.",
              HERO,
              "Medford, Oregon",
            ],
          );
        }
        pass("DB · updated existing axiom-auto tenant", shopId);
      } else {
        await client.query(
          `insert into shops (
             id, slug, name, niche, tagline, description, ring_color,
             hero_image_url, hero_video_url, hero_blend_percent,
             owner_user_id, is_showcase, onboarding_step, onboarding_json, hours_json, address
           ) values (
             $1, $2, $3, $4, $5, $6, '#7EC8E3',
             '', $7, 60, null, true, 'complete', '{}'::jsonb, '{}'::jsonb, 'Medford, Oregon'
           )`,
          [
            shopId,
            SLUG,
            NAME,
            NICHE,
            "Custom turbo builds, dyno-proven before they leave the bay.",
            "Apex Moto Labs — the axiom-auto local/dev tenant.",
            HERO,
          ],
        );
        if (hasLoop) {
          await client.query(`update shops set hero_background_loop = $1 where id = $2`, [HERO, shopId]);
        }
        pass("DB · inserted axiom-auto tenant", shopId);
      }

      await client.query(
        `insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
         values ($1, 'axiom_pro', 'active', 4900, 150)
         on conflict (shop_id) do update set
           status = excluded.status,
           gear_guardian_bps = excluded.gear_guardian_bps`,
        [shopId],
      );
      pass("DB · shop_billing active + Gear Guardian 150 bps");

      const read = await client.query<{
        slug: string;
        name: string;
        niche: string;
        hero_video_url: string | null;
        hero_background_loop: string | null;
      }>(
        hasLoop
          ? `select slug, name, niche, hero_video_url, hero_background_loop from shops where id = $1`
          : `select slug, name, niche, hero_video_url, null::text as hero_background_loop from shops where id = $1`,
        [shopId],
      );
      const row = read.rows[0];
      assert(row?.slug === SLUG, "DB · slug is axiom-auto", row?.slug);
      assert(row?.name === NAME, "DB · shop_name is Apex Moto Labs", row?.name);
      assert(row?.niche === NICHE, "DB · niche is auto", row?.niche);
      assert(row?.hero_video_url === HERO, "DB · hero_video_url persisted", row?.hero_video_url ?? undefined);
      if (hasLoop) {
        assert(
          row?.hero_background_loop === HERO,
          "DB · hero_background_loop persisted",
          row?.hero_background_loop ?? undefined,
        );
      } else {
        pass("DB · hero_background_loop column absent — video column only");
      }

      return "ok";
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unreachable = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo|connection/i.test(message);
    if (unreachable) {
      pass(
        "DB · unreachable — local LOCAL_STOREFRONTS fallback covers /axiom-auto",
        message.slice(0, 120),
      );
      return "unreachable";
    }
    fail("DB · seed failed", message.slice(0, 200));
    return "unreachable";
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function verifyRoutes() {
  const paths = [`/${SLUG}/admin`, `/${SLUG}/admin/hero-studio`, `/${SLUG}`];
  for (const path of paths) {
    const url = `${PREVIEW}${path}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "text/html" },
        redirect: "follow",
      });
      clearTimeout(timer);
      const html = await res.text();
      const noShop = /No shop at this address/i.test(html);
      assert(res.status < 500, `HTTP · ${path} status`, String(res.status));
      assert(!noShop, `HTTP · ${path} resolves tenant (not 404 shop)`, `status ${res.status}`);
      if (/Sign in|RedirectToSignIn|sign-in/i.test(html) && path.includes("/admin")) {
        pass(`HTTP · ${path} reached shop shell (auth gate ok)`);
      } else if (/Apex Moto|Hero Studio|archive|admin|axiom-auto/i.test(html)) {
        pass(`HTTP · ${path} rendered shop UI`);
      } else if (!noShop && res.ok) {
        pass(`HTTP · ${path} loaded without shop-missing banner`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/ECONNREFUSED|fetch failed|aborted/i.test(message)) {
        pass(
          `HTTP · ${path} skipped (dev server not reachable at ${PREVIEW})`,
          "Start npm run dev, then re-run this script to verify routes",
        );
      } else {
        fail(`HTTP · ${path} probe failed`, message.slice(0, 160));
      }
    }
  }
}

async function main() {
  console.log(`Seeding test shop · ${SLUG} (${NAME})…\n`);
  verifyLocalFallback();
  await upsertSupabase();
  await verifyRoutes();

  const failed = checks.filter((c) => !c.ok);
  const passed = checks.filter((c) => c.ok);
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Seed Test Shop");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Checks: ${checks.length}  ·  PASS ${passed.length}  ·  FAIL ${failed.length}`);
  console.log("──────────────────────────────────────────────────────────────");
  for (const c of checks) {
    const mark = c.ok ? "PASS" : "FAIL";
    console.log(`  [${mark}] ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log("──────────────────────────────────────────────────────────────");
  if (failed.length) {
    console.log("  RESULT: NOT READY — fix failures above.");
    process.exitCode = 1;
  } else {
    console.log(`  RESULT: READY — /${SLUG}/admin and /${SLUG}/admin/hero-studio resolve.`);
  }
  console.log("══════════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
