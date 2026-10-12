import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storefront-CStpLjPF.js
var storefront_CStpLjPF_exports = /* @__PURE__ */ __exportAll({
	a: () => offerModel,
	c: () => parseNeonAccent,
	d: () => quoteProfile,
	f: () => serviceLane,
	i: () => impactScore,
	l: () => parseThemeProfile,
	m: () => storefront_exports,
	n: () => NEON_PRESETS,
	o: () => parseGlowEnabled,
	p: () => shelfFor,
	r: () => estimateRange,
	s: () => parseLayout,
	t: () => LAYOUT_BLOCKS,
	u: () => parseWeek
});
var storefront_exports = /* @__PURE__ */ __exportAll$1({
	LAYOUT_BLOCKS: () => LAYOUT_BLOCKS,
	NEON_PRESETS: () => NEON_PRESETS,
	THEME_PROFILES: () => THEME_PROFILES,
	defaultWeek: () => defaultWeek,
	estimateRange: () => estimateRange,
	formatAuditReport: () => formatAuditReport,
	impactScore: () => impactScore,
	offerModel: () => offerModel,
	parseGlowEnabled: () => parseGlowEnabled,
	parseLayout: () => parseLayout,
	parseNeonAccent: () => parseNeonAccent,
	parseThemeProfile: () => parseThemeProfile,
	parseWeek: () => parseWeek,
	quoteProfile: () => quoteProfile,
	serviceLane: () => serviceLane,
	shelfFor: () => shelfFor,
	themeForNiche: () => themeForNiche
});
var SITE_LANES = [
	{
		id: "residential",
		label: "Residential",
		multiplier: 1
	},
	{
		id: "commercial",
		label: "Commercial",
		multiplier: 1.15
	},
	{
		id: "emergency",
		label: "Emergency",
		multiplier: 1.35
	}
];
var CLEAN_LANES = [
	{
		id: "standard",
		label: "Standard",
		multiplier: 1
	},
	{
		id: "deep",
		label: "Deep clean",
		multiplier: 1.4
	},
	{
		id: "moveout",
		label: "Move-out",
		multiplier: 1.65
	}
];
var CHAIR_LANES = [
	{
		id: "cut",
		label: "Cut",
		multiplier: 1
	},
	{
		id: "color",
		label: "Color",
		multiplier: 1.45
	},
	{
		id: "correction",
		label: "Correction",
		multiplier: 1.8
	}
];
var VISIT_LANES = [
	{
		id: "single",
		label: "One visit",
		multiplier: 1
	},
	{
		id: "series",
		label: "A series",
		multiplier: .9
	},
	{
		id: "group",
		label: "A group",
		multiplier: 1.2
	}
];
var RETAIL_CATALOG = [
	{
		id: "cap",
		name: "House cap",
		description: "Embroidered mark. One size.",
		priceCents: 3200,
		stock: 24,
		attribute: "One size",
		imageUrl: "/media/heroes/retail.svg"
	},
	{
		id: "print",
		name: "Shop print",
		description: "18×24 poster of the mark.",
		priceCents: 2400,
		stock: 12,
		attribute: "18×24",
		imageUrl: "/media/heroes/retail.svg"
	},
	{
		id: "bundle",
		name: "Counter bundle",
		description: "The cap and the print together.",
		priceCents: 4800,
		stock: 6,
		attribute: "Cap + print",
		imageUrl: "/media/heroes/retail.svg"
	}
];
function offerModel(niche) {
	return niche === "retail" ? "product" : "service";
}
function quoteProfile(niche) {
	if (offerModel(niche) === "product") return {
		model: "product",
		kicker: "The shelf",
		heading: "In stock",
		helper: "Each item has a price and a count. Add it to the cart, or order it now.",
		photo: "off",
		photoNote: "",
		emptyLane: "",
		filter: "menu",
		lanes: []
	};
	if (niche === "clean") return {
		model: "service",
		kicker: "Scope quote",
		heading: "Cleaning estimate",
		helper: "A photo of the room sets the bracket: a standard clean, a deep clean, or a move-out. The range is this crew's own prices. The photo stays on this device.",
		photo: "required",
		photoNote: "Use a photo of the room.",
		emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
		filter: "menu",
		lanes: CLEAN_LANES
	};
	if (niche === "salon" || niche === "beauty" || niche === "location" || niche === "tattoo") return {
		model: "service",
		kicker: "Scope quote",
		heading: niche === "location" ? "Chair estimate" : niche === "tattoo" ? "Session estimate" : "Style estimate",
		helper: "A photo sets the bracket — a cut, color, or a correction. The range is this shop's own prices. The photo stays on this device.",
		photo: "required",
		photoNote: "Use a photo of the work.",
		emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
		filter: "menu",
		lanes: CHAIR_LANES
	};
	if (niche === "contractor" || niche === "field" || niche === "locksmith" || niche === "firewood" || niche === "landscaper" || niche === "foodtruck" || niche === "dogwalk" || niche === "detailer" || niche === "trade") return {
		model: "service",
		kicker: "Snap-to-Fix",
		heading: "Instant estimate",
		helper: "Residential, commercial, or an emergency call. The photo stays on this device. The range comes from this shop's own prices.",
		photo: "required",
		photoNote: "Use a photo of the job.",
		emptyLane: "This book doesn't split that way yet. The range uses the full menu.",
		filter: "keyword",
		lanes: SITE_LANES
	};
	if (niche === "security") return {
		model: "service",
		kicker: "The post",
		heading: "Coverage range",
		helper: "A consult, a standing post, or the night of an event. The range is this crew's own rates.",
		photo: "off",
		photoNote: "",
		emptyLane: "",
		filter: "menu",
		lanes: [
			{
				id: "consult",
				label: "Consult",
				multiplier: 1
			},
			{
				id: "post",
				label: "Standing post",
				multiplier: 1
			},
			{
				id: "event",
				label: "Event night",
				multiplier: 1.25
			}
		]
	};
	if (niche === "guide") return {
		model: "service",
		kicker: "The trip",
		heading: "Trip range",
		helper: "A shared seat, a private boat, or a charter. The range is this outfit's own rates.",
		photo: "off",
		photoNote: "",
		emptyLane: "",
		filter: "menu",
		lanes: [
			{
				id: "shared",
				label: "Shared",
				multiplier: 1
			},
			{
				id: "private",
				label: "Private",
				multiplier: 1.4
			},
			{
				id: "charter",
				label: "Charter",
				multiplier: 1.8
			}
		]
	};
	if (niche === "photo") return {
		model: "service",
		kicker: "The book",
		heading: "Session range",
		helper: "A portrait, an event, or a commercial day. The range is this studio's own rates.",
		photo: "off",
		photoNote: "",
		emptyLane: "",
		filter: "menu",
		lanes: [
			{
				id: "portrait",
				label: "Portrait",
				multiplier: 1
			},
			{
				id: "event",
				label: "Event",
				multiplier: 1.35
			},
			{
				id: "commercial",
				label: "Commercial",
				multiplier: 1.6
			}
		]
	};
	return {
		model: "service",
		kicker: "The book",
		heading: "Visit range",
		helper: "One visit, a series, or a group. The range is this shop's own menu.",
		photo: "off",
		photoNote: "",
		emptyLane: "",
		filter: "menu",
		lanes: VISIT_LANES
	};
}
/** Bracket score from the lane and the shop's own spread. Not a reading of the photo. */
function impactScore(multiplier, low, high) {
	const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
	const spread = Math.max(0, high - low);
	const score = 38 + factor * 24 + Math.min(18, spread / 4e3);
	return Math.max(12, Math.min(96, Math.round(score)));
}
function formatAuditReport(input) {
	const reach = input.channel === "text" ? "Text" : "Email";
	return [
		`Lane ${input.lane}`,
		`Impact ${input.impact}`,
		`Range ${input.lowCents}–${input.highCents} cents`,
		`${reach} the report to ${input.contact}`,
		"The photo stayed on their device."
	].join("\n");
}
function shelfFor(niche, lines) {
	if (offerModel(niche) !== "product") return [];
	if (!lines?.length) return RETAIL_CATALOG.map((item) => ({ ...item }));
	return lines.map((line, index) => {
		const known = RETAIL_CATALOG.find((item) => item.name === line.name);
		return {
			id: line.id || known?.id || `item-${index}`,
			name: line.name,
			description: line.description,
			priceCents: line.priceCents,
			stock: known?.stock ?? 8,
			attribute: known?.attribute ?? "In stock",
			imageUrl: known?.imageUrl || "/media/heroes/retail.svg"
		};
	});
}
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
	if (niche === "field" || niche === "contractor" || niche === "locksmith" || niche === "firewood" || niche === "landscaper" || niche === "foodtruck" || niche === "dogwalk" || niche === "detailer" || niche === "trade" || niche === "clean" || niche === "security") return "site";
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
function estimateRange(prices, multiplier) {
	const amounts = prices.filter((price) => Number.isFinite(price) && price > 0);
	if (amounts.length === 0) return null;
	const low = Math.min(...amounts);
	const high = Math.max(...amounts);
	const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
	return {
		low: Math.round(low * factor),
		high: Math.round(Math.max(high, low) * factor)
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
export { offerModel as a, parseNeonAccent as c, quoteProfile as d, serviceLane as f, impactScore as i, parseThemeProfile as l, storefront_CStpLjPF_exports as m, NEON_PRESETS as n, parseGlowEnabled as o, shelfFor as p, estimateRange as r, parseLayout as s, LAYOUT_BLOCKS as t, parseWeek as u };
