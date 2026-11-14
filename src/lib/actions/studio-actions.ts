import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import {
  parseBrandMark,
  parseCinematicEffect,
  type BrandMarkStyle,
  type CinematicEffectId,
} from "@/lib/haptic-profiles";

export type HeroStudioJob = {
  id: string;
  shopId: string;
  shopSlug: string;
  mode: "manual" | "autopilot";
  effectId: CinematicEffectId;
  brandMark: BrandMarkStyle;
  loopUrl: string;
  logoUrl: string;
  status: string;
  createdAt: string;
};

async function assertShopDesk(userId: string, slug: string) {
  const sql = await getSql();
  const key = slug.trim().toLowerCase();
  const rows = await sql<{ id: string; owner_user_id: string | null }>`
    select s.id, s.owner_user_id
    from shops s
    left join shop_members m on m.shop_id = s.id and m.user_id = ${userId}
    where s.slug = ${key}
      and (s.owner_user_id = ${userId} or m.user_id = ${userId})
    limit 1
  `;
  const shop = rows[0];
  if (!shop) throw new Error("Forbidden");
  return shop;
}

export const saveHeroStudioJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      slug: string;
      mode?: "manual" | "autopilot";
      effectId: string;
      brandMark?: string;
      loopUrl: string;
      logoUrl?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const shop = await assertShopDesk(context.userId, data.slug);
    const sql = await getSql();
    const id = newId("hsj");
    const effectId = parseCinematicEffect(data.effectId);
    const brandMark = parseBrandMark(data.brandMark);
    const mode = data.mode === "autopilot" ? "autopilot" : "manual";
    const loopUrl = String(data.loopUrl ?? "").slice(0, 400);
    const logoUrl = String(data.logoUrl ?? "").slice(0, 400);
    try {
      const payload = JSON.stringify({
        effectId,
        brandMark,
        mode,
        loopUrl,
        logoUrl,
      });
      await sql`
        insert into hero_studio_jobs (
          id, shop_id, shop_slug, owner_user_id, mode, effect_id, brand_mark, loop_url, logo_url, status, payload, updated_at
        ) values (
          ${id}, ${shop.id}, ${data.slug.trim().toLowerCase()}, ${context.userId},
          ${mode}, ${effectId}, ${brandMark}, ${loopUrl}, ${logoUrl}, ${"ready"}, ${payload}::jsonb, now()
        )
      `;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/does not exist/i.test(message)) {
        return { id, saved: false as const, reason: "jobs-table-missing" };
      }
      throw err;
    }
    return { id, saved: true as const, effectId, brandMark, mode };
  });

export const listHeroStudioJobs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ data, context }): Promise<HeroStudioJob[]> => {
    await assertShopDesk(context.userId, data.slug);
    const sql = await getSql();
    try {
      const rows = await sql<{
        id: string;
        shop_id: string;
        shop_slug: string;
        mode: string;
        effect_id: string;
        brand_mark: string;
        loop_url: string;
        logo_url: string;
        status: string;
        created_at: string;
      }>`
        select id, shop_id, shop_slug, mode, effect_id, brand_mark, loop_url, logo_url, status,
               created_at::text as created_at
        from hero_studio_jobs
        where shop_slug = ${data.slug.trim().toLowerCase()}
        order by created_at desc
        limit 12
      `;
      return rows.map((row) => ({
        id: row.id,
        shopId: row.shop_id,
        shopSlug: row.shop_slug,
        mode: row.mode === "autopilot" ? "autopilot" : "manual",
        effectId: parseCinematicEffect(row.effect_id),
        brandMark: parseBrandMark(row.brand_mark),
        loopUrl: row.loop_url,
        logoUrl: row.logo_url,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  });
