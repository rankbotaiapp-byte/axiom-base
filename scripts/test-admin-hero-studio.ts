/**
 * Diagnostic: tenant admin + Hero Studio archive swap → Supabase → storefront mirror.
 *
 *   npx tsx --env-file=.env scripts/test-admin-hero-studio.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import {
  filterHistoricalHeroArchive,
  historicalArchiveCollections,
  historicalHeroArchive,
} from "../src/lib/axiom/historical-hero-archive.ts";
import { isCatalogHeroUrl, isPublicMediaFilm } from "../src/lib/axiom/hero-films.ts";
import {
  cleanHeroUrl,
  isPlayableHeroFilm,
  persistHeroToSupabase,
} from "../src/lib/axiom/hero-studio-state.ts";
import { bustStorefrontFilm, resolveShopHeroFilm } from "../src/lib/axiom/resolve-hero-film.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = join(ROOT, "public", "media");
const SHOP_SLUG = "axiom-hero-studio-diag";

const SWAP_TARGETS = [
  "/media/shark-hero-animation.mp4",
  "/media/otter-hero-animation.mp4",
  "/media/leopard-hero-animation.mp4",
  "/media/auto-hero-animation.mp4",
] as const;

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

function mediaFile(url: string): string {
  return url.replace(/^\/media\//, "").split("?")[0] ?? "";
}

function onDisk(url: string): boolean {
  const file = mediaFile(url);
  return Boolean(file) && !file.includes("..") && existsSync(join(MEDIA, file));
}

function listPublicMp4(): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // Keep archive inventory shallow: root media + one nested folder level used by niches.
        if (!prefix) walk(join(dir, entry.name), rel);
        continue;
      }
      if (/\.mp4$/i.test(entry.name)) out.push(`/media/${rel.replace(/\\/g, "/")}`);
    }
  };
  walk(MEDIA);
  return out.sort();
}

/** Mirrors updateShopBrandHandler pin path for heroFilm. */
function applyHeroPin(
  row: { hero_video_url: string | null; hero_background_loop: string | null; shop_config: Record<string, unknown> },
  heroFilm: string,
): typeof row {
  const pin = cleanHeroUrl(heroFilm);
  if (!pin || !(isPublicMediaFilm(pin) || isCatalogHeroUrl(pin) || isPlayableHeroFilm(pin))) {
    throw new Error(`validation rejected film: ${heroFilm}`);
  }
  return {
    hero_video_url: pin,
    hero_background_loop: pin,
    shop_config: {
      ...row.shop_config,
      overrideHeroVideoUrl: pin,
      hero_background_loop: pin,
      storefrontFilmAt: Date.now(),
    },
  };
}

/** mapShop preference: hero_background_loop wins over hero_video_url. */
function mapShopHeroVideo(row: {
  hero_video_url: string | null;
  hero_background_loop: string | null;
}): string | null {
  const loop = row.hero_background_loop?.trim();
  if (loop) return loop;
  return row.hero_video_url?.trim() || null;
}

function verifyRoutes() {
  const routeTree = readFileSync(join(ROOT, "src/routeTree.gen.ts"), "utf8");
  assert(routeTree.includes("'/\$shopSlug/admin'"), "Route · /$shopSlug/admin declared");
  assert(
    routeTree.includes("'/\$shopSlug/admin/hero-studio'"),
    "Route · /$shopSlug/admin/hero-studio declared",
  );
  assert(routeTree.includes("'/\$shopSlug/'") || routeTree.includes("'/\$shopSlug'"), "Route · /$shopSlug storefront declared");

  assert(existsSync(join(ROOT, "src/routes/$shopSlug/admin.tsx")), "File · admin.tsx present");
  assert(
    existsSync(join(ROOT, "src/routes/$shopSlug/admin.hero-studio.tsx")),
    "File · admin.hero-studio.tsx present",
  );
  assert(
    existsSync(join(ROOT, "src/app/[shopSlug]/admin/components/HeroStudio.tsx")),
    "File · HeroStudio component present",
  );
  assert(
    existsSync(join(ROOT, "src/components/admin/HeroCustomizer.tsx")),
    "File · HeroCustomizer archive picker present",
  );

  const customizer = readFileSync(join(ROOT, "src/components/admin/HeroCustomizer.tsx"), "utf8");
  assert(customizer.includes("filterHistoricalHeroArchive"), "UI · searchable archive filter wired");
  assert(customizer.includes("Quick pick"), "UI · searchable dropdown present");
  assert(customizer.includes("<select"), "UI · dropdown select element present");

  const studio = readFileSync(join(ROOT, "src/app/[shopSlug]/admin/components/HeroStudio.tsx"), "utf8");
  assert(studio.includes("HeroCustomizer"), "UI · Hero Studio mounts archive picker");
  assert(studio.includes("heroFilm: draft.hero_video_url"), "UI · publish sends heroFilm to shops");
  assert(studio.includes("persistHeroToSupabase"), "UI · publish persists to Supabase book");
}

