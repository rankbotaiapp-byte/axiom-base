import { defaultHeroSrcForNiche } from "./NicheRegistry.ts";

/**
 * Verified niche copy and cards. Default films come from master categories
 * in MasterHeroDefaults / NicheRegistry — not from per-niche `file` paths.
 */

/** Canonical default loop name inside each niche folder. */
export const NICHE_HERO_FILENAME = "hero-animation.mp4";

export const CATALOG = [
  {
    id: "auto",
    file: "auto-hero-animation.mp4",
    fallback: "auto-tuning-hero-animation.mp4",
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
    id: "beauty-salon",
    file: "silver-orb-hero-animation.mp4",
    label: "Beauty salon",
    blurb: "Color, skin, and a suite that starts on time.",
    defaultName: "Silver Room Beauty",
    tagline: "The suite is ready.",
    kicker: "They book the suite",
  },
  {
    id: "bow-tech",
    file: "bow-tech-hero-animation.mp4",
    fallback: "archery-hero-animation.mp4",
    card: "/media/heroes/custom-bow-tech.jpg",
    label: "Bow tech",
    blurb: "Custom bows, strings, and the workbench.",
    defaultName: "Ridge Bow Works",
    tagline: "Tune the limb. Set the rest.",
    kicker: "They book the bench",
  },
  {
    id: "canine",
    file: "leapard-page-hero-animation.mp4",
    fallback: "bear-charge-hero-animation.mp4",
    card: "/media/heroes/pets.jpg",
    label: "Canine",
    blurb: "Grooming, boarding, and outdoor animal work.",
    defaultName: "Charge Kennel",
    tagline: "The run opens on the hour.",
    kicker: "They book the run",
  },
  {
    id: "contractor",
    file: "infrastructure-hero-animation.mp4",
    fallback: "bear-charge-hero-animation.mp4",
    card: "/media/heroes/contractor.jpg",
    label: "Contractor",
    blurb: "General build, site visits, and the job book.",
    defaultName: "Rogue Contractor",
    tagline: "The job starts when the visit is confirmed.",
    kicker: "They book the site",
  },
  {
    id: "electrical",
    file: "locksmith-hero-animation.mp4",
    fallback: "electrician-hero-animation.mp4",
    card: "/media/heroes/electrical.jpg",
    label: "Electrical",
    blurb: "Panels, runs, and service calls.",
    defaultName: "Cascade Electric",
    tagline: "Power on. The ticket is clear.",
    kicker: "They book the call",
  },
  {
    id: "fabrication",
    // polar-bear ships in public/media; universal-hero-animation.mp4 does not.
    file: "polar-bear-hero-animation.mp4",
    fallback: "master-defaults/polar-bear-loop.mp4",
    label: "Fabrication",
    blurb: "Custom make, weld, and shop builds.",
    defaultName: "Meridian Fab",
    tagline: "Cut, fit, finish.",
    kicker: "They book the shop",
  },
  {
    id: "forestry",
    file: "owl-attack-hero-animation.mp4",
    fallback: "leopard-hero-animation.mp4",
    label: "Forestry",
    blurb: "Land, timber, and outdoor crew days.",
    defaultName: "High Desert Forestry",
    tagline: "The stand is marked. The crew is booked.",
    kicker: "They book the stand",
  },
  {
    id: "glasswork",
    file: "eye-hero-animation.mp4",
    fallback: "content-cretion-hero-animation.mp4",
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
    file: "welding-hero-animation.mp4",
    fallback: "snowleapard-hero-animation.mp4",
    label: "Machining",
    blurb: "Precision metal, fixtures, and bench work.",
    defaultName: "Bench Mark Machine",
    tagline: "Tolerance held. Ticket closed.",
    kicker: "They book the spindle",
  },
  {
    id: "plumbing",
    // Emergency Plumbing outreach + /demo/plumbing full-screen cinematic loop.
    file: "axiom-plumber-hero.mp4",
    fallback: "axio-plumber-hero.mp4",
    card: "/media/heroes/plumbing.jpg",
    label: "Plumbing",
    blurb: "Lines, fixtures, and emergency calls.",
    defaultName: "Main Street Plumbing",
    tagline: "The leak stops when we arrive.",
    kicker: "They book the line",
  },
  {
    id: "personal-trainer",
    file: "physical-trainer-hero-animation.mp4",
    label: "Personal trainer",
    blurb: "Sessions, programs, and an hour that stays on the book.",
    defaultName: "Form Bench Training",
    tagline: "The hour is yours.",
    kicker: "They book the session",
  },
  {
    id: "power-sports",
    file: "boarding-lessons-hero-animation.mp4",
    fallback: "snowboard-hero-animation.mp4",
    card: "/media/heroes/snow-sports-lessons.jpg",
    label: "Outdoor sports lessons",
    blurb: "Boards, sleds, and outdoor lesson blocks.",
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
    file: "personal-protection-hero-animation.mp4",
    fallback: "raptor-hero-animation.mp4",
    label: "Security",
    blurb: "Patrol, post, and private watch.",
    defaultName: "Raptor Watch",
    tagline: "The post is covered.",
    kicker: "They book the post",
  },
  {
    id: "stone-masonry",
    file: "leopard-hero-animation.mp4",
    fallback: "owl-attack-hero-animation.mp4",
    label: "Stone masonry",
    blurb: "Stone, mortar, and hardscape builds.",
    defaultName: "Owl Creek Stone",
    tagline: "Set the course. Lay the face.",
    kicker: "They book the wall",
  },
  {
    id: "taxidermy",
    file: "leopard-hero-animation.mp4",
    fallback: "raptor-hero-animation.mp4",
    label: "Taxidermy",
    blurb: "Mounts, restoration, and wildlife finish work.",
    defaultName: "Ridge Mount Studio",
    tagline: "The mount is waiting.",
    kicker: "They book the mount",
  },
  {
    id: "tool-repair",
    file: "gunsmith-hero-animation.mp4",
    label: "Tool repair",
    blurb: "Sharpen, rebuild, and tool service.",
    defaultName: "Form Bench Tools",
    tagline: "Bring the tool. Leave it ready.",
    kicker: "They book the bench",
  },
  {
    id: "water-systems",
    // Urgent otter loop shared with Emergency Plumbing outreach / demo inlays.
    file: "otter-hero-animation.mp4",
    fallback: "shark-hero-animation.mp4",
    label: "Water systems",
    blurb: "Wells, filtration, and deep-water service.",
    defaultName: "Abyssal Systems",
    tagline: "Deep-water service. Precision delivered.",
    kicker: "They book the system",
  },
  {
    id: "woodworking",
    file: "orb-explosion-hero-animation.mp4",
    label: "Woodworking",
    blurb: "Custom millwork, furniture, and finish carpentry.",
    defaultName: "Silver Grain Woodworks",
    tagline: "Grain matched. Joint locked.",
    kicker: "They book the mill",
  },
] as const;

