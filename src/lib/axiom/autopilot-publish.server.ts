import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { shopCity } from "./avatar";
import {
  assetPublishKey,
  extractProofAtoms,
  pickUnusedAssetUrl,
} from "./autopilot-caption.ts";
import { generateProofCaption } from "./autopilot-caption.server.ts";
import {
  applyWebPresencePreview,
  buildTenantPublishBundle,
  createLiveSocialAdapter,
  createSimulationSocialAdapter,
  livePublishCounted,
  mergeAutopilotWebPreview,
  isPublishStillUrl,
  runPublishPlan,
  type PublishLedgerEntry,
  type SocialChannelAdapter,
  type SocialPublishIntent,
  type SocialPublishReceipt,
  type TenantPublishBundle,
} from "./autopilot-publish";
import { parseOutreachMode } from "./outreach-queue";

type PublishShop = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  address: string;
  hero_image_url: string;
  hero_video_url: string | null;
  trade_profile: string | null;
};

function parseProfile(raw: string | null): Record<string, unknown> {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return {};
}

async function loadUsedAssetKeys(shopId: string): Promise<Set<string>> {
  const keys = new Set<string>();
  try {
    const sql = await getSql();
    const rows = await sql<{ asset_key: string; still_url?: string }>`
      select asset_key, still_url from shop_publish_assets where shop_id = ${shopId}
    `;
    for (const row of rows) {
      if (row.asset_key) keys.add(row.asset_key);
      else if (row.still_url) keys.add(assetPublishKey(shopId, row.still_url));
    }
    const posts = await sql<{ asset_id: string | null }>`
      select asset_id from shop_social_posts
      where shop_id = ${shopId} and status in ('published', 'queued', 'approved', 'simulated')
    `;
    for (const row of posts) {
      if (row.asset_id) keys.add(assetPublishKey(shopId, row.asset_id));
    }
  } catch {
    /* tables may be missing on older snapshots */
  }
  return keys;
}

async function loadLedger(shopId: string): Promise<PublishLedgerEntry[]> {
  try {
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from shop_events
      where shop_id = ${shopId} and type = ${"autopilot_publish"}
      order by created_at desc
      limit 80
    `;
    const ledger: PublishLedgerEntry[] = [];
    for (const row of rows) {
      const payload = row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {};
      const entries = Array.isArray(payload.ledger) ? payload.ledger : [];
      for (const item of entries) {
        if (!item || typeof item !== "object") continue;
        const entry = item as PublishLedgerEntry;
        if (entry.shopId === shopId && entry.key && entry.target) ledger.push(entry);
      }
    }
    const assets = await sql<{ asset_key: string; last_posted_at: string }>`
      select asset_key, last_posted_at from shop_publish_assets where shop_id = ${shopId}
    `;
    for (const row of assets) {
      ledger.push({
        key: `${row.asset_key}|web_storefront`,
        shopId,
        target: "web_storefront",
        day: "1970-01-01",
        status: "published",
      });
    }
    return ledger;
  } catch {
    return [];
  }
}

async function loadCandidateStills(shop: PublishShop): Promise<string[]> {
  const urls: string[] = [];
  if (isPublishStillUrl(shop.hero_image_url)) urls.push(shop.hero_image_url.trim());
  try {
    const sql = await getSql();
    const rows = await sql<{ image_url: string }>`
      select image_url from portfolio_items
      where shop_id = ${shop.id}
      order by created_at desc
      limit 24
    `;
    for (const row of rows) {
      if (isPublishStillUrl(row.image_url)) urls.push(row.image_url.trim());
    }
  } catch {
    /* portfolio optional */
  }
  return [...new Set(urls)];
}

async function loadRecentCaptions(shopId: string): Promise<string[]> {
  try {
    const sql = await getSql();
    const rows = await sql<{ caption: string }>`
      select caption from shop_social_posts
      where shop_id = ${shopId}
      order by created_at desc
      limit 20
    `;
    return rows.map((row) => row.caption).filter(Boolean);
  } catch {
    return [];
  }
}

async function rememberPublishedAsset(shopId: string, stillUrl: string): Promise<void> {
  const key = assetPublishKey(shopId, stillUrl);
  if (!stillUrl || !key.includes("|")) return;
  try {
    const sql = await getSql();
    await sql`
      insert into shop_publish_assets (shop_id, asset_key, still_url, first_posted_at, last_posted_at)
      values (${shopId}, ${key}, ${stillUrl}, now(), now())
      on conflict (shop_id, asset_key) do update set last_posted_at = now()
    `;
  } catch {
    /* unique table may be missing until migrate */
  }
}

async function persistNeedsCopy(shop: PublishShop, stillUrl: string, caption: string): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
      values (
        ${newId("soc")},
        ${shop.id},
        ${stillUrl || null},
        ${caption || "queued_needs_copy"},
        ${JSON.stringify(["facebook", "instagram", "gbp"])},
        ${"queued_needs_copy"},
        now()
      )
    `;
  } catch {
    /* status check may not include queued_needs_copy on older DBs */
  }
}

