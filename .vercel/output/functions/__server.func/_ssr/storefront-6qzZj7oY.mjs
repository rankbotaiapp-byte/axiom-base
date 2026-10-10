//#region node_modules/.nitro/vite/services/ssr/assets/storefront-6qzZj7oY.js
var JOB_LANES = [
	"residential",
	"commercial",
	"emergency"
];
var THEME_PROFILES = [
	"site",
	"chair",
	"desk"
];
var LAYOUT_BLOCKS = [
	"staff",
	"estimate",
	"menu"
];
var NEON_PRESETS = [
	{
		name: "Cyan",
		value: "#2EE6D6"
	},
	{
		name: "Emerald",
		value: "#3DDC97"
	},
	{
		name: "Steel",
		value: "#7EC8E3"
	}
];
var WEEK = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun"
];
function themeForNiche(niche) {
	if (niche === "field" || niche === "contractor" || niche === "trade" || niche === "clean" || niche === "security") return "site";
	if (niche === "salon" || niche === "beauty" || niche === "location" || niche === "tattoo") return "chair";
	return "desk";
}
function parseThemeProfile(raw, niche) {
	const value = typeof raw === "string" ? raw : "";
	if (THEME_PROFILES.includes(value)) return value;
	return themeForNiche(niche);
}
function parseNeonAccent(raw) {
	const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
	return /^#[0-9A-F]{6}$/.test(value) ? value : "";
}
function parseGlowEnabled(raw) {
	if (raw === false || raw === 0 || raw === "f" || raw === "false") return false;
	return true;
}
function parseLayout(raw) {
	let parsed = raw;
	if (typeof raw === "string" && raw.trim()) try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = null;
	}
	if (!Array.isArray(parsed)) return [...LAYOUT_BLOCKS];
	const next = [];
	for (const item of parsed) if (typeof item === "string" && LAYOUT_BLOCKS.includes(item) && !next.includes(item)) next.push(item);
	for (const block of LAYOUT_BLOCKS) if (!next.includes(block)) next.push(block);
	return next;
}
function serviceLane(name, description) {
	const text = `${name} ${description}`.toLowerCase();
	if (/emergenc|after-hours|urgent|same day/.test(text)) return "emergency";
	if (/commercial|business|crew|site wide|event/.test(text)) return "commercial";
	return "residential";
}
/** Range from the shop's own prices. The photo is a reference, not a diagnosis. */
function estimateJob(prices, lane) {
	const amounts = prices.filter((price) => Number.isFinite(price) && price > 0);
	if (amounts.length === 0) return null;
	const low = Math.min(...amounts);
	const high = Math.max(...amounts);
	const multiplier = lane === "emergency" ? 1.35 : lane === "commercial" ? 1.15 : 1;
	return {
		low: Math.round(low * multiplier),
		high: Math.round(Math.max(high, low) * multiplier)
	};
}
function defaultWeek() {
	return {
		mon: true,
		tue: true,
		wed: true,
		thu: true,
		fri: true,
		sat: true,
		sun: false
	};
}
function parseWeek(raw) {
	const week = defaultWeek();
	let parsed = raw;
	if (typeof raw === "string" && raw.trim()) try {
		parsed = JSON.parse(raw);
	} catch {
		return week;
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return week;
	for (const key of WEEK) {
		const value = parsed[key];
		if (typeof value === "boolean") week[key] = value;
	}
	return week;
}
//#endregion
export { parseGlowEnabled as a, parseThemeProfile as c, estimateJob as i, parseWeek as l, LAYOUT_BLOCKS as n, parseLayout as o, NEON_PRESETS as r, parseNeonAccent as s, JOB_LANES as t, serviceLane as u };
