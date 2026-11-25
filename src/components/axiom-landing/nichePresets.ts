/**
 * Trade presets for the inline Axiom Studio.
 * Picking a niche swaps services, hero copy, accent glow, booking slots, quote
 * options, chatbot greeting and the social queue in the live storefront preview.
 *
 * `catalogNiche` is the matching id in config/catalog.ts so /onboard?niche=… resolves.
 * Copy uses {business} and {city} tokens, filled from the configurator inputs.
 */

export type StudioNicheId =
  | "plumbing-hvac"
  | "auto-detailing"
  | "landscaping-tree"
  | "roofing-gc"
  | "barbershop"
  | "guided-fishing";

export type ModuleId = "booking" | "chatbot" | "social";

export type PriceUnit = "flat" | "from" | "person";

export interface StudioService {
  id: string;
  name: string;
  price: number;
  unit: PriceUnit;
  duration: string;
}

/** Hero look the visitor can swap to. Gradient art — no stock photos to license. */
export interface HeroPreset {
  id: string;
  label: string;
  /** CSS background for the hero. */
  background: string;
}

export interface QuoteOption {
  label: string;
  /** Multiplier applied to the chosen service's price. */
  factor: number;
}

export interface StudioNichePreset {
  id: StudioNicheId;
  label: string;
  catalogNiche: string | null;
  accent: string;
  defaultBusiness: string;
  defaultCity: string;
  headline: string;
  subhead: string;
  bookLabel: string;
  services: StudioService[];
  slots: string[];
  quoteSizeLabel: string;
  quoteOptions: QuoteOption[];
  chatGreeting: string;
  chatReplies: { ask: string; answer: string }[];
  socialPosts: { when: string; text: string }[];
  heroPresets: HeroPreset[];
  /** What the visitor's site probably looks like today (Before view). */
  beforeTagline: string;
}

export const STUDIO_ACCENTS = {
  cyan: "#00f0ff",
  mint: "#00ffcc",
  gold: "#FFE500",
} as const;

const scene = (a: string, b: string, c: string) =>
  `radial-gradient(120% 90% at 80% 10%, ${a}55, transparent 55%), radial-gradient(90% 70% at 10% 90%, ${b}44, transparent 60%), linear-gradient(160deg, ${c}, #050507 75%)`;

