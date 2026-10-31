import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { assertCanModifyShopById } from "./shop-server.server";
import { finishHeroIntro, startHeroIntro } from "./hero-animator.server";
import { sniffHeroAsset } from "./hero-brand";
import { shopHeroVideoPath } from "./hero-video";
import { requestOrigin, stripeConfigured, stripePublishableKey } from "./payments.server";
import {
  AI_CREDIT_PACK,
  AI_CREDIT_PACK_CENTS,
  AI_IMAGE_UNITS,
  AI_VIDEO_UNITS,
  brandDnaComplete,
  brandPromptLayer,
  parseBrandDna,
  type BrandDna,
} from "./shop-branding";

const IMAGE_EDIT = "https://api.x.ai/v1/images/edits";
const IMAGE_GEN = "https://api.x.ai/v1/images/generations";

function xaiKey() {
  return process.env.XAI_API_KEY?.trim() ?? "";
}

function decodeDataUrl(value: string): { bytes: Uint8Array; mime: string } | null {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value.trim());
  if (!match) return null;
  const bytes = Uint8Array.from(Buffer.from(match[2] ?? "", "base64"));
  if (bytes.byteLength < 32 || bytes.byteLength > 8 * 1024 * 1024) return null;
  return { bytes, mime: match[1] ?? "image/jpeg" };
}

async function stillBytes(value: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const data = decodeDataUrl(value);
  if (data) return data;
  if (!/^https:\/\//i.test(value) || /\s/.test(value)) return null;
  const res = await fetch(value);
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 32 || bytes.byteLength > 8 * 1024 * 1024) return null;
  const mime = res.headers.get("content-type") || "image/jpeg";
  return { bytes, mime };
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

async function loadCredits(shopId: string): Promise<number> {
  const sql = await getSql();
  try {
    await sql`
      insert into shop_ai_credits (shop_id, balance, updated_at)
      values (${shopId}, 0, now())
      on conflict (shop_id) do nothing
    `;
    const rows = await sql<{ balance: number }>`select balance from shop_ai_credits where shop_id = ${shopId} limit 1`;
    return Number(rows[0]?.balance ?? 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_ai_credits/i.test(message)) throw err;
    return 0;
  }
}

async function spendCredits(shopId: string, kind: "image" | "video", units: number, stripeRef = "") {
  const sql = await getSql();
  const rows = await sql<{ balance: number }>`
    update shop_ai_credits
    set balance = balance - ${units}, updated_at = now()
    where shop_id = ${shopId} and balance >= ${units}
    returning balance
  `;
  if (!rows[0]) throw new Error("Buy an AI credit pack to generate");
  try {
    await sql`
      insert into shop_ai_usage (id, shop_id, kind, units, stripe_ref)
      values (${newId("aiu")}, ${shopId}, ${kind}, ${units}, ${stripeRef})
    `;
  } catch {
    /* usage table is telemetry */
  }
  await reportMeter(shopId, units);
  return rows[0].balance;
}

async function refundCredits(shopId: string, units: number) {
  const sql = await getSql();
  await sql`
    insert into shop_ai_credits (shop_id, balance, updated_at)
    values (${shopId}, ${units}, now())
    on conflict (shop_id) do update set balance = shop_ai_credits.balance + excluded.balance, updated_at = now()
  `;
}

async function reportMeter(shopId: string, units: number) {
  const key = env("STRIPE_SECRET_KEY");
  const eventName = env("STRIPE_AI_METER_EVENT");
  if (!key || !eventName) return;
  const sql = await getSql();
  const rows = await sql<{ stripe_customer_id: string }>`
    select stripe_customer_id from shop_ai_credits where shop_id = ${shopId} limit 1
  `;
  const customer = rows[0]?.stripe_customer_id?.trim() ?? "";
  if (!customer.startsWith("cus_")) return;
  const body = new URLSearchParams({
    event_name: eventName,
    "payload[stripe_customer_id]": customer,
    "payload[value]": String(units),
  });
  await fetch("https://api.stripe.com/v1/billing/meter_events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  }).catch(() => undefined);
}

async function enhanceWithXai(prompt: string, scene: { bytes: Uint8Array; mime: string }, logo?: { bytes: Uint8Array; mime: string } | null) {
  const key = xaiKey();
  if (!key) throw new Error("AI is not available in this environment");
  const form = new FormData();
  form.set("model", "grok-imagine-image");
  form.set("prompt", prompt);
  form.append("image", new Blob([scene.bytes], { type: scene.mime }), "scene.jpg");
  if (logo) form.append("image", new Blob([logo.bytes], { type: logo.mime }), "logo.png");
  let res = await fetch(IMAGE_EDIT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    res = await fetch(IMAGE_GEN, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "grok-imagine-image", prompt, n: 1, response_format: "url" }),
    });
  }
  if (!res.ok) throw new Error("The branded still could not be generated");
  const body = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
  const url = body.data?.[0]?.url?.trim() ?? "";
  if (url.startsWith("https://")) return url;
  const b64 = body.data?.[0]?.b64_json ?? "";
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("The branded still did not return an image");
}

