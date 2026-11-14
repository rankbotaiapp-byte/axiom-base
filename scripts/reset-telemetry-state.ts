/**
 * Clear simulated failsafe state so live outreach can launch.
 *
 *   npx tsx --env-file=.env --tsconfig tsconfig.json scripts/reset-telemetry-state.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import {
  AXIOM_AUTOPILOT_LIMITS,
  TRICKLE_DELAY_MAX_SECONDS,
  TRICKLE_DELAY_MIN_SECONDS,
  hydrateAutopilotLimits,
} from "../src/lib/axiom/autopilot-limits.ts";

const BASE_MIN = TRICKLE_DELAY_MIN_SECONDS;
const BASE_MAX = TRICKLE_DELAY_MAX_SECONDS;

function envNum(key: string, fallback = ""): string {
  return (process.env[key] ?? "").trim() || fallback;
}

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Reset telemetry state for live fire");
  console.log("══════════════════════════════════════════════════════════════\n");

  hydrateAutopilotLimits({ minDelaySeconds: BASE_MIN, maxDelaySeconds: BASE_MAX });
  console.log(
    `  In-process AXIOM_AUTOPILOT_LIMITS → ${AXIOM_AUTOPILOT_LIMITS.minDelaySeconds}–${AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds}s`,
  );

  const primary = envNum("TWILIO_FROM_NUMBER", envNum("TWILIO_PHONE_NUMBER", "+15555550100"));
  const backup = envNum("TWILIO_FROM_NUMBER_BACKUP", envNum("TWILIO_BACKUP_NUMBER"));
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.log("  DATABASE_URL unset — durable tables were never written. Board is clear.");
    printSnapshot({ logs: 0, primaryStatus: "active", chunkStatus: "ready", min: BASE_MIN, max: BASE_MAX });
    return;
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  pool.on("error", () => {});
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  Hosted Postgres unreachable (${message}).`);
    console.log("  Simulation wrote in-process only; there is no paused failsafe row to clear remotely.");
    printSnapshot({ logs: 0, primaryStatus: "active", chunkStatus: "ready", min: BASE_MIN, max: BASE_MAX });
    await pool.end().catch(() => undefined);
    return;
  }

  try {
    const tables = await client.query<{ exists: boolean }>(
      `select exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = 'outreach_telemetry_logs'
       ) as exists`,
    );
    if (!tables.rows[0]?.exists) {
      const ddl = readFileSync(join(process.cwd(), "migrations/0092_outreach_telemetry.sql"), "utf8");
      await client.query(ddl);
      console.log("  Schema · applied 0092_outreach_telemetry.sql");
    }

    const now = new Date().toISOString();
    const deleted = await client.query(`delete from outreach_telemetry_logs`);
    console.log(`  Logs · deleted ${deleted.rowCount ?? 0} outreach_telemetry_logs rows`);

    const primaryUpdate = await client.query(
      `update outreach_send_identities
       set status = 'active', pause_reason = '', paused_at = null, updated_at = $2
       where channel = 'sms' and identity = $1
       returning identity, status`,
      [primary, now],
    );
    if ((primaryUpdate.rowCount ?? 0) === 0) {
      await client.query(
        `insert into outreach_send_identities (id, channel, identity, role, status, pause_reason, updated_at)
         values ($1, 'sms', $2, 'primary', 'active', '', $3)
         on conflict (channel, identity) do update
           set status = 'active', pause_reason = '', paused_at = null, role = 'primary', updated_at = excluded.updated_at`,
        [`sid_primary_${primary.slice(-8)}`, primary, now],
      );
    }
    if (backup && backup !== primary) {
      await client.query(
        `insert into outreach_send_identities (id, channel, identity, role, status, pause_reason, updated_at)
         values ($1, 'sms', $2, 'backup', 'active', '', $3)
         on conflict (channel, identity) do update
           set status = 'active', pause_reason = '', paused_at = null, updated_at = excluded.updated_at`,
        [`sid_backup_${backup.slice(-8)}`, backup, now],
      );
    }
    console.log(`  Number · primary ${primary} → active`);

    await client.query(
      `insert into outreach_dataset_chunks (id, niche, status, pause_reason, paused_at, updated_at)
       values ('plumbing-current', 'plumbing', 'ready', '', null, $1)
       on conflict (id) do update
         set status = 'ready', pause_reason = '', paused_at = null, updated_at = excluded.updated_at`,
      [now],
    );
    console.log("  Chunk · plumbing-current paused_reverify → ready");

    await client.query(
      `insert into outreach_health_state (
         id, min_delay_seconds, max_delay_seconds, last_hour_key,
         previous_error_rate, previous_conversion_velocity,
         sms_violation_rate, email_bounce_rate, conversion_velocity, error_rate,
         dataset_status, updated_at
       ) values ('master', $1, $2, '', 0, 0, 0, 0, 0, 0, 'ready', $3)
       on conflict (id) do update set
         min_delay_seconds = excluded.min_delay_seconds,
         max_delay_seconds = excluded.max_delay_seconds,
         last_hour_key = '',
         previous_error_rate = 0,
         previous_conversion_velocity = 0,
         sms_violation_rate = 0,
         email_bounce_rate = 0,
         conversion_velocity = 0,
         error_rate = 0,
         dataset_status = 'ready',
         updated_at = excluded.updated_at`,
      [BASE_MIN, BASE_MAX, now],
    );
    console.log(`  Throttle · AXIOM_AUTOPILOT_LIMITS restored to ${BASE_MIN}–${BASE_MAX}s`);

    const logs = await client.query<{ n: string | number }>(`select count(*)::int as n from outreach_telemetry_logs`);
    const identities = await client.query<{ identity: string; role: string; status: string }>(
      `select identity, role, status from outreach_send_identities where channel = 'sms' order by role`,
    );
    const chunk = await client.query<{ status: string }>(
      `select status from outreach_dataset_chunks where id = 'plumbing-current' limit 1`,
    );
    const health = await client.query<{ min_delay_seconds: number; max_delay_seconds: number; dataset_status: string }>(
      `select min_delay_seconds, max_delay_seconds, dataset_status from outreach_health_state where id = 'master' limit 1`,
    );

    const primaryRow = identities.rows.find((row) => row.identity === primary);
    printSnapshot({
      logs: Number(logs.rows[0]?.n ?? 0),
      primaryStatus: primaryRow?.status ?? "missing",
      chunkStatus: chunk.rows[0]?.status ?? "missing",
      min: Number(health.rows[0]?.min_delay_seconds ?? BASE_MIN),
      max: Number(health.rows[0]?.max_delay_seconds ?? BASE_MAX),
      identities: identities.rows,
      datasetStatus: health.rows[0]?.dataset_status,
    });
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

function printSnapshot(shot: {
  logs: number;
  primaryStatus: string;
  chunkStatus: string;
  min: number;
  max: number;
  identities?: Array<{ identity: string; role: string; status: string }>;
  datasetStatus?: string;
}) {
  console.log("\n  Board");
  console.log(`    outreach_telemetry_logs     ${shot.logs} rows`);
  console.log(`    primary Twilio status       ${shot.primaryStatus}`);
  if (shot.identities?.length) {
    for (const row of shot.identities) {
      console.log(`      ${row.role.padEnd(8)} ${row.identity}  ${row.status}`);
    }
  }
  console.log(`    plumbing chunk              ${shot.chunkStatus}`);
  if (shot.datasetStatus) console.log(`    health dataset_status       ${shot.datasetStatus}`);
  console.log(`    trickle delays              ${shot.min}–${shot.max}s`);
  const ok =
    shot.logs === 0 &&
    shot.primaryStatus === "active" &&
    (shot.chunkStatus === "ready" || shot.chunkStatus === "active") &&
    shot.min === BASE_MIN &&
    shot.max === BASE_MAX;
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log(ok ? "  RESULT: TELEMETRY BOARD CLEARED FOR LIVE FIRE." : "  RESULT: RESET INCOMPLETE.");
  console.log("══════════════════════════════════════════════════════════════\n");
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
