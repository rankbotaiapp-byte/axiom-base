import { r as isMp4, t as heroVideoPath } from "./hero-video-CVTInEqw.mjs";
import { i as getSql } from "./db-BasGGAz9.mjs";
import { i as gateIdentityEnabled, n as auth, r as authConfigured } from "./server-BPvWya0h.mjs";
import { DEV_USER_ID, UnauthorizedError } from "./verify.server-CpJQY2XC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hero-video.server-DIq8h9O9.js
function isOn(value) {
	return value === true || value === 1 || value === "t" || value === "true";
}
function asBytes(value) {
	if (value instanceof Uint8Array) return value;
	if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
	if (typeof value === "string" && value.startsWith("\\x")) return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
	return null;
}
function withHeroMarked(raw) {
	let parsed = {};
	try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = {};
	}
	return JSON.stringify({
		hero: true,
		service: Boolean(parsed.service),
		employee: Boolean(parsed.employee),
		testBooked: Boolean(parsed.testBooked)
	});
}
async function readHeroVideo(shopId) {
	return asBytes((await (await getSql())`
    select data from shop_hero_videos where shop_id = ${shopId} limit 1
  `)[0]?.data);
}
function heroVideoResponse(bytes, request) {
	const total = bytes.byteLength;
	const base = {
		"content-type": "video/mp4",
		"accept-ranges": "bytes",
		"cache-control": "public, max-age=31536000, immutable"
	};
	const range = request.headers.get("range");
	if (!range) return new Response(Buffer.from(bytes), { headers: {
		...base,
		"content-length": String(total)
	} });
	const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
	if (!match) return new Response(null, {
		status: 416,
		headers: { "content-range": `bytes */${total}` }
	});
	const start = match[1] ? Number(match[1]) : 0;
	let end = match[2] ? Number(match[2]) : total - 1;
	if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || start > end) return new Response(null, {
		status: 416,
		headers: { "content-range": `bytes */${total}` }
	});
	end = Math.min(end, total - 1);
	const slice = bytes.subarray(start, end + 1);
	return new Response(Buffer.from(slice), {
		status: 206,
		headers: {
			...base,
			"content-length": String(slice.byteLength),
			"content-range": `bytes ${start}-${end}/${total}`
		}
	});
}
async function storeHeroVideo(userId, shopId, bytes) {
	if (!isMp4(bytes)) throw new Error("Upload an .mp4 video, 12 MB or smaller");
	const sql = await getSql();
	const shop = (await sql`
    select id, owner_user_id, is_showcase, onboarding_json
    from shops where id = ${shopId} limit 1
  `)[0];
	if (!shop) throw new Error("Shop not found");
	if (isOn(shop.is_showcase)) throw new Error("Showcase shops are read-only");
	const members = await sql`
    select role from shop_members where shop_id = ${shopId} and user_id = ${userId} limit 1
  `;
	if (shop.owner_user_id !== userId && members[0]?.role !== "owner") throw new Error("Forbidden");
	await sql.query(`insert into shop_hero_videos (shop_id, mime, data, updated_at)
     values ($1, 'video/mp4', $2, now())
     on conflict (shop_id) do update
       set mime = 'video/mp4', data = excluded.data, updated_at = now()`, [shopId, Buffer.from(bytes)]);
	const path = heroVideoPath(shopId, Date.now());
	await sql`
    update shops
    set hero_video_url = ${path},
        onboarding_json = ${withHeroMarked(shop.onboarding_json)}
    where id = ${shopId}
  `;
	return path;
}
async function userIdFromUpload(request) {
	if (!authConfigured && !gateIdentityEnabled()) {
		if (process.env.DATABASE_URL?.trim()) throw new Error("Auth is disabled but a database is configured");
		return DEV_USER_ID;
	}
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user?.id) throw new UnauthorizedError();
	return session.user.id;
}
//#endregion
export { heroVideoResponse, readHeroVideo, storeHeroVideo, userIdFromUpload };
