/**
 * Southern Oregon test roster for the master desk.
 * Names, owners, reviews, and 541-555 numbers are invented listing fields.
 * This stays out of migrations so it does not ship into the live database.
 * Several shops are generated for every vertical, including trades that are
 * not one of the built-in niches.
 */

export const HOME_REGION_LABEL = "Southern Oregon";

export const HOME_REGION_COUNTIES = ["Jackson County", "Josephine County", "Douglas County"] as const;

export type HomeCounty = (typeof HOME_REGION_COUNTIES)[number];

export const HOME_REGION_CITIES: Record<HomeCounty, readonly string[]> = {
  "Jackson County": ["Medford", "Ashland", "Central Point"],
  "Josephine County": ["Grants Pass", "Cave Junction"],
  "Douglas County": ["Roseburg", "Winston", "Sutherlin"],
};

/** How many invented shops to place in each city for each vertical. */
export const HOME_REGION_COPIES = 3;

const LANES = ["North", "South", "East"] as const;

/**
 * Category phrase stored on the lead. Known phrases map to a built-in niche.
 * Anything else becomes its own trade key and picks up a keyword still or the
 * catch-all trade photo.
 */
export const REGIONAL_VERTICALS: readonly { category: string; craft: string }[] = [
  { category: "Guide services", craft: "Drift" },
  { category: "Fitness coaching / Personal training", craft: "Training" },
  { category: "Combat sports", craft: "Round" },
  { category: "Massage and bodywork", craft: "Bodywork" },
  { category: "Lessons and tutoring", craft: "Lessons" },
  { category: "Hair salon", craft: "Shear" },
  { category: "Nails, lashes, makeup", craft: "Lash" },
  { category: "Tattoo shop", craft: "Needle" },
  { category: "Photography", craft: "Frame" },
  { category: "Pet grooming", craft: "Paws" },
  { category: "Music artist / Rapper", craft: "Sessions" },
  { category: "Content creator", craft: "Edit" },
  { category: "Entertainer", craft: "Stage" },
  { category: "Events", craft: "Hosts" },
  { category: "General contractor / Home services", craft: "Build" },
  { category: "Home cleaning", craft: "Shine" },
  { category: "Field service", craft: "Curb Call" },
  { category: "Mobile locksmith", craft: "Keys" },
  { category: "Private security", craft: "Watch" },
  { category: "Practice", craft: "Visit Room" },
  { category: "Advisor", craft: "Consult" },
  { category: "Barber", craft: "Fades" },
  { category: "Studio", craft: "Daylight" },
  { category: "Retail / Merchandise", craft: "Counter" },
  { category: "HVAC", craft: "HVAC" },
  { category: "Electrical", craft: "Wiring" },
  { category: "Landscaper", craft: "Lawn" },
  { category: "Roofing", craft: "Roofing" },
  { category: "Plumbing", craft: "Plumbing" },
  { category: "Hunting guide", craft: "Hunting" },
  { category: "Firewood", craft: "Firewood" },
  { category: "Mobile food truck", craft: "Food Truck" },
  { category: "Air conditioning", craft: "Cooling" },
  { category: "Dog walking", craft: "Walks" },
  { category: "Auto detailing", craft: "Detail" },
  { category: "Towing", craft: "Towing" },
  { category: "Pest control", craft: "Pest" },
  { category: "Locksmith", craft: "Lock" },
  { category: "Painting", craft: "Paint" },
  { category: "Flooring", craft: "Floor" },
  { category: "Window cleaning", craft: "Glass" },
  { category: "Pressure washing", craft: "Wash" },
  { category: "Tree service", craft: "Tree" },
  { category: "Handyman", craft: "Handyman" },
  { category: "Moving", craft: "Moving" },
  { category: "Junk removal", craft: "Haul" },
  { category: "Pool service", craft: "Pool" },
  { category: "Garage door", craft: "Garage" },
  { category: "Appliance repair", craft: "Appliance" },
  { category: "Computer repair", craft: "Circuit" },
  { category: "Bookkeeping", craft: "Ledger" },
  { category: "Notary", craft: "Notary" },
  { category: "House sitting", craft: "Sit" },
  { category: "Pet sitting", craft: "Sitters" },
  { category: "Dog training", craft: "Recall" },
  { category: "Personal chef", craft: "Table" },
  { category: "Catering", craft: "Catering" },
  { category: "Fence building", craft: "Fence" },
  { category: "Concrete", craft: "Concrete" },
  { category: "Septic service", craft: "Septic" },
  { category: "Solar install", craft: "Solar" },
  { category: "Chimney sweep", craft: "Chimney" },
  { category: "Irrigation", craft: "Irrigation" },
  { category: "Mobile mechanic", craft: "Wrench" },
];

const FIRST = ["Maren", "Cole", "Dana", "Jonah", "Elena", "Priya", "Noah", "Leah", "Nina", "Luis", "Amira", "Claire", "Malik", "Carmen", "Hector", "Helen", "Omar", "Mateo", "June", "Alex"];
const LAST = ["Holt", "Brennan", "Okonkwo", "Hale", "Voss", "Shah", "Feldman", "Ortiz", "Brooks", "Navarro", "Nguyen", "Greene", "Solis", "Ramos", "Cho", "Aziz", "Diaz", "Park", "Morgan", "Walsh"];

type Channel = { phoneLine: "mobile" | "landline"; hasWebsite: boolean };

/** Rotates SMS-only, email-only, both, and no-channel so every batch shape exists. */
const CHANNELS: Channel[] = [
  { phoneLine: "landline", hasWebsite: true },
  { phoneLine: "mobile", hasWebsite: false },
  { phoneLine: "mobile", hasWebsite: true },
  { phoneLine: "landline", hasWebsite: false },
  { phoneLine: "mobile", hasWebsite: true },
];

function leadSlug(businessName: string, city: string): string {
  const raw = `${businessName} ${city}`
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return raw || "lead";
}

function mockEmail(businessName: string, city: string, hasWebsite: boolean): string {
  if (!hasWebsite) return "";
  const host = leadSlug(businessName, city).replace(/-/g, "");
  return `desk@${host}.example`;
}

export function homeRegionLeads() {
  const rows: {
    businessName: string;
    contactName: string;
    city: string;
    county: HomeCounty;
    tradeType: string;
    reviewScore: number;
    reviewCount: number;
    hasWebsite: boolean;
    phoneLine: "mobile" | "landline";
    leadSlug: string;
    contactPhone: string;
    contactEmail: string;
  }[] = [];

  let index = 0;
  for (const county of HOME_REGION_COUNTIES) {
    for (const city of HOME_REGION_CITIES[county]) {
      for (const vertical of REGIONAL_VERTICALS) {
        for (let copy = 0; copy < HOME_REGION_COPIES; copy += 1) {
          const lane = LANES[copy] ?? `Lane ${copy + 1}`;
          const businessName = `${lane} ${vertical.craft}`;
          const channel = CHANNELS[index % CHANNELS.length] ?? CHANNELS[0];
          const contactName = `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]}`;
          rows.push({
            businessName,
            contactName,
            city,
            county,
            tradeType: vertical.category,
            reviewScore: Math.round((4.2 + (index % 8) * 0.1) * 10) / 10,
            reviewCount: 12 + (index % 90),
            hasWebsite: channel.hasWebsite,
            phoneLine: channel.phoneLine,
            leadSlug: leadSlug(businessName, city),
            contactPhone: `541-555-${String(1001 + index).padStart(4, "0")}`,
            contactEmail: mockEmail(businessName, city, channel.hasWebsite),
          });
          index += 1;
        }
      }
    }
  }
  return rows;
}
