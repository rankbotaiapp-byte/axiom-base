import { t as env } from "./env.server-wS9zOhV6.mjs";
import { i as getSql } from "./db-BasGGAz9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/platform-owner.server-BSV0F2ax.js
/** Comma-separated sign-in emails. Server-only. Never sent to the browser. */
function masterEmails() {
	return (env("MASTER_ADMIN_EMAIL") ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
}
async function isPlatformOwner(userId) {
	const allow = masterEmails();
	if (!allow.length || !userId) return false;
	const email = (await (await getSql())`
    select "email" as email from "user" where id = ${userId} limit 1
  `)[0]?.email?.trim().toLowerCase() ?? "";
	return email.length > 0 && allow.includes(email);
}
async function assertPlatformOwner(userId) {
	if (masterEmails().length === 0) throw new Error("Master admin is not configured");
	if (!await isPlatformOwner(userId)) throw new Error("Forbidden");
}
//#endregion
export { assertPlatformOwner, isPlatformOwner };