/**
 * Five master-seed niches shown on the public landing / onboard catalog.
 * Full `CATALOG` stays intact for film resolution, hero archive, and legacy shops.
 * Staged cinematic modules (obsidian-core, moto-elite, hyper-moto, cyber-stinger)
 * are listed separately via `STAGED_EXPERIENCES` on the landing hub — not as niches.
 */
export const CORE_PUBLIC_NICHES = [
  "auto",
  "contractor",
  "plumbing",
  "barber",
  "taxidermy",
] as const;

/** Slugs surfaced on the public landing alongside the 5 core niches. */
export const PUBLIC_LANDING_MODULE_SLUGS = [
  "obsidian-core",
  "moto-elite",
  "hyper-moto",
  "cyber-stinger",
] as const;

export type CorePublicNiche = (typeof CORE_PUBLIC_NICHES)[number];

export function isCorePublicNiche(value: string): value is CorePublicNiche {
  return (CORE_PUBLIC_NICHES as readonly string[]).includes(value.trim().toLowerCase());
}

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
    label: "Abyssal Systems",
    blurb: "Deep-sea reef loop — shark, barracuda, eel, and octopus for the water-systems niche.",
  },
  {
    id: "abyssal-hero",
    file: "shark-hero-animation.mp4",
    label: "Abyssal hero",
    blurb: "Selectable Abyssal Systems underwater hero (same loop as shark-hero-animation).",
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

/** Public-facing niche ids (5 cores). Prefer this over `CATALOG_NICHES` on landing routes. */
export const PUBLIC_CATALOG_NICHES = CORE_PUBLIC_NICHES;

/** Public landing / onboard rows only — legacy templates are filtered out. */
export const PUBLIC_CATALOG = CATALOG.filter((row) => isCorePublicNiche(row.id));

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((row) => [row.id, row])) as Record<
  CatalogNiche,
  CatalogEntry
>;

export function catalogFilmPath(file: string): string {
  return `/media/${file}`;
}

