#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` — on every Vercel deploy — applying pending files
 * in ../migrations to DATABASE_URL (or POSTGRES_URL / DIRECT_URL). Each file is
 * applied in one transaction and recorded in `_migrations`.
 *
 * The read is non-recursive, so the opt-in auth schema under migrations/auth/
 * is not applied to an app that never asked for sign-in.
 *
 * No database URL -> skip (exit 0). Vercel Preview + ENETUNREACH / IPv6 to
 * `db.*.supabase.co` -> warn and skip so the app still deploys. SQL errors and
 * Production connect failures stay fatal.
 */
import { config as loadDotenv } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";
import {
  collectDatabaseUrls,
  pgPoolOptions,
  preferIpv4DatabaseUrl,
  PREVIEW_POOLER_HINT,
  shouldSkipUnreachablePreview,
} from "./migrate-url.mjs";

if (process.env.VERCEL !== "1") {
  loadDotenv({ path: ".env.local" });
  loadDotenv({ path: ".env" });
}

const databaseUrl = preferIpv4DatabaseUrl(collectDatabaseUrls());
if (!databaseUrl) {
  console.log("[migrate] Skipping migrations: no database URL configured");
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool(pgPoolOptions(databaseUrl));
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    if (shouldSkipUnreachablePreview(err)) {
      console.warn(PREVIEW_POOLER_HINT);
      await pool.end().catch(() => undefined);
      process.exit(0);
    }
    throw err;
  }

  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ROLLBACK fails when the connection died — keep the original error.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  if (shouldSkipUnreachablePreview(err)) {
    console.warn(PREVIEW_POOLER_HINT);
    process.exit(0);
  }
  console.error("[migrate] Failed:", err?.message || err);
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
