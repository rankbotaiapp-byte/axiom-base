import { getSql } from "@/lib/db";
import {
  isCollectionMode,
  isPricingType,
  type CollectionMode,
  type MerchantPrice,
  type MerchantPricingType,
} from "./merchant-pricing";
import { isPlatformOwner } from "./platform-owner.server";

type DbRow = {
  id: string;
  shop_slug: string;
  service_name: string;
  pricing_type: string;
  price_amount: string | number;
  active_deals_banner: string;
  collection_mode: string;
  updated_at: string | Date;
};

function mapRow(row: DbRow): MerchantPrice {
  return {
    id: row.id,
    shopSlug: row.shop_slug,
    serviceName: row.service_name,
    pricingType: isPricingType(row.pricing_type) ? row.pricing_type : "flat",
    priceAmount: Number(row.price_amount),
    activeDealsBanner: row.active_deals_banner ?? "",
    collectionMode: isCollectionMode(row.collection_mode) ? row.collection_mode : "online",
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function ownedShop(slug: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; slug: string; is_showcase: boolean; owner_user_id: string | null }>`
    select id, slug, is_showcase, owner_user_id from shops where slug = ${slug} limit 1
  `;
  const shop = rows[0];
  if (!shop) throw new Error("Shop not found");
  if (shop.is_showcase) throw new Error("Showcase shops are read-only");
  if (shop.owner_user_id === userId) return shop;
  const members = await sql<{ role: string }>`
    select role from shop_members where shop_id = ${shop.id} and user_id = ${userId} limit 1
  `;
  if (members[0]?.role === "owner") return shop;
  if (await isPlatformOwner(userId)) return shop;
  throw new Error("Forbidden");
}

export type SavedMerchantPrice = {
  slug: string;
  serviceName: string;
  pricingType: MerchantPricingType;
  collectionMode: CollectionMode;
  priceAmount: number;
  activeDealsBanner: string;
};

export async function listMerchantPricingForShop(slug: string) {
  const sql = await getSql();
  let rows: DbRow[] = [];
  try {
    rows = await sql<DbRow>`
      select id, shop_slug, service_name, pricing_type, price_amount, active_deals_banner, collection_mode, updated_at
      from merchant_pricing_settings
      where shop_slug = ${slug}
      order by service_name
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/merchant_pricing_settings|collection_mode|does not exist/i.test(message)) throw err;
  }
  const { stripePublishableKey } = await import("./payments.server");
  return { rows: rows.map(mapRow), elementsReady: Boolean(stripePublishableKey()) };
}

export async function saveMerchantPricingForShop(userId: string, data: SavedMerchantPrice) {
  const shop = await ownedShop(data.slug, userId);
  const sql = await getSql();
  const rows = await sql<DbRow>`
    insert into merchant_pricing_settings (
      shop_slug, service_name, pricing_type, price_amount, active_deals_banner, collection_mode
    ) values (
      ${shop.slug}, ${data.serviceName}, ${data.pricingType}, ${data.priceAmount.toFixed(2)},
      ${data.activeDealsBanner}, ${data.collectionMode}
    )
    on conflict (shop_slug, service_name) do update set
      pricing_type = excluded.pricing_type,
      price_amount = excluded.price_amount,
      active_deals_banner = excluded.active_deals_banner,
      collection_mode = excluded.collection_mode,
      updated_at = now()
    returning id, shop_slug, service_name, pricing_type, price_amount, active_deals_banner, collection_mode, updated_at
  `;
  const saved = rows[0];
  if (!saved) throw new Error("Price could not be saved");
  return mapRow(saved);
}

export async function deleteMerchantPricingForShop(userId: string, data: { slug: string; id: string }) {
  const shop = await ownedShop(data.slug, userId);
  const sql = await getSql();
  await sql`
    delete from merchant_pricing_settings
    where id = ${data.id}::uuid and shop_slug = ${shop.slug}
  `;
  return { ok: true as const };
}
