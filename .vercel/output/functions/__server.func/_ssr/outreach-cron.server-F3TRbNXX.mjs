import { a as getSql } from "./db-BbGQAJUy.mjs";
import { t as env } from "./env.server-wS9zOhV6.mjs";
import { drainNurtureTouches, drainOutreachQueue } from "./outreach-queue.server-BIx9OHZk.mjs";
import { timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/outreach-cron.server-F3TRbNXX.js
function secretMatches(header, secret) {
	if (header.length !== secret.length) return false;
	return timingSafeEqual(Buffer.from(header), Buffer.from(secret));
}
/** External scheduler. Refuses to run until OUTREACH_CRON_SECRET is set. */
async function handleOutreachCron(request) {
	const secret = env("OUTREACH_CRON_SECRET");
	if (!secret) return new Response(null, { status: 404 });
	if (!secretMatches(request.headers.get("x-outreach-cron") ?? "", secret)) return Response.json({ error: "Forbidden" }, { status: 403 });
	const sql = await getSql();
	const batch = await drainOutreachQueue(sql);
	const nurture = await drainNurtureTouches(sql);
	return Response.json({
		batchReleased: batch.released,
		nurtureReleased: nurture.released
	});
}
//#endregion
export { handleOutreachCron };
