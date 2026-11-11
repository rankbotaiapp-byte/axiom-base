import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { assertCanModifyShopById } from "./shop-server.server";
import { finishHeroIntro, startHeroIntro } from "./hero-animator.server";
import { sniffHeroAsset } from "./hero-brand";
import { shopHeroVideoPath } from "./hero-video";
import { requestOrigin, stripeConfigured, stripePublishableKey } from "./payments.server";
import {
  RENDER_AUTO_RELOAD_THRESHOLD,
  RENDER_CREDIT_PACK,
  RENDER_CREDIT_PACK_CENTS,
  assertRenderProfit,
  canPurchasePack,
  clampMonthlySpendLimitCents,
  currentSpendMonth,
  needsAutoReload,
  renderMarginCents,
  type RenderKind,
} from "./render-credits";
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

type CreditWallet = {
  balance: number;
  monthlySpendLimitCents: number;
  monthSpendCents: number;
  spendMonth: string;
  autoReload: boolean;
  autoReloadThreshold: number;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  hasCard: boolean;
};

function emptyWallet(): CreditWallet {
  return {
    balance: 0,
    monthlySpendLimitCents: RENDER_CREDIT_PACK_CENTS,
    monthSpendCents: 0,
    spendMonth: currentSpendMonth(),
    autoReload: false,
    autoReloadThreshold: RENDER_AUTO_RELOAD_THRESHOLD,
    stripeCustomerId: "",
    stripePaymentMethodId: "",
    hasCard: false,
  };
}