/** Niches that currently have `public/media/{id}/hero-animation.mp4` on disk. */
export const DEDICATED_NICHE_LOOPS: readonly CatalogNiche[] = [];

/** Older `/media/heroes/*hero.mp4` files still on disk — last-resort fallback. */
export const LEGACY_HERO_MP4_FILES = ["heroes/clean.mp4"] as const;

/** `*-hero-animation.mp4` loops currently in `public/media` (root). */
export const ROOT_HERO_ANIMATION_FILES = [
  "auto-hero-animation.mp4",
  "auto-tuning-hero-animation.mp4",
  "apex-launch-control-hero-animation.mp4",
  "apex-launch-hero-animation.mp4",
  "barber-hero-animation.mp4",
  "bear-charge-hero-animation.mp4",
  "boarding-lessons-hero-animation.mp4",
  "bow-tech-hero-animation.mp4",
  "cleaner-hero-animation.mp4",
  "content-cretion-hero-animation.mp4",
  "electrician-hero-animation.mp4",
  "eye-hero-animation.mp4",
  "guide-service-hero-animation.mp4",
  "gunsmith-hero-animation.mp4",
  "infrastructure-hero-animation.mp4",
  "leapard-page-hero-animation.mp4",
  "leopard-hero-animation.mp4",
  "locksmith-hero-animation.mp4",
  "orb-explosion-hero-animation.mp4",
  "otter-hero-animation.mp4",
  "owl-attack-hero-animation.mp4",
  "personal-protection-hero-animation.mp4",
  "photogaphy-hero-animation.mp4",
  "physical-trainer-hero-animation.mp4",
  "axio-plumber-hero.mp4",
  "axio-plumber-hero-mobile.mp4",
  "axiom-plumber-hero.mp4.mp4",
  "axiom-plumber-hero.mp4",
  "axiom-plumber-hero-mobile.mp4",
  "plumbing-emergency-hero.mp4",
  "plumbing-emergency-hero-mobile.mp4",
  "plumbers-hero-animation.mp4",
  "plumbers-outreach-hero-animation.mp4",
  "plumbers-outreach-hero-animation-mobile.mp4",
  "emergency-plumbing-web-page.mp4",
  "polar-bear-hero-animation.mp4",
  "raptor-hero-animation.mp4",
  "shark-hero-animation.mp4",
  "silver-orb-hero-animation.mp4",
  "snowleapard-hero-animation.mp4",
  "taxidermy-hero-animation.mp4",
  "tiger-hero-animation.mp4",
  "trout-fishin-hero-animation.mp4",
  "underwater-leapord-hero-animation.mp4",
] as const;

export function dedicatedHeroUrl(niche: CatalogNiche): string {
  return `/media/${niche}/${NICHE_HERO_FILENAME}`;
}

function catalogFallbackFile(niche: CatalogNiche): string | undefined {
  const row = CATALOG_BY_ID[niche];
  return "fallback" in row && typeof row.fallback === "string" ? row.fallback : undefined;
}

export function legacyHeroUrl(niche: CatalogNiche): string {
  return catalogFilmPath(catalogFallbackFile(niche) ?? CATALOG_BY_ID[niche].file);
}

/** Last-resort clip when the preferred animation and its catalog fallback are both missing. */
export function catalogFilmFallbackUrl(niche: CatalogNiche): string {
  const named = catalogFallbackFile(niche);
  if (named) return catalogFilmPath(named);
  const legacy = LEGACY_HERO_MP4_FILES[0];
  return legacy ? catalogFilmPath(legacy) : catalogFilmPath(CATALOG_BY_ID[niche].file);
}

/**
 * Prefer an uploaded `/media/{niche}/hero-animation.mp4`, then the catalog `file`,
 * then `fallback` (`*-hero-animation.mp4`), then the closest on-disk loop / `*hero.mp4`.
 */
