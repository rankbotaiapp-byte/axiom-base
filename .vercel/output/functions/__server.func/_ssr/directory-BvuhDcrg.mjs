import { o as slugify } from "./utils-BkNFIPfO.mjs";
import { n as isShopNiche, t as SHOP_NICHES } from "./types-TYGEZdcs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/directory-BvuhDcrg.js
/** Display names for the built-in niches. Directory labels match these first. */
var NICHE_LABELS = {
	guide: "Guide services",
	fitness: "Fitness coaching / Personal training",
	wellness: "Massage and bodywork",
	lessons: "Lessons and tutoring",
	salon: "Hair salon",
	beauty: "Nails, lashes, makeup",
	tattoo: "Tattoo shop",
	photo: "Photography",
	pets: "Pet grooming",
	music: "Music artist / Rapper",
	events: "Events",
	contractor: "General contractor / Home services",
	clean: "Home cleaning",
	field: "Field service",
	security: "Private security",
	practice: "Practice",
	counsel: "Advisor",
	location: "Barber",
	studio: "Studio",
	trade: "Your trade"
};
/** Directory phrases that mean one of the built-in niches. */
var ALIASES = {
	barber: "location",
	barbershop: "location",
	"hair salon": "salon",
	salon: "salon",
	advisor: "counsel",
	counsel: "counsel",
	consulting: "counsel",
	"private security": "security",
	security: "security"
};
var TRADE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function nicheLabel(id) {
	if (id === "all") return "All trades";
	if (isShopNiche(id)) return NICHE_LABELS[id];
	return id.replace(/-/g, " ");
}
/**
* Turn a directory category into a stable trade key.
* Known niches keep their id. Anything else becomes its own key.
*/
function classifyTrade(raw) {
	const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
	if (label.length < 2) throw new Error("Trade is required");
	const key = label.toLowerCase();
	if (key === "all" || key === "all trades") throw new Error("Name the trade");
	const byId = isShopNiche(key) ? key : null;
	const byLabel = SHOP_NICHES.find((id) => NICHE_LABELS[id].toLowerCase() === key) ?? null;
	const alias = ALIASES[key] ?? null;
	const niche = byId ?? byLabel ?? alias;
	if (niche) return {
		tradeType: niche,
		tradeLabel: NICHE_LABELS[niche],
		known: true
	};
	const slug = slugify(label);
	if (!TRADE_KEY.test(slug) || slug === "shop") throw new Error("Trade is required");
	return {
		tradeType: slug,
		tradeLabel: label,
		known: false
	};
}
function isTradeKey(value) {
	return value === "all" || TRADE_KEY.test(value) && value.length <= 48;
}
function sortLeads(leads, sort) {
	const key = sort === "city" ? "city" : sort === "trade" ? "tradeLabel" : "businessName";
	return [...leads].sort((a, b) => a[key].localeCompare(b[key], void 0, { sensitivity: "base" }));
}
//#endregion
export { sortLeads as i, isTradeKey as n, nicheLabel as r, classifyTrade as t };
