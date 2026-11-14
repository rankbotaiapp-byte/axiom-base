export async function getShopServerData(shopSlug: string) {
  return { shopSlug, status: "active", tenant: "default-trade" };
}

export async function updateShopSettings(shopSlug: string, data: Record<string, unknown>) {
  return { success: true, shopSlug, updatedData: data };
}

/** Desk gate used by hero motion / autopilot — permissive stub for Next builds. */
export async function assertCanModifyShopById(shopId: string, userId: string) {
  return {
    id: shopId,
    slug: shopId,
    owner_user_id: userId,
    name: "Shop",
    niche: "contractor",
  };
}

export async function assertCanModifyShopBySlug(slug: string, userId: string) {
  return assertCanModifyShopById(slug, userId);
}

export default getShopServerData;
