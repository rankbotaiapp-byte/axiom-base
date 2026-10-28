import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { clipMediaPurpose, parseMediaSlot, parseSocialChannels } from "./media-slots";

export const listOwnerMedia = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string }) => {
    const shopId = String(input?.shopId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    return { shopId };
  })
  .handler(async ({ data, context }) => {
    const { listShopMedia } = await import("./media-pipeline.server");
    return listShopMedia(context.userId, data.shopId);
  });

export const updateOwnerMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string; assetId: string; slot?: string; purpose?: string; caption?: string; isHero?: boolean }) => {
    const shopId = String(input?.shopId ?? "").trim();
    const assetId = String(input?.assetId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) throw new Error("That still was not found");
    return {
      shopId,
      assetId,
      slot: input.slot ? parseMediaSlot(input.slot) : undefined,
      purpose: input.purpose !== undefined ? clipMediaPurpose(input.purpose) : undefined,
      caption: input.caption !== undefined ? clipMediaPurpose(input.caption) : undefined,
      isHero: input.isHero,
    };
  })
  .handler(async ({ data, context }) => {
    const { updateShopMedia } = await import("./media-pipeline.server");
    return updateShopMedia(context.userId, data.shopId, data.assetId, data);
  });

export const removeOwnerMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string; assetId: string }) => {
    const shopId = String(input?.shopId ?? "").trim();
    const assetId = String(input?.assetId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) throw new Error("That still was not found");
    return { shopId, assetId };
  })
  .handler(async ({ data, context }) => {
    const { removeShopMedia } = await import("./media-pipeline.server");
    return removeShopMedia(context.userId, data.shopId, data.assetId);
  });

export const populateOwnerStorefront = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string }) => {
    const shopId = String(input?.shopId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    return { shopId };
  })
  .handler(async ({ data, context }) => {
    const { populateStorefrontFromMedia } = await import("./media-pipeline.server");
    return populateStorefrontFromMedia(context.userId, data.shopId);
  });

export const draftOwnerSocial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string; assetId?: string; channels?: string[]; caption?: string }) => {
    const shopId = String(input?.shopId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    const assetId = String(input?.assetId ?? "").trim();
    return {
      shopId,
      assetId: /^med_[a-zA-Z0-9]+$/.test(assetId) ? assetId : undefined,
      channels: parseSocialChannels(input.channels),
      caption: typeof input.caption === "string" ? input.caption.trim().slice(0, 400) : "",
    };
  })
  .handler(async ({ data, context }) => {
    const { draftSocialPost } = await import("./media-pipeline.server");
    return draftSocialPost(context.userId, data.shopId, data);
  });

export const approveOwnerSocial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { shopId: string; postId: string }) => {
    const shopId = String(input?.shopId ?? "").trim();
    const postId = String(input?.postId ?? "").trim();
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop not found");
    if (!/^soc_[a-zA-Z0-9]+$/.test(postId)) throw new Error("That post was not found");
    return { shopId, postId };
  })
  .handler(async ({ data, context }) => {
    const { approveSocialPost } = await import("./media-pipeline.server");
    return approveSocialPost(context.userId, data.shopId, data.postId);
  });
