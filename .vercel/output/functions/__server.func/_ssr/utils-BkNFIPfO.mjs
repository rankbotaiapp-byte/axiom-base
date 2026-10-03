import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-BkNFIPfO.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatMoney(cents) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	}).format(cents / 100);
}
function slugify(input) {
	return input.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "shop";
}
function newId(prefix) {
	return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function initials(name) {
	return name.split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase();
}
function formatPhone(raw) {
	const d = raw.replace(/\D/g, "");
	if (d.length === 10) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
	if (d.length === 11 && d[0] === "1") return `${d.slice(1, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
	return raw;
}
//#endregion
export { newId as a, initials as i, formatMoney as n, slugify as o, formatPhone as r, cn as t };
