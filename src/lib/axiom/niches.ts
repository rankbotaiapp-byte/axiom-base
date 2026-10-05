import type { IntroPreset } from "./intro";
import { NICHE_MEDIA } from "./media";
import type { Service, ShopNiche } from "./types";

export type NicheTemplate = {
  niche: ShopNiche;
  label: string;
  kicker: string;
  blurb: string;
  defaultName: string;
  tagline: string;
  description: string;
  address: string;
  ringColor: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  heroBlendPercent: number;
  introPreset?: IntroPreset;
  introSpeed?: number;
  introIntensity?: number;
  hours?: Record<string, string>;
  primaryServiceIndex?: number;
  services: {
    name: string;
    description: string;
    durationMin: number;
    priceCents: number;
    group?: string;
  }[];
  employees: {
    displayName: string;
    title: string;
    bio: string;
    avatarUrl: string;
    phone?: string;
    serviceIndexes: number[];
  }[];
  portfolio: { employeeIndex: number; imageUrl: string; caption: string }[];
};

export const RING_PRESETS = [
  { name: "Teal", value: "#2EE6D6" },
  { name: "Copper", value: "#E7B48A" },
  { name: "Steel", value: "#7EC8E3" },
  { name: "Ember", value: "#E07A73" },
  { name: "Gold", value: "#C9A227" },
  { name: "Violet", value: "#B388FF" },
] as const;

/** Lead the onboarding row with the newest templates, then the original three. */
export const NICHE_ORDER: ShopNiche[] = ["fitness", "tattoo", "music", "contractor", "location", "field", "studio"];

