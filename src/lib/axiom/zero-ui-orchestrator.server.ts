import { getSql } from "@/lib/db";
import { shopCity } from "./avatar";
import {
  brandedStillPrompt,
  callHrefFor,
  mapsSearchUrl,
  parseFrontendTemplate,
  type FrontendTemplate,
} from "./frontend-template";
import { masterLoopForNiche } from "../../config/AutopilotContentEngine.ts";
import { NICHES } from "./niches";
import { toE164 } from "./notify-target";
import { assertCanModifyShopById } from "./shop-server.server";
import {
  AI_IMAGE_UNITS,
  BRAND_FONTS,
  cleanHex,
  parseBrandDna,
  type BrandDna,
  type BrandFont,
} from "./shop-branding";

const IMAGE_GEN = "https://api.x.ai/v1/images/generations";

type ShopSnap = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  address: string;
  notify_phone: string | null;
  hero_video_url: string | null;
  trade_profile: string | null;
};

function xaiKey() {
  return process.env.XAI_API_KEY?.trim() ?? "";
}

function parseProfile(raw: string | null | undefined): Record<string, unknown> {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    /* keep empty */
  }
  return {};
}

async function loadOwnedShop(slug: string, shopId: string, userId: string): Promise<ShopSnap> {
  const sql = await getSql();
  const rows = await sql<ShopSnap>`
    select id, slug, name, niche, address, notify_phone, hero_video_url, trade_profile
    from shops where slug = ${slug} limit 1
  `;
  const row = rows[0];
  if (!row || row.id !== shopId) throw new Error("Shop not found");
  await assertCanModifyShopById(row.id, userId);
  return row;
}

