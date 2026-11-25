import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { shopCity } from "./avatar";
import {
  applyWebPresencePreview,
  buildTenantPublishBundle,
  createSimulationSocialAdapter,
  mergeAutopilotWebPreview,
  pacificPublishDay,
  runPublishPlan,
  type PublishLedgerEntry,
  type SocialPublishReceipt,
  type TenantPublishBundle,
} from "./autopilot-publish";

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

async function loadLedger(shopId: string, day: string): Promise<PublishLedgerEntry[]> {
  try {
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from shop_events
      where shop_id = ${shopId} and type = ${"autopilot_publish"}
      order by created_at desc
      limit 40
    `;
    const ledger: PublishLedgerEntry[] = [];
    for (const row of rows) {
      const payload = row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {};
      const entries = Array.isArray(payload.ledger) ? payload.ledger : [];
      for (const item of entries) {
        if (!item || typeof item !== "object") continue;
        const entry = item as PublishLedgerEntry;
        if (entry.shopId === shopId && entry.day === day && entry.key && entry.target) ledger.push(entry);
      }
    }
    return ledger;
  } catch {
    return [];
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
}

export async function publishApprovedAutopilotBundle(shop: PublishShop): Promise<{
  applied: boolean;
  receipts: SocialPublishReceipt[];
  detail: string;
}> {
  const city = shopCity(shop.address);
  const bundle = buildTenantPublishBundle({
    shopId: shop.id,
    slug: shop.slug,
    shopName: shop.name,
    niche: shop.niche,
    city,
    stillUrl: shop.hero_image_url,
    motionUrl: shop.hero_video_url,
  });
  const day = pacificPublishDay();
  const ledger = await loadLedger(shop.id, day);
  const adapter = createSimulationSocialAdapter();
  const plan = runPublishPlan({
    bundle,
    adapter,
    ledger,
    branding: { shopName: shop.name },
  });
  await persistPublish(shop, bundle, plan.receipts, plan.ledger).catch(() => undefined);
  const applied = plan.web.preview.applied || plan.receipts.some((row) => row.status === "simulated");
  return {
    applied,
    receipts: plan.receipts,
    detail: applied
      ? `Web preview ${plan.web.preview.applied ? "updated" : "held"}; ${plan.receipts.filter((row) => row.status === "simulated").length} social intents simulated.`
      : bundle.rejectReason || plan.web.preview.skippedReason || "Publish skipped.",
  };
}