async function loadWallet(shopId: string): Promise<CreditWallet> {
  const sql = await getSql();
  try {
    await sql`
      insert into shop_ai_credits (shop_id, balance, updated_at)
      values (${shopId}, 0, now())
      on conflict (shop_id) do nothing
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_ai_credits/i.test(message)) throw err;
    return emptyWallet();
  }
  try {
    const month = currentSpendMonth();
    const rows = await sql<{
      balance: number;
      monthly_spend_limit_cents: number;
      month_spend_cents: number;
      spend_month: string;
      auto_reload: boolean;
      auto_reload_threshold: number;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
    }>`
      select balance, monthly_spend_limit_cents, month_spend_cents, spend_month, auto_reload,
             auto_reload_threshold, stripe_customer_id, stripe_payment_method_id
      from shop_ai_credits where shop_id = ${shopId} limit 1
    `;
    const row = rows[0];
    if (!row) return emptyWallet();
    let monthSpend = Number(row.month_spend_cents ?? 0);
    if ((row.spend_month || "") !== month) {
      monthSpend = 0;
      await sql`
        update shop_ai_credits
        set month_spend_cents = 0, spend_month = ${month}, updated_at = now()
        where shop_id = ${shopId}
      `.catch(() => undefined);
    }
    const pm = String(row.stripe_payment_method_id ?? "").trim();
    return {
      balance: Number(row.balance ?? 0),
      monthlySpendLimitCents: clampMonthlySpendLimitCents(row.monthly_spend_limit_cents),
      monthSpendCents: monthSpend,
      spendMonth: month,
      autoReload: Boolean(row.auto_reload),
      autoReloadThreshold: Number(row.auto_reload_threshold ?? RENDER_AUTO_RELOAD_THRESHOLD) || RENDER_AUTO_RELOAD_THRESHOLD,
      stripeCustomerId: String(row.stripe_customer_id ?? "").trim(),
      stripePaymentMethodId: pm,
      hasCard: pm.startsWith("pm_"),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/monthly_spend_limit|auto_reload|stripe_payment_method/i.test(message)) throw err;
    const rows = await sql<{ balance: number; stripe_customer_id?: string }>`
      select balance, stripe_customer_id from shop_ai_credits where shop_id = ${shopId} limit 1
    `;
    return { ...emptyWallet(), balance: Number(rows[0]?.balance ?? 0), stripeCustomerId: String(rows[0]?.stripe_customer_id ?? "") };
  }
}

async function loadCredits(shopId: string): Promise<number> {
  return (await loadWallet(shopId)).balance;
}

async function recordMonthSpend(shopId: string, cents: number) {
  const sql = await getSql();
  const month = currentSpendMonth();
  await sql`
    update shop_ai_credits
    set month_spend_cents = case when spend_month = ${month} then month_spend_cents else 0 end + ${cents},
        spend_month = ${month},
        updated_at = now()
    where shop_id = ${shopId}
  `.catch(() => undefined);
}

async function spendCredits(shopId: string, kind: RenderKind, units: number, stripeRef = "") {
  assertRenderProfit(kind, units);
  const sql = await getSql();
  let wallet = await loadWallet(shopId);
  if (wallet.balance < units && needsAutoReload(wallet.balance, wallet.autoReload, wallet.autoReloadThreshold)) {
    await chargeSavedRenderPack(shopId).catch(() => undefined);
    wallet = await loadWallet(shopId);
  }
  const rows = await sql<{ balance: number }>`
    update shop_ai_credits
    set balance = balance - ${units}, updated_at = now()
    where shop_id = ${shopId} and balance >= ${units}
    returning balance
  `;
  if (!rows[0]) throw new Error("Buy a $15 render pack (20 hero animations) to generate");
  try {
    await sql`
      insert into shop_ai_usage (id, shop_id, kind, units, stripe_ref)
      values (${newId("aiu")}, ${shopId}, ${kind}, ${units}, ${stripeRef})
    `;
  } catch {
    /* usage table is telemetry */
  }
  await reportMeter(shopId, units);
  const next = Number(rows[0].balance);
  if (needsAutoReload(next, wallet.autoReload, wallet.autoReloadThreshold)) {
    void chargeSavedRenderPack(shopId).catch(() => undefined);
  }
  return next;
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
  form.append("image", new Blob([new Uint8Array(scene.bytes)], { type: scene.mime }), "scene.jpg");
  if (logo) form.append("image", new Blob([new Uint8Array(logo.bytes)], { type: logo.mime }), "logo.png");
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
  const wallet = await loadWallet(row.id);
  return {
    dna,
    complete: brandDnaComplete(dna),
    credits: wallet.balance,
    available: Boolean(xaiKey()),
    billing: stripeConfigured(),
    imageUnits: AI_IMAGE_UNITS,
    videoUnits: AI_VIDEO_UNITS,
    packSize: AI_CREDIT_PACK,
    packCents: AI_CREDIT_PACK_CENTS,
    monthlySpendLimitCents: wallet.monthlySpendLimitCents,
    monthSpendCents: wallet.monthSpendCents,
    autoReload: wallet.autoReload,
    autoReloadThreshold: wallet.autoReloadThreshold,
    hasCard: wallet.hasCard,
    marginCents: renderMarginCents("video"),
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
  if (credits < AI_IMAGE_UNITS) return { ok: false, detail: "Buy a $15 render pack to generate." };
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
        const { renderAutopilotHeroLoop } = await import("../blender/render-hero.server");
        const loop = await renderAutopilotHeroLoop({
          shopId: shop.id,
          director: {
            businessName: shop.name,
            niche: shop.niche,
            logoGeometry: dna.logoDataUrl,
            seed: shop.slug.length,
          },
          stillBytes: scene.bytes,
          logoBytes: logo?.bytes ?? null,
        });
        if (!loop.ok) {
          await startHeroIntro(actor, shop.id, "obsidian_carbon", scene.bytes, shop.niche);
        }
      } catch {
        await refundCredits(shop.id, AI_VIDEO_UNITS);
      }
    }
    return { ok: true, detail: "Autopilot branded a Cyber-Obsidian still and queued a hero loop." };
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

async function stripeForm(path: string, body: URLSearchParams, method: "POST" | "GET" = "POST") {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Card payments are not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
  });
  const json = (await res.json()) as Record<string, unknown> & { error?: { message?: string }; url?: string; id?: string };
  if (!res.ok) throw new Error(json.error?.message || "Stripe request failed");
  return json;
}

export async function startAiCreditPackHandler(ctx: {
  data: { slug: string; shopId: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  if (!stripeConfigured()) throw new Error("Card payments are not configured");
  const wallet = await loadWallet(row.id);
  if (!canPurchasePack(wallet.monthSpendCents, wallet.monthlySpendLimitCents)) {
    throw new Error("Monthly render spend limit reached. Raise the slider to buy another pack.");
  }
  const origin = requestOrigin();
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/${row.slug}/admin/hero-studio?credits=1`,
    cancel_url: `${origin}/${row.slug}/admin/hero-studio`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Axiom render credits · 20 hero animations",
    "line_items[0][price_data][unit_amount]": String(AI_CREDIT_PACK_CENTS),
    "line_items[0][quantity]": "1",
    "payment_intent_data[setup_future_usage]": "off_session",
    "metadata[kind]": "ai_credits",
    "metadata[shop_id]": row.id,
    "metadata[units]": String(AI_CREDIT_PACK),
  });
  if (wallet.stripeCustomerId.startsWith("cus_")) params.set("customer", wallet.stripeCustomerId);
  const json = await stripeForm("checkout/sessions", params);
  if (!json.url) throw new Error("Could not start the credit pack");
  return { url: String(json.url), publishableKey: stripePublishableKey() };
}