async function persistPublish(shop: PublishShop, bundle: TenantPublishBundle, receipts: SocialPublishReceipt[], ledger: PublishLedgerEntry[]) {
  const sql = await getSql();
  const profile = parseProfile(shop.trade_profile);
  const web = applyWebPresencePreview({
    branding: { shopName: shop.name },
    bundle,
  });
  Object.assign(profile, mergeAutopilotWebPreview(profile, web.preview));
  try {
    await sql`update shops set trade_profile = ${JSON.stringify(profile)} where id = ${shop.id}`;
  } catch {
    /* trade_profile may be missing on older snapshots */
  }
  try {
    await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (
        ${newId("evt")},
        ${shop.id},
        ${"autopilot_publish"},
        ${JSON.stringify({ bundle, receipts, ledger, preview: web.preview })}
      )
    `;
  } catch {
    /* events table is optional */
  }
  const posted = receipts.some((row) => row.status === "published" || row.status === "queued" || row.status === "simulated");
  if (posted && bundle.asset.stillUrl) {
    await rememberPublishedAsset(shop.id, bundle.asset.stillUrl);
  }
}

export async function publishApprovedAutopilotBundle(shop: PublishShop): Promise<{
  applied: boolean;
  receipts: SocialPublishReceipt[];
  detail: string;
}> {
  const city = shopCity(shop.address);
  const profile = parseProfile(shop.trade_profile);
  const used = await loadUsedAssetKeys(shop.id);
  const candidates = await loadCandidateStills(shop);
  const stillUrl = pickUnusedAssetUrl(candidates, used, shop.id) || (isPublishStillUrl(shop.hero_image_url) ? shop.hero_image_url.trim() : "");
  const recent = await loadRecentCaptions(shop.id);
  let extras: string[] = [];
  try {
    const sql = await getSql();
    const plates = await sql<{ caption: string }>`
      select caption from portfolio_items where shop_id = ${shop.id} and caption is not null limit 12
    `;
    extras = plates.map((row) => row.caption);
  } catch {
    extras = [];
  }
  const atoms = extractProofAtoms(profile, extras);
  const proofAtom = atoms[0] ?? "";
  const { tradeCopyForNiche } = await import("../../config/AutopilotContentEngine.ts");
  const { tradeLabel } = tradeCopyForNiche(shop.niche);
  const bookUrl = `/${shop.slug}/book`;
  const generated = await generateProofCaption(
    { shopName: shop.name, city, tradeLabel, proofAtom, bookUrl },
    recent,
  );
  const bundle = buildTenantPublishBundle({
    shopId: shop.id,
    slug: shop.slug,
    shopName: shop.name,
    niche: shop.niche,
    city,
    stillUrl,
    motionUrl: shop.hero_video_url,
    proofAtom,
    recentCaptions: recent,
  });
  if (!generated.ok || bundle.rejectReason === "queued_needs_copy") {
    await persistNeedsCopy(shop, stillUrl, generated.ok ? generated.caption : "");
    return {
      applied: false,
      receipts: [],
      detail: "queued_needs_copy",
    };
  }
  bundle.copy.caption = generated.caption;
  const ledger = await loadLedger(shop.id);
  const live = parseOutreachMode(env("OUTREACH_MODE")) === "live";
  let adapter: SocialChannelAdapter = createSimulationSocialAdapter();
  if (live) {
    const { loadShopSocialAccounts, publishSocialPostForShop, persistSocialDelivery } = await import("./social-publish.server");
    const accounts = await loadShopSocialAccounts(shop.id);
    const active = new Set(
      accounts.filter((row) => row.status === "active").map((row) => (row.platform === "gbp" ? "google_business" : row.platform)),
    );
    adapter = createLiveSocialAdapter({
      activeTargets: active,
      post: async (intent: SocialPublishIntent) => {
        const channel =
          intent.target === "google_business" ? "gbp" : intent.target === "web_storefront" ? "" : intent.target;
        if (!channel) {
          return {
            target: intent.target,
            status: "queued",
            idempotencyKey: intent.bundle.idempotencyKey,
            detail: "Web presence is applied in-app.",
            recordedAt: new Date().toISOString(),
          };
        }
        const postId = newId("soc");
        const sql = await getSql();
        await sql`
          insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
          values (
            ${postId},
            ${shop.id},
            ${intent.bundle.asset.stillUrl || null},
            ${intent.bundle.copy.caption},
            ${JSON.stringify([channel])},
            ${"queued"},
            now()
          )
        `.catch(() => undefined);
        const result = await publishSocialPostForShop({
          shopId: shop.id,
          postId,
          caption: intent.bundle.copy.caption,
          channels: [channel],
          assetId: intent.bundle.asset.stillUrl,
        });
        await persistSocialDelivery(postId, shop.id, result).catch(() => undefined);
        const ok = result.delivered.some((row) => row.ok);
        return {
          target: intent.target,
          status: ok ? "published" : "skipped",
          idempotencyKey: intent.bundle.idempotencyKey,
          detail: ok ? `Published to ${channel}.` : result.lastError || "Live publish did not deliver.",
          recordedAt: new Date().toISOString(),
          payload: intent.payload,
        };
      },
    });
  }
  const plan = await runPublishPlan({
    bundle,
    adapter,
    ledger,
    branding: { shopName: shop.name },
  });
  await persistPublish(shop, bundle, plan.receipts, plan.ledger).catch(() => undefined);
  const publishedLive = livePublishCounted(plan.receipts, adapter.mode);
  const applied = plan.web.preview.applied || publishedLive;
  return {
    applied,
    receipts: plan.receipts,
    detail: publishedLive
      ? `Published live to Graph/GBP. Web preview ${plan.web.preview.applied ? "updated" : "held"}.`
      : adapter.mode === "simulation"
        ? `Simulation only — no Graph/GBP call. Web preview ${plan.web.preview.applied ? "updated" : "held"}.`
        : bundle.rejectReason || plan.web.preview.skippedReason || "Publish skipped.",
  };
}