export async function readMotionStudioHandler(ctx: { data: { slug: string; shopId: string }; context: { userId: string } }) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const dna = await loadDna(row.id);
  const credits = await loadCredits(row.id);
  return {
    dna,
    complete: brandDnaComplete(dna),
    credits,
    available: Boolean(xaiKey()),
    billing: stripeConfigured(),
    imageUnits: AI_IMAGE_UNITS,
    videoUnits: AI_VIDEO_UNITS,
    packSize: AI_CREDIT_PACK,
    packCents: AI_CREDIT_PACK_CENTS,
  };
}

export async function saveBrandDnaHandler(ctx: {
  data: { slug: string; shopId: string; dna: BrandDna };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const dna = parseBrandDna({ ...ctx.data.dna, locked: true });
  if (!brandDnaComplete(dna)) throw new Error("Lock logo, colors, font, and a tagline first");
  const sql = await getSql();
  await sql`
    insert into shop_branding (shop_id, dna, updated_at)
    values (${row.id}, ${JSON.stringify(dna)}, now())
    on conflict (shop_id) do update set dna = excluded.dna, updated_at = now()
  `;
  return { dna, complete: true };
}

export async function enhanceHeroStillHandler(ctx: {
  data: { slug: string; shopId: string; imageDataUrl: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const dna = await loadDna(row.id);
  if (!brandDnaComplete(dna)) throw new Error("Lock Brand DNA before generating");
  const scene = decodeDataUrl(ctx.data.imageDataUrl);
  if (!scene) throw new Error("Drop a JPEG, PNG, or WebP under 8 MB");
  const kind = sniffHeroAsset(scene.bytes);
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") throw new Error("Drop a JPEG, PNG, or WebP");
  const logo = dna.logoDataUrl ? decodeDataUrl(dna.logoDataUrl) : null;
  const balance = await spendCredits(row.id, "image", AI_IMAGE_UNITS);
  try {
    const stillUrl = await enhanceWithXai(brandPromptLayer(dna, row.name), scene, logo);
    const sql = await getSql();
    await sql`update shops set hero_image_url = ${stillUrl} where id = ${row.id}`;
    return { stillUrl, credits: balance };
  } catch (err) {
    await refundCredits(row.id, AI_IMAGE_UNITS);
    throw err;
  }
}

export async function startCinematicHeroHandler(ctx: {
  data: { slug: string; shopId: string; imageDataUrl: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const dna = await loadDna(row.id);
  if (!brandDnaComplete(dna)) throw new Error("Lock Brand DNA before generating");
  const scene = await stillBytes(ctx.data.imageDataUrl);
  if (!scene) throw new Error("Brand a still first");
  await spendCredits(row.id, "video", AI_VIDEO_UNITS);
  try {
    const started = await startHeroIntro(ctx.context.userId, row.id, "obsidian_carbon", scene.bytes, row.niche);
    return { requestId: started.requestId, credits: await loadCredits(row.id) };
  } catch (err) {
    await refundCredits(row.id, AI_VIDEO_UNITS);
    throw err;
  }
}

export async function finishCinematicHeroHandler(ctx: {
  data: { slug: string; shopId: string; requestId: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const result = await finishHeroIntro(ctx.context.userId, row.id, ctx.data.requestId, {
    tagline: (await loadDna(row.id)).tagline,
    preset: "obsidian_carbon",
  });
  if (result.pending) return { pending: true as const, requestId: result.requestId };
  return {
    pending: false as const,
    heroVideoUrl: result.heroVideoUrl || shopHeroVideoPath(row.id, Date.now()),
    credits: await loadCredits(row.id),
  };
}

function isArmed(value: unknown) {
  return value === true || value === 1 || value === "t" || value === "true";
}

/** Spend credits on a branded still (and a loop when funds remain) for an armed shop. */
export async function generateArmedHeroForShop(shopId: string, userId: string): Promise<{ ok: boolean; detail: string }> {
  const sql = await getSql();
  let shop: {
    id: string;
    slug: string;
    name: string;
    niche: string;
    hero_image_url: string;
    owner_user_id: string | null;
    ai_content_autopilot?: unknown;
    autopilot_active?: unknown;
  } | undefined;
  try {
    const rows = await sql<{
      id: string;
      slug: string;
      name: string;
      niche: string;
      hero_image_url: string;
      owner_user_id: string | null;
      ai_content_autopilot?: unknown;
      autopilot_active?: unknown;
    }>`
      select id, slug, name, niche, hero_image_url, owner_user_id, ai_content_autopilot, autopilot_active
      from shops where id = ${shopId} limit 1
    `;
    shop = rows[0];
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/ai_content_autopilot|autopilot_active/i.test(message)) throw err;
    const rows = await sql<{
      id: string;
      slug: string;
      name: string;
      niche: string;
      hero_image_url: string;
      owner_user_id: string | null;
    }>`select id, slug, name, niche, hero_image_url, owner_user_id from shops where id = ${shopId} limit 1`;
    shop = rows[0] ? { ...rows[0], ai_content_autopilot: false, autopilot_active: false } : undefined;
  }
  if (!shop) return { ok: false, detail: "Shop not found" };
  if (!isArmed(shop.autopilot_active) && !isArmed(shop.ai_content_autopilot)) {
    return { ok: false, detail: "Autopilot is off" };
  }
  const dna = await loadDna(shop.id);
  if (!brandDnaComplete(dna)) return { ok: false, detail: "Lock Brand DNA before Autopilot can generate." };
  const scene = await stillBytes(shop.hero_image_url);
  if (!scene) return { ok: false, detail: "Drop a still in Hero Studio so Autopilot has a scene to brand." };
  const credits = await loadCredits(shop.id);
  if (credits < AI_IMAGE_UNITS) return { ok: false, detail: "Buy AI credits to generate." };
  const actor = userId || shop.owner_user_id || "";
  if (!actor) return { ok: false, detail: "No owner on this shop." };
  const logo = dna.logoDataUrl ? decodeDataUrl(dna.logoDataUrl) : null;
  const balance = await spendCredits(shop.id, "image", AI_IMAGE_UNITS);
  try {
    const stillUrl = await enhanceWithXai(brandPromptLayer(dna, shop.name), scene, logo);
    await sql`update shops set hero_image_url = ${stillUrl} where id = ${shop.id}`;
    if (balance >= AI_VIDEO_UNITS) {
      await spendCredits(shop.id, "video", AI_VIDEO_UNITS);
      try {
        await startHeroIntro(actor, shop.id, "obsidian_carbon", scene.bytes, shop.niche);
      } catch {
        await refundCredits(shop.id, AI_VIDEO_UNITS);
      }
    }
    return { ok: true, detail: "Autopilot branded a new still from locked DNA." };
  } catch (err) {
    await refundCredits(shop.id, AI_IMAGE_UNITS);
    return { ok: false, detail: err instanceof Error ? err.message : "Generation failed." };
  }
}

export async function tickArmedAiHeroes(): Promise<number> {
  const sql = await getSql();
  let rows: { id: string; owner_user_id: string | null }[] = [];
  try {
    rows = await sql<{ id: string; owner_user_id: string | null }>`
      select id, owner_user_id from shops
      where coalesce(autopilot_active, false) = true
         or coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 2
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/autopilot_active|ai_content_autopilot/i.test(message)) throw err;
    try {
      rows = await sql<{ id: string; owner_user_id: string | null }>`
        select id, owner_user_id from shops
        where coalesce(ai_content_autopilot, false) = true
        order by slug asc
        limit 2
      `;
    } catch (inner) {
      const innerMessage = inner instanceof Error ? inner.message : "";
      if (!/ai_content_autopilot/i.test(innerMessage)) throw inner;
      return 0;
    }
  }
  let ran = 0;
  for (const row of rows) {
    const result = await generateArmedHeroForShop(row.id, row.owner_user_id || "");
    if (result.ok) ran += 1;
  }
  return ran;
}

export async function startAiCreditPackHandler(ctx: {
  data: { slug: string; shopId: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  if (!stripeConfigured()) throw new Error("Card payments are not configured");
  const origin = requestOrigin();
  const key = env("STRIPE_SECRET_KEY");
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/${row.slug}/admin/hero-studio?credits=1`,
    cancel_url: `${origin}/${row.slug}/admin/hero-studio`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Axiom AI credits",
    "line_items[0][price_data][unit_amount]": String(AI_CREDIT_PACK_CENTS),
    "line_items[0][quantity]": "1",
    "metadata[kind]": "ai_credits",
    "metadata[shop_id]": row.id,
    "metadata[units]": String(AI_CREDIT_PACK),
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) throw new Error(json.error?.message || "Could not start the credit pack");
  return { url: json.url, publishableKey: stripePublishableKey() };
}

export async function settleAiCreditSession(sessionId: string) {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Card payments are not configured");
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const session = (await res.json()) as {
    id?: string;
    payment_status?: string;
    customer?: string | { id?: string } | null;
    metadata?: Record<string, string> | null;
  };
  if (!res.ok || session.metadata?.kind !== "ai_credits") throw new Error("This payment is not an AI credit pack");
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    throw new Error("Payment is not complete");
  }
  const shopId = session.metadata.shop_id ?? "";
  const units = Math.max(1, Number(session.metadata.units ?? AI_CREDIT_PACK) || AI_CREDIT_PACK);
  const customer = typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";
  const sql = await getSql();
  const claimed = await sql<{ stripe_ref: string }>`
    select stripe_ref from shop_ai_usage where stripe_ref = ${session.id ?? ""} limit 1
  `.catch(() => [] as { stripe_ref: string }[]);
  if (claimed[0]) return { shopId, already: true };
  await sql`
    insert into shop_ai_credits (shop_id, balance, stripe_customer_id, updated_at)
    values (${shopId}, ${units}, ${customer}, now())
    on conflict (shop_id) do update
      set balance = shop_ai_credits.balance + excluded.balance,
          stripe_customer_id = case when excluded.stripe_customer_id <> '' then excluded.stripe_customer_id else shop_ai_credits.stripe_customer_id end,
          updated_at = now()
  `;
  await sql`
    insert into shop_ai_usage (id, shop_id, kind, units, stripe_ref)
    values (${newId("aiu")}, ${shopId}, 'pack', ${units}, ${session.id ?? ""})
  `;
  return { shopId, already: false };
}
