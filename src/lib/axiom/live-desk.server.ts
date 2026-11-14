import { getSql } from "@/lib/db";
import { liveDeskState, type LiveDeskState } from "./live-desk-state";

type Sql = Awaited<ReturnType<typeof getSql>>;

function pacificDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

export type ShopLiveDesk = {
  shopSlug: string;
  shopId: string;
  state: LiveDeskState;
};

/** Live `{ paused, caps, sentToday }` for the shop-slug desk, from shops + engine + today's book. */
export async function readShopLiveDesk(slug: string): Promise<ShopLiveDesk | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const sql = await getSql();
  const shops = await sql<{
    id: string;
    slug: string;
    autopilot_active: boolean | null;
  }>`
    select id, slug, coalesce(autopilot_active, false) as autopilot_active
    from shops
    where slug = ${key}
    limit 1
  `;
  const shop = shops[0];
  if (!shop) return null;
  const today = pacificDay();

  let smsCap = 0;
  let emailCap = 0;
  let smsSent = 0;
  let emailSent = 0;
  let enginePaused = true;
  try {
    const rows = await sql<{
      paused: boolean;
      sms_daily_cap: number;
      email_daily_cap: number;
      sms_sent_today: number;
      email_sent_today: number;
      day_key: string;
    }>`
      select paused, sms_daily_cap, email_daily_cap, sms_sent_today, email_sent_today,
             day_key::text as day_key
      from outbound_engine_state
      where id = ${"master"}
      limit 1
    `;
    const row = rows[0];
    if (row) {
      enginePaused = row.paused !== false;
      smsCap = Number(row.sms_daily_cap) || 0;
      emailCap = Number(row.email_daily_cap) || 0;
      const sameDay = (row.day_key ?? "").slice(0, 10) === today;
      smsSent = sameDay ? Number(row.sms_sent_today) || 0 : 0;
      emailSent = sameDay ? Number(row.email_sent_today) || 0 : 0;
    }
  } catch {
    /* engine table missing — shop book still reports */
  }

  let shopSent = 0;
  try {
    const booked = await sql<{ n: number }>`
      select count(*)::int as n
      from appointments
      where shop_id = ${shop.id}
        and status in ('confirmed', 'completed')
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
    `;
    shopSent += Number(booked[0]?.n ?? 0) || 0;
  } catch {
    shopSent += 0;
  }
  try {
    const logged = await sql<{ n: number }>`
      select count(*)::int as n
      from outbound_engine_log
      where lead_slug = ${key}
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
    `;
    shopSent += Number(logged[0]?.n ?? 0) || 0;
  } catch {
    /* master log is optional on tenant desks */
  }

  const armed = shop.autopilot_active === true;
  return {
    shopSlug: shop.slug,
    shopId: shop.id,
    state: liveDeskState({
      paused: enginePaused || !armed,
      smsDailyCap: smsCap,
      emailDailyCap: emailCap,
      sentToday: shopSent || smsSent + emailSent,
    }),
  };
}
