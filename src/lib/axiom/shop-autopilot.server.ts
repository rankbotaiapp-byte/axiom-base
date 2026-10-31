import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { isCustomStorefrontAsset } from "./gallery";
import { notifyShop } from "./notify.server";
import { parseAutopilotActive, type AutopilotTickResult } from "./shop-autopilot";

async function selectArmedShops() {
  const sql = await getSql();
  try {
    return await sql<{
      id: string;
      slug: string;
      owner_user_id: string | null;
      hero_image_url: string;
      autopilot_active?: unknown;
      ai_content_autopilot?: unknown;
    }>`
      select id, slug, owner_user_id, hero_image_url, autopilot_active, ai_content_autopilot
      from shops
      where coalesce(autopilot_active, false) = true
         or coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 8
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/autopilot_active/i.test(message)) throw err;
    return sql<{
      id: string;
      slug: string;
      owner_user_id: string | null;
      hero_image_url: string;
      ai_content_autopilot?: unknown;
    }>`
      select id, slug, owner_user_id, hero_image_url, ai_content_autopilot
      from shops
      where coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 8
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

/** Background pass for armed tenants: branded still, proof fill, owner notice. */
export async function tickShopAutopilot(): Promise<{ ran: number; results: AutopilotTickResult[] }> {
  const rows = (await selectArmedShops()).filter((row) => parseAutopilotActive(row));
  const results: AutopilotTickResult[] = [];
  const { generateArmedHeroForShop } = await import("./hero-motion-studio.server");
  for (const row of rows) {
    const hero = await generateArmedHeroForShop(row.id, row.owner_user_id || "").catch((err: unknown) => ({
      ok: false,
      detail: err instanceof Error ? err.message : "Hero tick failed",
    }));
    const proof = await cycleProofStill(row).catch(() => false);
    let notice = false;
    if (hero.ok || proof) {
      await notifyShop(row.id, {
        kind: "inquiry",
        subject: "Autopilot ran",
        body: hero.ok
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
      notice,
      detail: hero.detail,
    });
  }
  return { ran: results.filter((row) => row.hero || row.proof).length, results };
}
