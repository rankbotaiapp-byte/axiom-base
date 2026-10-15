import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
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

export const listMerchantPricing = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    const value = String(slug ?? "").trim();
    if (!/^[a-z0-9-]{1,80}$/i.test(value)) throw new Error("Shop not found");
    return value;
  })
  .handler(async ({ data: slug }) => {
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
  });

export const saveMerchantPricing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    slug?: string;
    serviceName?: string;
    pricingType?: string;
    priceAmount?: number;
    activeDealsBanner?: string;
    collectionMode?: string;
  }) => {
    const slug = String(input?.slug ?? "").trim();
    const serviceName = String(input?.serviceName ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    const pricingType = String(input?.pricingType ?? "");
    const collectionMode = String(input?.collectionMode ?? "online");
    const priceAmount = Number(input?.priceAmount);
    const activeDealsBanner = String(input?.activeDealsBanner ?? "").trim().slice(0, 140);
    if (!/^[a-z0-9-]{1,80}$/i.test(slug)) throw new Error("Shop not found");
    if (serviceName.length < 2) throw new Error("Service name is required");
    if (!isPricingType(pricingType)) throw new Error("Choose a flat rate, deposit, or package");
    if (!isCollectionMode(collectionMode)) throw new Error("Choose online or in-person collection");
    if (!Number.isFinite(priceAmount) || priceAmount < 0 || priceAmount > 100000) {
      throw new Error("Enter a price from 0 to 100000");
    }
    return {
      slug,
      serviceName,
      pricingType: pricingType as MerchantPricingType,
      collectionMode: collectionMode as CollectionMode,
      priceAmount: Math.round(priceAmount * 100) / 100,
      activeDealsBanner,
    };
  })
  .handler(async ({ data, context }) => {
    const shop = await ownedShop(data.slug, context.userId);
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
  });

export const deleteMerchantPricing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: string; id?: string }) => {
    const slug = String(input?.slug ?? "").trim();
    const id = String(input?.id ?? "").trim();
    if (!/^[a-z0-9-]{1,80}$/i.test(slug)) throw new Error("Shop not found");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Price not found");
    return { slug, id };
  })
  .handler(async ({ data, context }) => {
    const shop = await ownedShop(data.slug, context.userId);
    const sql = await getSql();
    await sql`
      delete from merchant_pricing_settings
      where id = ${data.id}::uuid and shop_slug = ${shop.slug}
    `;
    return { ok: true as const };
  });
