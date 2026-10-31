/**
 * Sole public Axiom inventory: 21 verified niches ↔ `*-hero-animation.mp4` loops.
 * Landing, master hub, onboard, sweep, and shop create all read from here.
 */

export const CATALOG = [
  {
    id: "auto",
    file: "auto-hero-animation.mp4",
    card: "/media/heroes/auto-repair.png",
    label: "Auto",
    blurb: "Repair, detail, and the bay on a calendar.",
    defaultName: "Night Circuit",
    tagline: "The bay opens when you book it.",
    kicker: "They book the bay",
  },
  {
    id: "barber",
    file: "barber-hero-animation.mp4",
    label: "Barber",
    blurb: "Fades, hot towels, and a chair that starts on time.",
    defaultName: "Ashland Barber Co.",
    tagline: "A straight cut and the chair by the window.",
    kicker: "They book the chair",
  },
  {
    id: "bow-tech",
    file: "bow-tech-hero-animation.mp4",
    card: "/media/heroes/custom-bow-tech.jpg",
    label: "Bow tech",
    blurb: "Custom bows, strings, and the workbench.",
    defaultName: "Ridge Bow Works",
    tagline: "Tune the limb. Set the rest.",
    kicker: "They book the bench",
  },
  {
    id: "canine",
    file: "bear-charge-hero-animation.mp4",
    card: "/media/heroes/pets.jpg",
    label: "Canine",
    blurb: "Grooming, boarding, and outdoor animal work.",
    defaultName: "Charge Kennel",
    tagline: "The run opens on the hour.",
    kicker: "They book the run",
  },
  {
    id: "contractor",
    file: "orb-explosion-hero-animation.mp4",
    card: "/media/heroes/contractor.jpg",
    label: "Contractor",
    blurb: "General build, site visits, and the job book.",
    defaultName: "Rogue Contractor",
    tagline: "The job starts when the visit is confirmed.",
    kicker: "They book the site",
  },
  {
    id: "electrical",
    file: "electrician-hero-animation.mp4",
    card: "/media/heroes/electrical.jpg",
    label: "Electrical",
    blurb: "Panels, runs, and service calls.",
    defaultName: "Cascade Electric",
    tagline: "Power on. The ticket is clear.",
    kicker: "They book the call",
  },
  {
    id: "fabrication",
    file: "content-cretion-hero-animation.mp4",
    label: "Fabrication",
    blurb: "Custom make, weld, and shop builds.",
    defaultName: "Meridian Fab",
    tagline: "Cut, fit, finish.",
    kicker: "They book the shop",
  },
  {
    id: "forestry",
    file: "leopard-hero-animation.mp4",
    label: "Forestry",
    blurb: "Land, timber, and outdoor crew days.",
    defaultName: "High Desert Forestry",
    tagline: "The stand is marked. The crew is booked.",
    kicker: "They book the stand",
  },
  {
    id: "glasswork",
    file: "photogaphy-hero-animation.mp4",
    card: "/media/heroes/photographer-1.jpg",
    label: "Glasswork",
    blurb: "Glass, light, and precision installs.",
    defaultName: "North Frame Glass",
    tagline: "Measure once. Set the pane.",
    kicker: "They book the pane",
  },
  {
    id: "hvac",
    file: "cleaner-hero-animation.mp4",
    card: "/media/heroes/hvac.jpg",
    label: "HVAC",
    blurb: "Heat, cool, and indoor air service.",
    defaultName: "Valley Air",
    tagline: "Comfort on a calendar.",
    kicker: "They book the visit",
  },
  {
    id: "landscaping",
    file: "guide-service-hero-animation.mp4",
    card: "/media/heroes/landscaper.jpg",
    label: "Landscaping",
    blurb: "Grounds, irrigation, and outdoor builds.",
    defaultName: "Creek Line Landscapes",
    tagline: "The yard is on the book.",
    kicker: "They book the grounds",
  },
  {
    id: "machining",
    file: "gunsmith-hero-animation.mp4",
    label: "Machining",
    blurb: "Precision metal, fixtures, and bench work.",
    defaultName: "Bench Mark Machine",
    tagline: "Tolerance held. Ticket closed.",
    kicker: "They book the spindle",
  },
  {
    id: "plumbing",
    file: "plumbers-hero-animation.mp4",
    card: "/media/heroes/plumbing.jpg",
    label: "Plumbing",
    blurb: "Lines, fixtures, and emergency calls.",
    defaultName: "Main Street Plumbing",
    tagline: "The leak stops when we arrive.",
    kicker: "They book the line",
  },
  {
    id: "power-sports",
    file: "boarding-lessons-hero-animation.mp4",
    card: "/media/heroes/snow-sports-lessons.jpg",
    label: "Power sports",
    blurb: "Boards, sleds, and lesson blocks.",
    defaultName: "Board Line",
    tagline: "Gear up. The block is yours.",
    kicker: "They book the block",
  },
  {
    id: "roofing",
    file: "tiger-hero-animation.mp4",
    card: "/media/heroes/roofing.jpg",
    label: "Roofing",
    blurb: "Shingles, metal, and roof inspections.",
    defaultName: "Ridge Line Roofing",
    tagline: "Up on the pitch. Done before dark.",
    kicker: "They book the roof",
  },
  {
    id: "security",
    file: "raptor-hero-animation.mp4",
    label: "Security",
    blurb: "Patrol, post, and private watch.",
    defaultName: "Raptor Watch",
    tagline: "The post is covered.",
    kicker: "They book the post",
  },
  {
    id: "stone-masonry",
    file: "owl-attack-hero-animation.mp4",
    label: "Stone masonry",
    blurb: "Stone, mortar, and hardscape builds.",
    defaultName: "Owl Creek Stone",
    tagline: "Set the course. Lay the face.",
    kicker: "They book the wall",
  },
  {
    id: "taxidermy",
    file: "leapard-page-hero-animation.mp4",
    label: "Taxidermy",
    blurb: "Mounts, restoration, and wildlife finish work.",
    defaultName: "Leopard Page Taxidermy",
    tagline: "The mount is waiting.",
    kicker: "They book the mount",
  },
  {
    id: "tool-repair",
    file: "physical-trainer-hero-animation.mp4",
    label: "Tool repair",
    blurb: "Sharpen, rebuild, and tool service.",
    defaultName: "Form Bench Tools",
    tagline: "Bring the tool. Leave it ready.",
    kicker: "They book the bench",
  },
  {
    id: "water-systems",
    file: "trout-fishin-hero-animation.mp4",
    label: "Water systems",
    blurb: "Wells, filtration, and water service.",
    defaultName: "Trout Line Water",
    tagline: "Clear water on the schedule.",
    kicker: "They book the system",
  },
  {
    id: "woodworking",
    file: "silver-orb-hero-animation.mp4",
    label: "Woodworking",
    blurb: "Custom millwork, furniture, and finish carpentry.",
    defaultName: "Silver Grain Woodworks",
    tagline: "Grain matched. Joint locked.",
    kicker: "They book the mill",
  },
] as const;