export function scanNicheHeroUrl(
  niche: CatalogNiche,
  disk: { dedicated: readonly string[]; files: readonly string[] },
): string {
  if (disk.dedicated.includes(niche)) return dedicatedHeroUrl(niche);
  const preferred = CATALOG_BY_ID[niche].file;
  if (disk.files.includes(preferred)) return catalogFilmPath(preferred);
  const namedFallback = catalogFallbackFile(niche);
  if (namedFallback && disk.files.includes(namedFallback)) return catalogFilmPath(namedFallback);
  const hay = `${niche} ${CATALOG_BY_ID[niche].label}`.toLowerCase();
  let best = "";
  let bestScore = 0;
  for (const file of disk.files) {
    if (!/\.mp4$/i.test(file) || file.includes("\\")) continue;
    const stem = file
      .toLowerCase()
      .replace(/^heroes\//, "")
      .replace(/(\.mp4)+$/i, "")
      .replace(/[^a-z0-9]+/g, " ");
    const animation = /hero animation|hero-animation/.test(stem);
    const legacyHero = /\bhero\b/.test(stem) && !animation;
    let score = 0;
    for (const token of hay.split(/[^a-z0-9]+/).filter((word) => word.length >= 3)) {
      if (stem.includes(token)) score += 40 + token.length;
    }
    if (score > 0 && animation) score += 24;
    if (score > 0 && legacyHero) score += 8;
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }
  return catalogFilmPath(best || preferred);
}

/** Landing / master-category loop. Shop and demo pages use `tradeLoopUrl`. */
export function catalogFilmUrl(niche: CatalogNiche): string {
  return defaultHeroSrcForNiche(niche);
}

/** Niche-specific cinematic loop from the catalog `file` (plumbing → emergency hero). */
export function tradeLoopUrl(niche: CatalogNiche): string {
  return catalogFilmPath(CATALOG_BY_ID[niche].file);
}

/** Any stored niche string → that trade's default loop. */
export function defaultNicheFilm(value: string | null | undefined): string {
  return tradeLoopUrl(resolveCatalogNiche(value));
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

/** Alternate filenames that resolve to a catalog niche (typos, synonyms, not-yet-renamed uploads). */
export const FILM_FILE_ALIASES: Record<string, CatalogNiche> = {
  "charging-bear-hero-animation.mp4": "contractor",
  "bear-charge-hero-animation.mp4": "contractor",
  "grizzly-hud-hero-animation.mp4": "contractor",
  "infrastructure-hero-animation.mp4": "contractor",
  "infrastructure-hero-animatio.mp4": "contractor",
  "universal-hero-animation.mp4": "fabrication",
  "cyber-network-hero-animation.mp4": "fabrication",
  "content-cretion-hero-animation.mp4": "glasswork",
  "photogaphy-hero-animation.mp4": "glasswork",
  "polar-bear-hero-animation.mp4": "fabrication",
  "leopard-hero-path.mp4": "contractor",
  "snowleopard-hero-animation.mp4": "machining",
  "snowleapard-hero-animation.mp4": "machining",
  "welding-hero-animation.mp4": "machining",
  "underwater-leopard-hero-animation.mp4": "taxidermy",
  "underwater-leapord-hero-animation.mp4": "taxidermy",
  "hero-1280.mp4": "taxidermy",
  "hero-854.mp4": "taxidermy",
  "archery-hero-animation.mp4": "bow-tech",
  "electric-tech-hero-animation.mp4": "electrical",
  "heist-hero-animation.mp4": "glasswork",
  "snowboard-hero-animation.mp4": "power-sports",
  "otter-hero-animation.mp4": "water-systems",
  "axio-plumber-hero.mp4": "plumbing",
  "plumbers-outreach-hero-animation.mp4": "plumbing",
  "plumbers-outreach-hero-animation-mobile.mp4": "plumbing",
  "axio-plumber-hero-mobile.mp4": "plumbing",
  "axiom-plumber-hero.mp4.mp4": "plumbing",
  "axiom-plumber-hero.mp4": "plumbing",
  "axiom-plumber-hero-mobile.mp4": "plumbing",
  "plumbing-emergency-hero.mp4": "plumbing",
  "plumbing-emergency-hero-mobile.mp4": "plumbing",
  "emergency-plumbing-web-page.mp4": "plumbing",
  "plumbers-hero-animation.mp4": "plumbing",
  "shark-hero-animation.mp4": "water-systems",
  "abyssal-hero-loop.mp4": "water-systems",
  "abyssal-hero-animation.mp4": "water-systems",
  "hero-ocean-loop.mp4": "water-systems",
  "eye-hero-animation.mp4": "glasswork",
  "owl-attack-hero-animation.mp4": "forestry",
  "raptor-hero-animation.mp4": "security",
  "taxidermy-hero-animation.mp4": "taxidermy",
  "taxidermy-her-animation.mp4": "taxidermy",
  "physical-trainer-hero-animation.mp4": "personal-trainer",
  "silver-orb-hero-animation.mp4": "beauty-salon",
  "gunsmith-hero-animation.mp4": "tool-repair",
  "orb-explosion-hero-animation.mp4": "woodworking",
  "auto-hero-animation.mp4": "auto",
  "auto-tuning-hero-animation.mp4": "auto",
  "apex-launch-hero-animation.mp4": "auto",
  "apex-launch-control-hero-animation.mp4": "auto",
  "personal-protection-hero-animation.mp4": "security",
  "personal-protectio-hero-animation.mp4": "security",
  "electrician-hero-animation.mp4": "electrical",
  "locksmith-hero-animation.mp4": "electrical",
  "boarding-lessons-hero-animation.mp4": "power-sports",
  "bow-tech-hero-animation.mp4": "bow-tech",
};

export function catalogByFilm(urlOrFile: string): CatalogEntry | undefined {
  const raw = urlOrFile.trim().split("?")[0] ?? "";
  const nested = raw.match(/\/media\/([a-z0-9]+(?:-[a-z0-9]+)*)\/hero-animation\.mp4$/i);
  if (nested && isCatalogNiche(nested[1]!.toLowerCase())) return CATALOG_BY_ID[nested[1]!.toLowerCase() as CatalogNiche];
  const file = raw.includes("/") ? (raw.split("/").pop() ?? "") : raw;
  const aliased = FILM_FILE_ALIASES[file] ?? FILM_FILE_ALIASES[`${file}.mp4`];
  if (aliased) return CATALOG_BY_ID[aliased];
  return CATALOG.find(
    (row) =>
      row.file === file ||
      row.file === `${file}.mp4` ||
      row.id === file ||
      ("fallback" in row && (row.fallback === file || row.fallback === `${file}.mp4`)),
  );
}

/** Older shop niches still in the DB map onto the verified inventory. */
export const LEGACY_NICHE_ALIASES: Record<string, CatalogNiche> = {
  guide: "forestry",
  fitness: "personal-trainer",
  trainer: "personal-trainer",
  gym: "personal-trainer",
  combat: "roofing",
  wellness: "woodworking",
  lessons: "power-sports",
  "outdoor-sports-lessons": "power-sports",
  "sports-lessons": "power-sports",
  boarding: "power-sports",
  salon: "beauty-salon",
  beauty: "beauty-salon",
  spa: "beauty-salon",
  tattoo: "taxidermy",
  photo: "glasswork",
  pets: "canine",
  music: "fabrication",
  creator: "glasswork",
  prompt: "contractor",
  entertainer: "fabrication",
  events: "contractor",
  landscaper: "landscaping",
  foodtruck: "water-systems",
  dogwalk: "canine",
  detailer: "auto",
  hunting: "bow-tech",
  archery: "bow-tech",
  "bow-hunting": "bow-tech",
  saas: "fabrication",
  tech: "fabrication",
  network: "fabrication",
  cyber: "fabrication",
  ai: "fabrication",
  logging: "forestry",
  construction: "contractor",
  "junk-removal": "contractor",
  junk: "contractor",
  industrial: "contractor",
  infrastructure: "contractor",
  electrician: "electrical",
  "smart-home": "electrical",
  skiing: "power-sports",
  snowboard: "power-sports",
  winter: "power-sports",
  adventure: "taxidermy",
  exotic: "taxidermy",
  entertainment: "glasswork",
  heist: "glasswork",
  branding: "glasswork",
  media: "glasswork",
  river: "water-systems",
  rafting: "water-systems",
  aquatic: "water-systems",
  marine: "water-systems",
  aquarium: "water-systems",
  diving: "taxidermy",
  conservation: "taxidermy",
  marketing: "glasswork",
  social: "glasswork",
  "content-creation": "glasswork",
  "water-sports": "water-systems",
  universal: "fabrication",
  drone: "machining",
  automation: "machining",
  monitoring: "machining",
  otter: "water-systems",
  shark: "water-systems",
  abyssal: "water-systems",
  "abyssal-systems": "water-systems",
  "abyssal-hero": "water-systems",
  "deep-sea": "water-systems",
  underwater: "water-systems",
  therapy: "personal-trainer",
  bowtech: "bow-tech",
  clean: "hvac",
  field: "auto",
  tuning: "auto",
  "auto-tuning": "auto",
  protection: "security",
  "personal-protection": "security",
  bodyguard: "security",
  guard: "security",
  locksmith: "electrical",
  firewood: "forestry",
  wildlife: "forestry",
  welding: "machining",
  practice: "woodworking",
  counsel: "woodworking",
  location: "barber",
  studio: "glasswork",
  retail: "fabrication",
  trade: "auto",
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
