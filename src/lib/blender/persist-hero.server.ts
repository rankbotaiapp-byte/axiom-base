import { getSql } from "@/lib/db";
import { isMp4, shopHeroVideoPath } from "../axiom/hero-video";

export async function persistShopHeroMp4(shopId: string, bytes: Uint8Array): Promise<string | null> {
  if (!isMp4(bytes)) return null;
  const sql = await getSql();
  await sql.query(
    `insert into shop_hero_videos (shop_id, mime, data, updated_at)
     values ($1, 'video/mp4', $2, now())
     on conflict (shop_id) do update
       set mime = 'video/mp4', data = excluded.data, updated_at = now()`,
    [shopId, Buffer.from(bytes)],
  );
  const heroVideoUrl = shopHeroVideoPath(shopId, Date.now());
  await sql`update shops set hero_video_url = ${heroVideoUrl} where id = ${shopId}`;
  return heroVideoUrl;
}
