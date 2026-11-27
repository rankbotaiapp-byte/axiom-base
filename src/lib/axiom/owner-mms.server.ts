import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { shopCity } from "./avatar";
import { generateProofCaption } from "./autopilot-caption.server.ts";
import { tradeCopyForNiche } from "../../config/AutopilotContentEngine.ts";
import { applyAxiomBrandStamp } from "./brand-stamp.server.ts";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate";
import {
  applyOwnerMmsMenu,
  lastMmsIsFresh,
  OWNER_MMS_MENU,
  ownerMmsCaptionSeed,
  parseLastMmsUpload,
  parseOwnerMmsKeyword,
  parseOwnerMmsMenuReply,
  type LastMmsUpload,
  type OwnerMmsSlot,
} from "./owner-mms.ts";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  address: string;
  phone: string | null;
  owner_phone: string | null;
  notify_phone: string | null;
  notification_phone: string | null;
  hero_image_url: string | null;
  hero_media_url: string | null;
  hero_media_prev_url: string | null;
  last_mms_upload: unknown;
  license_number: string | null;
  ad_tagline: string | null;
  tagline: string | null;
};

function twilioBasicAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  if (!sid || !token) return "";
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

async function loadOwnerShop(shopId: string): Promise<ShopRow | null> {
  const sql = await getSql();
  try {
    const rows = await sql<ShopRow>`
      select id, slug, name, niche, address, phone, owner_phone, notify_phone, notification_phone,
             hero_image_url, hero_media_url, hero_media_prev_url, last_mms_upload,
             license_number, ad_tagline, tagline
      from shops where id = ${shopId} limit 1
    `;
    return rows[0] ?? null;
  } catch {
    const rows = await sql<ShopRow>`
      select id, slug, name, niche, address, phone, notify_phone, notification_phone,
             hero_image_url, tagline
      from shops where id = ${shopId} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      owner_phone: row.notify_phone,
      hero_media_url: "",
      hero_media_prev_url: "",
      last_mms_upload: null,
      license_number: "",
      ad_tagline: row.tagline,
    };
  }
}

async function ensureStaff(shopId: string): Promise<string | null> {
  const sql = await getSql();
  const staff = await sql<{ id: string }>`
    select id from employees where shop_id = ${shopId} order by created_at asc limit 1
  `.catch(() => [] as { id: string }[]);
  if (staff[0]?.id) return staff[0].id;
  const id = newId("emp");
  try {
    await sql`
      insert into employees (id, shop_id, display_name, title)
      values (${id}, ${shopId}, ${"Owner"}, ${"Owner"})
    `;
    return id;
  } catch {
    return null;
  }
}

async function saveLastMms(shopId: string, pointer: LastMmsUpload | null): Promise<void> {
  const sql = await getSql();
  try {
    await sql`
      update shops set last_mms_upload = ${pointer ? JSON.stringify(pointer) : null}::jsonb where id = ${shopId}
    `;
  } catch {
    /* column may be missing until migrate */
  }
}

async function setHero(shopId: string, nextUrl: string, prevUrl: string): Promise<void> {
  const sql = await getSql();
  try {
    await sql`
      update shops
      set hero_media_url = ${nextUrl},
          hero_media_prev_url = ${prevUrl},
          hero_image_url = ${nextUrl || prevUrl}
      where id = ${shopId}
    `;
  } catch {
    await sql`update shops set hero_image_url = ${nextUrl || prevUrl} where id = ${shopId}`.catch(() => undefined);
  }
}

async function insertPortfolio(input: {
  shopId: string;
  employeeId: string | null;
  url: string;
  caption: string;
  slot: OwnerMmsSlot;
  pairKey: string;
}): Promise<string> {
  const id = newId("pf");
  const sql = await getSql();
  if (!input.employeeId) return id;
  try {
    await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption, status, tags, slot, pair_key)
      values (
        ${id}, ${input.shopId}, ${input.employeeId}, ${input.url}, ${input.caption},
        ${"approved"}, ${input.slot}, ${input.slot}, ${input.pairKey}
      )
    `;
  } catch {
    await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
      values (${id}, ${input.shopId}, ${input.employeeId}, ${input.url}, ${input.caption})
    `.catch(() => undefined);
  }
  return id;
}

async function updatePortfolioSlot(id: string, slot: OwnerMmsSlot): Promise<void> {
  if (!id) return;
  const sql = await getSql();
  await sql`
    update portfolio_items set slot = ${slot}, tags = ${slot} where id = ${id}
  `.catch(() => undefined);
}

async function removePortfolio(id: string): Promise<void> {
  if (!id) return;
  const sql = await getSql();
  await sql`delete from portfolio_items where id = ${id}`.catch(() => undefined);
}

async function enqueueSocialDraft(input: {
  shopId: string;
  slug: string;
  url: string;
  caption: string;
  shop: ShopRow;
  stampBuffer?: Buffer;
}): Promise<void> {
  const city = shopCity(input.shop.address || "");
  let stampedUrl = input.url;
  try {
    const source = input.stampBuffer;
    if (source) {
      const stamped = await applyAxiomBrandStamp({
        imageBuffer: source,
        shop: {
          name: input.shop.name,
          city,
          phone: input.shop.phone || input.shop.notify_phone,
          license_number: input.shop.license_number,
          ad_tagline: input.shop.ad_tagline || input.shop.tagline,
        },
        platform: "instagram",
      });
      const { uploadPreparedWebpToStorage } = await import("./storefront-layout.server");
      const stored = await uploadPreparedWebpToStorage(input.slug, stamped.webp, "stamp");
      if (stored?.url) stampedUrl = stored.url;
    }
  } catch {
    /* keep original still */
  }
  const sql = await getSql();
  await sql`
    insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
    values (
      ${newId("soc")},
      ${input.shopId},
      ${stampedUrl},
      ${input.caption},
      ${JSON.stringify(["facebook", "instagram", "gbp"])},
      ${"pending_approval"},
      now()
    )
  `.catch(() => undefined);
}

async function captionForProof(shop: ShopRow, seed: string): Promise<string> {
  if (seed.length >= 8) return seed.slice(0, 180);
  const city = shopCity(shop.address || "");
  const { tradeLabel } = tradeCopyForNiche(shop.niche);
  const generated = await generateProofCaption({
    shopName: shop.name,
    city,
    tradeLabel,
    proofAtom: `${tradeLabel} job in ${city}`,
    bookUrl: `/${shop.slug}/book`,
  });
  return generated.ok ? generated.caption : `${shop.name} · recent local work in ${city}`;
}

async function latestUnpairedBefore(shopId: string): Promise<string> {
  const sql = await getSql();
  try {
    const rows = await sql<{ pair_key: string }>`
      select pair_key from portfolio_items
      where shop_id = ${shopId} and slot = ${"before"} and coalesce(pair_key, '') <> ''
      order by created_at desc
      limit 1
    `;
    const key = rows[0]?.pair_key ?? "";
    if (!key) return newId("pair");
    const after = await sql<{ n: number }>`
      select count(*)::int as n from portfolio_items
      where shop_id = ${shopId} and slot = ${"after"} and pair_key = ${key}
    `;
    if (Number(after[0]?.n ?? 0) === 0) return key;
  } catch {
    /* ignore */
  }
  return newId("pair");
}

export async function handleOwnerMmsMenuReply(input: {
  shopId: string;
  from: string;
  body: string;
}): Promise<{ handled: boolean; reply: string }> {
  const menu = parseOwnerMmsMenuReply(input.body);
  if (!menu) return { handled: false, reply: "" };
  const shop = await loadOwnerShop(input.shopId);
  if (!shop) return { handled: false, reply: "" };
  if (!mmsSenderMayUpdateProof(input.from, [shop.owner_phone, shop.notify_phone, shop.notification_phone])) {
    return { handled: false, reply: "" };
  }
  const pointer = parseLastMmsUpload(shop.last_mms_upload);
  if (!lastMmsIsFresh(pointer) || !pointer) {
    return { handled: true, reply: "That photo expired. Text a new photo to place it." };
  }
  const next = applyOwnerMmsMenu(pointer, menu);
  if (next.slot === "hero") {
    await setHero(shop.id, pointer.url, shop.hero_media_url || shop.hero_image_url || "");
    await updatePortfolioSlot(pointer.portfolioId, "hero");
    await saveLastMms(shop.id, { ...pointer, slot: "hero", prevHeroUrl: shop.hero_media_url || shop.hero_image_url || pointer.prevHeroUrl });
  } else if (next.slot === "before") {
    await updatePortfolioSlot(pointer.portfolioId, "before");
    await saveLastMms(shop.id, { ...pointer, slot: "before" });
  } else {
    await setHero(shop.id, pointer.prevHeroUrl, pointer.prevHeroUrl);
    await removePortfolio(pointer.portfolioId);
    await saveLastMms(shop.id, null);
  }
  return { handled: true, reply: next.confirm };
}

export async function ingestInboundMmsProofs(
  form: URLSearchParams,
  shop: { id: string; slug: string },
  from: string,
): Promise<{ stored: number; reply?: string; handled: boolean }> {
  const count = Number(form.get("NumMedia") || 0);
  if (!Number.isFinite(count) || count <= 0) return { stored: 0, handled: false };
  const row = await loadOwnerShop(shop.id);
  if (!row) return { stored: 0, handled: false };
  if (!mmsSenderMayUpdateProof(from, [row.owner_phone, row.notify_phone, row.notification_phone])) {
    return { stored: 0, handled: false };
  }
  const { enhanceJobPhoto, isRasterJobPhoto } = await import("./cinematic-enhance.server");
  const { uploadPreparedWebpToStorage } = await import("./storefront-layout.server");
  const employeeId = await ensureStaff(shop.id);
  const body = form.get("Body") || "";
  const slot = parseOwnerMmsKeyword(body);
  const seed = ownerMmsCaptionSeed(body);
  const caption = await captionForProof(row, seed);
  const auth = twilioBasicAuth();
  let stored = 0;
  let lastUrl = "";
  let lastPortfolioId = "";
  const prevHero = row.hero_media_url || row.hero_image_url || "";
  const pairKey = slot === "after" || slot === "before" ? await latestUnpairedBefore(shop.id) : "";

  for (let index = 0; index < Math.min(count, 8); index += 1) {
    const mediaUrl = form.get(`MediaUrl${index}`) || "";
    const contentType = form.get(`MediaContentType${index}`) || "";
    if (!mediaUrl || !isRasterJobPhoto(contentType, mediaUrl)) continue;
    try {
      const headers: HeadersInit = {};
      if (auth) headers.Authorization = auth;
      const response = await fetch(mediaUrl, { headers, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength < 32 || bytes.byteLength > 8 * 1024 * 1024) continue;
      const enhanced = await enhanceJobPhoto(bytes);
      const uploaded = await uploadPreparedWebpToStorage(shop.slug, enhanced.webp, slot === "hero" ? "hero" : "mms");
      if (!uploaded?.url) continue;
      lastUrl = uploaded.url;
      const itemSlot: OwnerMmsSlot = slot === "hero" ? "hero" : slot;
      lastPortfolioId = await insertPortfolio({
        shopId: shop.id,
        employeeId,
        url: uploaded.url,
        caption,
        slot: itemSlot,
        pairKey: slot === "hero" ? "" : pairKey || (slot === "proof" ? "" : newId("pair")),
      });
      if (slot === "hero") {
        await setHero(shop.id, uploaded.url, prevHero);
      }
      if (slot === "proof") {
        await enqueueSocialDraft({
          shopId: shop.id,
          slug: shop.slug,
          url: uploaded.url,
          caption,
          shop: row,
          stampBuffer: enhanced.webp,
        });
      }
      stored += 1;
    } catch {
      /* skip a bad attachment */
    }
  }

  if (stored > 0 && lastUrl) {
    await saveLastMms(shop.id, {
      url: lastUrl,
      prevHeroUrl: prevHero,
      portfolioId: lastPortfolioId,
      slot,
      uploadedAt: new Date().toISOString(),
    });
    const reply =
      slot === "hero"
        ? "Set as your main Hero Banner. Reply 3 to Undo."
        : slot === "before"
          ? "Saved as a Before photo. Reply 3 to Undo."
          : slot === "after"
            ? "Saved as an After photo for your slider. Reply 3 to Undo."
            : OWNER_MMS_MENU;
    return { stored, handled: true, reply };
  }
  return { stored, handled: stored > 0 };
}
