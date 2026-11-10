/**
 * Single source of truth for the Axiom storefront.
 * Copy, pricing, hero timing and niche presets all live here so the page
 * can be re-skinned (otter, moto, etc.) without touching components.
 */

export const site = {
  name: "Axiom",
  legalName: "New Era Apps (Gear Guardian LLC)",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Your complete local business app — live in minutes.",
  description:
    "Axiom builds a 24/7 booking app, admin dashboard and autonomous content engine for your local business. Launch to your phone in minutes, or book a 2-week custom build.",
  region: "Southern Oregon",
  contactEmail: "hello@newera-apps.com",
} as const;

export type PlanId = "starter" | "lifetime" | "custom";

export const plans: Record<
  PlanId,
  { id: PlanId; label: string; cta: string; price: string; fine: string; tone: "ember" | "ice" | "ghost" }
> = {
  starter: {
    id: "starter",
    label: "Complete App System",
    cta: "Start for $1",
    price: "$1 first month",
    fine: "then $150/mo · cancel anytime",
    tone: "ember",
  },
  lifetime: {
    id: "lifetime",
    label: "Lifetime Access",
    cta: "Get Lifetime Access — $1000",
    price: "$1000 once",
    fine: "one payment · yours forever",
    tone: "ice",
  },
  custom: {
    id: "custom",
    label: "2-Week Custom Build",
    cta: "Book a 2-week build",
    price: "Quoted per project",
    fine: "built personally by Eric, with Axiom",
    tone: "ghost",
  },
};

/** Hero timing + framing. All times are seconds into the source clip. */
export const hero = {
  sources: [
    { src: "/media/hero-1280.webm", type: "video/webm", media: "(min-width: 768px)" },
    { src: "/media/hero-1280.mp4", type: "video/mp4", media: "(min-width: 768px)" },
    { src: "/media/hero-854.webm", type: "video/webm" },
    { src: "/media/hero-854.mp4", type: "video/mp4" },
  ],
  poster: "/media/hero-poster.jpg",
  videoAspect: 16 / 9,
  /** Moment the leopard is mid-stride with shards in the air. */
  freezeAt: 2.3,
  /** Speed-ramp into the freeze (bullet-time feel). */
  rampIn: 0.55,
  /** How long the world stays frozen while the camera orbits. */
  freezeDuration: 4.6,
  /** Subject centre/size in UV space (0..1, origin bottom-left) — drives depth relief. */
  subject: { x: 0.47, y: 0.5, rx: 0.2, ry: 0.42 },
  /** Max camera swing either side of centre, radians. The shard field itself turns a full 360°. */
  orbitArc: 0.62,
  /**
   * Optional: a pre-rendered true 360° bullet-time clip of the frozen subject
   * (e.g. generated with a "360 orbit, frozen moment" prompt). When set, it is
   * played inside the freeze instead of the 2.5D relief, with shards composited on top.
   */
  orbitClip: null as string | null,
  /** Freeze on every loop, or only the first N loops. */
  freezeLoops: Infinity,
} as const;

/** Niche presets used to seed a brand-new tenant app in one click. */
export const niches = {
  barber: {
    label: "Barbershop",
    schemaType: "BarberShop",
    services: ["Haircut", "Skin fade", "Beard trim", "Hot towel shave"],
    pillars: ["style guides", "maintenance tips", "behind the chair", "local events"],
  },
  salon: {
    label: "Hair & beauty salon",
    schemaType: "HairSalon",
    services: ["Cut & style", "Color", "Highlights", "Blowout"],
    pillars: ["trends", "hair care", "before & after", "seasonal looks"],
  },
  restaurant: {
    label: "Restaurant / food truck",
    schemaType: "Restaurant",
    services: ["Dine-in", "Takeout", "Catering", "Events"],
    pillars: ["menu spotlights", "specials", "kitchen stories", "local events"],
  },
  auto: {
    label: "Auto repair",
    schemaType: "AutoRepair",
    services: ["Diagnostics", "Brakes", "Oil change", "Suspension"],
    pillars: ["warning signs", "seasonal maintenance", "repair explainers", "cost guides"],
  },
  trades: {
    label: "Home services / trades",
    schemaType: "HomeAndConstructionBusiness",
    services: ["Repairs", "Installs", "Inspections", "Emergency calls"],
    pillars: ["homeowner tips", "project showcases", "seasonal checklists", "cost guides"],
  },
  fitness: {
    label: "Gym / trainer / coach",
    schemaType: "ExerciseGym",
    services: ["1:1 training", "Group classes", "Programs", "Assessments"],
    pillars: ["training tips", "client wins", "nutrition basics", "local events"],
  },
  other: {
    label: "Other local business",
    schemaType: "LocalBusiness",
    services: ["Consultation", "Service", "Appointment"],
    pillars: ["how-tos", "FAQs", "behind the scenes", "local community"],
  },
} as const;

export type NicheId = keyof typeof niches;
export const nicheIds = Object.keys(niches) as NicheId[];