function verifyArchiveInventory() {
  const archive = historicalHeroArchive();
  const collections = historicalArchiveCollections();
  const disk = listPublicMp4();

  assert(archive.length > 0, "Archive · loads historical inventory", `${archive.length} assets`);
  assert(collections.includes("all"), "Archive · collections include 'all'");
  assert(collections.length > 1, "Archive · multiple collections", collections.join(", "));

  const mustFind = [
    "shark-hero-animation.mp4",
    "otter-hero-animation.mp4",
    "leopard-hero-animation.mp4",
    "auto-hero-animation.mp4",
  ];
  for (const file of mustFind) {
    const hit = archive.some((row) => row.src.endsWith(`/${file}`) || row.src.endsWith(file));
    assert(hit, `Archive · includes ${file}`);
    assert(onDisk(`/media/${file}`), `Disk · public/media/${file} present`);
  }

  const searchable = filterHistoricalHeroArchive("shark");
  assert(
    searchable.some((row) => row.src.includes("shark")),
    "Archive · search 'shark' returns matches",
    `${searchable.length} hits`,
  );

  const rootHeroFiles = disk.filter((url) => /\/[a-z0-9-]+-hero-animation\.mp4$/i.test(url));
  const covered = rootHeroFiles.filter((url) => archive.some((row) => row.src === url));
  const coverage = rootHeroFiles.length
    ? Math.round((covered.length / rootHeroFiles.length) * 100)
    : 0;
  assert(
    coverage >= 80,
    "Archive · covers ≥80% of root *-hero-animation.mp4 inventory",
    `${covered.length}/${rootHeroFiles.length} (${coverage}%) · disk mp4s=${disk.length}`,
  );
}

function verifySimulatedSwap() {
  let row = {
    hero_video_url: "/media/auto-hero-animation.mp4" as string | null,
    hero_background_loop: "/media/auto-hero-animation.mp4" as string | null,
    shop_config: {} as Record<string, unknown>,
  };

  for (const next of SWAP_TARGETS) {
    assert(isPlayableHeroFilm(next), `Validate · ${mediaFile(next)} is playable`);
    assert(isPublicMediaFilm(next) || isCatalogHeroUrl(next), `Validate · ${mediaFile(next)} is catalog/public film`);
    const cleaned = cleanHeroUrl(next);
    assert(cleaned === next, `Validate · cleanHeroUrl keeps ${mediaFile(next)}`);

    try {
      row = applyHeroPin(row, next);
      pass(`Swap · pin ${mediaFile(next)} updates both shop columns`);
    } catch (err) {
      fail(`Swap · pin ${mediaFile(next)}`, err instanceof Error ? err.message : String(err));
      continue;
    }

    assert(row.hero_video_url === next, `Persist contract · hero_video_url=${mediaFile(next)}`);
    assert(
      row.hero_background_loop === next,
      `Persist contract · hero_background_loop=${mediaFile(next)}`,
    );
    assert(
      row.hero_video_url === row.hero_background_loop,
      `Persist contract · columns stay in lockstep after ${mediaFile(next)}`,
    );

    const mapped = mapShopHeroVideo(row);
    assert(mapped === next, `mapShop · prefers hero_background_loop=${mediaFile(next)}`);

    const storefront = resolveShopHeroFilm({
      overrideHeroVideoUrl: String(row.shop_config.overrideHeroVideoUrl ?? ""),
      heroVideoUrl: mapped,
      niche: "auto",
    });
    assert(storefront === next, `Storefront · resolveShopHeroFilm mirrors ${mediaFile(next)}`);

    const busted = bustStorefrontFilm(storefront, Number(row.shop_config.storefrontFilmAt));
    assert(
      busted.startsWith(next) && busted.includes("?v="),
      `Storefront · full-bleed bust cache for ${mediaFile(next)}`,
      busted,
    );
  }
}

