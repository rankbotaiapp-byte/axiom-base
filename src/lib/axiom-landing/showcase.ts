// Premium cinematic builds shown in Proof of Work.
// Each one is a static site in public/showcase/<dir>/ and opens full-size inside
// the page. A card only appears once every file in `requires` exists (checked at
// build time in app/page.tsx), so a half-installed demo can never reach a prospect.
// Prices live in lib/pricing.ts (PRICING.cinematic) — override per build with `price`.

export type ShowcaseBuild = {
  id: string;
  /** Folder under public/showcase/ (defaults to id). Several builds can share one export. */
  dir?: string;
  name: string;
  niche: string;
  blurb: string;
  accent: string;
  /** What the visitor should try first — shown on the card and in the demo header */
  tryIt: string[];
  /** Owner-outcome line on the demo chrome (not inside the iframe). */
  hook: string;
  /** Paths relative to public/showcase/<dir>/ */
  entry: string;
  poster?: string;
  preview?: string; // short muted loop played on hover
  requires: string[];
  /** Optional per-build price override (USD) */
  price?: number;
  /** Demo branding baked into the build — swapped for the buyer's at runtime on /t/<slug> */
  brand: {
    names: string[]; // longest first; case variants (UPPER/Title) are matched automatically
    phones: string[]; // any formatting; matched by digits
    /** CSS selector for where the logo goes. Default: before the first on-page brand name. */
    logoSelector?: string;
  };
};