/** Extra loops a shop can pin. They are not tenant niches. */
export const EXTRA_HERO_LOOPS = [
  {
    id: "otter",
    file: "otter-hero-animation.mp4",
    label: "Underwater Otter",
    blurb: "An underwater river otter on a looping clip.",
  },
  {
    id: "shark",
    file: "shark-hero-animation.mp4",
    label: "Deep-sea reef",
    blurb: "Great white, barracuda, eel, and octopus on a looping clip.",
  },
  {
    id: "polar-bear",
    file: "polar-bear-hero-animation.mp4",
    label: "Polar bear",
    blurb: "Ice field, white bear, and a slow loop.",
  },
  {
    id: "snow-leopard",
    file: "snowleapard-hero-animation.mp4",
    label: "Snow leopard",
    blurb: "Snow leopard on a looping clip.",
  },
  {
    id: "underwater-leopard",
    file: "underwater-leapord-hero-animation.mp4",
    label: "Underwater leopard",
    blurb: "Leopard underwater on a looping clip.",
  },
  {
    id: "eye",
    file: "eye-hero-animation.mp4",
    label: "Eye",
    blurb: "A close eye on a looping clip.",
  },
] as const;

export type CatalogEntry = (typeof CATALOG)[number];
export type CatalogNiche = CatalogEntry["id"];

