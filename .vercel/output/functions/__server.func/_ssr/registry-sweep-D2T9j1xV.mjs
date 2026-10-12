//#region node_modules/.nitro/vite/services/ssr/assets/registry-sweep-D2T9j1xV.js
/** Invented filings per county. The desk stages them in batches of 1,000. */
var SWEEP_PER_COUNTY = 2e3;
var ACTIVE_COUNTIES = [
	{
		county: "Miami-Dade County",
		cities: [
			"Miami",
			"Hialeah",
			"Miami Beach"
		],
		areaCode: "305"
	},
	{
		county: "Broward County",
		cities: [
			"Fort Lauderdale",
			"Hollywood",
			"Pembroke Pines"
		],
		areaCode: "954"
	},
	{
		county: "Palm Beach County",
		cities: [
			"West Palm Beach",
			"Boca Raton",
			"Delray Beach"
		],
		areaCode: "561"
	},
	{
		county: "Hillsborough County",
		cities: [
			"Tampa",
			"Brandon",
			"Plant City"
		],
		areaCode: "813"
	},
	{
		county: "Orange County",
		cities: [
			"Orlando",
			"Winter Park",
			"Apopka"
		],
		areaCode: "407"
	},
	{
		county: "Duval County",
		cities: ["Jacksonville", "Jacksonville Beach"],
		areaCode: "904"
	}
];
var ACTIVE_STATE = "FL";
/** Craft word used in the business title, and the filing phrase stored as the trade. */
var SWEEP_FILINGS = [
	{
		craft: "Guide",
		phrase: "Guide services"
	},
	{
		craft: "Training",
		phrase: "Fitness coaching / Personal training"
	},
	{
		craft: "Combat",
		phrase: "Combat sports"
	},
	{
		craft: "Bodywork",
		phrase: "Massage and bodywork"
	},
	{
		craft: "Lessons",
		phrase: "Lessons and tutoring"
	},
	{
		craft: "Salon",
		phrase: "Hair salon"
	},
	{
		craft: "Lash",
		phrase: "Nails, lashes, makeup"
	},
	{
		craft: "Tattoo",
		phrase: "Tattoo shop"
	},
	{
		craft: "Photo",
		phrase: "Photography"
	},
	{
		craft: "Grooming",
		phrase: "Pet grooming"
	},
	{
		craft: "Sessions",
		phrase: "Music artist / Rapper"
	},
	{
		craft: "Creator",
		phrase: "Content creator"
	},
	{
		craft: "Landscaper",
		phrase: "Landscaper"
	},
	{
		craft: "Foodtruck",
		phrase: "Mobile food truck"
	},
	{
		craft: "Dogwalk",
		phrase: "Dog walking"
	},
	{
		craft: "Detailer",
		phrase: "Mobile detailer"
	},
	{
		craft: "Performer",
		phrase: "Entertainer"
	},
	{
		craft: "Events",
		phrase: "Events"
	},
	{
		craft: "Build",
		phrase: "General contractor / Home services"
	},
	{
		craft: "Cleaning",
		phrase: "Home cleaning"
	},
	{
		craft: "Field",
		phrase: "Field service"
	},
	{
		craft: "Keys",
		phrase: "Mobile locksmith"
	},
	{
		craft: "Firewood",
		phrase: "Firewood cutting"
	},
	{
		craft: "Watch",
		phrase: "Private security"
	},
	{
		craft: "Practice",
		phrase: "Practice"
	},
	{
		craft: "Advisor",
		phrase: "Advisor"
	},
	{
		craft: "Barber",
		phrase: "Barber"
	},
	{
		craft: "Studio",
		phrase: "Studio"
	},
	{
		craft: "Retail",
		phrase: "Retail / Merchandise"
	},
	{
		craft: "Independent",
		phrase: "Sole proprietor"
	},
	{
		craft: "Electrical",
		phrase: "Electrical"
	},
	{
		craft: "Plumbing",
		phrase: "Plumbing"
	},
	{
		craft: "HVAC",
		phrase: "HVAC"
	},
	{
		craft: "Roofing",
		phrase: "Roofing"
	},
	{
		craft: "Drywall",
		phrase: "Drywall"
	},
	{
		craft: "Framing",
		phrase: "Framing"
	},
	{
		craft: "Concrete",
		phrase: "Concrete"
	},
	{
		craft: "Handyman",
		phrase: "Handyman"
	},
	{
		craft: "Lock",
		phrase: "Lock Services"
	},
	{
		craft: "Cordwood",
		phrase: "Firewood Services"
	},
	{
		craft: "Construction",
		phrase: "Construction"
	},
	{
		craft: "Mechanic",
		phrase: "Mobile mechanic"
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
	"Claire"
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
	"Greene"
];
function registrySweepTotal() {
	return ACTIVE_COUNTIES.length * SWEEP_PER_COUNTY;
}
function registryCountyAt(offset) {
	const total = registrySweepTotal();
	if (total === 0) return "";
	const index = Math.min(Math.max(0, Math.floor(offset)), total - 1);
	return ACTIVE_COUNTIES[Math.floor(index / 2e3)]?.county ?? "";
}
/** One slice of the statewide filing list. Earlier rows are not built. */
function registrySweepSlice(offset, limit) {
	const total = registrySweepTotal();
	const start = Math.max(0, Math.floor(offset));
	const end = Math.min(total, start + Math.max(0, Math.floor(limit)));
	const rows = [];
	for (let index = start; index < end; index += 1) rows.push(recordAt(index));
	return rows;
}
function recordAt(index) {
	const countyIndex = Math.floor(index / SWEEP_PER_COUNTY);
	const within = index % SWEEP_PER_COUNTY;
	const place = ACTIVE_COUNTIES[countyIndex];
	const filing = SWEEP_FILINGS[within % SWEEP_FILINGS.length];
	const copy = Math.floor(within / SWEEP_FILINGS.length) + 1;
	const first = FIRST[index % FIRST.length];
	const last = LAST[index % LAST.length];
	const sole = within % 7 === 0;
	return {
		line: index + 2,
		name: `${first} ${last} ${filing.craft} ${ACTIVE_STATE} ${copy}`,
		city: place.cities[within % place.cities.length],
		county: place.county,
		trade: sole ? "Sole proprietor" : filing.phrase,
		email: index % 2 === 0 ? `${ACTIVE_STATE.toLowerCase()}${index}@sweep.example` : "",
		phone: `${place.areaCode}-555-${String(within).padStart(5, "0")}`,
		website: index % 3 === 0 ? "sweep.example" : "",
		phoneLine: index % 2 === 0 ? "mobile" : "landline"
	};
}
//#endregion
export { SWEEP_PER_COUNTY, registryCountyAt, registrySweepSlice, registrySweepTotal };