export async function saveRenderWalletHandler(ctx: {
  data: { slug: string; shopId: string; monthlySpendLimitCents: number; autoReload: boolean };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  const limit = clampMonthlySpendLimitCents(ctx.data.monthlySpendLimitCents);
  const autoReload = Boolean(ctx.data.autoReload);
  const sql = await getSql();
  await sql`
    insert into shop_ai_credits (shop_id, balance, monthly_spend_limit_cents, auto_reload, updated_at)
    values (${row.id}, 0, ${limit}, ${autoReload}, now())
    on conflict (shop_id) do update
      set monthly_spend_limit_cents = ${limit},
          auto_reload = ${autoReload},
          updated_at = now()
  `;
  const wallet = await loadWallet(row.id);
  if (autoReload && !wallet.hasCard) {
    const setup = await startRenderCardSetupHandler(ctx);
    return { ...wallet, setupUrl: setup.url, publishableKey: setup.publishableKey };
  }
  return { ...wallet, setupUrl: "", publishableKey: stripePublishableKey() };
}

export async function startRenderCardSetupHandler(ctx: {
  data: { slug: string; shopId: string };
  context: { userId: string };
}) {
  const row = await assertCanModifyShopById(ctx.data.shopId, ctx.context.userId);
  if (row.slug !== ctx.data.slug) throw new Error("Shop not found");
  if (!stripeConfigured()) throw new Error("Card payments are not configured");
  const wallet = await loadWallet(row.id);
  const origin = requestOrigin();
  const params = new URLSearchParams({
    mode: "setup",
    success_url: `${origin}/${row.slug}/admin/hero-studio?card=1`,
    cancel_url: `${origin}/${row.slug}/admin/hero-studio`,
    "metadata[kind]": "ai_credits_setup",
    "metadata[shop_id]": row.id,
  });
  if (wallet.stripeCustomerId.startsWith("cus_")) params.set("customer", wallet.stripeCustomerId);
  else params.set("customer_creation", "always");
  const json = await stripeForm("checkout/sessions", params);
  if (!json.url) throw new Error("Could not open card setup");
  return { url: String(json.url), publishableKey: stripePublishableKey() };
}

async function creditPack(shopId: string, units: number, customer: string, stripeRef: string, spendCents: number) {
  const sql = await getSql();
  const claimed = await sql<{ stripe_ref: string }>`
    select stripe_ref from shop_ai_usage where stripe_ref = ${stripeRef} limit 1
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
    values (${newId("aiu")}, ${shopId}, 'pack', ${units}, ${stripeRef})
  `;
  if (spendCents > 0) await recordMonthSpend(shopId, spendCents);
  return { shopId, already: false };
}

export async function chargeSavedRenderPack(shopId: string) {
  if (!stripeConfigured()) throw new Error("Card payments are not configured");
  const wallet = await loadWallet(shopId);
  if (!wallet.hasCard || !wallet.stripeCustomerId.startsWith("cus_")) {
    throw new Error("Save a card to auto-reload credits");
  }
  if (!canPurchasePack(wallet.monthSpendCents, wallet.monthlySpendLimitCents)) {
    throw new Error("Monthly render spend limit reached");
  }
  const params = new URLSearchParams({
    amount: String(RENDER_CREDIT_PACK_CENTS),
    currency: "usd",
    customer: wallet.stripeCustomerId,
    payment_method: wallet.stripePaymentMethodId,
    off_session: "true",
    confirm: "true",
    "metadata[kind]": "ai_credits_reload",
    "metadata[shop_id]": shopId,
    "metadata[units]": String(RENDER_CREDIT_PACK),
  });
  const json = await stripeForm("payment_intents", params);
  const status = String(json.status ?? "");
  if (status !== "succeeded") throw new Error("Auto-reload charge did not settle");
  return creditPack(shopId, RENDER_CREDIT_PACK, wallet.stripeCustomerId, String(json.id ?? ""), RENDER_CREDIT_PACK_CENTS);
}

export async function settleAiCreditSession(sessionId: string) {
  const session = await stripeForm(
    `checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=setup_intent&expand[]=payment_intent.payment_method`,
    new URLSearchParams(),
    "GET",
  );
  const meta = (session.metadata ?? {}) as Record<string, string>;
  const kind = String(meta.kind ?? "");
  if (kind === "ai_credits_setup" || session.mode === "setup") {
    return settleAiCreditSetupFromSession(session);
  }
  if (kind !== "ai_credits") throw new Error("This payment is not an AI credit pack");
  const status = String(session.payment_status ?? "");
  if (status !== "paid" && status !== "no_payment_required") throw new Error("Payment is not complete");
  const shopId = meta.shop_id ?? "";
  const units = Math.max(1, Number(meta.units ?? AI_CREDIT_PACK) || AI_CREDIT_PACK);
  const customer = typeof session.customer === "string" ? session.customer : String((session.customer as { id?: string } | null)?.id ?? "");
  const paymentIntent = session.payment_intent as { payment_method?: string | { id?: string } } | string | null;
  const pm =
    typeof paymentIntent === "string"
      ? ""
      : typeof paymentIntent?.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent?.payment_method?.id ?? "";
  if (pm.startsWith("pm_")) {
    const sql = await getSql();
    await sql`
      update shop_ai_credits
      set stripe_payment_method_id = ${pm},
          stripe_customer_id = case when ${customer} <> '' then ${customer} else stripe_customer_id end,
          updated_at = now()
      where shop_id = ${shopId}
    `.catch(() => undefined);
  }
  return creditPack(shopId, units, customer, String(session.id ?? ""), AI_CREDIT_PACK_CENTS);
}

async function settleAiCreditSetupFromSession(session: Record<string, unknown>) {
  const meta = (session.metadata ?? {}) as Record<string, string>;
  const shopId = meta.shop_id ?? "";
  const customer = typeof session.customer === "string" ? session.customer : String((session.customer as { id?: string } | null)?.id ?? "");
  const setup = session.setup_intent as { payment_method?: string | { id?: string } } | string | null;
  const pm =
    typeof setup === "string"
      ? ""
      : typeof setup?.payment_method === "string"
        ? setup.payment_method
        : setup?.payment_method?.id ?? "";
  if (!shopId || !pm.startsWith("pm_")) throw new Error("Card setup did not return a payment method");
  const sql = await getSql();
  await sql`
    insert into shop_ai_credits (shop_id, balance, stripe_customer_id, stripe_payment_method_id, auto_reload, updated_at)
    values (${shopId}, 0, ${customer}, ${pm}, true, now())
    on conflict (shop_id) do update
      set stripe_customer_id = case when excluded.stripe_customer_id <> '' then excluded.stripe_customer_id else shop_ai_credits.stripe_customer_id end,
          stripe_payment_method_id = excluded.stripe_payment_method_id,
          auto_reload = true,
          updated_at = now()
  `;
  return { shopId, already: false, setup: true as const };
}

export async function settleAiCreditReload(paymentIntentId: string) {
  const pi = await stripeForm(`payment_intents/${encodeURIComponent(paymentIntentId)}`, new URLSearchParams(), "GET");
  const meta = (pi.metadata ?? {}) as Record<string, string>;
  if (meta.kind !== "ai_credits_reload") throw new Error("This charge is not a credit reload");
  if (String(pi.status ?? "") !== "succeeded") throw new Error("Reload is not complete");
  const shopId = meta.shop_id ?? "";
  const units = Math.max(1, Number(meta.units ?? RENDER_CREDIT_PACK) || RENDER_CREDIT_PACK);
  const customer = String(pi.customer ?? "");
  return creditPack(shopId, units, customer, String(pi.id ?? ""), RENDER_CREDIT_PACK_CENTS);
}
