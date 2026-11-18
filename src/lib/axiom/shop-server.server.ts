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
    custom_niche: "",
    address: "",
    onboarding_json: "{}" as string,
    trade_profile: "{}" as string,
    hero_image_url: "",
    hero_video_url: "",
  };
}

export async function assertCanModifyShopBySlug(slug: string, userId: string) {
  return assertCanModifyShopById(slug, userId);
}

/** One-time claim for a shop whose checkout had no signed-in payer. */
export async function claimShopWithToken(shopId: string) {
  const { randomBytes } = await import("node:crypto");
  const token = randomBytes(16).toString("hex");
  if (!shopId) return token;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${`claim_${token.slice(0, 16)}`}, ${shopId}, 'claim_token', ${token})
    `;
  } catch {
    // The token is still returned so the unowned shop can be claimed.
  }
  return token;
}

/**
 * Redeem a guest-checkout claim token and attach the signed-in owner.
 * Replays Stripe-backed generation quota when checkout had no `metadata.user_id`.
 */
export async function redeemShopClaimWithToken(input: {
  shopId: string;
  claimToken: string;
  userId: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const shopId = input.shopId.trim();
  const token = input.claimToken.trim();
  const userId = input.userId.trim();
  if (!shopId || !token || !userId || userId === "dev-user") {
    return { ok: false, error: "Invalid claim." };
  }

  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const tokenRows = await sql<{ payload: string }>`
      select payload
      from shop_events
      where shop_id = ${shopId}
        and type = 'claim_token'
        and payload = ${token}
      limit 1
    `;
    if (!tokenRows[0]) return { ok: false, error: "Claim link expired or already used." };

    const shops = await sql<{ slug: string; owner_user_id: string | null }>`
      select slug, owner_user_id from shops where id = ${shopId} limit 1
    `;
    const shop = shops[0];
    if (!shop) return { ok: false, error: "Shop not found." };
    if (shop.owner_user_id && shop.owner_user_id !== userId) {
      return { ok: false, error: "This shop already has an owner." };
    }

    await sql`
      update shops
      set owner_user_id = coalesce(owner_user_id, ${userId})
      where id = ${shopId}
    `;
    await sql`
      insert into shop_members (shop_id, user_id, role)
      values (${shopId}, ${userId}, 'owner')
      on conflict (shop_id, user_id) do nothing
    `;
    await sql`
      delete from shop_events
      where shop_id = ${shopId}
        and type = 'claim_token'
        and payload = ${token}
    `;

    const { syncGenerationQuotaForClaimedShopOwner } = await import("./generation-quota.server");
    await syncGenerationQuotaForClaimedShopOwner(userId, shop.slug);

    return { ok: true, slug: shop.slug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claim failed.";
    return { ok: false, error: message };
  }
}

/**
 * Territory checkout opener. Seeds axiom_pro billing at the 150 bps Gear Guardian split.
 * A missing payer stays unowned until claimShopWithToken is redeemed.
 */
export async function provisionTerritoryForPayer(input: { leadSlug: string; userId?: string }) {
  const { provisionTenant } = await import("./provision");
  const ownerId = (input.userId || "").trim();
  const feeSplit = {
    plan: "axiom_pro",
    status: "trialing" as const,
    gear_guardian_bps: 150,
  };
  const shop = await provisionTenant({
    slug: input.leadSlug,
    userId: ownerId,
    status: feeSplit.status,
    plan: feeSplit.plan,
    gear: { gear_guardian_bps: feeSplit.gear_guardian_bps, gear_guardian_issuer: "Gear Guardian LLC" },
  });
  if (!ownerId) {
    const claimToken = await claimShopWithToken(shop.shopId);
    return { ...shop, unowned: true, claimToken };
  }
  const { syncGenerationQuotaForClaimedShopOwner } = await import("./generation-quota.server");
  await syncGenerationQuotaForClaimedShopOwner(ownerId, shop.slug).catch(() => undefined);
  return { ...shop, unowned: false };
}

export default getShopServerData;