export const SHOWCASE: ShowcaseBuild[] = [
  {
    id: "ironsight-armory",
    name: "Ironsight Armory",
    niche: "Gunsmith · Tactical",
    blurb: "Crosshair cursor that fires on every click or tap, a scope zoom that tracks the rifle, and a live HUD with booking and quotes built in.",
    accent: "#ff5a36",
    tryIt: ["Click or tap anywhere to fire", "Tap the scope to zoom", "Press Z for scope, F to fire"],
    hook: "Your customers play with the rifle. You get the booking. After checkout this HUD shows your shop name and number.",
    entry: "index.html",
    poster: "tactical/hero-poster.jpg",
    preview: "tactical/hero-loop.mp4",
    requires: ["index.html", "app.js", "tactical/hero-loop.mp4"],
    brand: { names: ["Ironsight Armory"], phones: ["(541) 555-0123", "(541) 555-0199"] },
  },
  {
    id: "cyber-augment-labs",
    name: "Cyber-Augment Labs",
    niche: "Personal Protection · Armory",
    blurb: "The cyborg with the mechanical arm firing in a smoky armory, a muzzle-flash Fire Test, annotated hardware close-ups and an upgrade booking form.",
    accent: "#ff2d55",
    tryIt: ["Hit Engage Fire Test", "Hover the workshop callouts", "Scroll to the arsenal"],
    hook: "That Fire Test is a closer. Put your brand on it and the upgrade form hits your phone, not a demo inbox.",
    entry: "cyber-augment/index.html",
    poster: "cyber-augment/hero-poster.jpg",
    preview: "cyber-augment/personal-protection-hero-animation.mp4",
    requires: ["cyber-augment/index.html", "cyber-augment/personal-protection-hero-animation.mp4"],
    brand: { names: ["Cyber-Augment Labs"], phones: [] },
  },
  {
    id: "emergency-plumbing",
    dir: "studio",
    name: "Rogue Rapid Plumbing",
    niche: "Emergency Trades · Plumbing",
    blurb: "The cybernetic emergency otter on a 24/7 storefront, with a live missed-call simulator: watch a missed call turn into an instant text-back and a booked job.",
    accent: "#2ee6d6",
    tryIt: ["Run the missed-call simulator", "Tap Call Now"],
    hook: "Run the missed-call sim. That text-back is the $400 after-hours job you currently lose. Checkout stamps your number on Call Now.",
    entry: "plumbing/index.html",
    poster: "media/plumbing-emergency-hero.jpg",
    preview: "media/plumbing-emergency-hero.mp4",
    requires: ["plumbing/index.html", "media/plumbing-emergency-hero.mp4"],
    brand: { names: ["Rogue Rapid Plumbing"], phones: ["(541) 555-0142"] },
  },
  {
    id: "drone-hub",
    dir: "studio",
    name: "Axiom Drone Hub",
    niche: "Drone Services · Aerial",
    blurb: "A 3D drone command hub over cinematic footage, with switchable mission modes and a booking flow for aerial jobs.",
    accent: "#4da3ff",
    tryIt: ["Switch mission modes", "Drag to look around"],
    hook: "Switch a mission, then hit book. That flow is what a $12k agency site still will not do — and it becomes yours in one payment.",
    entry: "drone-hub/index.html",
    poster: "media/drone-poster.jpg",
    preview: "media/drone-loop.mp4",
    requires: ["drone-hub/index.html", "media/drone-loop.mp4"],
    brand: { names: ["Axiom Drone Hub", "Axiom"], phones: [] },
  },
  {
    id: "apex-alpine",
    name: "Apex Alpine",
    niche: "Aerial Recon · Film Studio",
    blurb: "Snow leopard hero with thermal-recon and command-center sections for a drone fleet and studio business, plus a deploy request form.",
    accent: "#9be7ff",
    tryIt: ["Scroll into Thermal Recon", "Open Deploy"],
    hook: "Open Deploy. That request is a real lead form. Your logo sits on this leopard the same night you pay.",
    entry: "snow-leopard-apex/index.html",
    poster: "apex/snowleapard-hero-poster.jpg",
    preview: "apex/snowleapard-hero-web.mp4",
    requires: ["snow-leopard-apex/index.html", "apex/snowleapard-hero-web.mp4"],
    brand: { names: ["Apex Alpine Systems", "Apex Alpine"], phones: [] },
  },
  {
    id: "leopard-adventures",
    name: "Leopard Adventures",
    niche: "Outfitters · Guides",
    blurb: "A snow leopard stalking through fog under GPS telemetry, with a trip builder that prices by package and group size.",
    accent: "#7fe3ff",
    tryIt: ["Open Instant Quote", "Change the group size"],
    hook: "Change the group size and watch the quote move. That is the conversation you currently have on Facebook Messenger at 9pm.",
    entry: "index.html",
    poster: "media/leopard-hero-poster.jpg",
    preview: "media/leopard-hero.mp4",
    requires: ["index.html", "media/leopard-hero.mp4"],
    brand: { names: ["Leopard Adventures"], phones: ["(541) 555-0142"] },
  },
  {
    id: "abyssal-systems",
    name: "Abyssal Systems",
    niche: "Marine · Charters",
    blurb: "Ironsight-style HUD over full-screen shark footage: live depth, temperature and clock, plus Book, Call, Directions and an instant quote.",
    accent: "#2fe0d0",
    tryIt: ["Watch the live depth readout", "Open Instant Quote"],
    hook: "Book / Call / Directions are already wired. Checkout swaps the demo name for yours — the HUD stays.",
    entry: "index.html",
    poster: "hero-ocean-poster.jpg",
    preview: "hero-ocean-loop.mp4",
    requires: ["index.html", "hero-ocean-loop.mp4"],
    brand: { names: ["Abyssal Systems"], phones: ["(541) 555-0123"] },
  },
  {
    id: "abyssal-sanctuary",
    name: "Abyssal Sanctuary",
    niche: "Dive Tours · Aquatic",
    blurb: "A photoreal reef feed through a WebGL water shader. Ripple the water, lock on to tracked sea life, and make the octopus ink.",
    accent: "#00ffcc",
    tryIt: ["Drag across the water", "Tap a contact to lock on", "Tap the octopus"],
    hook: "Lock onto a contact. Guests remember this. You remember the booked dive. Make it your charter brand today.",
    entry: "index.html",
    poster: "poster.jpg",
    preview: "shark-hero-animation.mp4",
    requires: ["index.html", "main.js", "shark-hero-animation.mp4"],
    brand: { names: ["Abyssal Sanctuary"], phones: [] },
  },
  {
    id: "aqua-otter",
    dir: "studio",
    name: "Aqua Otter Advocates",
    niche: "Nonprofit · Eco Tours",
    blurb: "Underwater otter hero with poppable bubbles, a live telemetry panel, a voice-concierge card and expedition booking.",
    accent: "#22d3ee",
    tryIt: ["Pop the bubbles", "Hit Start Dive"],
    hook: "Hit Start Dive, then book an expedition. Donors and guests should feel this — not a WordPress theme.",
    entry: "otter-adventures/index.html",
    poster: "videos/otter-hero-poster.jpg",
    preview: "videos/otter-hero.mp4",
    requires: ["otter-adventures/index.html", "videos/otter-hero.mp4"],
    brand: { names: ["Aqua Otter Advocates"], phones: [] },
  },
  {
    id: "wall-cam-pest",
    name: "Wallwatch Pest Control",
    niche: "Pest Control · Wall-Cam",
    blurb: "A live wall-cam: visitors tap the siding, the cover shatters, and six pests light up with inspection prices behind the drywall.",
    accent: "#00ffcc",
    tryIt: ["Tap Open the wall", "Tap a pest bracket", "Book an inspection"],
    hook: "Prospects play with the wall. You get the inspection. Checkout stamps your shop name and number on this exact HUD.",
    entry: "index.html",
    poster: "poster.jpg",
    preview: "pests.mp4",
    requires: ["index.html", "pests.mp4", "poster.jpg", "wall.jpg"],
    brand: { names: ["Wallwatch Pest Control", "Wall-Cam Pest Hero"], phones: ["(541) 555-0142"] },
  },
];

export const showcaseSrc = (b: ShowcaseBuild, file: string) => `/showcase/${b.dir ?? b.id}/${file}`;
export const getShowcase = (id?: string | null) => SHOWCASE.find((b) => b.id === id);
