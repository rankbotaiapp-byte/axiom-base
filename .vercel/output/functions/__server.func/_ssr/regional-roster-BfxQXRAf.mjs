//#region node_modules/.nitro/vite/services/ssr/assets/regional-roster-BfxQXRAf.js
/**
* Southern Oregon test roster for the master desk.
* Names, owners, reviews, and 541-555 numbers are invented listing fields.
* This stays out of migrations so it does not ship into the live database.
* Several shops are generated for every vertical, including trades that are
* not one of the built-in niches.
*/
var HOME_REGION_LABEL = "Southern Oregon";
var HOME_REGION_COUNTIES = [
	"Jackson County",
	"Josephine County",
	"Douglas County"
];
var HOME_REGION_CITIES = {
	"Jackson County": [
		"Medford",
		"Ashland",
		"Central Point"
	],
	"Josephine County": ["Grants Pass", "Cave Junction"],
	"Douglas County": [
		"Roseburg",
		"Winston",
		"Sutherlin"
	]
};
var LANES = [
	"North",
	"South",
	"East"
];
/**
* Category phrase stored on the lead. Known phrases map to a built-in niche.
* Anything else becomes its own trade key and picks up a keyword still or the
* catch-all trade photo.
*/
var REGIONAL_VERTICALS = [
	{
		category: "Guide services",
		craft: "Drift"
	},
	{
		category: "Fitness coaching / Personal training",
		craft: "Training"
	},
	{
		category: "Combat sports",
		craft: "Round"
	},
	{
		category: "Massage and bodywork",
		craft: "Bodywork"
	},
	{
		category: "Lessons and tutoring",
		craft: "Lessons"
	},
	{
		category: "Hair salon",
		craft: "Shear"
	},
	{
		category: "Nails, lashes, makeup",
		craft: "Lash"
	},
	{
		category: "Tattoo shop",
		craft: "Needle"
	},
	{
		category: "Photography",
		craft: "Frame"
	},
	{
		category: "Pet grooming",
		craft: "Paws"
	},
	{
		category: "Music artist / Rapper",
		craft: "Sessions"
	},
	{
		category: "Content creator",
		craft: "Edit"
	},
	{
		category: "Entertainer",
		craft: "Stage"
	},
	{
		category: "Events",
		craft: "Hosts"
	},
	{
		category: "General contractor / Home services",
		craft: "Build"
	},
	{
		category: "Home cleaning",
		craft: "Shine"
	},
	{
		category: "Field service",
		craft: "Curb Call"
	},
	{
		category: "Mobile locksmith",
		craft: "Keys"
	},
	{
		category: "Private security",
		craft: "Watch"
	},
	{
		category: "Practice",
		craft: "Visit Room"
	},
	{
		category: "Advisor",
		craft: "Consult"
	},
	{
		category: "Barber",
		craft: "Fades"
	},
	{
		category: "Studio",
		craft: "Daylight"
	},
	{
		category: "Retail / Merchandise",
		craft: "Counter"
	},
	{
		category: "HVAC",
		craft: "HVAC"
	},
	{
		category: "Electrical",
		craft: "Wiring"
	},
	{
		category: "Landscaper",
		craft: "Lawn"
	},
	{
		category: "Roofing",
		craft: "Roofing"
	},
	{
		category: "Plumbing",
		craft: "Plumbing"
	},
	{
		category: "Hunting guide",
		craft: "Hunting"
	},
	{
		category: "Firewood",
		craft: "Firewood"
	},
	{
		category: "Mobile food truck",
		craft: "Food Truck"
	},
	{
		category: "Air conditioning",
		craft: "Cooling"
	},
	{
		category: "Dog walking",
		craft: "Walks"
	},
	{
		category: "Auto detailing",
		craft: "Detail"
	},
	{
		category: "Towing",
		craft: "Towing"
	},
	{
		category: "Pest control",
		craft: "Pest"
	},
	{
		category: "Locksmith",
		craft: "Lock"
	},
	{
		category: "Painting",
		craft: "Paint"
	},
	{
		category: "Flooring",
		craft: "Floor"
	},
	{
		category: "Window cleaning",
		craft: "Glass"
	},
	{
		category: "Pressure washing",
		craft: "Wash"
	},
	{
		category: "Tree service",
		craft: "Tree"
	},
	{
		category: "Handyman",
		craft: "Handyman"
	},
	{
		category: "Moving",
		craft: "Moving"
	},
	{
		category: "Junk removal",
		craft: "Haul"
	},
	{
		category: "Pool service",
		craft: "Pool"
	},
	{
		category: "Garage door",
		craft: "Garage"
	},
	{
		category: "Appliance repair",
		craft: "Appliance"
	},
	{
		category: "Computer repair",
		craft: "Circuit"
	},
	{
		category: "Bookkeeping",
		craft: "Ledger"
	},
	{
		category: "Notary",
		craft: "Notary"
	},
	{
		category: "House sitting",
		craft: "Sit"
	},
	{
		category: "Pet sitting",
		craft: "Sitters"
	},
	{
		category: "Dog training",
		craft: "Recall"
	},
	{
		category: "Personal chef",
		craft: "Table"
	},
	{
		category: "Catering",
		craft: "Catering"
	},
	{
		category: "Fence building",
		craft: "Fence"
	},
	{
		category: "Concrete",
		craft: "Concrete"
	},
	{
		category: "Septic service",
		craft: "Septic"
	},
	{
		category: "Solar install",
		craft: "Solar"
	},
	{
		category: "Chimney sweep",
		craft: "Chimney"
	},
	{
		category: "Irrigation",
		craft: "Irrigation"
	},
	{
		category: "Mobile mechanic",
		craft: "Wrench"
	}
];
var FIRST = [
	"Maren",
	"Cole",
	"Dana",
	"Jonah",
	"Elena",
	"Priya",
	"Noah",
	"Leah",
	"Nina",
	"Luis",
	"Amira",
	"Claire",
	"Malik",
	"Carmen",
	"Hector",
	"Helen",
	"Omar",
	"Mateo",
	"June",
	"Alex"
];
var LAST = [
	"Holt",
	"Brennan",
	"Okonkwo",
	"Hale",
	"Voss",
	"Shah",
	"Feldman",
	"Ortiz",
	"Brooks",
	"Navarro",
	"Nguyen",
	"Greene",
	"Solis",
	"Ramos",
	"Cho",
	"Aziz",
	"Diaz",
	"Park",
	"Morgan",
	"Walsh"
];
/** Rotates SMS-only, email-only, both, and no-channel so every batch shape exists. */
var CHANNELS = [
	{
		phoneLine: "landline",
		hasWebsite: true
	},
	{
		phoneLine: "mobile",
		hasWebsite: false
	},
	{
		phoneLine: "mobile",
		hasWebsite: true
	},
	{
		phoneLine: "landline",
		hasWebsite: false
	},
	{
		phoneLine: "mobile",
		hasWebsite: true
	}
];
function leadSlug(businessName, city) {
	return `${businessName} ${city}`.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64) || "lead";
}
function mockEmail(businessName, city, hasWebsite) {
	if (!hasWebsite) return "";
	return `desk@${leadSlug(businessName, city).replace(/-/g, "")}.example`;
}
function homeRegionLeads() {
	const rows = [];
	let index = 0;
	for (const county of HOME_REGION_COUNTIES) for (const city of HOME_REGION_CITIES[county]) for (const vertical of REGIONAL_VERTICALS) for (let copy = 0; copy < 3; copy += 1) {
		const businessName = `${LANES[copy] ?? `Lane ${copy + 1}`} ${vertical.craft}`;
		const channel = CHANNELS[index % CHANNELS.length] ?? CHANNELS[0];
		const contactName = `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]}`;
		rows.push({
			businessName,
			contactName,
			city,
			county,
			tradeType: vertical.category,
			reviewScore: Math.round((4.2 + index % 8 * .1) * 10) / 10,
			reviewCount: 12 + index % 90,
			hasWebsite: channel.hasWebsite,
			phoneLine: channel.phoneLine,
			leadSlug: leadSlug(businessName, city),
			contactPhone: `541-555-${String(1001 + index).padStart(4, "0")}`,
			contactEmail: mockEmail(businessName, city, channel.hasWebsite)
		});
		index += 1;
	}
	return rows;
}
//#endregion
export { HOME_REGION_LABEL as n, homeRegionLeads as r, HOME_REGION_COUNTIES as t };
