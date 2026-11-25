/**
 * Reload the PostgREST schema cache, and optionally create public.app_settings.
 *
 * The studio error
 *   Could not find the table 'public.app_settings' in the schema cache
 * means Postgres has no such table, or PostgREST has not reloaded since it
 * was created. This sends `NOTIFY pgrst, 'reload schema'`.
 *
 *   node --env-file=.env.local scripts/reload-postgrest-schema.mjs
 *   node --env-file=.env.local scripts/reload-postgrest-schema.mjs --apply
 *
 * --apply runs migrations/0099_app_settings.sql, records it in _migrations,
 * then reloads the cache. Prefers DIRECT_URL (session connection) so NOTIFY
 * reaches the Supabase API. Falls back to DATABASE_URL.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const apply = process.argv.includes("--apply");
const connectionString = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

if (!connectionString) {
  console.error("Set DIRECT_URL or DATABASE_URL, then re-run.");
  console.error("Example: node --env-file=.env.local scripts/reload-postgrest-schema.mjs --apply");
  process.exit(1);
}

const migrationName = "0099_app_settings.sql";
const migrationPath = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations", migrationName);

const pool = new pg.Pool({ connectionString, max: 1 });
const client = await pool.connect();

try {
  if (apply) {
    const sql = await readFile(migrationPath, "utf8");
    await client.query("begin");
    await client.query(sql);
    await client.query(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    await client.query("insert into _migrations (name) values ($1) on conflict (name) do nothing", [
      migrationName,
    ]);
    await client.query("commit");
    console.log(`Applied ${migrationName}.`);
  }

  await client.query("notify pgrst, 'reload schema'");
  const found = await client.query("select to_regclass('public.app_settings') as rel");
  const rel = found.rows[0]?.rel;
  console.log(rel ? `Schema cache reload sent. ${rel} is present.` : "Schema cache reload sent. public.app_settings is still missing — run with --apply.");
} catch (err) {
  try {
    await client.query("rollback");
  } catch {
    /* no open transaction */
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
