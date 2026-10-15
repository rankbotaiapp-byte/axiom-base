import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isCollectionMode, isPricingType, type CollectionMode, type MerchantPricingType } from "./merchant-pricing";

export const listMerchantPricing = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    const value = String(slug ?? "").trim();
    if (!/^[a-z0-9-]{1,80}$/i.test(value)) throw new Error("Shop not found");
    return value;
  })
  .handler(async ({ data: slug }) => {
    const { listMerchantPricingForShop } = await import("./merchant-pricing.server");
    return listMerchantPricingForShop(slug);
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
    const { saveMerchantPricingForShop } = await import("./merchant-pricing.server");
    return saveMerchantPricingForShop(context.userId, data);
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
    const { deleteMerchantPricingForShop } = await import("./merchant-pricing.server");
    return deleteMerchantPricingForShop(context.userId, data);
  });