export const STUDIO_NICHES: readonly StudioNichePreset[] = [
  {
    id: "plumbing-hvac",
    label: "Plumbing & HVAC",
    catalogNiche: "plumbing",
    accent: STUDIO_ACCENTS.cyan,
    defaultBusiness: "Accurate Plumbing",
    defaultCity: "Medford, OR",
    headline: "{business}: burst pipe at 2 AM? We're already on it.",
    subhead: "Licensed plumbing & HVAC across {city}. Book online in 30 seconds, any hour.",
    bookLabel: "Book a tech",
    services: [
      { id: "leak", name: "Emergency leak repair", price: 189, unit: "from", duration: "1–2 hr" },
      { id: "heater", name: "Water heater install", price: 1450, unit: "from", duration: "4 hr" },
      { id: "hvac", name: "AC / furnace tune-up", price: 129, unit: "flat", duration: "1 hr" },
      { id: "drain", name: "Drain clearing", price: 159, unit: "flat", duration: "1 hr" },
    ],
    slots: ["Today · 4:30 PM", "Tonight · 8:00 PM", "Tomorrow · 7:30 AM", "Tomorrow · 1:00 PM"],
    quoteSizeLabel: "Home size",
    quoteOptions: [
      { label: "Apartment", factor: 0.9 },
      { label: "House", factor: 1 },
      { label: "Large / 2-story", factor: 1.25 },
    ],
    chatGreeting: "Hi! I'm the {business} assistant. Is this an emergency or a scheduled job?",
    chatReplies: [
      { ask: "It's an emergency", answer: "Got it — I can get a tech to you tonight. Tap a slot and I'll text the on-call tech now." },
      { ask: "How much is a tune-up?", answer: "AC or furnace tune-ups are a flat $129. Want me to hold tomorrow morning?" },
    ],
    socialPosts: [
      { when: "Tue 9:00 AM", text: "3 signs your water heater is about to quit 🔥" },
      { when: "Thu 6:30 PM", text: "Before/after: crawlspace re-pipe in {city}" },
      { when: "Sat 10:00 AM", text: "Freeze warning — wrap your hose bibs tonight ❄️" },
    ],
    heroPresets: [
      { id: "night", label: "Night call", background: scene("#00f0ff", "#2f6bff", "#06131c") },
      { id: "copper", label: "Copper", background: scene("#ff9a3d", "#00f0ff", "#1a0f08") },
      { id: "clean", label: "Clean steel", background: scene("#b8c7d6", "#00ffcc", "#0d1116") },
    ],
    beforeTagline: "Family owned since 1998. Call for service.",
  },
  {
    id: "auto-detailing",
    label: "Auto Detailing",
    catalogNiche: "auto",
    accent: STUDIO_ACCENTS.gold,
    defaultBusiness: "Mirror Finish Detail",
    defaultCity: "Grants Pass, OR",
    headline: "{business}: showroom shine, booked in a tap.",
    subhead: "Ceramic coating, paint correction and full details in {city}. Mobile service available.",
    bookLabel: "Book a detail",
    services: [
      { id: "full", name: "Full interior + exterior", price: 229, unit: "flat", duration: "4 hr" },
      { id: "ceramic", name: "Ceramic coating", price: 899, unit: "from", duration: "1 day" },
      { id: "correction", name: "Paint correction", price: 499, unit: "from", duration: "6 hr" },
      { id: "express", name: "Express wash + wax", price: 79, unit: "flat", duration: "1 hr" },
    ],
    slots: ["Fri · 9:00 AM", "Fri · 1:00 PM", "Sat · 8:00 AM", "Mon · 10:00 AM"],
    quoteSizeLabel: "Vehicle",
    quoteOptions: [
      { label: "Coupe / sedan", factor: 1 },
      { label: "SUV", factor: 1.2 },
      { label: "Truck / 3-row", factor: 1.35 },
    ],
    chatGreeting: "Hey! Want a quote for your ride? What are you driving?",
    chatReplies: [
      { ask: "A lifted truck", answer: "Love it. Full detail on a truck runs about $309. Want the Saturday 8 AM slot?" },
      { ask: "Do you come to me?", answer: "Yep — mobile service anywhere in {city} for a $25 trip fee." },
    ],
    socialPosts: [
      { when: "Mon 5:00 PM", text: "50/50 shot: before vs after paint correction 😮" },
      { when: "Wed 12:00 PM", text: "Why ceramic beats wax in Oregon rain" },
      { when: "Sat 9:00 AM", text: "Weekend slots open — tap to book" },
    ],
    heroPresets: [
      { id: "gloss", label: "Gloss black", background: scene("#FFE500", "#ff3d6e", "#0b0b0b") },
      { id: "studio", label: "Studio lights", background: scene("#ffffff", "#FFE500", "#121212") },
      { id: "neon", label: "Neon bay", background: scene("#ff2bd6", "#00f0ff", "#0a0612") },
    ],
    beforeTagline: "Quality detailing. Call or text for pricing.",
  },
  {
    id: "landscaping-tree",
    label: "Landscaping / Tree Service",
    catalogNiche: "landscaping",
    accent: STUDIO_ACCENTS.mint,
    defaultBusiness: "Rogue Valley Tree & Turf",
    defaultCity: "Central Point, OR",
    headline: "{business}: yards that look cared for — without the phone tag.",
    subhead: "Tree removal, pruning and full landscaping in {city}. Free estimates booked online.",
    bookLabel: "Book an estimate",
    services: [
      { id: "removal", name: "Tree removal", price: 650, unit: "from", duration: "Half day" },
      { id: "prune", name: "Pruning & shaping", price: 275, unit: "from", duration: "3 hr" },
      { id: "cleanup", name: "Seasonal yard cleanup", price: 189, unit: "flat", duration: "3 hr" },
      { id: "design", name: "Landscape design", price: 0, unit: "flat", duration: "Free estimate" },
    ],
    slots: ["Wed · 8:00 AM", "Wed · 2:00 PM", "Thu · 9:30 AM", "Sat · 8:00 AM"],
    quoteSizeLabel: "Lot size",
    quoteOptions: [
      { label: "Under ¼ acre", factor: 1 },
      { label: "¼ – 1 acre", factor: 1.4 },
      { label: "1+ acre", factor: 2 },
    ],
    chatGreeting: "Hi! Need a tree looked at, or a full yard project?",
    chatReplies: [
      { ask: "A tree is leaning on my house", answer: "That's urgent — I'm flagging it for the crew lead and holding Wednesday 8 AM for you." },
      { ask: "Do you do free estimates?", answer: "Always free. Pick any open slot and we'll walk the property with you." },
    ],
    socialPosts: [
      { when: "Tue 7:00 AM", text: "Storm season checklist for {city} trees 🌲" },
      { when: "Thu 4:00 PM", text: "Timelapse: 80-ft fir removal, zero damage" },
      { when: "Sun 10:00 AM", text: "Spring cleanup slots filling — grab yours" },
    ],
    heroPresets: [
      { id: "forest", label: "Old growth", background: scene("#00ffcc", "#3ddc97", "#06140e") },
      { id: "golden", label: "Golden hour", background: scene("#FFE500", "#ff9a3d", "#151006") },
      { id: "mist", label: "Valley mist", background: scene("#b8f5e6", "#7ec8e3", "#0b1214") },
    ],
    beforeTagline: "Tree service and landscaping. Licensed & insured.",
  },
  {
    id: "roofing-gc",
    label: "Roofing / General Contractor",
    catalogNiche: "roofing",
    accent: STUDIO_ACCENTS.cyan,
    defaultBusiness: "Summit Roofing & Build",
    defaultCity: "Ashland, OR",
    headline: "{business}: leaks fixed, roofs replaced, jobs booked 24/7.",
    subhead: "Roof repair, full replacements and remodels across {city}. Storm damage? Book tonight.",
    bookLabel: "Book an inspection",
    services: [
      { id: "inspect", name: "Roof inspection", price: 149, unit: "flat", duration: "1 hr" },
      { id: "repair", name: "Leak repair", price: 450, unit: "from", duration: "Half day" },
      { id: "replace", name: "Full roof replacement", price: 12500, unit: "from", duration: "2–4 days" },
      { id: "remodel", name: "Remodel consult", price: 0, unit: "flat", duration: "Free" },
    ],
    slots: ["Tomorrow · 8:00 AM", "Tomorrow · 3:00 PM", "Fri · 10:00 AM", "Mon · 8:00 AM"],
    quoteSizeLabel: "Roof size",
    quoteOptions: [
      { label: "Under 1,500 sq ft", factor: 1 },
      { label: "1,500 – 2,500", factor: 1.35 },
      { label: "2,500+", factor: 1.8 },
    ],
    chatGreeting: "Hi — is water coming in right now, or are you planning ahead?",
    chatReplies: [
      { ask: "Water is coming in", answer: "Put a bucket under it — I'm dispatching an emergency tarp crew and holding tomorrow 8 AM for repair." },
      { ask: "Do you finance?", answer: "Yes, financing is available on replacements. I'll have the estimator bring options." },
    ],
    socialPosts: [
      { when: "Mon 8:00 AM", text: "Drone footage: full tear-off in {city}" },
      { when: "Wed 6:00 PM", text: "Missing shingles after the wind? Here's what to check" },
      { when: "Fri 11:00 AM", text: "5-star review from the Johnson remodel ⭐️" },
    ],
    heroPresets: [
      { id: "storm", label: "Storm front", background: scene("#00f0ff", "#2f6bff", "#070b14") },
      { id: "slate", label: "Slate", background: scene("#9aa3b2", "#00f0ff", "#0c0d10") },
      { id: "sunrise", label: "Sunrise", background: scene("#FFE500", "#ff3d6e", "#140a06") },
    ],
    beforeTagline: "Roofing & construction. Free estimates — call today.",
  },
  {
    id: "barbershop",
    label: "Barbershop / Grooming",
    catalogNiche: "barber",
    accent: STUDIO_ACCENTS.gold,
    defaultBusiness: "Shear Skill Barbershop",
    defaultCity: "Medford, OR",
    headline: "{business}: fresh cut, zero wait. Book your chair.",
    subhead: "Fades, beard work and hot-towel shaves in {city}. Walk in sharp — book ahead.",
    bookLabel: "Book a chair",
    services: [
      { id: "cut", name: "Signature cut", price: 35, unit: "flat", duration: "45 min" },
      { id: "fade", name: "Skin fade + design", price: 45, unit: "flat", duration: "1 hr" },
      { id: "beard", name: "Beard sculpt", price: 25, unit: "flat", duration: "30 min" },
      { id: "shave", name: "Hot-towel shave", price: 40, unit: "flat", duration: "45 min" },
    ],
    slots: ["Today · 3:15 PM", "Today · 5:45 PM", "Tomorrow · 10:00 AM", "Sat · 9:30 AM"],
    quoteSizeLabel: "Add-on",
    quoteOptions: [
      { label: "Just the service", factor: 1 },
      { label: "+ beard lineup", factor: 1.4 },
      { label: "+ hot towel", factor: 1.6 },
    ],
    chatGreeting: "What's up! Want to grab a chair today?",
    chatReplies: [
      { ask: "Anything open today?", answer: "3:15 PM and 5:45 PM are open. Tap one and you're locked in." },
      { ask: "Do you take walk-ins?", answer: "When there's a gap, yes — but booking guarantees your barber." },
    ],
    socialPosts: [
      { when: "Tue 4:00 PM", text: "Fade of the week ✂️ swipe for the details" },
      { when: "Thu 9:00 AM", text: "Saturday chairs are almost gone" },
      { when: "Sun 12:00 PM", text: "New hot-towel shave just dropped 🔥" },
    ],
    heroPresets: [
      { id: "leather", label: "Leather & brass", background: scene("#FFE500", "#b8743a", "#120c06") },
      { id: "neon", label: "Neon pole", background: scene("#ff3d6e", "#00f0ff", "#0d0710") },
      { id: "mono", label: "Monochrome", background: scene("#ffffff", "#9aa3b2", "#0b0b0d") },
    ],
    beforeTagline: "Walk-ins welcome. Cash only.",
  },
  {
    id: "guided-fishing",
    label: "Guided Fishing / Outdoor",
    catalogNiche: null,
    accent: STUDIO_ACCENTS.mint,
    defaultBusiness: "Rogue River Guides",
    defaultCity: "Gold Hill, OR",
    headline: "{business}: dawn on the Rogue. Your seat is one tap away.",
    subhead: "Steelhead and salmon trips out of {city}. Gear, boat and guide included.",
    bookLabel: "Book a trip",
    services: [
      { id: "half", name: "Half-day drift", price: 425, unit: "flat", duration: "4 hr" },
      { id: "full", name: "Full-day steelhead", price: 650, unit: "flat", duration: "8 hr" },
      { id: "sunset", name: "Sunset salmon run", price: 375, unit: "flat", duration: "3 hr" },
      { id: "extra", name: "Extra angler", price: 75, unit: "person", duration: "Add-on" },
    ],
    slots: ["Fri · 6:00 AM", "Sat · 5:30 AM", "Sun · 6:00 AM", "Mon · 2:00 PM"],
    quoteSizeLabel: "Party size",
    quoteOptions: [
      { label: "1 angler", factor: 1 },
      { label: "2 anglers", factor: 1.15 },
      { label: "3 anglers", factor: 1.3 },
    ],
    chatGreeting: "Hey! Steelhead or salmon this trip?",
    chatReplies: [
      { ask: "Steelhead!", answer: "Full-day steelhead is $650 per boat. Saturday 5:30 AM is open — want it?" },
      { ask: "Do I need a license?", answer: "Yes — an Oregon angling license. We'll text you the link when you book." },
    ],
    socialPosts: [
      { when: "Mon 6:00 AM", text: "River report: 2,140 cfs and fishing well 🎣" },
      { when: "Wed 7:00 PM", text: "28\" hen from Saturday's float" },
      { when: "Fri 5:00 AM", text: "Weekend boats: 1 seat left" },
    ],
    heroPresets: [
      { id: "river", label: "River dawn", background: scene("#00ffcc", "#2f6bff", "#04110f") },
      { id: "fog", label: "Canyon fog", background: scene("#cfe8e4", "#00f0ff", "#0b1112") },
      { id: "dusk", label: "Dusk run", background: scene("#FFE500", "#ff3d6e", "#120a06") },
    ],
    beforeTagline: "Guided fishing trips. Call to book.",
  },
];

