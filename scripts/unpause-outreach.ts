/**
 * Arm the master outbound engine: cron on, paused off.
 *
 *   node --env-file=.env ./node_modules/ts-node/dist/bin-esm.js scripts/unpause-outreach.ts
 */
import { Pool } from "pg";

async function main(): Promise<void> {
  const connectionString = (process.env.DATABASE_URL ?? "").trim();
  if (!connectionString) {
    console.error("[unpause-outreach] DATABASE_URL is not set");
    process.exit(1);
  }
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  const client = await pool.connect();
  try {
    await client.query(`
      alter table outbound_engine_state
        add column if not exists cron_enabled boolean not null default false
    `);
    const row = await client.query<{ id: string; paused: boolean; cron_enabled: boolean }>(
      `insert into outbound_engine_state (id, paused, cron_enabled, updated_at)
       values ('master', false, true, now())
       on conflict (id) do update
         set paused = false,
             cron_enabled = true,
             updated_at = now()
       returning id, paused, cron_enabled`,
    );
    const next = row.rows[0];
    console.log("unpause-outreach ok");
    console.log(`  outbound_engine_state.id=${next?.id}`);
    console.log(`  paused=${next?.paused} (outboundPaused)`);
    console.log(`  cron_enabled=${next?.cron_enabled}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[unpause-outreach]", err instanceof Error ? err.message : err);
  process.exit(1);
});
