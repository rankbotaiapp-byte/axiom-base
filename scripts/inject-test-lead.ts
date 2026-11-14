/**
 * Live-fire micro-test: pin axiom-auto notify contacts, pause pending queue rows,
 * insert exactly one due plumbing SMS lead.
 *
 *   node --env-file=.env ./node_modules/ts-node/dist/bin-esm.js scripts/inject-test-lead.ts
 *
 * Does not send. Does not flip OUTREACH_MODE.
 */
import { Pool } from "pg";

const PHONE = "+15418908126";
const EMAIL = "rankbotaiapp@gmail.com";
const SLUG = "axiom-auto";

function requiredEnv(name: string): string {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    console.error(`[inject-test-lead] ${name} is not set`);
    process.exit(1);
  }
  return value;
}

async function allowPausedStatus(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    do $$
    declare
      con text;
    begin
      select con.conname into con
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where rel.relname = 'outreach_queue'
        and nsp.nspname = 'public'
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%status%';
      if con is not null then
        execute format('alter table public.outreach_queue drop constraint %I', con);
      end if;
      alter table public.outreach_queue
        add constraint outreach_queue_status_check
        check (status in ('pending', 'sent', 'failed', 'rate_limited', 'paused'));
    exception
      when duplicate_object then null;
    end
    $$;
  `);
}

async function main(): Promise<void> {
  const connectionString = requiredEnv("DATABASE_URL");
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 12_000 });
  const client = await pool.connect();
  try {
    await client.query("begin");

    const shop = await client.query<{ id: string; slug: string }>(
      `update shops
       set notification_phone = $1,
           notification_email = $2,
           notify_phone = $1,
           notify_email = $2
       where slug = $3
       returning id, slug`,
      [PHONE, EMAIL, SLUG],
    );
    if (!shop.rowCount) {
      throw new Error(`No shops.slug = ${SLUG}`);
    }

    await allowPausedStatus(client);

    const paused = await client.query(
      `update outreach_queue
       set status = 'paused',
           detail = 'paused for live-fire micro-test',
           scheduled_for = scheduled_for + interval '365 days'
       where status = 'pending'`,
    );

    const id = `oq_livefire_${Date.now()}`;
    await client.query(
      `insert into outreach_queue (
         id, business_name, phone, email, niche, channel, status,
         scheduled_for, lead_slug, campaign_id, detail
       ) values (
         $1, $2, $3, $4, 'plumbing', 'sms', 'pending',
         now(), $5, $6, $7
       )`,
      [
        id,
        "Axiom Live-Fire Micro-Test",
        PHONE,
        EMAIL,
        "live-fire-micro-test",
        shop.rows[0]!.id,
        "dummy template · live-fire SMS to founder line",
      ],
    );

    await client.query("commit");
    console.log("inject-test-lead ok");
    console.log(`  shop ${shop.rows[0]!.slug} notify → ***${PHONE.slice(-4)} / ${EMAIL.slice(0, 1)}***@${EMAIL.split("@")[1]}`);
    console.log(`  paused ${paused.rowCount ?? 0} pending queue row(s)`);
    console.log(`  inserted 1 due SMS lead ${id} (niche=plumbing, scheduled_for=now())`);
    console.log("  Set OUTREACH_MODE=live in .env, restart npm run dev, then hit the cron curls.");
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[inject-test-lead]", err instanceof Error ? err.message : err);
  process.exit(1);
});