export const STUDIO_MODULES: readonly { id: ModuleId; label: string; blurb: string }[] = [
  { id: "booking", label: "24/7 Instant Booking", blurb: "Customers book open slots any hour" },
  { id: "chatbot", label: "AI Lead Chatbot", blurb: "Answers, qualifies and holds the slot" },
  { id: "social", label: "Autonomous Social Queue", blurb: "Posts written and scheduled for you" },
];

export interface StudioConfig {
  business: string;
  city: string;
  niche: StudioNicheId;
  modules: Record<ModuleId, boolean>;
  heroPresetId: string;
  hasCustomPhoto: boolean;
}

export const nicheById = (id: StudioNicheId): StudioNichePreset =>
  STUDIO_NICHES.find((n) => n.id === id) ?? STUDIO_NICHES[0];

export function fillTokens(text: string, cfg: Pick<StudioConfig, "business" | "city">): string {
  return text
    .replaceAll("{business}", cfg.business.trim() || "Your Business")
    .replaceAll("{city}", cfg.city.trim() || "your area");
}

export function formatPrice(s: StudioService): string {
  if (s.price === 0) return "Free";
  const n = `$${s.price.toLocaleString("en-US")}`;
  return s.unit === "from" ? `from ${n}` : s.unit === "person" ? `${n}/person` : n;
}

/** Query string the launch button hands to /onboard (or your checkout route). */
export function launchParams(cfg: StudioConfig): URLSearchParams {
  const preset = nicheById(cfg.niche);
  const params = new URLSearchParams();
  params.set("business", cfg.business.trim());
  params.set("city", cfg.city.trim());
  params.set("niche", preset.catalogNiche ?? preset.id);
  params.set("studioNiche", preset.id);
  params.set(
    "modules",
    (Object.keys(cfg.modules) as ModuleId[]).filter((m) => cfg.modules[m]).join(","),
  );
  params.set("hero", cfg.hasCustomPhoto ? "upload" : cfg.heroPresetId);
  params.set("plan", "trial");
  return params;
}

export function buildLaunchHref(path: string, cfg: StudioConfig): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${launchParams(cfg).toString()}`;
}
