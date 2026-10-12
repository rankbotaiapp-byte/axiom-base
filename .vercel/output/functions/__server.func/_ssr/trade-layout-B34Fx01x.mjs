//#region node_modules/.nitro/vite/services/ssr/assets/trade-layout-B34Fx01x.js
var CORD_SIZES = [
	"full",
	"half",
	"third",
	"face"
];
var CORD_LABEL = {
	full: "Full cord",
	half: "Half cord",
	third: "Third",
	face: "Face cord"
};
/** Share of a full-cord price. A face cord is the short stack, not a full rick. */
var CORD_FACTOR = {
	full: 1,
	half: .55,
	third: .4,
	face: .35
};
var LAYOUTS = {
	firewood: {
		modules: [
			"workflow",
			"bulk",
			"species",
			"dropzone"
		],
		fields: [
			"cords",
			"species",
			"cuts",
			"deliveryNote",
			"dropZones",
			"radiusMiles"
		],
		kicker: "The cord",
		heading: "Cut, deliver, stack."
	},
	locksmith: {
		modules: [
			"dispatch",
			"callout",
			"kinds",
			"radius"
		],
		fields: [
			"dispatchOn",
			"responseMin",
			"emergencyCents",
			"radiusMiles",
			"kinds"
		],
		kicker: "The van",
		heading: "Lockout, rekey, or the car."
	},
	landscaper: {
		modules: ["kinds", "radius"],
		fields: [
			"kinds",
			"radiusMiles",
			"note"
		],
		kicker: "The yard",
		heading: "What the visit covers."
	},
	foodtruck: {
		modules: ["kinds", "radius"],
		fields: [
			"kinds",
			"radiusMiles",
			"note"
		],
		kicker: "The window",
		heading: "What the truck is booked for."
	},
	dogwalk: {
		modules: ["kinds", "radius"],
		fields: [
			"kinds",
			"radiusMiles",
			"note"
		],
		kicker: "The leash",
		heading: "What the walk covers."
	},
	detailer: {
		modules: ["kinds", "radius"],
		fields: [
			"kinds",
			"radiusMiles",
			"note"
		],
		kicker: "The driveway",
		heading: "What the van is booked for."
	},
	guide: {
		modules: ["party", "workflow"],
		fields: ["partyMax", "note"],
		kicker: "The launch",
		heading: "How the boat goes out."
	},
	fitness: {
		modules: ["session", "party"],
		fields: ["partyMax", "note"],
		kicker: "The floor",
		heading: "How the hour is sold."
	},
	combat: {
		modules: ["rounds", "workflow"],
		fields: ["note"],
		kicker: "The gym",
		heading: "How a round is booked."
	},
	wellness: {
		modules: ["session"],
		fields: ["note"],
		kicker: "The table",
		heading: "How the hour is held."
	},
	lessons: {
		modules: ["session", "party"],
		fields: ["partyMax", "note"],
		kicker: "The lesson",
		heading: "Who the hour is for."
	},
	salon: {
		modules: ["chair"],
		fields: ["note"],
		kicker: "The chair",
		heading: "What the chair is booked for."
	},
	beauty: {
		modules: ["chair", "kinds"],
		fields: ["kinds", "note"],
		kicker: "The set",
		heading: "What the set includes."
	},
	tattoo: {
		modules: ["chair", "workflow"],
		fields: ["note"],
		kicker: "The sitting",
		heading: "How a piece is booked."
	},
	photo: {
		modules: ["session"],
		fields: ["note"],
		kicker: "The shoot",
		heading: "How the hour is shot."
	},
	pets: {
		modules: ["kinds"],
		fields: ["kinds", "note"],
		kicker: "The coat",
		heading: "What the groom covers."
	},
	creator: {
		modules: ["session", "workflow"],
		fields: ["note"],
		kicker: "The edit",
		heading: "Shoot, cut, or both."
	},
	entertainer: {
		modules: ["session", "coverage"],
		fields: ["note"],
		kicker: "The set",
		heading: "How the night is booked."
	},
	music: {
		modules: ["session", "workflow"],
		fields: ["note"],
		kicker: "The room",
		heading: "Booth, mix, or the night."
	},
	events: {
		modules: ["coverage", "workflow"],
		fields: ["note"],
		kicker: "The date",
		heading: "How a date is held."
	},
	contractor: {
		modules: ["radius", "workflow"],
		fields: ["radiusMiles", "note"],
		kicker: "The job",
		heading: "Where the crew will go."
	},
	clean: {
		modules: ["kinds", "radius"],
		fields: [
			"kinds",
			"radiusMiles",
			"note"
		],
		kicker: "The house",
		heading: "What the clean covers."
	},
	field: {
		modules: ["callout", "radius"],
		fields: [
			"emergencyCents",
			"radiusMiles",
			"responseMin"
		],
		kicker: "The curb",
		heading: "How fast the van rolls."
	},
	security: {
		modules: ["coverage", "radius"],
		fields: ["radiusMiles", "note"],
		kicker: "The post",
		heading: "How the door is covered."
	},
	practice: {
		modules: ["session"],
		fields: ["note"],
		kicker: "The visit",
		heading: "How a visit is booked."
	},
	counsel: {
		modules: ["session"],
		fields: ["note"],
		kicker: "The hour",
		heading: "How a consult is booked."
	},
	location: {
		modules: ["chair"],
		fields: ["note"],
		kicker: "The chair",
		heading: "What the chair is booked for."
	},
	studio: {
		modules: ["session"],
		fields: ["note"],
		kicker: "The build",
		heading: "How an engagement starts."
	},
	retail: {
		modules: ["kinds"],
		fields: ["kinds", "note"],
		kicker: "The shelf",
		heading: "What is counted."
	},
	trade: {
		modules: ["workflow"],
		fields: ["note"],
		kicker: "The book",
		heading: "How a time is sold."
	}
};
var EMPTY = {
	cords: [
		"full",
		"half",
		"third",
		"face"
	],
	species: [
		"Fir",
		"Oak",
		"Mixed"
	],
	cuts: ["16 inch", "18 inch"],
	deliveryNote: "",
	dropZones: [],
	dispatchOn: true,
	responseMin: 30,
	emergencyCents: 12500,
	radiusMiles: 20,
	kinds: [],
	partyMax: 6,
	note: ""
};
var DEFAULT_KINDS = {
	locksmith: [
		"Lockout",
		"Rekey",
		"Automotive"
	],
	landscaper: [
		"Mow",
		"Cleanup",
		"Planting"
	],
	foodtruck: [
		"Lunch stop",
		"Private event",
		"Catering tray"
	],
	dogwalk: [
		"Solo walk",
		"Pack walk",
		"Midday"
	],
	detailer: [
		"Exterior",
		"Full detail",
		"Interior"
	],
	pets: [
		"Bath",
		"Full groom",
		"Nails"
	],
	clean: [
		"Standard",
		"Deep clean",
		"Move-out"
	],
	beauty: [
		"Nails",
		"Lashes",
		"Makeup"
	],
	retail: [
		"House cap",
		"Shop print",
		"Counter bundle"
	]
};
function layoutFor(niche) {
	return LAYOUTS[niche];
}
function defaultTradeProfile(niche) {
	return {
		...EMPTY,
		cords: [...EMPTY.cords],
		species: [...EMPTY.species],
		cuts: [...EMPTY.cuts],
		kinds: [...DEFAULT_KINDS[niche] ?? EMPTY.kinds],
		partyMax: niche === "guide" ? 8 : niche === "fitness" || niche === "lessons" ? 4 : EMPTY.partyMax,
		radiusMiles: niche === "firewood" ? 25 : EMPTY.radiusMiles,
		deliveryNote: niche === "firewood" ? "The drop is the driveway. A tight lane needs a note." : "",
		dropZones: niche === "firewood" ? [
			"New Era",
			"Medford",
			"Ashland"
		] : [],
		responseMin: niche === "field" ? 45 : EMPTY.responseMin
	};
}
function cordQuote(fullCents, size) {
	return Math.round((Number.isFinite(fullCents) && fullCents > 0 ? fullCents : 0) * CORD_FACTOR[size]);
}
/** The cord price is the delivery line when the book has one, otherwise the top price. */
function cordBaseCents(services) {
	const named = services.find((service) => /cord/i.test(service.name) && service.priceCents > 0);
	if (named) return named.priceCents;
	const priced = services.map((service) => service.priceCents).filter((price) => price > 0);
	return priced.length ? Math.max(...priced) : 0;
}
function checkDropZone(query, zones) {
	const needle = query.trim().toLowerCase();
	if (needle.length < 3) return "idle";
	const listed = zones.map((zone) => zone.trim().toLowerCase()).filter((zone) => zone.length > 1);
	if (listed.length === 0) return "idle";
	return listed.some((zone) => zone === needle || zone.includes(needle) || needle.includes(zone)) ? "in" : "out";
}
function matchOffering(kind, services) {
	const needle = kind.trim().toLowerCase();
	if (!needle) return null;
	return services.find((service) => {
		const name = service.name.trim().toLowerCase();
		return name === needle || name.includes(needle) || needle.includes(name);
	}) ?? null;
}
function asRecord(raw) {
	if (typeof raw === "string" && raw.trim()) try {
		return asRecord(JSON.parse(raw));
	} catch {
		return {};
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	return raw;
}
function textList(value, limit) {
	if (!Array.isArray(value)) return [];
	const next = [];
	for (const item of value) {
		if (typeof item !== "string") continue;
		const text = item.trim().replace(/\s+/g, " ").slice(0, 40);
		if (!text || next.includes(text)) continue;
		next.push(text);
		if (next.length >= limit) break;
	}
	return next;
}
function textLine(value, limit) {
	if (typeof value !== "string") return null;
	return value.trim().replace(/\s+/g, " ").slice(0, limit);
}
function whole(value, min, max) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	if (!Number.isFinite(n)) return null;
	return Math.min(max, Math.max(min, Math.round(n)));
}
function parseTradeProfile(niche, raw) {
	const base = defaultTradeProfile(niche);
	const record = asRecord(raw);
	const savedCords = Array.isArray(record.cords) ? new Set(textList(record.cords, CORD_SIZES.length)) : null;
	const cords = savedCords ? CORD_SIZES.filter((size) => savedCords.has(size)) : base.cords;
	const species = Array.isArray(record.species) ? textList(record.species, 8) : base.species;
	const cuts = Array.isArray(record.cuts) ? textList(record.cuts, 8) : base.cuts;
	const dropZones = Array.isArray(record.dropZones) ? textList(record.dropZones, 12) : base.dropZones;
	const kinds = Array.isArray(record.kinds) ? textList(record.kinds, 8) : base.kinds;
	const deliveryNote = textLine(record.deliveryNote, 180);
	const note = textLine(record.note, 180);
	const responseMin = whole(record.responseMin, 5, 180);
	const emergencyCents = whole(record.emergencyCents, 0, 5e5);
	const radiusMiles = whole(record.radiusMiles, 1, 150);
	const partyMax = whole(record.partyMax, 1, 40);
	return {
		cords: cords.length ? cords : base.cords,
		species,
		cuts,
		deliveryNote: deliveryNote ?? base.deliveryNote,
		dropZones,
		dispatchOn: typeof record.dispatchOn === "boolean" ? record.dispatchOn : base.dispatchOn,
		responseMin: responseMin ?? base.responseMin,
		emergencyCents: emergencyCents ?? base.emergencyCents,
		radiusMiles: radiusMiles ?? base.radiusMiles,
		kinds,
		partyMax: partyMax ?? base.partyMax,
		note: note ?? base.note
	};
}
function linesToList(value) {
	return textList(value.split(/\n|,/).map((line) => line.trim()).filter(Boolean), 12);
}
//#endregion
export { cordQuote as a, matchOffering as c, cordBaseCents as i, parseTradeProfile as l, CORD_SIZES as n, layoutFor as o, checkDropZone as r, linesToList as s, CORD_LABEL as t };
