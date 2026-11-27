import { getSql } from "@/lib/db";
import { shopCity } from "./avatar";
import { isCustomStorefrontAsset } from "./gallery";
import type { ProofBeforeAfter, ProofJobCard, ShopProofSlots } from "./shop-proof-slots.ts";

export type { ProofBeforeAfter, ProofJobCard, ShopProofSlots } from "./shop-proof-slots.ts";

export async function loadShopProofSlots(slug: string): Promise<ShopProofSlots | null> {
  const sql = await getSql();
  let shop: {
    id: string;
    address: string;
    hero_image_url: string;
    hero_video_url: string | null;
    hero_media_url?: string | null;
  } | undefined;
  try {
    const rows = await sql<{
      id: string;
      address: string;
      hero_image_url: string;
      hero_video_url: string | null;
      hero_media_url: string | null;
    }>`
      select id, address, hero_image_url, hero_video_url, hero_media_url
      from shops where slug = ${slug} limit 1
    `;
    shop = rows[0];
  } catch {
    const rows = await sql<{
      id: string;
      address: string;
      hero_image_url: string;
      hero_video_url: string | null;
    }>`select id, address, hero_image_url, hero_video_url from shops where slug = ${slug} limit 1`;
    shop = rows[0];
  }
  if (!shop) return null;
  const city = shopCity(shop.address || "");
  const ownerHero = String(shop.hero_media_url ?? "").trim();
  const heroUrl = isCustomStorefrontAsset(ownerHero) || /^https:\/\//i.test(ownerHero) ? ownerHero : "";
  type PortfolioRow = {
    id: string;
    image_url: string;
    caption: string;
    slot?: string;
    pair_key?: string;
    tags?: string;
  };
  const items: PortfolioRow[] = await sql<PortfolioRow>`
    select id, image_url, caption, slot, pair_key, tags
    from portfolio_items
    where shop_id = ${shop.id}
    order by created_at desc
    limit 24
  `.catch(async () => {
    return sql<PortfolioRow>`
      select id, image_url, caption from portfolio_items
      where shop_id = ${shop.id}
      order by created_at desc
      limit 24
    `;
  });

  const recentJobs: ProofJobCard[] = [];
  const befores = new Map<string, { url: string; caption: string }>();
  const afters = new Map<string, { url: string; caption: string }>();
  for (const row of items) {
    const slot = String(row.slot || row.tags || "proof").toLowerCase();
    const pair = String(row.pair_key || "").trim();
    if (slot === "before" && pair) befores.set(pair, { url: row.image_url, caption: row.caption });
    else if (slot === "after" && pair) afters.set(pair, { url: row.image_url, caption: row.caption });
    else if (slot !== "hero") {
      recentJobs.push({
        id: row.id,
        imageUrl: row.image_url,
        caption: row.caption || `${city} job`,
        city,
      });
    }
  }
  const beforeAfter: ProofBeforeAfter[] = [];
  for (const [key, before] of befores) {
    const after = afters.get(key);
    if (!after) continue;
    beforeAfter.push({
      id: key,
      title: before.caption || after.caption || "Before & after",
      summary: city ? `${city} service` : "",
      beforeUrl: before.url,
      afterUrl: after.url,
    });
  }

  return {
    heroUrl,
    heroVideoUrl: shop.hero_video_url || "",
    recentJobs: recentJobs.slice(0, 9),
    beforeAfter: beforeAfter.slice(0, 4),
    city,
  };
}