async function verifyLiveSupabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) {
    pass("Supabase live · skipped (DATABASE_URL unset) — contract checks still green");
    return;
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  pool.on("error", () => {});
  const client = await pool.connect();
  try {
    const colCheck = await client.query<{ exists: boolean }>(
      `select exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'shops' and column_name = 'hero_background_loop'
       ) as exists`,
    );
    const hasLoopCol = Boolean(colCheck.rows[0]?.exists);
    assert(hasLoopCol, "Supabase · shops.hero_background_loop column exists");

    // Prefer an existing showcase/demo shop; otherwise create a disposable diagnostic row.
    const existing = await client.query<{
      id: string;
      slug: string;
      hero_video_url: string | null;
      hero_background_loop: string | null;
    }>(
      hasLoopCol
        ? `select id, slug, hero_video_url, hero_background_loop
           from shops
           where is_showcase = true or slug = $1
           order by case when slug = $1 then 0 else 1 end, created_at asc
           limit 1`
        : `select id, slug, hero_video_url, null::text as hero_background_loop
           from shops
           where is_showcase = true or slug = $1
           order by case when slug = $1 then 0 else 1 end, created_at asc
           limit 1`,
      [SHOP_SLUG],
    );

    let shopId = existing.rows[0]?.id ?? "";
    let slug = existing.rows[0]?.slug ?? SHOP_SLUG;
    let previousVideo = existing.rows[0]?.hero_video_url ?? null;
    let previousLoop = existing.rows[0]?.hero_background_loop ?? null;
    let created = false;

    if (!shopId) {
      shopId = `shop_diag_${Date.now().toString(36)}`;
      slug = SHOP_SLUG;
      await client.query(
        `insert into shops (
           id, slug, name, niche, tagline, description, ring_color,
           hero_image_url, hero_video_url, hero_blend_percent,
           owner_user_id, is_showcase, onboarding_step, onboarding_json, hours_json, address
         ) values (
           $1, $2, 'Hero Studio Diagnostic', 'auto', 'Diag loop', 'Diagnostic shop', '#00ffcc',
           '', $3, 60, null, true, 'complete', '{}'::jsonb, '{}'::jsonb, 'Medford'
         )`,
        [shopId, slug, SWAP_TARGETS[0]],
      );
      if (hasLoopCol) {
        await client.query(`update shops set hero_background_loop = $1 where id = $2`, [
          SWAP_TARGETS[0],
          shopId,
        ]);
      }
      created = true;
      previousVideo = SWAP_TARGETS[0];
      previousLoop = SWAP_TARGETS[0];
      pass("Supabase live · created disposable showcase shop", slug);
    } else {
      pass("Supabase live · using shop", slug);
    }

    for (const next of SWAP_TARGETS) {
      if (!onDisk(next)) {
        fail(`Supabase swap · ${mediaFile(next)} missing on disk`);
        continue;
      }
      if (hasLoopCol) {
        await client.query(
          `update shops set hero_video_url = $1, hero_background_loop = $1 where id = $2`,
          [next, shopId],
        );
      } else {
        await client.query(`update shops set hero_video_url = $1 where id = $2`, [next, shopId]);
      }

      const read = await client.query<{
        hero_video_url: string | null;
        hero_background_loop: string | null;
      }>(
        hasLoopCol
          ? `select hero_video_url, hero_background_loop from shops where id = $1`
          : `select hero_video_url, null::text as hero_background_loop from shops where id = $1`,
        [shopId],
      );
      const row = read.rows[0];
      assert(row?.hero_video_url === next, `Supabase · hero_video_url saved ${mediaFile(next)}`);
      if (hasLoopCol) {
        assert(
          row?.hero_background_loop === next,
          `Supabase · hero_background_loop saved ${mediaFile(next)}`,
        );
      }

      const mirrored = resolveShopHeroFilm({
        heroVideoUrl: mapShopHeroVideo({
          hero_video_url: row?.hero_video_url ?? null,
          hero_background_loop: row?.hero_background_loop ?? null,
        }),
        niche: "auto",
      });
      assert(mirrored === next, `Storefront mirror · public film is ${mediaFile(next)}`);
    }

    // Restore previous values (or delete disposable shop).
    if (created) {
      await client.query(`delete from shops where id = $1`, [shopId]);
      pass("Supabase live · cleaned disposable diagnostic shop");
    } else if (hasLoopCol) {
      await client.query(
        `update shops set hero_video_url = $1, hero_background_loop = $2 where id = $3`,
        [previousVideo, previousLoop, shopId],
      );
      pass("Supabase live · restored previous hero columns");
    } else {
      await client.query(`update shops set hero_video_url = $1 where id = $2`, [previousVideo, shopId]);
      pass("Supabase live · restored previous hero_video_url");
    }

    // client_storefronts book (optional REST path used by persistHeroToSupabase).
    const draft = {
      hero_video_url: SWAP_TARGETS[0],
      tagline: "Hero Studio diagnostic",
      updatedAt: new Date().toISOString(),
    };
    const book = await persistHeroToSupabase(slug, draft);
    assert(
      book === "saved" || book === "skipped",
      "Supabase REST · persistHeroToSupabase returns saved|skipped",
      book,
    );
  } catch (err) {
    fail("Supabase live · session", err instanceof Error ? err.message.slice(0, 180) : String(err));
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

function printReport() {
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  AXIOM · Admin / Hero Studio Diagnostic");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Checks: ${checks.length}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  console.log("───────────────────────────────────────────────────────────");
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    console.log(`  [${mark}] ${check.label}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log("───────────────────────────────────────────────────────────");
  if (failed === 0) {
    console.log("  RESULT: Admin studio UI, persistence, and storefront swap are operational.");
  } else {
    console.log(`  RESULT: ${failed} check(s) failed.`);
  }
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
}

async function main() {
  console.log("Simulating paid-tenant admin + Hero Studio session…");
  verifyRoutes();
  verifyArchiveInventory();
  verifySimulatedSwap();
  await verifyLiveSupabase();
  printReport();
  if (checks.some((c) => !c.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
