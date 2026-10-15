import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. Music and contractor niches live in 0008. */
export type DbSource = "neon" | "pglite";

// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl =
  typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl =
  rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;

/**
 * Active backend: Postgres at `DATABASE_URL` when that variable is set.
 * Pending migrations run on boot, and rows survive a restart.
 * With no URL, the process uses an in-memory Postgres and drops those rows
 * when it exits. Set `DATABASE_URL` to keep leads, shops, and nurture loops.
 */
export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgPool__?: import("pg").Pool;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __pgMigratePromise__?: Promise<void>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

function transientDbError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  const code = err && typeof err === "object" && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  if (code === "57014" || /statement timeout/i.test(message)) return false;
  return (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "08000" ||
    code === "08003" ||
    code === "08006" ||
    code === "57P01" ||
    /connection terminated|connection timeout|timeout expired|ENOTFOUND|ECONNRESET|EAI_AGAIN/i.test(message)
  );
}

async function withDbRetry<T>(run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run();
    } catch (err) {
      last = err;
      if (!transientDbError(err) || attempt === 2) throw err;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw last;
}

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function migrationSources(): Record<string, string> {
  try {
    return import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
  } catch (err) {
    // Vite replaces the glob call. A plain Node script, such as the California
    // seed, reads the same files from disk.
    if (!(err instanceof TypeError)) throw err;
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../../migrations");
    const sources: Record<string, string> = {};
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".sql")) continue;
      sources[`/migrations/${name}`] = readFileSync(join(dir, name), "utf8");
    }
    return sources;
  }
}

/**
 * Apply pending `migrations/*.sql` to the Postgres named by `DATABASE_URL`.
 * The build step also runs this. Boot runs it again so a long-lived server
 * picks up a new file without waiting for the next deploy, including send-window
 * columns. Applied names live
 * in `_migrations`, so a restart does not re-run them or touch existing rows.
 */
async function migratePostgres(): Promise<void> {
  if (!databaseUrl) return;
  await withDbRetry(() => migratePostgresConnected());
}

async function migratePostgresConnected(): Promise<void> {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
  const client = await pool.connect();
  try {
    await client.query(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const applied = (await client.query<{ name: string }>("select name from _migrations")).rows.map(
      (row) => row.name,
    );
    const migrations = migrationSources();
    for (const { name, path } of pendingMigrations(Object.keys(migrations), applied)) {
      try {
        await client.query("BEGIN");
        await client.query(migrations[path]);
        await client.query("insert into _migrations (name) values ($1)", [name]);
        await client.query("COMMIT");
        console.info(`[db] applied ${name}`);
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // Keep the original migration error if the connection already died.
        }
        console.error(`[db] migration failed: ${name}`);
        throw err;
      }
    }
  } finally {
    client.release();
  }
  } finally {
    await pool.end();
  }
}

function migratePostgresOnce(): Promise<void> {
  globalRef.__pgMigratePromise__ ??= migratePostgres().catch((err) => {
    globalRef.__pgMigratePromise__ = undefined;
    throw err;
  });
  return globalRef.__pgMigratePromise__;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
    // pooled endpoint. One pool per process; warm serverless instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    // One pool per process. Bulk import holds a single client for each
    // stage-and-promote transaction so the batch is not split across connections.
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    // A reset from the pooler emits `error` on an idle client. Without a
    // listener Node treats that as fatal and exits the dev server.
    pool.on("error", (err) => {
      console.error("[db] connection dropped", err instanceof Error ? err.message : err);
    });
    pool.on("connect", (client) => {
      client.on("error", (err) => {
        console.error("[db] connection dropped", err instanceof Error ? err.message : err);
      });
    });
    globalRef.__pgPool__ = pool;
    return toSql(async <T>(text: string, params: unknown[]) =>
      withDbRetry(async () => {
        const res = await pool.query(text, params);
        return res.rows as T[];
      }),
    );
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

/** PGLite asks the engine for a 2GB block. On an 8GB machine that reservation
 *  starves the dev server. Cap it at 256MB before the database module loads. */
function capDatabaseMemory() {
  const Memory = WebAssembly.Memory;
  if ((Memory as { capped?: boolean }).capped) return;
  const maxPages = 4096;
  function CappedMemory(this: WebAssembly.Memory, descriptor: WebAssembly.MemoryDescriptor) {
    const maximum = Math.min(descriptor.maximum ?? maxPages, maxPages);
    const initial = Math.min(descriptor.initial, maximum);
    return new Memory({ ...descriptor, initial, maximum });
  }
  CappedMemory.prototype = Memory.prototype;
  Object.setPrototypeOf(CappedMemory, Memory);
  (CappedMemory as { capped?: boolean }).capped = true;
  WebAssembly.Memory = CappedMemory as unknown as typeof WebAssembly.Memory;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the Neon path.
  // One in-memory instance per process, shared across HMR module instances, so
  // data survives source edits (it resets on dev-server restart).
  globalRef.__pgliteInstance__ ??= (async () => {
    capDatabaseMemory();
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/ (the single schema source, including open trades) so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
  // files are tracked in _migrations. The glob does not descend, so the opt-in
  // auth schema under migrations/auth/ stays out. Runs once per module instance
  // — so an HMR reload after adding a migration file applies it live — with
  // passes serialized on a global chain so concurrent callers never
  // double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = migrationSources();
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  if (dbSource === "neon") {
    await migratePostgresOnce();
    return createNeonSql();
  }
  return createPgliteSql();
}

/**
 * Run `fn` on one connection inside a transaction.
 *
 * Postgres checks a client out of the pool, raises the statement timeout for
 * that transaction only, then commits or rolls back before the client goes
 * back. PGLite uses its own transaction. Bulk lead import uses this so a
 * 1,000-row stage, promote, and cleanup succeed or fail together.
 */
export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (dbSource === "neon") {
    await getSql();
    const pool = globalRef.__pgPool__;
    if (!pool) throw new Error("Postgres pool is not ready");
    const client = await withDbRetry(() => pool.connect());
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '120s'");
      const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
        const res = await client.query(text, params);
        return res.rows as TRow[];
      });
      const result = await fn(sql);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Keep the original error if the connection already died.
      }
      throw err;
    } finally {
      client.release();
    }
  }
  const pg = await getPglite();
  return pg.transaction(async (tx) => {
    const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
      const result = await tx.query<TRow>(text, params);
      return result.rows;
    });
    return fn(sql);
  });
}

/**
 * Get the shared, **server-only** SQL client. Postgres at `DATABASE_URL` when
 * that variable is set, otherwise the in-memory fallback. Memoized — safe to
 * call per request. On Postgres, pending migrations finish before the first query.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server handles traffic.
 *
 * - **Postgres** (`DATABASE_URL`): apply pending migrations before queries.
 *   Existing lead, shop, and nurture rows stay put across restarts.
 * - **PGLite** (no `DATABASE_URL`): open the in-memory DB and apply the same
 *   files. That database is empty again after the process exits.
 *
 * Vite `configureServer` awaits this at dev startup; production imports of this
 * module kick it off immediately (see bottom of file).
 */
export function ensureDbReady(): Promise<void> {
  if (dbSource === "neon") return migratePostgresOnce();
  return getSql().then(() => undefined);
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined") {
  console.info(
    dbSource === "neon"
      ? "[db] postgres via DATABASE_URL"
      : "[db] in-memory postgres — DATABASE_URL is unset, so rows reset when this process stops",
  );
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] bootstrap failed:", err);
    throw err;
  });
}