async function writeProfile(
  shopId: string,
  profile: Record<string, unknown>,
  extra: { ring?: string; neon?: string; heroImage?: string; heroVideo?: string | null; name?: string } = {},
) {
  const sql = await getSql();
  const json = JSON.stringify(profile);
  const name = extra.name?.replace(/\s+/g, " ").trim().slice(0, 80);
  try {
    if (extra.ring && extra.neon && extra.heroImage !== undefined && extra.heroVideo !== undefined) {
      if (name) {
        await sql`
          update shops
          set trade_profile = ${json},
              ring_color = ${extra.ring},
              neon_accent = ${extra.neon},
              hero_image_url = ${extra.heroImage},
              hero_video_url = ${extra.heroVideo},
              name = ${name}
          where id = ${shopId}
        `;
      } else {
        await sql`
          update shops
          set trade_profile = ${json},
              ring_color = ${extra.ring},
              neon_accent = ${extra.neon},
              hero_image_url = ${extra.heroImage},
              hero_video_url = ${extra.heroVideo}
          where id = ${shopId}
        `;
      }
    } else if (extra.ring && extra.neon) {
      if (name) {
        await sql`
          update shops
          set trade_profile = ${json}, ring_color = ${extra.ring}, neon_accent = ${extra.neon}, name = ${name}
          where id = ${shopId}
        `;
      } else {
        await sql`
          update shops
          set trade_profile = ${json}, ring_color = ${extra.ring}, neon_accent = ${extra.neon}
          where id = ${shopId}
        `;
      }
    } else if (extra.heroImage !== undefined) {
      await sql`
        update shops set trade_profile = ${json}, hero_image_url = ${extra.heroImage} where id = ${shopId}
      `;
    } else {
      await sql`update shops set trade_profile = ${json} where id = ${shopId}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/trade_profile|ring_color|neon_accent|hero_/i.test(message)) throw err;
  }
}

function setFrontend(profile: Record<string, unknown>, next: FrontendTemplate) {
  profile.frontendTemplate = next;
  /* Alias for the demo_configs contract. Autopilot still reads shopConfig only. */
  profile.demoConfig = next;
}

function shopConfigOf(profile: Record<string, unknown>): Record<string, unknown> {
  const current =
    profile.shopConfig && typeof profile.shopConfig === "object" && !Array.isArray(profile.shopConfig)
      ? { ...(profile.shopConfig as Record<string, unknown>) }
      : {};
  profile.shopConfig = current;
  return current;
}

async function loadDna(shopId: string): Promise<BrandDna> {
  const sql = await getSql();
  try {
    const rows = await sql<{ dna: string }>`select dna from shop_branding where shop_id = ${shopId} limit 1`;
    return parseBrandDna(rows[0]?.dna ? JSON.parse(rows[0].dna) : {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_branding/i.test(message)) throw err;
    return parseBrandDna({});
  }
}

async function spendImageCredit(shopId: string) {
  const sql = await getSql();
  try {
    await sql`
      insert into shop_ai_credits (shop_id, balance, updated_at)
      values (${shopId}, 0, now())
      on conflict (shop_id) do nothing
    `;
    const rows = await sql<{ balance: number }>`
      update shop_ai_credits
      set balance = balance - ${AI_IMAGE_UNITS}, updated_at = now()
      where shop_id = ${shopId} and balance >= ${AI_IMAGE_UNITS}
      returning balance
    `;
    if (!rows[0]) throw new Error("Add AI credits before generating a branded still");
    return Number(rows[0].balance);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/shop_ai_credits/i.test(message) && /does not exist|undefined/i.test(message)) {
      throw new Error("AI credits are not on this database yet");
    }
    throw err;
  }
}

async function refundImageCredit(shopId: string) {
  const sql = await getSql();
  try {
    await sql`
      update shop_ai_credits
      set balance = balance + ${AI_IMAGE_UNITS}, updated_at = now()
      where shop_id = ${shopId}
    `;
  } catch {
    /* refund is best-effort */
  }
}

async function generateStill(prompt: string): Promise<string> {
  const key = xaiKey();
  if (!key) throw new Error("AI is not available in this environment");
  const res = await fetch(IMAGE_GEN, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt,
      n: 1,
      response_format: "url",
    }),
  });
  if (!res.ok) throw new Error("The branded still could not be generated");
  const body = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
  const url = body.data?.[0]?.url?.trim() ?? "";
  if (url.startsWith("https://")) return url;
  const b64 = body.data?.[0]?.b64_json ?? "";
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("The branded still did not return an image");
}

export async function lockTenantBrandHandler(ctx: {
  data: {
    slug: string;
    shopId: string;
    name?: string;
    logoDataUrl?: string;
    logoUrl?: string;
    primary: string;
    font: string;
    tagline?: string;
  };
  context: { userId: string };
}) {
  const shop = await loadOwnedShop(ctx.data.slug, ctx.data.shopId, ctx.context.userId);
  const brandName =
    String(ctx.data.name ?? shop.name)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || shop.name;
  const font = BRAND_FONTS.includes(ctx.data.font as BrandFont) ? (ctx.data.font as BrandFont) : "display";
  const primary = cleanHex(ctx.data.primary, "#2EE6D6");
  const logoDataUrl = String(ctx.data.logoDataUrl ?? "").startsWith("data:image/")
    ? String(ctx.data.logoDataUrl).slice(0, 240_000)
    : "";
  const logoUrl = !logoDataUrl && /^https:\/\//i.test(String(ctx.data.logoUrl ?? "").trim())
    ? String(ctx.data.logoUrl).trim().slice(0, 800)
    : logoDataUrl;
  const tagline = String(ctx.data.tagline ?? brandName).replace(/\s+/g, " ").trim().slice(0, 80) || brandName;
  const dna = parseBrandDna({
    locked: true,
    logoDataUrl: logoDataUrl || undefined,
    primary,
    secondary: "#F3F1EB",
    font,
    tagline,
  });
  if (brandName.length < 2) throw new Error("Lock a shop name first");
  const sql = await getSql();
  try {
    await sql`
      insert into shop_branding (shop_id, dna, updated_at)
      values (${shop.id}, ${JSON.stringify({ ...dna, logoDataUrl: dna.logoDataUrl || logoUrl })}, now())
      on conflict (shop_id) do update set dna = excluded.dna, updated_at = now()
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_branding/i.test(message)) throw err;
  }
  const profile = parseProfile(shop.trade_profile);
  const prior = parseFrontendTemplate(profile) ?? {
    version: 1 as const,
    builtAt: "",
    brandName,
    logoUrl: "",
    primary,
    font,
    city: shopCity(shop.address),
    address: shop.address,
    phone: shop.notify_phone ?? "",
    bookPath: `/${shop.slug}/book`,
    mapsUrl: mapsSearchUrl(shop.address),
    callHref: callHrefFor(shop.notify_phone ?? ""),
    heroAssetUrl: "",
    heroVideoUrl: shop.hero_video_url ?? "",
    animate: false,
  };
  setFrontend(profile, {
    ...prior,
    brandName,
    logoUrl: logoUrl || prior.logoUrl,
    primary,
    font,
    city: shopCity(shop.address),
    address: shop.address,
  });
  await writeProfile(shop.id, profile, { ring: primary, neon: primary, name: brandName });
  return { ok: true as const, locked: true, primary, font, name: brandName, logoUrl: logoUrl || prior.logoUrl };
}

