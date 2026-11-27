import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import {
  parsePriceBookDraft,
  tradeDefaultCatalog,
  type PriceBookDraft,
  type PriceBookItem,
  type PricingMode,
} from "./price-book.ts";
import { assertStorefrontOwner, httpStatus } from "./storefront-unlock.server";

export { httpStatus };

type ServiceRow = {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
  sort_order: number;
  trade: string | null;
  pricing_mode: string | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  deposit_cents: number | null;
  active: boolean | null;
};

function fromRow(row: ServiceRow): PriceBookItem {
  return {
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    trade: row.trade || "",
    description: row.description || "",
    pricingMode: (row.pricing_mode as PricingMode) || "starting_at",
    baseCents: Number(row.price_cents) || 0,
    minCents: Number(row.min_price_cents) || Number(row.price_cents) || 0,
    maxCents: Number(row.max_price_cents) || Number(row.price_cents) || 0,
    depositCents: Number(row.deposit_cents) || 0,
    durationMin: Number(row.duration_min) || 60,
    sortOrder: Number(row.sort_order) || 0,
    active: row.active !== false,
  };
}

export async function listShopPriceBook(shopId: string): Promise<PriceBookItem[]> {
  const sql = await getSql();
  const rows = await sql<ServiceRow>`
    select id, shop_id, name, description, duration_min, price_cents, sort_order,
           trade, pricing_mode, min_price_cents, max_price_cents, deposit_cents, active
    from services
    where shop_id = ${shopId}
    order by sort_order asc, name asc
  `.catch(async () => {
    const fallback = await sql<{
      id: string;
      shop_id: string;
      name: string;
      description: string;
      duration_min: number;
      price_cents: number;
      sort_order: number;
    }>`
      select id, shop_id, name, description, duration_min, price_cents, sort_order
      from services where shop_id = ${shopId} order by sort_order asc
    `.catch(() => []);
    return fallback.map((row) => ({
      ...row,
      trade: "",
      pricing_mode: "starting_at",
      min_price_cents: row.price_cents,
      max_price_cents: row.price_cents,
      deposit_cents: 0,
      active: true,
    }));
  });
  return rows.map(fromRow);
}

export async function seedTradePriceBook(shopId: string, niche: string): Promise<number> {
  const existing = await listShopPriceBook(shopId);
  if (existing.length > 0) return 0;
  const sql = await getSql();
  const defaults = tradeDefaultCatalog(niche);
  let n = 0;
  for (const [index, row] of defaults.entries()) {
    const id = newId("svc");
    await sql`
      insert into services (
        id, shop_id, name, description, duration_min, price_cents, sort_order,
        trade, pricing_mode, min_price_cents, max_price_cents, deposit_cents, active
      ) values (
        ${id}, ${shopId}, ${row.name}, ${row.description}, ${row.durationMin}, ${row.baseCents}, ${index},
        ${row.trade}, ${row.pricingMode}, ${row.minCents}, ${row.maxCents}, ${row.depositCents}, true
      )
    `.catch(async () => {
      await sql`
        insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order)
        values (${id}, ${shopId}, ${row.name}, ${row.description}, ${row.durationMin}, ${row.baseCents}, ${index})
      `.catch(() => undefined);
    });
    n += 1;
  }
  return n;
}

export async function listPriceBookForSlug(slug: string): Promise<{ shopId: string; items: PriceBookItem[]; voiceAnswerMode: string; voiceDailyCapCents: number }> {
  const sql = await getSql();
  const shops = await sql<{
    id: string;
    niche: string | null;
    voice_answer_mode: string | null;
    voice_daily_cap_cents: number | null;
  }>`
    select id, niche, voice_answer_mode, voice_daily_cap_cents from shops where slug = ${slug} limit 1
  `.catch(async () => {
    const rows = await sql<{ id: string; niche: string | null }>`
      select id, niche from shops where slug = ${slug} limit 1
    `;
    return rows.map((row) => ({ ...row, voice_answer_mode: "immediate", voice_daily_cap_cents: 2500 }));
  });
  const shop = shops[0];
  if (!shop) return { shopId: "", items: [], voiceAnswerMode: "immediate", voiceDailyCapCents: 2500 };
  await seedTradePriceBook(shop.id, shop.niche || "plumbing");
  return {
    shopId: shop.id,
    items: await listShopPriceBook(shop.id),
    voiceAnswerMode: shop.voice_answer_mode || "immediate",
    voiceDailyCapCents: Number(shop.voice_daily_cap_cents) || 2500,
  };
}

export async function upsertPriceBookItem(request: Request, slug: string, raw: Record<string, unknown>) {
  const desk = await assertStorefrontOwner(slug, request);
  const sql = await getSql();
  const id = String(raw.id || "").trim() || newId("svc");
  const item = parsePriceBookDraft(raw as PriceBookDraft & Record<string, unknown>, desk.shopId || "", id);
  const shopRows = await sql<{ id: string }>`select id from shops where slug = ${desk.slug} limit 1`;
  const shopId = shopRows[0]?.id;
  if (!shopId) throw Object.assign(new Error("Unknown shop"), { status: 404 });
  await sql`
    insert into services (
      id, shop_id, name, description, duration_min, price_cents, sort_order,
      trade, pricing_mode, min_price_cents, max_price_cents, deposit_cents, active
    ) values (
      ${item.id}, ${shopId}, ${item.name}, ${item.description}, ${item.durationMin}, ${item.baseCents}, ${item.sortOrder},
      ${item.trade}, ${item.pricingMode}, ${item.minCents}, ${item.maxCents}, ${item.depositCents}, ${item.active}
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      duration_min = excluded.duration_min,
      price_cents = excluded.price_cents,
      sort_order = excluded.sort_order,
      trade = excluded.trade,
      pricing_mode = excluded.pricing_mode,
      min_price_cents = excluded.min_price_cents,
      max_price_cents = excluded.max_price_cents,
      deposit_cents = excluded.deposit_cents,
      active = excluded.active
  `;
  return item;
}

export async function deletePriceBookItem(request: Request, slug: string, id: string) {
  const desk = await assertStorefrontOwner(slug, request);
  const sql = await getSql();
  await sql`
    update services set active = false
    where id = ${id} and shop_id = (select id from shops where slug = ${desk.slug} limit 1)
  `;
  return { ok: true };
}

export async function saveVoiceSettings(request: Request, slug: string, raw: Record<string, unknown>) {
  const desk = await assertStorefrontOwner(slug, request);
  const mode = String(raw.voiceAnswerMode || "") === "ring_overflow" ? "ring_overflow" : "immediate";
  const cap = Math.min(100000, Math.max(0, Number(raw.voiceDailyCapCents) || 2500));
  const sql = await getSql();
  await sql`
    update shops set voice_answer_mode = ${mode}, voice_daily_cap_cents = ${cap} where slug = ${desk.slug}
  `.catch(() => undefined);
  return { voiceAnswerMode: mode, voiceDailyCapCents: cap };
}