export const CATALOG_NICHES = CATALOG.map((row) => row.id) as unknown as readonly [
  CatalogNiche,
  ...CatalogNiche[],
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((row) => [row.id, row])) as Record<
  CatalogNiche,
  CatalogEntry
>;

export function catalogFilmPath(file: string): string {
  return `/media/${file}`;
}

export function catalogFilmUrl(niche: CatalogNiche): string {
  return catalogFilmPath(CATALOG_BY_ID[niche].file);
}

/**
 * Public-card media from the same catalog row as the title (never by array offset).
 * Shop films stay on `file`; cards use `card` when the trade still exists.
 */
export function catalogCardSrc(niche: CatalogNiche): string {
  const row = CATALOG_BY_ID[niche];
  return "card" in row && row.card ? row.card : catalogFilmUrl(niche);
}

export function catalogCardIsVideo(src: string): boolean {
  return /\.mp4(?:$|\?)/i.test(src);
}

/** Opaque trade still for public cards / demo plates, or empty when the card is the loop. */
export function catalogCardStill(niche: CatalogNiche): string {
  const src = catalogCardSrc(niche);
  return catalogCardIsVideo(src) ? "" : src;
}

export function isCatalogNiche(value: string): value is CatalogNiche {
  return Object.prototype.hasOwnProperty.call(CATALOG_BY_ID, value);
}

export function assertCatalogNiche(value: string): CatalogNiche {
  const key = value.trim().toLowerCase();
  if (!isCatalogNiche(key)) throw new Error(`Unknown catalog niche: ${value}`);
  return key;
}

export function catalogEntry(value: string): CatalogEntry | undefined {
  const key = value.trim().toLowerCase();
  return isCatalogNiche(key) ? CATALOG_BY_ID[key] : undefined;
}

export function catalogByFilm(urlOrFile: string): CatalogEntry | undefined {
  const raw = urlOrFile.trim().split("?")[0] ?? "";
  const file = raw.includes("/") ? (raw.split("/").pop() ?? "") : raw;
  return CATALOG.find((row) => row.file === file || row.file === `${file}.mp4`);
}

/** Older shop niches still in the DB map onto the verified inventory. */
export const LEGACY_NICHE_ALIASES: Record<string, CatalogNiche> = {
  guide: "landscaping",
  fitness: "tool-repair",
  combat: "roofing",
  wellness: "woodworking",
  lessons: "power-sports",
  salon: "barber",
  beauty: "barber",
  tattoo: "taxidermy",
  photo: "glasswork",
  pets: "canine",
  music: "fabrication",
  creator: "fabrication",
  prompt: "contractor",
  entertainer: "fabrication",
  events: "contractor",
  landscaper: "landscaping",
  foodtruck: "water-systems",
  dogwalk: "canine",
  detailer: "auto",
  hunting: "stone-masonry",
  therapy: "tool-repair",
  bowtech: "bow-tech",
  clean: "hvac",
  field: "auto",
  locksmith: "electrical",
  firewood: "forestry",
  practice: "woodworking",
  counsel: "woodworking",
  location: "barber",
  studio: "glasswork",
  retail: "fabrication",
  trade: "machining",
};

/** Normalize any stored niche string to a verified catalog id. */
export function resolveCatalogNiche(value: string | null | undefined): CatalogNiche {
  const key = (value ?? "").trim().toLowerCase();
  if (isCatalogNiche(key)) return key;
  const aliased = LEGACY_NICHE_ALIASES[key];
  if (aliased) return aliased;
  return "contractor";
}

export const UNIVERSAL_CATALOG_FALLBACK = catalogFilmUrl("contractor");

/** Sweep / master hub filing phrases — locked to the verified loops. */
export const CATALOG_FILINGS = CATALOG.map((row) => ({
  craft: row.label.split(" ")[0] || row.label,
  phrase: row.label,
  niche: row.id,
})) as readonly { craft: string; phrase: string; niche: CatalogNiche }[];
