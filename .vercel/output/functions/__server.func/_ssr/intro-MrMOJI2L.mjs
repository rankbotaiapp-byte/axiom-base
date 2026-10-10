import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { n as isCustomHeroVideo } from "./hero-video-CVTInEqw.mjs";
import { n as isShopNiche, t as SHOP_NICHES } from "./types-TYGEZdcs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/intro-MrMOJI2L.js
/** Charge units declared on a trade. Trades that declare none stay a flat fee. */
function unitsForTemplate(declared) {
	if (declared?.length) return [...declared];
	return ["flat"];
}
function defaultUnit(units) {
	return units.find((unit) => unit !== "flat") ?? units[0] ?? "flat";
}
/** Consecutive rows that share a section name. Matches the customer menu. */
function sectionsOf(rows) {
	const sections = [];
	rows.forEach((row, index) => {
		const last = sections[sections.length - 1];
		if (last && last.label === row.group) last.count += 1;
		else sections.push({
			label: row.group,
			start: index,
			count: 1
		});
	});
	return sections;
}
function renameSection(rows, start, count, name) {
	const end = start + count;
	return rows.map((row, index) => index >= start && index < end ? {
		...row,
		group: name
	} : row);
}
/**
* Swap a line with its neighbor. Crossing a section boundary adopts that section,
* so the line joins it instead of splitting the menu into a one-line island.
*/
function moveRow(rows, index, direction) {
	const next = index + direction;
	if (index < 0 || next < 0 || next >= rows.length) return rows;
	const moving = rows[index];
	const neighbor = rows[next];
	const relocated = moving.group === neighbor.group ? moving : {
		...moving,
		group: neighbor.group
	};
	const copy = rows.slice();
	copy[index] = neighbor;
	copy[next] = relocated;
	return copy;
}
function moveSection(rows, sectionIndex, direction) {
	const sections = sectionsOf(rows);
	const current = sections[sectionIndex];
	const other = sections[sectionIndex + direction];
	if (!current || !other) return rows;
	const currentRows = rows.slice(current.start, current.start + current.count);
	const otherRows = rows.slice(other.start, other.start + other.count);
	const [first, second] = direction < 0 ? [currentRows, otherRows] : [otherRows, currentRows];
	const start = Math.min(current.start, other.start);
	const end = Math.max(current.start + current.count, other.start + other.count);
	return [
		...rows.slice(0, start),
		...first,
		...second,
		...rows.slice(end)
	];
}
function insertRow(rows, index, row) {
	const at = Math.max(0, Math.min(index, rows.length));
	return [
		...rows.slice(0, at),
		row,
		...rows.slice(at)
	];
}
function nextSectionName(labels) {
	const base = "New section";
	if (!labels.includes(base)) return base;
	let n = 2;
	while (labels.includes(`${base} ${n}`)) n += 1;
	return `${base} ${n}`;
}
/** One source for niche stills and looping hero films. Templates and heroes both read this. */
var NICHE_MEDIA = {
	fitness: film("/media/tiger-poster.svg", "/media/heroes/tiger-deer.mp4", "Training loop · tiger-deer.mp4", "zoomin", 36, 48, 60, void 0, { loopUrl: "/media/tiger.mp4" }),
	music: film("/media/music-hero.jpg", "/media/music-hero.mp4", "Stage loop · music-hero.mp4", "panlr", 24, 62, 68, "stage"),
	contractor: film("/media/heroes/contractor.jpg", "/media/contractor-hero.mp4", "Site loop · contractor-hero.mp4", "zoomin", 30, 38, 56, "site"),
	location: film("/media/barber-hero.jpg", "/media/clipper.mp4", "Barber loop · clipper.mp4", "kenburns", 34, 46, 58),
	tattoo: film("", "/media/tattoo-gun.mp4", "Tattoo loop · tattoo-gun.mp4", "panlr", 28, 50, 58),
	guide: film("/media/rafting-image.png", "/media/heroes/guide.mp4", "River loop · guide.mp4", "panlr", 28, 42, 62),
	field: film("/media/auto-hero.jpg", "/media/auto-hero.mp4", "Field loop · auto-hero.mp4", "panlr", 30, 44, 64, "site"),
	studio: film("/media/apps-hero.jpg", "/media/apps-hero.mp4", "Studio loop · apps-hero.mp4", "zoomin", 32, 40, 60),
	salon: film("/media/heroes/salon.jpg", "/media/heroes/salon.mp4", "Salon loop · salon.mp4", "panlr", 32, 40, 58),
	beauty: still("beauty", "Beauty still", "kenburns", 36, 42, 62, void 0, "jpg"),
	wellness: film("/media/heroes/wellness.jpg", "/media/heroes/wellness.mp4", "Wellness loop · wellness.mp4", "fade", 24, 36, 70),
	lessons: still("lessons", "Lessons still", "pantd", 28, 34, 60, void 0, "jpg"),
	photo: film("", "/media/heroes/photo.mp4", "Photo loop · photo.mp4", "zoomin", 34, 48, 64),
	pets: still("pets", "Pets still", "panlr", 30, 38, 58, void 0, "jpg"),
	clean: film("/media/heroes/clean.jpg", "/media/heroes/clean.mp4", "Clean loop · clean.mp4", "zoomout", 26, 36, 56),
	practice: still("practice", "Practice still", "kenburns", 30, 40, 66, void 0, "jpg"),
	counsel: film("/media/heroes/counsel.jpg", "/media/heroes/counsel.mp4", "Counsel loop · counsel.mp4", "fade", 22, 32, 72),
	events: film("/media/heroes/events.jpg", "/media/heroes/events.mp4", "Events loop · events.mp4", "panlr", 28, 44, 60, "stage"),
	trade: film("/media/heroes/trade.jpg", "/media/heroes/welding-trade.mp4", "Trade loop · welding-trade.mp4", "zoomin", 32, 40, 58, "site", { imageUrl: "/media/heroes/trade.jpg" }),
	security: film("", "/media/heroes/private-security.mp4", "Post loop · private-security.mp4", "kenburns", 30, 42, 60)
};
/** Named trades that share a niche id but need their own still. */
var TRADE_SCENES = [
	{
		test: /\bhunting\b/i,
		film: film("/media/heroes/hunting-guide.jpg", "/media/heroes/deer-hunting-guide.mp4", "Hunt loop · deer-hunting-guide.mp4", "panlr", 28, 42, 62, void 0, { imageUrl: "/media/heroes/hunting-guide.jpg" })
	},
	{
		test: /\b(firewood|cordwood|fire wood)\b/i,
		film: still("firewood", "Firewood still", "kenburns", 30, 40, 58, "site", "jpg")
	},
	{
		test: /\b(hvac|furnace|heat pump|air condition\w*)\b/i,
		film: still("hvac", "HVAC still", "panlr", 30, 42, 58, "site", "jpg")
	},
	{
		test: /\b(electric\w*|wiring)\b/i,
		film: still("electrical", "Electrical still", "kenburns", 34, 46, 60, "site", "jpg")
	},
	{
		test: /\b(food truck|foodtruck|mobile food|mobile kitchen)\b/i,
		film: still("food-truck", "Food truck still", "panlr", 28, 40, 58, void 0, "jpg")
	},
	{
		test: /\b(landscap\w*|lawn|yard)\b/i,
		film: still("landscaping", "Landscaping still", "pantd", 26, 40, 56, "site", "jpg")
	},
	{
		test: /\b(roof\w*|shingle|gutter)\b/i,
		film: still("roofing", "Roofing still", "zoomin", 28, 44, 54, "site", "jpg")
	},
	{
		test: /\b(plumb\w*|drain)\b/i,
		film: still("plumbing", "Plumbing still", "panlr", 30, 40, 58, "site", "jpg")
	}
];
function film(heroImageUrl, heroVideoUrl, loopLabel, introPreset, introSpeed, introIntensity, heroBlendPercent, tone, inset) {
	return {
		heroImageUrl,
		heroVideoUrl,
		loopLabel,
		introPreset,
		introSpeed,
		introIntensity,
		heroBlendPercent,
		tone,
		insetImageUrl: inset?.imageUrl,
		insetLoopUrl: inset?.loopUrl
	};
}
function still(name, loopLabel, introPreset, introSpeed, introIntensity, heroBlendPercent, tone, ext = "svg") {
	return film(`/media/heroes/${name}.${ext}`, "", loopLabel, introPreset, introSpeed, introIntensity, heroBlendPercent, tone);
}
function matchTradeScene(businessName) {
	const name = businessName.trim();
	if (!name) return null;
	return TRADE_SCENES.find((scene) => scene.test.test(name))?.film ?? null;
}
/** Preview pages (?b=slug) and new shops read the same film, pan, and blend. */
function leadHeroFor(tradeType, businessName, category = "") {
	const named = matchTradeScene(businessName) ?? matchTradeScene(category) ?? matchTradeScene(tradeType.replace(/-/g, " "));
	if (named) return named;
	return NICHE_MEDIA[isShopNiche(tradeType) ? tradeType : "trade"];
}
function resolveHeroMedia(shop) {
	const media = NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.location;
	const stillUrl = shop.heroImageUrl ?? "";
	const customStill = stillUrl.startsWith("data:");
	const customVideo = isCustomHeroVideo(shop.heroVideoUrl);
	return {
		imageUrl: stillUrl || media.heroImageUrl,
		videoUrl: customVideo ? shop.heroVideoUrl : customStill ? null : shop.heroVideoUrl || media.heroVideoUrl,
		tone: media.tone ?? null,
		loopLabel: customVideo ? "Custom loop · this shop" : customStill ? "Custom still · niche loop hidden" : media.loopLabel
	};
}
var RING_PRESETS = [
	{
		name: "Teal",
		value: "#2EE6D6"
	},
	{
		name: "Copper",
		value: "#E7B48A"
	},
	{
		name: "Steel",
		value: "#7EC8E3"
	},
	{
		name: "Ember",
		value: "#E07A73"
	},
	{
		name: "Gold",
		value: "#C9A227"
	},
	{
		name: "Violet",
		value: "#B388FF"
	}
];
/** Lead the onboarding row with the newest templates, then the original three. */
var NICHE_ORDER = [...SHOP_NICHES];
var NICHES = {
	guide: {
		niche: "guide",
		label: "Guide services",
		kicker: "They book the boat",
		blurb: "A shared seat or a private boat — the put-in on a calendar.",
		defaultName: "Glass Eddy",
		tagline: "The boat leaves when you do.",
		description: "Shared seats and private boats on the same stretch. The price covers the guide, the gear, and the shuttle back.",
		address: "New Era · put-in at the bridge",
		ringColor: "#7EC8E3",
		heroImageUrl: NICHE_MEDIA.guide.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.guide.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.guide.heroBlendPercent,
		introPreset: NICHE_MEDIA.guide.introPreset,
		introSpeed: NICHE_MEDIA.guide.introSpeed,
		introIntensity: NICHE_MEDIA.guide.introIntensity,
		primaryServiceIndex: 0,
		priceUnits: [
			"flat",
			"person",
			"boat"
		],
		hours: {
			mon: "closed",
			tue: "07:00-16:00",
			wed: "07:00-16:00",
			thu: "07:00-16:00",
			fri: "07:00-16:00",
			sat: "07:00-16:00",
			sun: "07:00-15:00"
		},
		services: [
			{
				group: "Shared",
				name: "Morning half-day",
				description: "Class II. Paddle, vest, and the shuttle back. Six seats on the boat.",
				durationMin: 240,
				priceCents: 9500,
				priceUnit: "person"
			},
			{
				group: "Shared",
				name: "Full-day canyon",
				description: "The long line. Lunch on the gravel. Gear included.",
				durationMin: 480,
				priceCents: 16500,
				priceUnit: "person"
			},
			{
				group: "Private",
				name: "Private half-day",
				description: "Your group only. Up to six. Same water, no other boat.",
				durationMin: 240,
				priceCents: 52e3,
				priceUnit: "boat"
			},
			{
				group: "Private",
				name: "Private full-day",
				description: "The canyon for one group. Lunch, gear, and the shuttle.",
				durationMin: 480,
				priceCents: 88e3,
				priceUnit: "boat"
			}
		],
		employees: [{
			displayName: "Willa Grant",
			title: "Lead guide",
			bio: "Reads the line before the boat does. Shared mornings and the private days.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2,
				3
			]
		}, {
			displayName: "Theo Marsh",
			title: "Guide",
			bio: "The early put-in. He runs the half-day and the boats that want a quiet canyon.",
			avatarUrl: "",
			serviceIndexes: [0, 2]
		}],
		portfolio: [{
			employeeIndex: 0,
			imageUrl: "/media/rafting-image.png",
			caption: "The line"
		}]
	},
	fitness: {
		niche: "fitness",
		label: "Fitness coaching / Personal training",
		kicker: "They book the session",
		blurb: "An assessment, a one-to-one hour, or a small group — the floor on a calendar.",
		defaultName: "Form Room",
		tagline: "Show up. We count the rest.",
		description: "Personal training and small groups in New Era. Book the hour, not a guess.",
		address: "New Era · the floor opens at six",
		ringColor: "#E07A73",
		heroImageUrl: NICHE_MEDIA.fitness.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.fitness.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.fitness.heroBlendPercent,
		introPreset: NICHE_MEDIA.fitness.introPreset,
		introSpeed: NICHE_MEDIA.fitness.introSpeed,
		introIntensity: NICHE_MEDIA.fitness.introIntensity,
		primaryServiceIndex: 1,
		hours: {
			mon: "06:00-19:00",
			tue: "06:00-19:00",
			wed: "06:00-19:00",
			thu: "06:00-19:00",
			fri: "06:00-19:00",
			sat: "07:00-13:00",
			sun: "closed"
		},
		services: [
			{
				group: "Assess",
				name: "Intro assessment",
				description: "How you move, what hurts, and the first block of work.",
				durationMin: 45,
				priceCents: 8e3
			},
			{
				group: "Train",
				name: "Personal training",
				description: "One coach, one hour, the program you are actually on.",
				durationMin: 60,
				priceCents: 12e3
			},
			{
				group: "Train",
				name: "Small group",
				description: "Four people. The same hour, a shared floor.",
				durationMin: 50,
				priceCents: 4e3
			}
		],
		employees: [{
			displayName: "Nina Voss",
			title: "Head coach",
			bio: "Strength first. She writes the block and stays for the ugly reps.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}, {
			displayName: "Calvin Brooks",
			title: "Coach",
			bio: "Small groups and the people who would rather not train alone.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}],
		portfolio: []
	},
	music: {
		niche: "music",
		label: "Music artist / Rapper",
		kicker: "They book the night",
		blurb: "A release, a session, or the show itself — the booth and the room on one calendar.",
		defaultName: "Lowlight",
		tagline: "The record, then the room.",
		description: "Studio time and live sets out of New Era. Book the booth, the mix, or the night.",
		address: "New Era · books after two",
		ringColor: "#B388FF",
		heroImageUrl: NICHE_MEDIA.music.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.music.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.music.heroBlendPercent,
		introPreset: NICHE_MEDIA.music.introPreset,
		introSpeed: NICHE_MEDIA.music.introSpeed,
		introIntensity: NICHE_MEDIA.music.introIntensity,
		primaryServiceIndex: 2,
		hours: {
			mon: "closed",
			tue: "14:00-22:00",
			wed: "14:00-22:00",
			thu: "14:00-22:00",
			fri: "14:00-22:00",
			sat: "12:00-20:00",
			sun: "closed"
		},
		services: [
			{
				group: "Release",
				name: "Single rollout",
				description: "Artwork, the date, and the posts that go with the drop.",
				durationMin: 60,
				priceCents: 35e3
			},
			{
				group: "Release",
				name: "Mix + master",
				description: "One song. Notes back in the same sitting.",
				durationMin: 90,
				priceCents: 28e3
			},
			{
				group: "Booth",
				name: "Studio session",
				description: "Booth time with an engineer. Two songs, or one until it sits right.",
				durationMin: 120,
				priceCents: 4e4
			},
			{
				group: "Booth",
				name: "Feature verse",
				description: "Write and record a verse on your record.",
				durationMin: 75,
				priceCents: 5e4
			},
			{
				group: "Stage",
				name: "Live set",
				description: "Book the show. A room, a set length, and the night.",
				durationMin: 45,
				priceCents: 8e4
			}
		],
		employees: [{
			displayName: "Mara Quinn",
			title: "Artist",
			bio: "Writes in the booth and holds the room when the lights drop.",
			avatarUrl: "/media/music-mara.jpg",
			serviceIndexes: [
				0,
				2,
				3,
				4
			]
		}, {
			displayName: "Ellis Ward",
			title: "Engineer",
			bio: "Runs the desk. The mix comes back before you leave the block.",
			avatarUrl: "/media/music-ellis.jpg",
			serviceIndexes: [1, 2]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/music-work-2.jpg",
				caption: "The room"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/music-hero.jpg",
				caption: "Night set"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/music-work-1.jpg",
				caption: "Booth"
			}
		]
	},
	contractor: {
		niche: "contractor",
		label: "General contractor / Home services",
		kicker: "They book the job",
		blurb: "A consult, a measure, or the start day — home work with a scope you can read.",
		defaultName: "Hearth Line",
		tagline: "Walk the house. Then we build.",
		description: "Kitchens, repairs, and the rooms that need a real start day. New Era, and about twenty miles out.",
		address: "New Era · jobs within 20 miles",
		ringColor: "#C9A227",
		heroImageUrl: NICHE_MEDIA.contractor.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.contractor.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.contractor.heroBlendPercent,
		introPreset: NICHE_MEDIA.contractor.introPreset,
		introSpeed: NICHE_MEDIA.contractor.introSpeed,
		introIntensity: NICHE_MEDIA.contractor.introIntensity,
		primaryServiceIndex: 0,
		hours: {
			mon: "07:30-16:30",
			tue: "07:30-16:30",
			wed: "07:30-16:30",
			thu: "07:30-16:30",
			fri: "07:30-16:30",
			sat: "08:00-13:00",
			sun: "closed"
		},
		services: [
			{
				group: "Consult",
				name: "Project consultation",
				description: "Walk the house. Leave with a scope and a number.",
				durationMin: 60,
				priceCents: 15e3
			},
			{
				group: "Consult",
				name: "Site measure",
				description: "Rooms, openings, and the list the crew actually builds from.",
				durationMin: 90,
				priceCents: 2e4
			},
			{
				group: "Build",
				name: "Repair call",
				description: "One problem. A leak, a door, a stair that moves.",
				durationMin: 120,
				priceCents: 28e3
			},
			{
				group: "Build",
				name: "Start day",
				description: "The first day on a room. The rest of the job is quoted from the consult.",
				durationMin: 240,
				priceCents: 65e3
			}
		],
		employees: [{
			displayName: "Lena Cho",
			title: "General contractor",
			bio: "Scopes the job in plain language, then stays on it until the punch list is short.",
			avatarUrl: "/media/contractor-lead.jpg",
			serviceIndexes: [
				0,
				1,
				3
			]
		}, {
			displayName: "Owen Briggs",
			title: "Lead carpenter",
			bio: "Cabinets, stairs, and the repairs that should have been done last year.",
			avatarUrl: "/media/contractor-crew.jpg",
			serviceIndexes: [2, 3]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/contractor-work-1.jpg",
				caption: "Kitchen"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/contractor-hero.jpg",
				caption: "Start day"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/contractor-work-2.jpg",
				caption: "Front stair"
			}
		]
	},
	tattoo: {
		niche: "tattoo",
		label: "Tattoo shop",
		kicker: "They book the chair",
		blurb: "A consult, a small piece, or a session — the book instead of a walk-in.",
		defaultName: "Iron Ledger",
		tagline: "Draw it. Then sit for it.",
		description: "A two-artist shop. Book the consult, then the session. Flash and custom, on the calendar.",
		address: "New Era · walk in only if the book is open",
		ringColor: "#E07A73",
		heroImageUrl: NICHE_MEDIA.tattoo.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.tattoo.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.tattoo.heroBlendPercent,
		introPreset: NICHE_MEDIA.tattoo.introPreset,
		introSpeed: NICHE_MEDIA.tattoo.introSpeed,
		introIntensity: NICHE_MEDIA.tattoo.introIntensity,
		services: [
			{
				group: "Consult",
				name: "Consult",
				description: "Placement, size, and a date for the work.",
				durationMin: 30,
				priceCents: 4e3
			},
			{
				group: "Chair",
				name: "Small piece",
				description: "One sitting. Flash or a simple custom.",
				durationMin: 90,
				priceCents: 18e3
			},
			{
				group: "Chair",
				name: "Session",
				description: "A longer sitting on a piece already drawn.",
				durationMin: 180,
				priceCents: 45e3
			}
		],
		employees: [{
			displayName: "Rio Hale",
			title: "Lead artist",
			bio: "Linework and the pieces that take more than one afternoon.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Sam Ortega",
			title: "Artist",
			bio: "Small work, flash, and the consult that turns into a drawing.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}],
		portfolio: []
	},
	location: {
		niche: "location",
		label: "Barber",
		kicker: "They come to you",
		blurb: "A chair, a fade, a line out the door.",
		defaultName: "Atlas Cuts",
		tagline: "Precision cuts. No waiting around.",
		description: "A quiet two-chair shop. Book a chair, skip the walk-in list, leave looking finished.",
		address: "12 Main Street, New Era",
		ringColor: "#E7B48A",
		heroImageUrl: NICHE_MEDIA.location.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.location.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.location.heroBlendPercent,
		introPreset: NICHE_MEDIA.location.introPreset,
		introSpeed: NICHE_MEDIA.location.introSpeed,
		introIntensity: NICHE_MEDIA.location.introIntensity,
		services: [
			{
				group: "Cut",
				name: "Signature cut",
				description: "Consultation, cut, finish.",
				durationMin: 45,
				priceCents: 4800
			},
			{
				group: "Cut",
				name: "Skin fade",
				description: "Tight blend, razor line.",
				durationMin: 50,
				priceCents: 5400
			},
			{
				group: "Beard",
				name: "Beard sculpt",
				description: "Shape, line-up, oil.",
				durationMin: 25,
				priceCents: 2800
			}
		],
		employees: [{
			displayName: "Jordan Hale",
			title: "Lead barber",
			bio: "Fades and classic tapers. Calm chair, sharp lines.",
			avatarUrl: "/media/sal.jpg",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Reese Quinn",
			title: "Barber",
			bio: "Texture and finishes. The haircut you forget you have — in a good way.",
			avatarUrl: "/media/marco.jpg",
			serviceIndexes: [0, 1]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/barber-work-1.jpg",
				caption: "House fade"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/barber-work-2.jpg",
				caption: "Shave"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/barber-work-1.jpg",
				caption: "Crop"
			}
		]
	},
	field: {
		niche: "field",
		label: "Field service",
		kicker: "You go to them",
		blurb: "Auto, HVAC, trades — a van, a bay, a job that starts on the curb.",
		defaultName: "Northline Repair",
		tagline: "We come to the curb.",
		description: "Mobile diagnostics plus a bay for the work that needs a hoist. Plain-language quotes.",
		address: "New Era · 15-mile service radius",
		ringColor: "#7EC8E3",
		heroImageUrl: NICHE_MEDIA.field.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.field.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.field.heroBlendPercent,
		introPreset: NICHE_MEDIA.field.introPreset,
		introSpeed: NICHE_MEDIA.field.introSpeed,
		introIntensity: NICHE_MEDIA.field.introIntensity,
		services: [
			{
				group: "At the curb",
				name: "Driveway diagnostic",
				description: "Scan and a plain-language report.",
				durationMin: 60,
				priceCents: 12900
			},
			{
				group: "At the curb",
				name: "Mobile rescue",
				description: "Battery, jump, no-start triage.",
				durationMin: 50,
				priceCents: 14900
			},
			{
				group: "In the bay",
				name: "Oil + filter",
				description: "On the hoist. Includes the inspection.",
				durationMin: 45,
				priceCents: 8900
			}
		],
		employees: [{
			displayName: "Chris Dalton",
			title: "Lead technician",
			bio: "Drivability and brakes. Listens to the engine — and to you.",
			avatarUrl: "/media/dana.jpg",
			serviceIndexes: [0, 2]
		}, {
			displayName: "Avery Knox",
			title: "Mobile tech",
			bio: "The van is a rolling bay. Fast on the jobs that should not need a tow.",
			avatarUrl: "/media/gabe.jpg",
			serviceIndexes: [0, 1]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/auto-work-1.jpg",
				caption: "Brake job"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/auto-work-2.jpg",
				caption: "Bay work"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/auto-work-1.jpg",
				caption: "Curb-side"
			}
		]
	},
	studio: {
		niche: "studio",
		label: "Studio",
		kicker: "You build for them",
		blurb: "Web apps, contractors, studios — a desk, a build, a product that books itself.",
		defaultName: "Forge Studio",
		tagline: "Powered by Axiom.",
		description: "We stand up the booking site, the operator console, and the staff station — then light the edge of the phone when the first appointment lands.",
		address: "New Era",
		ringColor: "#2EE6D6",
		heroImageUrl: NICHE_MEDIA.studio.heroImageUrl,
		heroVideoUrl: NICHE_MEDIA.studio.heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA.studio.heroBlendPercent,
		introPreset: NICHE_MEDIA.studio.introPreset,
		introSpeed: NICHE_MEDIA.studio.introSpeed,
		introIntensity: NICHE_MEDIA.studio.introIntensity,
		services: [
			{
				group: "Start",
				name: "Discovery call",
				description: "What you run. What the ring should say.",
				durationMin: 45,
				priceCents: 15e3
			},
			{
				group: "Build",
				name: "Site launch session",
				description: "Live booking page, services, and staff.",
				durationMin: 90,
				priceCents: 48e3
			},
			{
				group: "Build",
				name: "Console + station",
				description: "Admin, employee board, incoming book.",
				durationMin: 60,
				priceCents: 32e3
			},
			{
				group: "Build",
				name: "Custom ring + brand",
				description: "Perimeter glow, color, confirmation language.",
				durationMin: 50,
				priceCents: 22e3
			}
		],
		employees: [{
			displayName: "Eric",
			title: "Founder",
			bio: "Builds the shop you can book. New Era Apps, powered by Axiom.",
			avatarUrl: "/media/eric.jpg",
			phone: "5418908126",
			serviceIndexes: [
				0,
				1,
				2,
				3
			]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/apps-work-1.jpg",
				caption: "The ring"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/apps-work-2.jpg",
				caption: "Operator console"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/apps-hero.jpg",
				caption: "Studio"
			}
		]
	},
	salon: bookable({
		niche: "salon",
		label: "Hair salon",
		kicker: "They book the chair",
		blurb: "A cut, a color, a finish — the chair on a calendar.",
		defaultName: "Halo Room",
		tagline: "Sit down. Leave finished.",
		description: "Color and cuts by appointment. The chair is yours for the block you booked.",
		address: "New Era · chairs by appointment",
		ringColor: "#E7B48A",
		soloTitle: "Stylist",
		services: [
			{
				group: "Cut",
				name: "Cut + style",
				description: "Consultation, cut, and the finish.",
				durationMin: 60,
				priceCents: 8500
			},
			{
				group: "Color",
				name: "Color consult",
				description: "The formula, the time, and a date for the work.",
				durationMin: 30,
				priceCents: 4e3
			},
			{
				group: "Color",
				name: "Gloss + style",
				description: "Tone and a blowout. One sitting.",
				durationMin: 90,
				priceCents: 16e3
			}
		],
		employees: [{
			displayName: "Noor Ellis",
			title: "Lead stylist",
			bio: "Color first, then the cut that holds it.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Jules Park",
			title: "Stylist",
			bio: "Cuts and the gloss that should not take all afternoon.",
			avatarUrl: "",
			serviceIndexes: [0, 2]
		}]
	}),
	beauty: bookable({
		niche: "beauty",
		label: "Nails, lashes, makeup",
		kicker: "They book the set",
		blurb: "A set, a fill, a face — booked, not a walk-in.",
		defaultName: "Set Apart",
		tagline: "The set, then you leave.",
		description: "Nails, lashes, and makeup on a clock. You book the set. We hold the chair.",
		address: "New Era · sets by appointment",
		ringColor: "#E07A73",
		soloTitle: "Artist",
		services: [
			{
				group: "Nails",
				name: "Gel set",
				description: "Shape, color, and a finish that lasts.",
				durationMin: 75,
				priceCents: 6500
			},
			{
				group: "Lashes",
				name: "Lash fill",
				description: "A fill on a set you already wear.",
				durationMin: 60,
				priceCents: 8500
			},
			{
				group: "Face",
				name: "Makeup",
				description: "The face for the event. You leave ready.",
				durationMin: 50,
				priceCents: 9500
			}
		],
		employees: [{
			displayName: "Imani Cole",
			title: "Lead artist",
			bio: "Sets and the face that has to last all night.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Remy Sol",
			title: "Artist",
			bio: "Nails and the fills that stay on schedule.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}]
	}),
	wellness: bookable({
		niche: "wellness",
		label: "Massage and bodywork",
		kicker: "They book the hour",
		blurb: "A table, a pressure, a block of quiet.",
		defaultName: "Still Water",
		tagline: "The hour is yours.",
		description: "Bodywork by appointment. Tell us the pressure. We keep the room.",
		address: "New Era · tables on the hour",
		ringColor: "#7EC8E3",
		soloTitle: "Practitioner",
		services: [
			{
				group: "Table",
				name: "Relaxation",
				description: "Sixty minutes. Even pressure. You set the quiet.",
				durationMin: 60,
				priceCents: 11e3
			},
			{
				group: "Table",
				name: "Deep work",
				description: "Ninety minutes on the places that actually hurt.",
				durationMin: 90,
				priceCents: 15e3
			},
			{
				group: "Start",
				name: "First session",
				description: "What hurts, what helps, and the first hour.",
				durationMin: 75,
				priceCents: 13e3
			}
		],
		employees: [{
			displayName: "Sasha Nguyen",
			title: "Lead practitioner",
			bio: "Listens first. The pressure follows what you actually said.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Eden Walsh",
			title: "Practitioner",
			bio: "The longer sessions and the first visits.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	lessons: bookable({
		niche: "lessons",
		label: "Lessons and tutoring",
		kicker: "They book the lesson",
		blurb: "One student, or a small group, on a repeating hour.",
		defaultName: "Second Chair",
		tagline: "Show up. We work the hour.",
		description: "Lessons and tutoring by the block. The same hour, every week, if you want it.",
		address: "New Era · lessons after school",
		ringColor: "#C9A227",
		soloTitle: "Teacher",
		services: [
			{
				group: "One to one",
				name: "Private lesson",
				description: "One student. The work you are actually on.",
				durationMin: 50,
				priceCents: 7e3
			},
			{
				group: "One to one",
				name: "Placement",
				description: "Where you are, and the plan for the next month.",
				durationMin: 40,
				priceCents: 5e3
			},
			{
				group: "Group",
				name: "Small group",
				description: "Up to four. The same lesson, shared.",
				durationMin: 60,
				priceCents: 3500
			}
		],
		employees: [{
			displayName: "Priya Shah",
			title: "Lead teacher",
			bio: "Writes the plan and stays for the hard problem.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}, {
			displayName: "Jonah Reed",
			title: "Teacher",
			bio: "Small groups and the students who would rather not study alone.",
			avatarUrl: "",
			serviceIndexes: [0, 2]
		}]
	}),
	photo: bookable({
		niche: "photo",
		label: "Photography",
		kicker: "They book the session",
		blurb: "A portrait, a mini, or the plan for the event.",
		defaultName: "North Light",
		tagline: "We shoot the hour you booked.",
		description: "Sessions by appointment. You get the time, the place, and the edit that follows.",
		address: "New Era · studio and on location",
		ringColor: "#B388FF",
		soloTitle: "Photographer",
		services: [
			{
				group: "Session",
				name: "Portrait hour",
				description: "One hour. One person or a pair. The edit included.",
				durationMin: 60,
				priceCents: 25e3
			},
			{
				group: "Session",
				name: "Mini",
				description: "Twenty directed frames. A short block.",
				durationMin: 30,
				priceCents: 15e3
			},
			{
				group: "Plan",
				name: "Event consult",
				description: "The timeline, the light, and the date.",
				durationMin: 45,
				priceCents: 1e4
			}
		],
		employees: [{
			displayName: "Ada Morales",
			title: "Photographer",
			bio: "Portraits and the events that need a timeline.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Kit Romero",
			title: "Photographer",
			bio: "Minis and the second camera.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	pets: bookable({
		niche: "pets",
		label: "Pet grooming",
		kicker: "They book the groom",
		blurb: "A bath, a full groom, or just the nails.",
		defaultName: "Good Coat",
		tagline: "In clean. Out finished.",
		description: "Grooms by appointment so the dog is not waiting in a crate all afternoon.",
		address: "New Era · grooms by appointment",
		ringColor: "#E7B48A",
		soloTitle: "Groomer",
		services: [
			{
				group: "Groom",
				name: "Full groom",
				description: "Bath, cut, ears, and nails. Breed cut or your notes.",
				durationMin: 90,
				priceCents: 8500
			},
			{
				group: "Groom",
				name: "Bath + brush",
				description: "A clean coat. No haircut.",
				durationMin: 45,
				priceCents: 4500
			},
			{
				group: "Quick",
				name: "Nail trim",
				description: "Nails only. In and out.",
				durationMin: 20,
				priceCents: 1800
			}
		],
		employees: [{
			displayName: "Harper Lin",
			title: "Lead groomer",
			bio: "Full grooms and the dogs that need a calm room.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}, {
			displayName: "Casey Dunn",
			title: "Groomer",
			bio: "Baths, nails, and the short appointments.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	clean: bookable({
		niche: "clean",
		label: "Home cleaning",
		kicker: "They book the visit",
		blurb: "A standard clean, a deep clean, or the move-out.",
		defaultName: "Clear House",
		tagline: "We arrive when the book says.",
		description: "Home cleans on a clock. You book the visit. We bring the kit.",
		address: "New Era · visits within 15 miles",
		ringColor: "#2EE6D6",
		soloTitle: "Cleaner",
		services: [
			{
				group: "Visit",
				name: "Standard clean",
				description: "Kitchen, baths, floors. A home that is already lived in.",
				durationMin: 120,
				priceCents: 16e3
			},
			{
				group: "Visit",
				name: "Deep clean",
				description: "The corners the weekly clean skips.",
				durationMin: 240,
				priceCents: 28e3
			},
			{
				group: "Move",
				name: "Move-out",
				description: "Empty rooms. The handoff clean.",
				durationMin: 240,
				priceCents: 32e3
			}
		],
		employees: [{
			displayName: "Rosa Alvarez",
			title: "Lead",
			bio: "Walks the house first, then the crew follows her list.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Ben Cho",
			title: "Cleaner",
			bio: "Standard visits and the deep cleans.",
			avatarUrl: "",
			serviceIndexes: [0, 1]
		}]
	}),
	practice: bookable({
		niche: "practice",
		label: "Practice",
		kicker: "They book the visit",
		blurb: "A new visit, a follow-up, or a consult — the chair on a calendar.",
		defaultName: "Lane Practice",
		tagline: "The visit starts on time.",
		description: "A small practice. New visits and follow-ups are booked. The room is ready when you arrive.",
		address: "New Era · visits by appointment",
		ringColor: "#7EC8E3",
		soloTitle: "Practitioner",
		services: [
			{
				group: "Visit",
				name: "New visit",
				description: "The first time. History, the plan, and the block.",
				durationMin: 60,
				priceCents: 18e3
			},
			{
				group: "Visit",
				name: "Follow-up",
				description: "A return visit on a plan you already have.",
				durationMin: 30,
				priceCents: 9e3
			},
			{
				group: "Visit",
				name: "Consult",
				description: "A question and a recommendation. No procedure.",
				durationMin: 30,
				priceCents: 7500
			}
		],
		employees: [{
			displayName: "Dr. Leah Okonkwo",
			title: "Practitioner",
			bio: "New visits and the plan that follows.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Micah Berg",
			title: "Practitioner",
			bio: "Follow-ups and consults.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	counsel: bookable({
		niche: "counsel",
		label: "Advisor",
		kicker: "They book the consult",
		blurb: "An intro, a working session, or a review.",
		defaultName: "Plain Counsel",
		tagline: "The hour has an agenda.",
		description: "Consults for people who need a clear hour, not a waiting room.",
		address: "New Era · calls and the office",
		ringColor: "#C9A227",
		soloTitle: "Advisor",
		services: [
			{
				group: "Consult",
				name: "Intro consult",
				description: "What you need, and whether we are the right hour.",
				durationMin: 30,
				priceCents: 0
			},
			{
				group: "Consult",
				name: "Working session",
				description: "One problem. Notes you can use after.",
				durationMin: 60,
				priceCents: 2e4
			},
			{
				group: "Review",
				name: "Review",
				description: "A look at the work already done.",
				durationMin: 45,
				priceCents: 15e3
			}
		],
		employees: [{
			displayName: "Helen Park",
			title: "Advisor",
			bio: "Starts with the question, ends with a next step.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Omar Aziz",
			title: "Advisor",
			bio: "Working sessions and reviews.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	events: bookable({
		niche: "events",
		label: "Events",
		kicker: "They book the date",
		blurb: "A consult, the ceremony, or the set.",
		defaultName: "Hold the Date",
		tagline: "The date is held when you book it.",
		description: "Event work by the block. Consult first, then the day itself.",
		address: "New Era · and the venue",
		ringColor: "#B388FF",
		soloTitle: "Lead",
		services: [
			{
				group: "Plan",
				name: "Date consult",
				description: "The timeline, the room, and whether the date is open.",
				durationMin: 45,
				priceCents: 0
			},
			{
				group: "Day",
				name: "Ceremony",
				description: "The ceremony block. You have the lead for that hour.",
				durationMin: 90,
				priceCents: 8e4
			},
			{
				group: "Day",
				name: "Reception set",
				description: "The longer block. Sound, the room, the night.",
				durationMin: 240,
				priceCents: 15e4
			}
		],
		employees: [{
			displayName: "Vera Lang",
			title: "Lead",
			bio: "Holds the timeline and the room.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Chris Adeyemi",
			title: "Operator",
			bio: "The set and the second half of the night.",
			avatarUrl: "",
			serviceIndexes: [2]
		}]
	}),
	security: bookable({
		niche: "security",
		label: "Private security",
		kicker: "They book the post",
		blurb: "A consult, a standing post, or the night of an event.",
		defaultName: "Night Watch",
		tagline: "The door is covered when you book it.",
		description: "Private posts and event details. Book the shift, not a maybe.",
		address: "New Era · and the site",
		ringColor: "#7EC8E3",
		soloTitle: "Lead",
		services: [
			{
				group: "Start",
				name: "Site consult",
				description: "Walk the door, the lot, and what the post actually needs.",
				durationMin: 45,
				priceCents: 0
			},
			{
				group: "Post",
				name: "Standing post",
				description: "One officer, one shift, the site you named.",
				durationMin: 240,
				priceCents: 32e3
			},
			{
				group: "Post",
				name: "Event detail",
				description: "The night of the event. Door, floor, and the close.",
				durationMin: 300,
				priceCents: 48e3
			}
		],
		employees: [{
			displayName: "Reed Calder",
			title: "Lead",
			bio: "Walks the site first. The post follows his list.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Imani Brooks",
			title: "Officer",
			bio: "Event nights and the shifts that run late.",
			avatarUrl: "",
			serviceIndexes: [1, 2]
		}]
	}),
	trade: bookable({
		niche: "trade",
		label: "Your trade",
		kicker: "They book a time",
		blurb: "If the list does not name it, start here and rename every line.",
		defaultName: "Open Book",
		tagline: "A time, a price, a yes.",
		description: "A booking page for a trade that is not on the list yet. Rename the lines. The book still works.",
		address: "New Era",
		ringColor: "#2EE6D6",
		soloTitle: "Owner",
		services: [
			{
				group: "Start",
				name: "Intro",
				description: "A short first meeting. Rename this to what you actually sell.",
				durationMin: 30,
				priceCents: 0
			},
			{
				group: "Book",
				name: "Standard booking",
				description: "The usual block. Change the name, the price, and the length.",
				durationMin: 60,
				priceCents: 1e4
			},
			{
				group: "Book",
				name: "Longer block",
				description: "When the work needs more than an hour.",
				durationMin: 120,
				priceCents: 18e3
			}
		],
		employees: [{
			displayName: "Alex Morgan",
			title: "Owner",
			bio: "Takes the book until you rename this to yourself.",
			avatarUrl: "",
			serviceIndexes: [
				0,
				1,
				2
			]
		}]
	})
};
function bookable(input) {
	return {
		...input,
		heroImageUrl: NICHE_MEDIA[input.niche].heroImageUrl,
		heroVideoUrl: NICHE_MEDIA[input.niche].heroVideoUrl,
		heroBlendPercent: NICHE_MEDIA[input.niche].heroBlendPercent,
		introPreset: NICHE_MEDIA[input.niche].introPreset,
		introSpeed: NICHE_MEDIA[input.niche].introSpeed,
		introIntensity: NICHE_MEDIA[input.niche].introIntensity,
		portfolio: []
	};
}
var DEFAULT_HOURS = {
	mon: "09:00-18:00",
	tue: "09:00-18:00",
	wed: "09:00-18:00",
	thu: "09:00-18:00",
	fri: "09:00-18:00",
	sat: "09:00-16:00",
	sun: "closed"
};
var WEEKDAYS = [
	["mon", "Mon"],
	["tue", "Tue"],
	["wed", "Wed"],
	["thu", "Thu"],
	["fri", "Fri"],
	["sat", "Sat"],
	["sun", "Sun"]
];
var VOICE = {
	guide: {
		bench: "The crew",
		heading: "Who rows with you.",
		menuKicker: "Departures",
		menuHeading: "Trips",
		bookLabel: "Book a trip",
		inquiry: "Ask the outfit",
		offerStep: "Trip",
		staffStep: "Guide",
		timeStep: "Launch",
		timeHint: "Pick a launch",
		requestLabel: "Request this launch",
		gallery: "On the water"
	},
	fitness: {
		bench: "The floor",
		heading: "Who coaches the hour.",
		menuKicker: "The book",
		menuHeading: "Sessions",
		bookLabel: "Book a session",
		inquiry: "Ask the gym",
		offerStep: "Session",
		staffStep: "Coach",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this session",
		gallery: "The floor"
	},
	tattoo: {
		bench: "The chair",
		heading: "Who holds the machine.",
		menuKicker: "The book",
		menuHeading: "Work",
		bookLabel: "Book the chair",
		inquiry: "Ask the shop",
		offerStep: "Piece",
		staffStep: "Artist",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this sitting",
		gallery: "The work"
	},
	music: {
		bench: "The room",
		heading: "Who's on the record.",
		menuKicker: "The book",
		menuHeading: "Sessions",
		bookLabel: "Book the room",
		inquiry: "Ask the studio",
		offerStep: "Session",
		staffStep: "Artist",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this session",
		gallery: "The room"
	},
	contractor: {
		bench: "The crew",
		heading: "Who walks the job.",
		menuKicker: "The book",
		menuHeading: "Work",
		bookLabel: "Book a visit",
		inquiry: "Ask the crew",
		offerStep: "Visit",
		staffStep: "Who comes",
		timeStep: "Arrival",
		timeHint: "Pick an arrival",
		requestLabel: "Request this visit",
		gallery: "The jobs"
	},
	location: {
		bench: "The chairs",
		heading: "Who you'll sit with.",
		menuKicker: "The book",
		menuHeading: "Cuts",
		bookLabel: "Book a chair",
		inquiry: "Ask the shop",
		offerStep: "Cut",
		staffStep: "Barber",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this chair",
		gallery: "The chair"
	},
	field: {
		bench: "The crew",
		heading: "Who rolls up.",
		menuKicker: "The book",
		menuHeading: "Calls",
		bookLabel: "Book a call",
		inquiry: "Ask the shop",
		offerStep: "Job",
		staffStep: "Tech",
		timeStep: "Arrival",
		timeHint: "Pick an arrival",
		requestLabel: "Request this call",
		gallery: "The jobs"
	},
	studio: {
		bench: "The studio",
		heading: "Who you'll work with.",
		menuKicker: "The book",
		menuHeading: "Engagements",
		bookLabel: "Book a call",
		inquiry: "Ask the studio",
		offerStep: "Engagement",
		staffStep: "Who builds it",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this call",
		gallery: "The work"
	},
	salon: {
		bench: "The chairs",
		heading: "Who styles you.",
		menuKicker: "The book",
		menuHeading: "Styles",
		bookLabel: "Book a chair",
		inquiry: "Ask the salon",
		offerStep: "Style",
		staffStep: "Stylist",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this chair",
		gallery: "The work"
	},
	beauty: {
		bench: "The artists",
		heading: "Who does the set.",
		menuKicker: "The book",
		menuHeading: "Sets",
		bookLabel: "Book a set",
		inquiry: "Ask the studio",
		offerStep: "Set",
		staffStep: "Artist",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this set",
		gallery: "The work"
	},
	wellness: {
		bench: "The room",
		heading: "Who holds the hour.",
		menuKicker: "The book",
		menuHeading: "Sessions",
		bookLabel: "Book a session",
		inquiry: "Ask the studio",
		offerStep: "Session",
		staffStep: "Practitioner",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this session",
		gallery: "The room"
	},
	lessons: {
		bench: "The teachers",
		heading: "Who teaches the hour.",
		menuKicker: "The book",
		menuHeading: "Lessons",
		bookLabel: "Book a lesson",
		inquiry: "Ask the teacher",
		offerStep: "Lesson",
		staffStep: "Teacher",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this lesson",
		gallery: "The work"
	},
	photo: {
		bench: "The photographers",
		heading: "Who shoots the hour.",
		menuKicker: "The book",
		menuHeading: "Sessions",
		bookLabel: "Book a session",
		inquiry: "Ask the studio",
		offerStep: "Session",
		staffStep: "Photographer",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this session",
		gallery: "The work"
	},
	pets: {
		bench: "The groomers",
		heading: "Who finishes the coat.",
		menuKicker: "The book",
		menuHeading: "Grooms",
		bookLabel: "Book a groom",
		inquiry: "Ask the shop",
		offerStep: "Groom",
		staffStep: "Groomer",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this groom",
		gallery: "The work"
	},
	clean: {
		bench: "The crew",
		heading: "Who comes to the house.",
		menuKicker: "The book",
		menuHeading: "Cleans",
		bookLabel: "Book a clean",
		inquiry: "Ask the crew",
		offerStep: "Clean",
		staffStep: "Who comes",
		timeStep: "Arrival",
		timeHint: "Pick an arrival",
		requestLabel: "Request this clean",
		gallery: "The jobs"
	},
	practice: {
		bench: "The practice",
		heading: "Who sees you.",
		menuKicker: "The book",
		menuHeading: "Visits",
		bookLabel: "Book a visit",
		inquiry: "Ask the practice",
		offerStep: "Visit",
		staffStep: "Practitioner",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this visit",
		gallery: "The practice"
	},
	counsel: {
		bench: "The advisors",
		heading: "Who takes the hour.",
		menuKicker: "The book",
		menuHeading: "Consults",
		bookLabel: "Book a consult",
		inquiry: "Ask the office",
		offerStep: "Consult",
		staffStep: "Advisor",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this consult",
		gallery: "The work"
	},
	events: {
		bench: "The crew",
		heading: "Who holds the date.",
		menuKicker: "The book",
		menuHeading: "Dates",
		bookLabel: "Book the date",
		inquiry: "Ask the lead",
		offerStep: "Date",
		staffStep: "Who works it",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this date",
		gallery: "The dates"
	},
	security: {
		bench: "The post",
		heading: "Who covers the door.",
		menuKicker: "The book",
		menuHeading: "Posts",
		bookLabel: "Book a post",
		inquiry: "Ask the lead",
		offerStep: "Post",
		staffStep: "Officer",
		timeStep: "Shift",
		timeHint: "Pick a start",
		requestLabel: "Request this post",
		gallery: "The sites"
	},
	trade: {
		bench: "The book",
		heading: "Who takes the time.",
		menuKicker: "The book",
		menuHeading: "Offerings",
		bookLabel: "Book a time",
		inquiry: "Ask",
		offerStep: "Booking",
		staffStep: "Who",
		timeStep: "Time",
		timeHint: "Pick a time",
		requestLabel: "Request this time",
		gallery: "The work"
	}
};
function nicheCopy(niche) {
	return VOICE[niche] ?? VOICE.location;
}
var PRICE_UNIT_LABEL = {
	flat: "Flat fee",
	person: "Per person",
	boat: "Per boat"
};
/** Units the admin may assign, taken from that trade's template. */
function priceUnitsFor(niche) {
	return unitsForTemplate(NICHES[niche]?.priceUnits);
}
function defaultPriceUnit(niche) {
	return defaultUnit(priceUnitsFor(niche));
}
function formatDuration(minutes) {
	const min = Math.max(0, Math.round(minutes));
	if (min < 60) return `${min} min`;
	const hours = Math.floor(min / 60);
	const rest = min % 60;
	const hourLabel = hours === 1 ? "1 hr" : `${hours} hr`;
	return rest === 0 ? hourLabel : `${hourLabel} ${rest} min`;
}
function formatPrice(service) {
	const money = formatMoney(service.priceCents);
	if (service.priceUnit === "person") return `${money} / person`;
	if (service.priceUnit === "boat") return `${money} / boat`;
	return money;
}
function formatOffer(service) {
	return `${formatPrice(service)} · ${formatDuration(service.durationMin)}`;
}
function serviceGroups(services) {
	const groups = [];
	for (const service of services ?? []) {
		const label = typeof service.group === "string" ? service.group : "";
		const last = groups[groups.length - 1];
		if (last && last.label === label) last.items.push(service);
		else groups.push({
			label,
			items: [service]
		});
	}
	return groups;
}
var INTRO_PRESETS = [
	{
		id: "kenburns",
		label: "Ken Burns (Scale + Pan Inward)"
	},
	{
		id: "zoomin",
		label: "Zoom In Only"
	},
	{
		id: "zoomout",
		label: "Zoom Out Only"
	},
	{
		id: "panlr",
		label: "Pan Left-to-Right"
	},
	{
		id: "pantd",
		label: "Pan Top-Down"
	},
	{
		id: "fade",
		label: "Fade In + Subtle Scale"
	},
	{
		id: "none",
		label: "None (Static)"
	}
];
var INTRO_FX_KEY = "axiom:intro-fx";
var INTRO_FX_EVENT = "axiom:intro-fx";
function parseIntroPreset(raw) {
	const v = typeof raw === "string" ? raw.toLowerCase() : "";
	if (INTRO_PRESETS.some((p) => p.id === v)) return v;
	return "kenburns";
}
function readIntroFx() {
	if (typeof window === "undefined") return true;
	return window.localStorage.getItem(INTRO_FX_KEY) !== "off";
}
function writeIntroFx(on) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(INTRO_FX_KEY, on ? "on" : "off");
	window.dispatchEvent(new Event(INTRO_FX_EVENT));
}
function introDurationSec(speed) {
	return 3 + (100 - Math.min(100, Math.max(1, speed))) / 100 * 9;
}
/**
* Pixel travel at the end of a hero scroll.
* The film lags (slowest), the tone wash and light move farther the same way,
* and the title travels the opposite way so it leaves faster.
* Intensity 0 keeps every layer still. Speed, already stored per shop, only leans on that distance.
*/
function parallaxTravel(intensity, speed = 40) {
	const depth = Math.min(100, Math.max(0, intensity)) / 100;
	if (depth === 0) return {
		background: 0,
		wash: 0,
		light: 0,
		foreground: 0
	};
	const pace = .85 + .3 * (Math.min(100, Math.max(1, speed)) / 100);
	return {
		background: Math.round((16 + 48 * depth) * pace),
		wash: Math.round((32 + 80 * depth) * pace),
		light: Math.round((48 + 100 * depth) * pace),
		foreground: -Math.round((24 + 70 * depth) * pace)
	};
}
/**
* Loop rate while the hero crosses the viewport. 1 at rest and once the hero
* has left, so a film off-screen is not still being scrubbed.
*/
function heroPlaybackRate(progress, intensity) {
	const p = Math.min(1, Math.max(0, progress));
	if (p <= .04 || p >= .96) return 1;
	return 1 + .18 * (Math.min(100, Math.max(0, intensity)) / 100) * Math.sin(p * Math.PI);
}
function cameraMotion(preset, intensity) {
	const i = Math.min(100, Math.max(0, intensity)) / 100;
	const zoom = 1 + .18 * i;
	const pan = 5.5 * i;
	switch (preset) {
		case "kenburns": return {
			initial: {
				scale: 1.02,
				x: `${-pan}%`,
				y: `${-pan * .35}%`,
				opacity: 1
			},
			animate: {
				scale: zoom,
				x: `${pan * .7}%`,
				y: `${pan * .25}%`,
				opacity: 1
			}
		};
		case "zoomin": return {
			initial: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: zoom,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		case "zoomout": return {
			initial: {
				scale: zoom,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		case "panlr": return {
			initial: {
				scale: 1 + .1 * i,
				x: `${-pan}%`,
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1 + .1 * i,
				x: `${pan}%`,
				y: "0%",
				opacity: 1
			}
		};
		case "pantd": return {
			initial: {
				scale: 1 + .1 * i,
				x: "0%",
				y: `${-pan}%`,
				opacity: 1
			},
			animate: {
				scale: 1 + .1 * i,
				x: "0%",
				y: `${pan}%`,
				opacity: 1
			}
		};
		case "fade": return {
			initial: {
				scale: 1 + .08 * i,
				x: "0%",
				y: "0%",
				opacity: 0
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		default: return {
			initial: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
	}
}
//#endregion
export { writeIntroFx as A, parseIntroPreset as C, resolveHeroMedia as D, renameSection as E, sectionsOf as O, parallaxTravel as S, readIntroFx as T, leadHeroFor as _, NICHE_MEDIA as a, nextSectionName as b, RING_PRESETS as c, defaultPriceUnit as d, formatOffer as f, introDurationSec as g, insertRow as h, NICHES as i, serviceGroups as k, WEEKDAYS as l, heroPlaybackRate as m, INTRO_FX_EVENT as n, NICHE_ORDER as o, formatPrice as p, INTRO_PRESETS as r, PRICE_UNIT_LABEL as s, DEFAULT_HOURS as t, cameraMotion as u, moveRow as v, priceUnitsFor as w, nicheCopy as x, moveSection as y };
