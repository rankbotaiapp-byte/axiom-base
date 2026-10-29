import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { cityFromAddress } from "./avatar";
import { keepHeroBrand, sniffHeroAsset } from "./hero-brand";
import { shopTradeLabel } from "./niches";
import {
  clipMediaPurpose,
  MEDIA_ASSET_LIMIT,
  MEDIA_FILE_MAX_BYTES,
  MEDIA_SLOT_LABEL,
  parseMediaSlot,
  parseSocialChannels,
  placeBrandedAssets,
  shopMediaPath,
  socialCaptionDraft,
  type MediaAssetView,
  type SocialChannel,
} from "./media-slots";
import { assertCanModifyShopById } from "./shop-server.server";
import { parseTradeProfile } from "./trade-layout";
import { isShopNiche } from "./types";

type AssetRow = {
  id: string;
  shop_id: string;
  slot: string;
  purpose: string;
  caption: string;
  mime: string;
  data?: unknown;
  is_hero: boolean | number | string | null;
  created_at: string;
  updated_at?: string;
};

function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
  if (typeof value === "string" && value.startsWith("\\x")) {
    return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
  }
  return null;
}

function flag(value: boolean | number | string | null | undefined): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

function missingTable(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /shop_media_assets|shop_social_posts/i.test(message);
}

function toView(row: AssetRow): MediaAssetView {
  const version = Date.parse(row.updated_at || row.created_at) || Date.now();
  return {
    id: row.id,
    shopId: row.shop_id,
    slot: parseMediaSlot(row.slot),
    purpose: row.purpose,
    caption: row.caption,
    url: shopMediaPath(row.id, version),
    isHero: flag(row.is_hero),
    createdAt: row.created_at,
  };
}

function mimeFor(kind: "jpeg" | "png" | "webp") {
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  return "image/jpeg";
}

export async function listShopMedia(userId: string, shopId: string): Promise<MediaAssetView[]> {
  await assertCanModifyShopById(shopId, userId);
  try {
    const sql = await getSql();
    const rows = await sql<AssetRow>`
      select id, shop_id, slot, purpose, caption, mime, is_hero, created_at, updated_at
      from shop_media_assets
      where shop_id = ${shopId}
      order by is_hero desc, created_at desc
      limit ${MEDIA_ASSET_LIMIT}
    `;
    return rows.map(toView);
  } catch (err) {
    if (missingTable(err)) return [];
    throw err;
  }
}

export async function readShopMediaBytes(assetId: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) return null;
  try {
    const sql = await getSql();
    const rows = await sql<AssetRow>`
      select mime, data from shop_media_assets where id = ${assetId} limit 1
    `;
    const row = rows[0];
    const bytes = row ? asBytes(row.data) : null;
    if (!row || !bytes) return null;
    return { bytes, mime: row.mime || "image/jpeg" };
  } catch (err) {
    if (missingTable(err)) return null;
    throw err;
  }
}

