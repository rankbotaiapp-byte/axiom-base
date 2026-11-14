import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("0094 hero_studio_jobs is bound by studio-actions insert and list", () => {
  const sql = readFileSync(new URL("../../../migrations/0094_hero_studio_jobs.sql", import.meta.url), "utf8");
  const supabase = readFileSync(
    new URL("../../../supabase/migrations/0011_hero_studio_jobs.sql", import.meta.url),
    "utf8",
  );
  const actions = readFileSync(new URL("./studio-actions.ts", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists hero_studio_jobs/);
  assert.match(sql, /payload jsonb/);
  assert.match(sql, /shop_slug/);
  assert.match(supabase, /hero_studio_jobs/);
  assert.match(actions, /insert into hero_studio_jobs/);
  assert.match(actions, /payload/);
  assert.match(actions, /from hero_studio_jobs/);
  assert.match(actions, /authMiddleware/);
  assert.match(actions, /assertShopDesk/);
});
