import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import {
  composeAutopilotClip,
  parseShopConfig,
  pickAutopilotLoop,
  resolveAutopilotLoops,
} from "../../config/AutopilotContentEngine.ts";
import { shopCity } from "./avatar";
import { extractProofAtoms } from "./autopilot-caption.ts";
import { isCustomStorefrontAsset } from "./gallery";
import { notifyShop } from "./notify.server";
import { parseAutopilotActive, type AutopilotTickResult } from "./shop-autopilot";

type ArmedShop = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  address: string;
  owner_user_id: string | null;
  hero_image_url: string;
  hero_video_url: string | null;
  trade_profile: string | null;
  autopilot_active?: unknown;
  ai_content_autopilot?: unknown;
};

async function selectArmedShops() {
  const sql = await getSql();
  try {
    return await sql<ArmedShop>`
      select id, slug, name, niche, address, owner_user_id, hero_image_url, hero_video_url,
             trade_profile, autopilot_active, ai_content_autopilot
      from shops
      where owner_user_id is not null
         or coalesce(autopilot_active, false) = true
         or coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 16
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/autopilot_active|hero_video_url|trade_profile/i.test(message)) throw err;
    return sql<ArmedShop>`
      select id, slug, name, niche, address, owner_user_id, hero_image_url, hero_video_url,
             trade_profile, ai_content_autopilot
      from shops
      where owner_user_id is not null
         or coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 16
    `;
  }
}

async function cycleProofStill(shop: { id: string; hero_image_url: string }): Promise<boolean> {
  const src = shop.hero_image_url.trim();
  if (!isCustomStorefrontAsset(src)) return false;
  const sql = await getSql();
  const existing = await sql<{ n: number }>`
    select count(*)::int as n from portfolio_items
    where shop_id = ${shop.id} and image_url = ${src}
  `;
  if (Number(existing[0]?.n ?? 0) > 0) return false;
  const custom = await sql<{ n: number }>`
    select count(*)::int as n from portfolio_items
    where shop_id = ${shop.id}
      and (
        image_url like 'data:image/%'
        or image_url like '/api/shop-media/%'
        or image_url like '/api/hero/%'
      )
  `;
  if (Number(custom[0]?.n ?? 0) >= 3) return false;
  const staff = await sql<{ id: string }>`
    select id from employees where shop_id = ${shop.id} order by created_at asc limit 1
  `;
  const employeeId = staff[0]?.id;
  if (!employeeId) return false;
  await sql`
    insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
    values (${newId("pf")}, ${shop.id}, ${employeeId}, ${src}, ${"On the job"})
  `;
  return true;
}

async function queueSocialClip(shop: ArmedShop): Promise<{ queued: boolean; caption: string; city: string }> {
  const sql = await getSql();
  const config = parseShopConfig(shop.trade_profile);
  const loops = resolveAutopilotLoops({
    shopConfig: config,
    pinnedHeroUrl: config.overrideHeroVideoUrl || shop.hero_video_url,
    niche: shop.niche,
  });
  const pick = pickAutopilotLoop(loops, config.autopilotLoopCursor ?? 0);
  const city = shopCity(shop.address);
  let profile: Record<string, unknown> = {};
  try {
    profile = shop.trade_profile ? (JSON.parse(shop.trade_profile) as Record<string, unknown>) : {};
  } catch {
    profile = {};
  }
  let extras: { caption: string }[] = [];
  try {
    extras = await sql<{ caption: string }>`
      select caption from portfolio_items where shop_id = ${shop.id} and caption is not null limit 8
    `;
  } catch {
    extras = [];
  }
  const proofAtom = extractProofAtoms(profile, extras.map((row) => row.caption))[0] ?? "";
  const clip = composeAutopilotClip({
    loopUrl: pick.loopUrl,
    shopName: shop.name,
    city,
    bookUrl: `/${shop.slug}/book`,
    niche: shop.niche,
    proofAtom,
  });
  const status = clip.needsCopy ? "queued_needs_copy" : "queued";
  const body = clip.needsCopy
    ? "queued_needs_copy"
    : `${clip.caption}\nFilm: ${clip.loopUrl}\nMaster: ${clip.masterLoopUrl}`;
  const id = newId("soc");
  try {
    await sql`
      insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
      values (
        ${id},
        ${shop.id},
        ${clip.loopUrl},
        ${body},
        ${JSON.stringify(["facebook", "instagram", "gbp"])},
        ${status},
        now()
      )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_social_posts/i.test(message)) throw err;
    return { queued: false, caption: clip.caption, city };
  }
  try {
    await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${shop.id}, ${"autopilot_clip"}, ${JSON.stringify(clip)})
    `;
  } catch {
    /* events table is optional on older snapshots */
  }
  const shopConfig =
    profile.shopConfig && typeof profile.shopConfig === "object" && !Array.isArray(profile.shopConfig)
      ? { ...(profile.shopConfig as Record<string, unknown>) }
      : {};
  shopConfig.autopilotLoopCursor = pick.nextCursor;
  profile.shopConfig = shopConfig;
  try {
    await sql`update shops set trade_profile = ${JSON.stringify(profile)} where id = ${shop.id}`;
  } catch {
    /* older databases may not have trade_profile */
  }
  return { queued: !clip.needsCopy, caption: clip.caption, city };
}

export async function queueAutopilotSocialClips(): Promise<{ queued: number }> {
  const rows = (await selectArmedShops()).filter((row) => parseAutopilotActive(row));
  let queued = 0;
  for (const row of rows) {
    if ((await queueSocialClip(row).catch(() => ({ queued: false }))).queued) queued += 1;
  }
  return { queued };
}

/** Background pass for armed tenants: stock brand, AI still, proof fill, social clip, owner notice. */
export async function tickShopAutopilot(): Promise<{ ran: number; results: AutopilotTickResult[] }> {
  await import("./social-publish.server")
    .then((mod) => mod.publishQueuedSocialPosts())
    .catch(() => undefined);
  const rows = (await selectArmedShops()).filter((row) => parseAutopilotActive(row));
  const results: AutopilotTickResult[] = [];
  const { generateArmedHeroForShop } = await import("./hero-motion-studio.server");
  const { sourceBrandedContentForShop } = await import("./autopilot-content.server");
  for (const row of rows) {
    const stock = await sourceBrandedContentForShop({
      id: row.id,
      slug: row.slug,
      name: row.name,
      niche: row.niche,
      address: row.address,
      owner_user_id: row.owner_user_id,
      hero_image_url: row.hero_image_url,
      trade_profile: row.trade_profile,
    }).catch((err: unknown) => ({
      shopId: row.id,
      slug: row.slug,
      sourced: false,
      stored: false,
      queued: false,
      provider: "none",
      detail: err instanceof Error ? err.message : "Stock branding failed",
    }));
    const hero = await generateArmedHeroForShop(row.id, row.owner_user_id || "").catch((err: unknown) => ({
      ok: false,
      detail: err instanceof Error ? err.message : "Hero tick failed",
    }));
    const proof = await cycleProofStill(row).catch(() => false);
    const social = (await queueSocialClip(row).catch(() => ({ queued: false }))).queued;
    const stockBrand = Boolean(stock.sourced && (stock.stored || stock.queued));
    const { publishApprovedAutopilotBundle } = await import("./autopilot-publish.server");
    const published = await publishApprovedAutopilotBundle(row).catch(() => ({
      applied: false,
      receipts: [],
      detail: "Publish hook skipped.",
    }));
    let notice = false;
    if (hero.ok || proof || social || stockBrand || published.applied) {
      await notifyShop(row.id, {
        kind: "inquiry",
        subject: "Autopilot ran",
        body: stockBrand
          ? "Fresh trade stock media was sourced and stamped with your shop name, city, and booking CTA."
          : social
            ? "A social clip is queued with your rotating cinematic loop, shop name, city, and booking line."
            : published.applied
              ? published.detail.includes("Simulation")
                ? "Storefront preview media is updated. Social was not counted as live."
                : "Storefront preview media is updated and live social posts went out."
              : hero.ok
                ? "A fresh still is on your storefront. Proof plates stay in sync."
                : "A proof plate was filled from your shop photo.",
      }).catch(() => undefined);
      notice = true;
    }
    results.push({
      shopId: row.id,
      slug: row.slug,
      hero: Boolean(hero.ok),
      proof,
      social,
      stockBrand,
      published: published.applied,
      notice,
      detail: stockBrand ? stock.detail : published.applied ? published.detail : hero.detail,
    });
  }
  return {
    ran: results.filter((row) => row.hero || row.proof || row.social || row.stockBrand || row.published).length,
    results,
  };
}

export async function runOwnedAutopilotTickHandler({
  data,
  context,
}: {
  data: { slug: string };
  context: { userId: string };
}): Promise<{ queued: boolean; city: string; name: string; caption: string }> {
  const sql = await getSql();
  const shops = await sql<ArmedShop>`
    select id, slug, name, niche, address, owner_user_id, hero_image_url, hero_video_url, trade_profile
    from shops
    where slug = ${data.slug}
    limit 1
  `;
  const shop = shops[0];
  if (!shop) throw new Error("Shop not found");
  const mem = await sql<{ role: string }>`
    select role from shop_members
    where shop_id = ${shop.id} and user_id = ${context.userId}
    limit 1
  `;
  if (mem[0]?.role !== "owner" && shop.owner_user_id !== context.userId) throw new Error("Forbidden");
  const clip = await queueSocialClip(shop);
  return { queued: clip.queued, city: clip.city || shopCity(shop.address), name: shop.name, caption: clip.caption };
}
