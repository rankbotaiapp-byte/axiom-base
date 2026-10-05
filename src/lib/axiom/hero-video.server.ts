import { auth, authConfigured } from "@/lib/auth/server";
import { gateIdentityEnabled } from "@/lib/auth/gate-identity.server";
import { DEV_USER_ID, UnauthorizedError } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { HERO_VIDEO_MAX_BYTES, heroVideoPath, isMp4 } from "./hero-video";

function isOn(value: unknown) {
  return value === true || value === 1 || value === "t" || value === "true";
}

function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
  if (typeof value === "string" && value.startsWith("\\x")) {
    return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
  }
  return null;
}

function withHeroMarked(raw: string): string {
  let parsed: Partial<{ hero: boolean; service: boolean; employee: boolean; testBooked: boolean }> = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = {};
  }
  return JSON.stringify({
    hero: true,
    service: Boolean(parsed.service),
    employee: Boolean(parsed.employee),
    testBooked: Boolean(parsed.testBooked),
  });
}

export async function readHeroVideo(shopId: string): Promise<Uint8Array | null> {
  const sql = await getSql();
  const rows = await sql<{ data: unknown }>`
    select data from shop_hero_videos where shop_id = ${shopId} limit 1
  `;
  return asBytes(rows[0]?.data);
}

export function heroVideoResponse(bytes: Uint8Array, request: Request): Response {
  const total = bytes.byteLength;
  const base = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
  };
  const range = request.headers.get("range");
  if (!range) {
    return new Response(Buffer.from(bytes), {
      headers: { ...base, "content-length": String(total) },
    });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
  }
  const start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || start > end) {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
  }
  end = Math.min(end, total - 1);
  const slice = bytes.subarray(start, end + 1);
  return new Response(Buffer.from(slice), {
    status: 206,
    headers: {
      ...base,
      "content-length": String(slice.byteLength),
      "content-range": `bytes ${start}-${end}/${total}`,
    },
  });
}

export async function storeHeroVideo(userId: string, shopId: string, bytes: Uint8Array): Promise<string> {
  if (!isMp4(bytes)) throw new Error("Upload an .mp4 video, 12 MB or smaller");
  const sql = await getSql();
  const shops = await sql<{
    id: string;
    owner_user_id: string | null;
    is_showcase: unknown;
    onboarding_json: string;
  }>`
    select id, owner_user_id, is_showcase, onboarding_json
    from shops where id = ${shopId} limit 1
  `;
  const shop = shops[0];
  if (!shop) throw new Error("Shop not found");
  if (isOn(shop.is_showcase)) throw new Error("Showcase shops are read-only");
  const members = await sql<{ role: string }>`
    select role from shop_members where shop_id = ${shopId} and user_id = ${userId} limit 1
  `;
  if (shop.owner_user_id !== userId && members[0]?.role !== "owner") throw new Error("Forbidden");

  await sql.query(
    `insert into shop_hero_videos (shop_id, mime, data, updated_at)
     values ($1, 'video/mp4', $2, now())
     on conflict (shop_id) do update
       set mime = 'video/mp4', data = excluded.data, updated_at = now()`,
    [shopId, Buffer.from(bytes)],
  );
  const version = Date.now();
  const path = heroVideoPath(shopId, version);
  await sql`
    update shops
    set hero_video_url = ${path},
        onboarding_json = ${withHeroMarked(shop.onboarding_json)}
    where id = ${shopId}
  `;
  return path;
}

export async function userIdFromUpload(request: Request): Promise<string> {
  if (!authConfigured && !gateIdentityEnabled()) {
    if (process.env.DATABASE_URL?.trim()) {
      throw new Error("Auth is disabled but a database is configured");
    }
    return DEV_USER_ID;
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

export { HERO_VIDEO_MAX_BYTES };
