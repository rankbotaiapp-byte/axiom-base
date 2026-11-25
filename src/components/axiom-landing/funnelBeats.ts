/**
 * Axiom scroll funnel — every word in the 6 pitch beats lives here.
 * Edit copy, timestamps and labels without touching the animation code.
 * `start` / `end` are seconds into the HeyGen recording; the floating player
 * jumps to `start` when a visitor taps "Watch this part".
 */

export type EnterFrom = "left" | "right" | "bottom";

export interface FounderVisual {
  kind: "founder";
  location: string;
  name: string;
  role: string;
  coordinates: string;
  region: string;
  portrait: string;
}

export interface FrictionItem {
  code: string;
  label: string;
  detail?: string;
  /** Highlighted in Axiom blue (the one that costs real money). */
  hot?: boolean;
}

export interface FrictionVisual {
  kind: "friction";
  target: string;
  items: FrictionItem[];
}

export interface EngineVisual {
  kind: "engine";
  eyebrow: string;
  word: string;
}

export interface NodeItem {
  code: string;
  label: string;
}

export interface CoreVisual {
  kind: "core";
  header: string;
  core: string;
  coreLabel: string;
  status: string;
  nodes: [NodeItem, NodeItem, NodeItem];
}

export interface FocusVisual {
  kind: "focus";
  focusLabel: string;
  jobs: { name: string; amount: string }[];
  statusLabel: string;
  status: string;
}

export interface StudioHandoffVisual {
  kind: "studio";
  header: string;
  pager: string;
  panelLabel: string;
  price: string;
  pitch: string;
  footer: string;
  launchLabel: string;
  trialLabel: string;
}

export type BeatVisual = FounderVisual | FrictionVisual | EngineVisual | CoreVisual | FocusVisual | StudioHandoffVisual;

export interface Beat {
  id: string;
  number: string;
  start: number;
  end: number;
  enterFrom: EnterFrom;
  kicker: string;
  title: string;
  body: string;
  visual: BeatVisual;
}

export const FUNNEL_BEATS: Beat[] = [
  {
    id: "founder",
    number: "01",
    start: 0,
    end: 5,
    enterFrom: "left",
    kicker: "Founder · Pacific Northwest",
    title: "Hey — I'm Eric, a local web builder.",
    body: "I build Axiom right here in the Pacific Northwest, for the contractors and service pros who keep this region running.",
    visual: {
      kind: "founder",
      location: "LOCATION: PACIFIC NORTHWEST",
      name: "ERIC",
      role: "WEB BUILDER",
      coordinates: "45.5230° N, 122.6765° W",
      region: "ROGUE VALLEY · OREGON",
      portrait: "/videos/axiom-story-eric.jpg",
    },
  },
  {
    id: "friction",
    number: "02",
    start: 5,
    end: 13,
    enterFrom: "right",
    kicker: "Target: Contractors & Service Pros",
    title: "You didn't start a business to fight this at night.",
    body: "Updating the website. Feeding the social queue. Calling back the lead you missed while you were on a job. That's not the work you're paid for.",
    visual: {
      kind: "friction",
      target: "FRICTION LOG",
      items: [
        { code: "FRICTION 01", label: "Manual web updates" },
        { code: "FRICTION 02", label: "Social queue pending" },
        { code: "FRICTION 03", label: "Missed calls", detail: "9:42 PM", hot: true },
      ],
    },
  },
  {
    id: "engine",
    number: "03",
    start: 13,
    end: 15,
    enterFrom: "bottom",
    kicker: "The fix",
    title: "Meet Axiom.",
    body: "An autonomous booking and content engine that runs your digital front desk 24/7.",
    visual: { kind: "engine", eyebrow: "THE AUTONOMOUS ENGINE", word: "AXIOM" },
  },
  {
    id: "core",
    number: "04",
    start: 15,
    end: 20,
    enterFrom: "left",
    kicker: "Always-on autopilot",
    title: "Three modules. Zero days off.",
    body: "Axiom books the jobs, keeps your content flowing, and keeps your web presence live — around the clock, without you touching it.",
    visual: {
      kind: "core",
      header: "NEO-GRID / ENGINE 01",
      core: "24/7",
      coreLabel: "ALWAYS-ON AUTOPILOT ENGINE",
      status: "SYSTEM STATUS: 100% AUTOPILOT",
      nodes: [
        { code: "NODE 01", label: "Autonomous booking" },
        { code: "NODE 02", label: "Content pipeline" },
        { code: "NODE 03", label: "Live web presence" },
      ],
    },
  },
  {
    id: "focus",
    number: "05",
    start: 20,
    end: 25,
    enterFrom: "right",
    kicker: "Your focus",
    title: "You do the trade and close the jobs. Axiom runs the rest.",
    body: "While you're on the roof or under the sink, Axiom keeps every digital chore moving in the background.",
    visual: {
      kind: "focus",
      focusLabel: "YOUR FOCUS: TRADE & CLOSING JOBS",
      jobs: [
        { name: "Water heater swap · Medford", amount: "$1,450" },
        { name: "Panel upgrade · Grants Pass", amount: "$2,300" },
        { name: "Roof leak repair · Ashland", amount: "$860" },
      ],
      statusLabel: "STATUS: LIVE",
      status: "AXIOM: ALL DIGITAL UPKEEP ACTIVE",
    },
  },
  {
    id: "studio",
    number: "06",
    start: 25,
    end: 28,
    enterFrom: "bottom",
    kicker: "Build it live",
    title: "Build your storefront right here — then test drive it for $1.",
    body: "No dead links, no sales call. Name your business, pick your trade, drop in a photo and watch Axiom build it below.",
    visual: {
      kind: "studio",
      header: "AXIOM / STUDIO",
      pager: "01 / 02",
      panelLabel: "BUILD YOUR STOREFRONT LIVE",
      price: "$1",
      pitch: "STOREFRONT TEST DRIVE",
      footer: "PRICE · USD",
      launchLabel: "Launch Studio Below",
      trialLabel: "Test Drive for $1",
    },
  },
];