export async function storeShopMedia(
  userId: string,
  shopId: string,
  bytes: Uint8Array,
  input: { slot?: unknown; purpose?: unknown; caption?: unknown; isHero?: unknown },
): Promise<MediaAssetView> {
  if (bytes.byteLength > MEDIA_FILE_MAX_BYTES) throw new Error("Use a photo 8 MB or smaller");
  const kind = sniffHeroAsset(bytes);
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") {
    throw new Error("Upload a JPEG, PNG, or WebP");
  }
  const row = await assertCanModifyShopById(shopId, userId);
  const slot = parseMediaSlot(input.slot, "gallery");
  const purpose = clipMediaPurpose(input.purpose);
  const caption = clipMediaPurpose(input.caption) || purpose || MEDIA_SLOT_LABEL[slot];
  const isHero = Boolean(input.isHero) || slot === "hero";
  const sql = await getSql();
  const counted = await sql<{ n: number }>`
    select count(*)::int as n from shop_media_assets where shop_id = ${row.id}
  `;
  if (Number(counted[0]?.n ?? 0) >= MEDIA_ASSET_LIMIT) throw new Error("The launch desk is full");
  const id = newId("med");
  if (isHero) {
    await sql`update shop_media_assets set is_hero = false where shop_id = ${row.id}`;
  }
  await sql.query(
    `insert into shop_media_assets (id, shop_id, slot, purpose, caption, mime, data, is_hero, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
    [id, row.id, slot, purpose, caption, mimeFor(kind), Buffer.from(bytes), isHero],
  );
  return {
    id,
    shopId: row.id,
    slot,
    purpose,
    caption,
    url: shopMediaPath(id, Date.now()),
    isHero,
    createdAt: new Date().toISOString(),
  };
}

export async function updateShopMedia(
  userId: string,
  shopId: string,
  assetId: string,
  patch: { slot?: unknown; purpose?: unknown; caption?: unknown; isHero?: unknown },
): Promise<MediaAssetView[]> {
  const row = await assertCanModifyShopById(shopId, userId);
  if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) throw new Error("That still was not found");
  const sql = await getSql();
  const current = await sql<AssetRow>`
    select id, shop_id, slot, purpose, caption, mime, is_hero, created_at, updated_at
    from shop_media_assets
    where id = ${assetId} and shop_id = ${row.id}
    limit 1
  `;
  const found = current[0];
  if (!found) throw new Error("That still was not found");
  const slot = patch.slot !== undefined ? parseMediaSlot(patch.slot, parseMediaSlot(found.slot)) : parseMediaSlot(found.slot);
  const purpose = patch.purpose !== undefined ? clipMediaPurpose(patch.purpose) : found.purpose;
  const caption = patch.caption !== undefined ? clipMediaPurpose(patch.caption) : found.caption;
  const isHero = patch.isHero !== undefined ? Boolean(patch.isHero) : flag(found.is_hero);
  if (isHero) {
    await sql`update shop_media_assets set is_hero = false where shop_id = ${row.id} and id <> ${assetId}`;
  }
  await sql`
    update shop_media_assets
    set slot = ${slot},
        purpose = ${purpose},
        caption = ${caption},
        is_hero = ${isHero},
        updated_at = now()
    where id = ${assetId} and shop_id = ${row.id}
  `;
  return listShopMedia(userId, shopId);
}

export async function removeShopMedia(userId: string, shopId: string, assetId: string): Promise<MediaAssetView[]> {
  const row = await assertCanModifyShopById(shopId, userId);
  if (!/^med_[a-zA-Z0-9]+$/.test(assetId)) throw new Error("That still was not found");
  const sql = await getSql();
  await sql`delete from shop_media_assets where id = ${assetId} and shop_id = ${row.id}`;
  return listShopMedia(userId, shopId);
}

export async function populateStorefrontFromMedia(userId: string, shopId: string): Promise<{
  placed: ReturnType<typeof placeBrandedAssets>;
}> {
  const row = await assertCanModifyShopById(shopId, userId);
  const assets = await listShopMedia(userId, shopId);
  const placed = placeBrandedAssets(assets);
  const sql = await getSql();
  const urlFor = (id: string | null) => assets.find((item) => item.id === id)?.url ?? "";

  if (placed.heroId) {
    const heroUrl = urlFor(placed.heroId);
    if (heroUrl) {
      await sql`
        update shops
        set hero_image_url = ${heroUrl}
        where id = ${row.id}
      `;
    }
  }

  if (placed.logoId) {
    const logoUrl = urlFor(placed.logoId);
    if (logoUrl) {
      const niche = isShopNiche(row.niche) ? row.niche : "contractor";
      const profile = parseTradeProfile(niche, row.trade_profile);
      profile.logoUrl = logoUrl;
      try {
        await sql`update shops set trade_profile = ${keepHeroBrand(profile, row.trade_profile)} where id = ${row.id}`;
      } catch (err) {
        if (!/trade_profile/i.test(err instanceof Error ? err.message : "")) throw err;
      }
    }
  }

  if (placed.staffId) {
    const avatar = urlFor(placed.staffId);
    const staff = await sql<{ id: string }>`
      select id from employees where shop_id = ${row.id} order by created_at asc limit 1
    `;
    if (avatar && staff[0]) {
      await sql`update employees set avatar_url = ${avatar} where id = ${staff[0].id} and shop_id = ${row.id}`;
    }
  }

  const emp = await sql<{ id: string }>`
    select id from employees where shop_id = ${row.id} order by created_at asc limit 1
  `;
  const employeeId = emp[0]?.id;
  if (employeeId) {
    for (const galleryId of placed.galleryIds) {
      const imageUrl = urlFor(galleryId);
      const caption = assets.find((item) => item.id === galleryId)?.caption || "Proof of work";
      if (!imageUrl) continue;
      const existing = await sql<{ id: string }>`
        select id from portfolio_items where shop_id = ${row.id} and image_url = ${imageUrl} limit 1
      `;
      if (existing[0]) continue;
      await sql`
        insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
        values (${newId("pf")}, ${row.id}, ${employeeId}, ${imageUrl}, ${caption})
      `;
    }
  }

  return { placed };
}

export async function draftSocialPost(
  userId: string,
  shopId: string,
  input: { assetId?: string; channels?: unknown; caption?: string },
): Promise<{
  id: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  channels: SocialChannel[];
  status: "draft";
}> {
  const row = await assertCanModifyShopById(shopId, userId);
  const channels = parseSocialChannels(input.channels);
  const sendTo = channels.length ? channels : (["facebook", "instagram", "x"] as SocialChannel[]);
  const assets = await listShopMedia(userId, shopId);
  const asset =
    assets.find((item) => item.id === input.assetId) ??
    assets.find((item) => item.slot === "outreach") ??
    assets.find((item) => item.isHero) ??
    assets[0];
  const city = cityFromAddress(row.address);
  const niche = isShopNiche(row.niche) ? row.niche : "contractor";
  const trade = shopTradeLabel({ niche, customNiche: row.custom_niche ?? "" });
  const fallback = socialCaptionDraft({
    shopName: row.name,
    trade,
    city,
    pageUrl: `/${row.slug}`,
  });
  let caption = (input.caption ?? "").trim();
  let hashtags = fallback.hashtags;
  if (!caption) {
    const written = await writeSocialCaption(row.name, trade, city);
    caption = written.caption;
    hashtags = written.hashtags || hashtags;
  }
  const body = `${caption}\n${hashtags}`.trim();
  const id = newId("soc");
  try {
    const sql = await getSql();
    await sql`
      insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
      values (${id}, ${row.id}, ${asset?.id ?? null}, ${body}, ${JSON.stringify(sendTo)}, ${"draft"}, now())
    `;
  } catch (err) {
    if (!missingTable(err)) throw err;
  }
  return {
    id,
    caption: body,
    hashtags,
    imageUrl: asset?.url ?? "",
    channels: sendTo,
    status: "draft",
  };
}

async function writeSocialCaption(shopName: string, trade: string, city: string): Promise<{ caption: string; hashtags: string }> {
  const fallback = socialCaptionDraft({ shopName, trade, city, pageUrl: "" });
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return fallback;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 160,
      messages: [
        {
          role: "user",
          content: `Write one high-conversion social caption for ${shopName}, a ${trade} shop in ${city}. No hashtags in the caption. 40 words or fewer. No emoji.`,
        },
      ],
    }),
  });
  if (!res.ok) return fallback;
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = (body.choices?.[0]?.message?.content ?? "").trim().replace(/\s+/g, " ").slice(0, 240);
  return { caption: text || fallback.caption, hashtags: fallback.hashtags };
}

export async function approveSocialPost(
  userId: string,
  shopId: string,
  postId: string,
): Promise<{
  approved: boolean;
  delivered: SocialChannel[];
  pending: SocialChannel[];
  caption: string;
}> {
  const row = await assertCanModifyShopById(shopId, userId);
  if (!/^soc_[a-zA-Z0-9]+$/.test(postId)) throw new Error("That post was not found");
  try {
    const sql = await getSql();
    const posts = await sql<{ id: string; caption: string; channels: string }>`
      select id, caption, channels from shop_social_posts
      where id = ${postId} and shop_id = ${row.id}
      limit 1
    `;
    const post = posts[0];
    if (!post) throw new Error("That post was not found");
    const channels = parseSocialChannels(post.channels);
    await sql`
      update shop_social_posts set status = ${"approved"} where id = ${post.id} and shop_id = ${row.id}
    `;
    return {
      approved: true,
      delivered: [],
      pending: channels,
      caption: post.caption,
    };
  } catch (err) {
    if (missingTable(err)) {
      return { approved: true, delivered: [], pending: ["facebook", "instagram", "x"], caption: "" };
    }
    throw err;
  }
}

export function mediaResponse(bytes: Uint8Array, mime: string): Response {
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": mime,
      "content-length": String(bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
