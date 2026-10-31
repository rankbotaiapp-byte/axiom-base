import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

test("shop_hero_config is readable publicly, writable only by owners, and keyed by shop slug", () => {
  const create = read("migrations/0069_shop_hero_config.sql");
  const access = read("migrations/0070_shop_hero_config_access.sql");
  const server = read("src/lib/axiom/shop-server.server.ts");
  const studio = read("src/components/admin/hero-button-studio.tsx");
  const page = read("src/app/[shopSlug]/admin/hero-studio/page.tsx");

  assert.match(create, /create table if not exists shop_hero_config/);
  assert.match(create, /shop_id text primary key/);
  assert.match(create, /enable row level security/);
  assert.match(access, /shop_hero_config_shop_id_fkey/);
  assert.match(access, /references shops\(id\)/);
  assert.match(access, /shop_hero_config_public_read/);
  assert.match(access, /for select/);
  assert.doesNotMatch(access, /for insert/);
  assert.doesNotMatch(access, /for update/);
  assert.doesNotMatch(access, /for delete/);

  assert.match(server, /select \* from shops where slug = \$\{safe\}/);
  assert.match(server, /select config from shop_hero_config where shop_id = \$\{row\.id\}/);
  assert.match(server, /await assertCanModifyShop\(row, context\.userId\)/);
  assert.match(server, /insert into shop_hero_config \(shop_id, config, updated_at\)/);
  assert.match(server, /mem\?\.role === "owner"/);
  assert.match(server, /row\.owner_user_id === userId/);

  assert.match(studio, /updateShopBrand\(\{ data: \{ slug: shop\.slug, heroHud:/);
  assert.match(server, /persistSeededHeroHud/);
  assert.match(server, /ai_content_autopilot/);
  assert.match(page, /getOperatorData\(\{ data: shopSlug \}\)/);
  assert.match(page, /readonly=\{mode === "preview" \|\| shop\.isShowcase\}/);
});

test("0073 adds geo and autopilot columns instead of indexing a missing active flag", () => {
  const sql = read("migrations/0073_production_hardening.sql");
  assert.match(sql, /add column if not exists active boolean/);
  assert.match(sql, /add column if not exists ai_content_autopilot boolean/);
  assert.doesNotMatch(sql, /where active and not claimed/);
  assert.doesNotMatch(sql, /\bupdate preloaded_leads\b/i);
});

test("0074 does not create geo indexes until preloaded_leads.active exists", () => {
  const sql = read("migrations/0074_preloaded_lead_geo_indexes.sql");
  const guard = sql.indexOf("column_name = 'active'");
  const idx = sql.indexOf("create index if not exists preloaded_leads_state_county_niche_idx");
  assert.ok(guard >= 0 && idx > guard);
  assert.match(sql, /when undefined_column then null/);
});

test("hosted migrate reads SQL from disk so Vite cannot keep a stale 0074", () => {
  const db = read("src/lib/db.ts");
  assert.match(db, /diskMigrationSources/);
  assert.match(db, /isUndefinedColumn/);
  assert.match(db, /code === "42703"/);
});

test("catalog niche remap drops shops_niche_check before writing auto", () => {
  const sql = read("migrations/0065_catalog_niches.sql");
  const drop = sql.indexOf("drop constraint");
  const remap = sql.indexOf("set niche = 'auto'");
  const add = sql.lastIndexOf("add constraint shops_niche_check");
  assert.ok(drop >= 0 && remap > drop && add > remap);
  assert.match(sql, /'auto', 'barber', 'bow-tech'/);
});