export const NICHES: Record<ShopNiche, NicheTemplate> = {
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
    heroBlendPercent: 60,
    introPreset: "zoomin",
    introSpeed: 36,
    introIntensity: 48,
    primaryServiceIndex: 1,
    hours: {
      mon: "06:00-19:00",
      tue: "06:00-19:00",
      wed: "06:00-19:00",
      thu: "06:00-19:00",
      fri: "06:00-19:00",
      sat: "07:00-13:00",
      sun: "closed",
    },
    services: [
      {
        group: "Assess",
        name: "Intro assessment",
        description: "How you move, what hurts, and the first block of work.",
        durationMin: 45,
        priceCents: 8000,
      },
      {
        group: "Train",
        name: "Personal training",
        description: "One coach, one hour, the program you are actually on.",
        durationMin: 60,
        priceCents: 12000,
      },
      {
        group: "Train",
        name: "Small group",
        description: "Four people. The same hour, a shared floor.",
        durationMin: 50,
        priceCents: 4000,
      },
    ],
    employees: [
      {
        displayName: "Nina Voss",
        title: "Head coach",
        bio: "Strength first. She writes the block and stays for the ugly reps.",
        avatarUrl: "",
        serviceIndexes: [0, 1],
      },
      {
        displayName: "Calvin Brooks",
        title: "Coach",
        bio: "Small groups and the people who would rather not train alone.",
        avatarUrl: "",
        serviceIndexes: [1, 2],
      },
    ],
    portfolio: [],
  },
  music: {
    niche: "music",
    label: "Music artist / Rapper",
    kicker: "They book the night",
    blurb: "A release, a session, or the show itself — the booth and the room on one calendar.",
    defaultName: "Lowlight",
    tagline: "The record, then the room.",
    description:
      "Studio time and live sets out of New Era. Book the booth, the mix, or the night.",
    address: "New Era · books after two",
    ringColor: "#B388FF",
    heroImageUrl: NICHE_MEDIA.music.heroImageUrl,
    heroVideoUrl: NICHE_MEDIA.music.heroVideoUrl,
    heroBlendPercent: 68,
    introPreset: "panlr",
    introSpeed: 24,
    introIntensity: 62,
    primaryServiceIndex: 2,
    hours: {
      mon: "closed",
      tue: "14:00-22:00",
      wed: "14:00-22:00",
      thu: "14:00-22:00",
      fri: "14:00-22:00",
      sat: "12:00-20:00",
      sun: "closed",
    },
    services: [
      {
        group: "Release",
        name: "Single rollout",
        description: "Artwork, the date, and the posts that go with the drop.",
        durationMin: 60,
        priceCents: 35000,
      },
      {
        group: "Release",
        name: "Mix + master",
        description: "One song. Notes back in the same sitting.",
        durationMin: 90,
        priceCents: 28000,
      },
      {
        group: "Show",
        name: "Studio session",
        description: "Booth time with an engineer. Two songs, or one until it sits right.",
        durationMin: 120,
        priceCents: 40000,
      },
      {
        group: "Show",
        name: "Live set",
        description: "Book the show. A room, a set length, and the night.",
        durationMin: 45,
        priceCents: 80000,
      },
      {
        group: "Show",
        name: "Feature verse",
        description: "Write and record a verse on your record.",
        durationMin: 75,
        priceCents: 50000,
      },
    ],
    employees: [
      {
        displayName: "Mara Quinn",
        title: "Artist",
        bio: "Writes in the booth and holds the room when the lights drop.",
        avatarUrl: "/media/music-mara.jpg",
        serviceIndexes: [0, 2, 3, 4],
      },
      {
        displayName: "Ellis Ward",
        title: "Engineer",
        bio: "Runs the desk. The mix comes back before you leave the block.",
        avatarUrl: "/media/music-ellis.jpg",
        serviceIndexes: [1, 2],
      },
    ],
    portfolio: [
      { employeeIndex: 0, imageUrl: "/media/music-work-2.jpg", caption: "The room" },
      { employeeIndex: 0, imageUrl: "/media/music-hero.jpg", caption: "Night set" },
      { employeeIndex: 1, imageUrl: "/media/music-work-1.jpg", caption: "Booth" },
    ],
  },
  contractor: {
    niche: "contractor",
    label: "General contractor / Home services",
    kicker: "They book the job",
    blurb: "A consult, a measure, or the start day — home work with a scope you can read.",
    defaultName: "Hearth Line",
    tagline: "Walk the house. Then we build.",
    description:
      "Kitchens, repairs, and the rooms that need a real start day. New Era, and about twenty miles out.",
    address: "New Era · jobs within 20 miles",
    ringColor: "#C9A227",
    heroImageUrl: NICHE_MEDIA.contractor.heroImageUrl,
    heroVideoUrl: NICHE_MEDIA.contractor.heroVideoUrl,
    heroBlendPercent: 56,
    introPreset: "zoomin",
    introSpeed: 30,
    introIntensity: 38,
    primaryServiceIndex: 0,
    hours: {
      mon: "07:30-16:30",
      tue: "07:30-16:30",
      wed: "07:30-16:30",
      thu: "07:30-16:30",
      fri: "07:30-16:30",
      sat: "08:00-13:00",
      sun: "closed",
    },
    services: [
      {
        group: "Consult",
        name: "Project consultation",
        description: "Walk the house. Leave with a scope and a number.",
        durationMin: 60,
        priceCents: 15000,
      },
      {
        group: "Consult",
        name: "Site measure",
        description: "Rooms, openings, and the list the crew actually builds from.",
        durationMin: 90,
        priceCents: 20000,
      },
      {
        group: "Build",
        name: "Repair call",
        description: "One problem. A leak, a door, a stair that moves.",
        durationMin: 120,
        priceCents: 28000,
      },
      {
        group: "Build",
        name: "Start day",
        description: "The first day on a room. The rest of the job is quoted from the consult.",
        durationMin: 240,
        priceCents: 65000,
      },
    ],
    employees: [
      {
        displayName: "Lena Cho",
        title: "General contractor",
        bio: "Scopes the job in plain language, then stays on it until the punch list is short.",
        avatarUrl: "/media/contractor-lead.jpg",
        serviceIndexes: [0, 1, 3],
      },
      {
        displayName: "Owen Briggs",
        title: "Lead carpenter",
        bio: "Cabinets, stairs, and the repairs that should have been done last year.",
        avatarUrl: "/media/contractor-crew.jpg",
        serviceIndexes: [2, 3],
      },
    ],
    portfolio: [
      { employeeIndex: 0, imageUrl: "/media/contractor-work-1.jpg", caption: "Kitchen" },
      { employeeIndex: 0, imageUrl: "/media/contractor-hero.jpg", caption: "Start day" },
      { employeeIndex: 1, imageUrl: "/media/contractor-work-2.jpg", caption: "Front stair" },
    ],
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
    heroBlendPercent: 58,
    services: [
      {
        name: "Consult",
        description: "Placement, size, and a date for the work.",
        durationMin: 30,
        priceCents: 4000,
      },
      {
        name: "Small piece",
        description: "One sitting. Flash or a simple custom.",
        durationMin: 90,
        priceCents: 18000,
      },
      {
        name: "Session",
        description: "A longer sitting on a piece already drawn.",
        durationMin: 180,
        priceCents: 45000,
      },
    ],
    employees: [
      {
        displayName: "Rio Hale",
        title: "Lead artist",
        bio: "Linework and the pieces that take more than one afternoon.",
        avatarUrl: "",
        serviceIndexes: [0, 1, 2],
      },
      {
        displayName: "Sam Ortega",
        title: "Artist",
        bio: "Small work, flash, and the consult that turns into a drawing.",
        avatarUrl: "",
        serviceIndexes: [0, 1],
      },
    ],
    portfolio: [],
  },
  location: {
    niche: "location",
    label: "Barber",
    kicker: "They come to you",
    blurb: "A chair, a fade, a line out the door.",
    defaultName: "Atlas Cuts",
    tagline: "Precision cuts. No waiting around.",
    description:
      "A quiet two-chair shop. Book a chair, skip the walk-in list, leave looking finished.",
    address: "12 Main Street, New Era",
    ringColor: "#E7B48A",
    heroImageUrl: NICHE_MEDIA.location.heroImageUrl,
    heroVideoUrl: NICHE_MEDIA.location.heroVideoUrl,
    heroBlendPercent: 58,
    services: [
      {
        name: "Signature cut",
        description: "Consultation, cut, finish.",
        durationMin: 45,
        priceCents: 4800,
      },
      {
        name: "Skin fade",
        description: "Tight blend, razor line.",
        durationMin: 50,
        priceCents: 5400,
      },
      {
        name: "Beard sculpt",
        description: "Shape, line-up, oil.",
        durationMin: 25,
        priceCents: 2800,
      },
    ],
    employees: [
      {
        displayName: "Jordan Hale",
        title: "Lead barber",
        bio: "Fades and classic tapers. Calm chair, sharp lines.",
        avatarUrl: "/media/sal.jpg",
        serviceIndexes: [0, 1, 2],
      },
      {
        displayName: "Reese Quinn",
        title: "Barber",
        bio: "Texture and finishes. The haircut you forget you have — in a good way.",
        avatarUrl: "/media/marco.jpg",
        serviceIndexes: [0, 1],
      },
    ],
    portfolio: [
      { employeeIndex: 0, imageUrl: "/media/barber-work-1.jpg", caption: "House fade" },
      { employeeIndex: 0, imageUrl: "/media/barber-work-2.jpg", caption: "Shave" },
      { employeeIndex: 1, imageUrl: "/media/barber-work-1.jpg", caption: "Crop" },
    ],
  },
  field: {
    niche: "field",
    label: "Field service",
    kicker: "You go to them",
    blurb: "Auto, HVAC, trades — a van, a bay, a job that starts on the curb.",
    defaultName: "Northline Repair",
    tagline: "We come to the curb.",
    description:
      "Mobile diagnostics plus a bay for the work that needs a hoist. Plain-language quotes.",
    address: "New Era · 15-mile service radius",
    ringColor: "#7EC8E3",
    heroImageUrl: NICHE_MEDIA.field.heroImageUrl,
    heroVideoUrl: NICHE_MEDIA.field.heroVideoUrl,
    heroBlendPercent: 64,
    services: [
      {
        name: "Driveway diagnostic",
        description: "Scan and a plain-language report.",
        durationMin: 60,
        priceCents: 12900,
      },
      {
        name: "Oil + filter",
        description: "At the curb or in the bay.",
        durationMin: 45,
        priceCents: 8900,
      },
      {
        name: "Mobile rescue",
        description: "Battery, jump, no-start triage.",
        durationMin: 50,
        priceCents: 14900,
      },
    ],
    employees: [
      {
        displayName: "Chris Dalton",
        title: "Lead technician",
        bio: "Drivability and brakes. Listens to the engine — and to you.",
        avatarUrl: "/media/dana.jpg",
        serviceIndexes: [0, 1],
      },
      {
        displayName: "Avery Knox",
        title: "Mobile tech",
        bio: "The van is a rolling bay. Fast on the jobs that should not need a tow.",
        avatarUrl: "/media/gabe.jpg",
        serviceIndexes: [0, 2],
      },
    ],
    portfolio: [
      { employeeIndex: 0, imageUrl: "/media/auto-work-1.jpg", caption: "Brake job" },
      { employeeIndex: 0, imageUrl: "/media/auto-work-2.jpg", caption: "Bay work" },
      { employeeIndex: 1, imageUrl: "/media/auto-work-1.jpg", caption: "Curb-side" },
    ],
  },
  studio: {
    niche: "studio",
    label: "Studio",
    kicker: "You build for them",
    blurb: "Web apps, contractors, studios — a desk, a build, a product that books itself.",
    defaultName: "Forge Studio",
    tagline: "Powered by Axiom.",
    description:
      "We stand up the booking site, the operator console, and the staff station — then light the edge of the phone when the first appointment lands.",
    address: "New Era",
    ringColor: "#2EE6D6",
    heroImageUrl: NICHE_MEDIA.studio.heroImageUrl,
    heroVideoUrl: NICHE_MEDIA.studio.heroVideoUrl,
    heroBlendPercent: 60,
    services: [
      {
        name: "Discovery call",
        description: "What you run. What the ring should say.",
        durationMin: 45,
        priceCents: 15000,
      },
      {
        name: "Site launch session",
        description: "Live booking page, services, and staff.",
        durationMin: 90,
        priceCents: 48000,
      },
      {
        name: "Console + station",
        description: "Admin, employee board, incoming book.",
        durationMin: 60,
        priceCents: 32000,
      },
      {
        name: "Custom ring + brand",
        description: "Perimeter glow, color, confirmation language.",
        durationMin: 50,
        priceCents: 22000,
      },
    ],
    employees: [
      {
        displayName: "Eric",
        title: "Founder",
        bio: "Builds the shop you can book. New Era Apps, powered by Axiom.",
        avatarUrl: "/media/eric.jpg",
        phone: "5418908126",
        serviceIndexes: [0, 1, 2, 3],
      },
    ],
    portfolio: [
      { employeeIndex: 0, imageUrl: "/media/apps-work-1.jpg", caption: "The ring" },
      { employeeIndex: 0, imageUrl: "/media/apps-work-2.jpg", caption: "Operator console" },
      { employeeIndex: 0, imageUrl: "/media/apps-hero.jpg", caption: "Studio" },
    ],
  },
};

export const DEFAULT_HOURS: Record<string, string> = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "09:00-16:00",
  sun: "closed",
};

export const WEEKDAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
] as const;

export function nicheCopy(niche: ShopNiche) {
  if (niche === "fitness") return { bench: "The floor", heading: "Who coaches the hour." };
  if (niche === "tattoo") return { bench: "The chair", heading: "Who holds the machine." };
  if (niche === "music") return { bench: "The room", heading: "Who's on the record." };
  if (niche === "contractor") return { bench: "The crew", heading: "Who walks the job." };
  if (niche === "field") return { bench: "The crew", heading: "Who rolls up." };
  if (niche === "studio") return { bench: "The studio", heading: "Who you'll work with." };
  return { bench: "The bench", heading: "Who you'll sit with." };
}

export function serviceGroups(services: Service[] | null | undefined): { label: string; items: Service[] }[] {
  const groups: { label: string; items: Service[] }[] = [];
  for (const service of services ?? []) {
    const label = typeof service.group === "string" ? service.group : "";
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(service);
    else groups.push({ label, items: [service] });
  }
  return groups;
}