export async function generateBrandedAssetHandler(ctx: {
  data: { slug: string; shopId: string; prompt: string };
  context: { userId: string };
}) {
  const shop = await loadOwnedShop(ctx.data.slug, ctx.data.shopId, ctx.context.userId);
  const dna = await loadDna(shop.id);
  const profile = parseProfile(shop.trade_profile);
  const template = parseFrontendTemplate(profile);
  const color = template?.primary || dna.primary;
  const brand = shop.name;
  const category = NICHES[shop.niche as keyof typeof NICHES]?.label ?? shop.niche;
  if (!template && !dna.locked && !dna.logoDataUrl) throw new Error("Lock the brand before generating");
  const prompt = brandedStillPrompt({
    category,
    brand,
    color,
    details: ctx.data.prompt,
    logoLocked: Boolean(template?.logoUrl || dna.logoDataUrl),
  });
  const credits = await spendImageCredit(shop.id);
  try {
    const url = await generateStill(prompt);
    const next = parseFrontendTemplate(profile) ?? {
      version: 1 as const,
      builtAt: "",
      brandName: brand,
      logoUrl: dna.logoDataUrl,
      primary: color,
      font: dna.font,
      city: shopCity(shop.address),
      address: shop.address,
      phone: shop.notify_phone ?? "",
      bookPath: `/${shop.slug}/book`,
      mapsUrl: mapsSearchUrl(shop.address),
      callHref: callHrefFor(shop.notify_phone ?? ""),
      heroAssetUrl: url,
      heroVideoUrl: shop.hero_video_url ?? "",
      animate: false,
    };
    setFrontend(profile, { ...next, heroAssetUrl: url });
    await writeProfile(shop.id, profile, { heroImage: url });
    return { ok: true as const, assetUrl: url, credits, prompt };
  } catch (err) {
    await refundImageCredit(shop.id);
    throw err;
  }
}

export async function orchestrateFinalWebBuildHandler(ctx: {
  data: { slug: string; shopId: string; brandedAssetUrl: string; animate: boolean };
  context: { userId: string };
}) {
  const shop = await loadOwnedShop(ctx.data.slug, ctx.data.shopId, ctx.context.userId);
  const dna = await loadDna(shop.id);
  const profile = parseProfile(shop.trade_profile);
  const prior = parseFrontendTemplate(profile);
  const asset = String(ctx.data.brandedAssetUrl ?? "").trim().slice(0, 800) || prior?.heroAssetUrl || "";
  if (!asset) throw new Error("Generate a branded still first");
  const animate = Boolean(ctx.data.animate);
  const catalogLoop = masterLoopForNiche(shop.niche);
  const heroVideo = animate ? catalogLoop : prior?.heroVideoUrl || shop.hero_video_url || catalogLoop;
  const phone = toE164(shop.notify_phone ?? "") || shop.notify_phone || prior?.phone || "";
  const template: FrontendTemplate = {
    version: 1,
    builtAt: new Date().toISOString(),
    brandName: shop.name,
    logoUrl: prior?.logoUrl || dna.logoDataUrl || "",
    primary: prior?.primary || dna.primary || "#2EE6D6",
    font: prior?.font || dna.font,
    city: shopCity(shop.address),
    address: shop.address,
    phone,
    bookPath: `/${shop.slug}/book`,
    mapsUrl: mapsSearchUrl(shop.address),
    callHref: callHrefFor(phone),
    heroAssetUrl: asset,
    heroVideoUrl: heroVideo,
    animate,
  };
  setFrontend(profile, template);
  const shopConfig = shopConfigOf(profile);
  const loops = shopConfig.selectedAutopilotLoops;
  const cursor = shopConfig.autopilotLoopCursor;
  shopConfig.overrideHeroVideoUrl = heroVideo;
  shopConfig.storefrontFilmAt = Date.now();
  if (Array.isArray(loops)) shopConfig.selectedAutopilotLoops = loops;
  if (cursor != null) shopConfig.autopilotLoopCursor = cursor;
  await writeProfile(shop.id, profile, {
    ring: template.primary,
    neon: template.primary,
    heroImage: asset,
    heroVideo,
  });
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/${shop.slug}`);
  } catch {
    /* TanStack serves the live storefront */
  }
  return {
    ok: true as const,
    storefrontPath: `/${shop.slug}`,
    template,
    autopilotLoopsPreserved: Array.isArray(loops) ? loops.length : 0,
  };
}
