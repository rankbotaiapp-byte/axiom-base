import { getSql } from "@/lib/db";
import { cityFromAddress } from "./avatar";
import { buildFunnelPost } from "./funnel-post";
import { requestOrigin } from "./payments.server";

export async function todayFunnelPostHandler(ctx: {
  data: { slug: string; shopId: string };
  context: { userId?: string };
}): Promise<{ post: string; hashtags: string; pageUrl: string }> {
  const userId = ctx.context.userId?.trim() ?? "";
  if (!userId) throw new Error("Forbidden");
  const key = ctx.data.slug || ctx.data.shopId;
  const sql = await getSql();
  const shops = await sql<{ id: string; slug: string; niche: string; address: string }>`
    select id, slug, niche, address
    from shops
    where slug = ${key} or id = ${key}
    limit 1
  `;
  const shop = shops[0];
  if (!shop) throw new Error("Shop not found");
  const members = await sql<{ ok: number }>`
    select 1 as ok
    from shop_billing b
    where b.shop_id = ${shop.id}
      and b.status in ('active', 'trialing')
      and (
        exists (
          select 1 from shop_members m
          where m.shop_id = b.shop_id
            and m.user_id = ${userId}
            and m.role in ('owner', 'employee')
        )
        or exists (
          select 1 from shops s
          where s.id = b.shop_id
            and s.owner_user_id = ${userId}
        )
      )
    limit 1
  `;
  if (!members[0]) throw new Error("Forbidden");
  const pageUrl = `${requestOrigin()}/${shop.slug}`;
  const piece = buildFunnelPost({
    niche: shop.niche,
    city: cityFromAddress(shop.address),
    pageUrl,
  });
  return { ...piece, pageUrl };
}
