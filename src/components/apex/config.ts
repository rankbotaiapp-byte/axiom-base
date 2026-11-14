/**
 * APEX MOTO · APEX GT3 — single source of truth for the hero video crop,
 * performance tiers, product data and pricing.
 *
 * All pixel values are in SOURCE VIDEO pixels (752 × 400 master).
 */

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VideoCropConfig {
  /** Native size of the master video file. */
  source: { width: number; height: number };
  /** Window that isolates the car + exhaust and excludes the baked-in button bar. */
  crop: PixelRect;
  /** Baked-in headline text that is inpainted out by the shader. */
  inpaint: PixelRect;
  /** Point (0–1 inside the crop) the framing is built around (car centre). */
  focal: { x: number; y: number };
  /** Where on screen (0–1) the focal point lands — keeps the flames above the bottom HUD. */
  screenAnchor: { landscape: { x: number; y: number }; portrait: { x: number; y: number } };
  /** 0 = object-fit contain, 1 = object-fit cover (blended in log space). */
  fit: { landscape: number; portrait: number };
  /** >1 pulls the camera back (smaller car, more obsidian space around it). */
  frame: { landscape: number; portrait: number };
  /** Exhaust tips in source pixels — particle embers are emitted from here. */
  emitters: ReadonlyArray<{ x: number; y: number }>;
  /** Seamless loop window (seconds). Skips the headline fade-in at the head of the file. */
  loop: { start: number; end: number };
}

export const videoCrop: VideoCropConfig = {
  source: { width: 752, height: 400 },
  crop: { x: 90, y: 12, w: 662, h: 326 },
  inpaint: { x: 38, y: 186, w: 286, h: 32 },
  focal: { x: 0.56, y: 0.62 },
  screenAnchor: { landscape: { x: 0.6, y: 0.43 }, portrait: { x: 0.5, y: 0.4 } },
  fit: { landscape: 0.3, portrait: 0.32 },
  frame: { landscape: 1.2, portrait: 1 },
  emitters: [
    { x: 505, y: 262 },
    { x: 662, y: 258 },
  ],
  loop: { start: 0.6, end: 5.95 },
};

export const media = {
  master: "/media/apex-moto-gt3-hero.mp4",
  /** Pre-cropped, headline-removed loop for the CSS-only tier (no shader needed). */
  cleanLoop: "/media/garage-loop.mp4",
  poster: "/media/apex-moto-gt3-poster.jpg",
} as const;

/* ------------------------------------------------------------------ */
/* Performance tiers                                                    */
/* ------------------------------------------------------------------ */

export type DeviceTier = "desktop" | "mobile" | "low";

export interface TierSettings {
  label: string;
  maxPixelRatio: number;
  /** Multiplier applied to every particle layer's count. */
  particleScale: number;
  /** Bloom render-target size relative to the drawing buffer. */
  bloomResolution: number;
  bloomPasses: number;
}

export const tierSettings: Record<Exclude<DeviceTier, "low">, TierSettings> = {
  desktop: { label: "ULTRA · WEBGL", maxPixelRatio: 2, particleScale: 1, bloomResolution: 0.5, bloomPasses: 3 },
  mobile: { label: "MOBILE · WEBGL", maxPixelRatio: 1.25, particleScale: 0.5, bloomResolution: 0.25, bloomPasses: 2 },
};

export const lowTierLabel = "LITE · CSS";

/* ------------------------------------------------------------------ */
/* Telemetry baselines                                                  */
/* ------------------------------------------------------------------ */

export const telemetryBaseline = {
  whp: { idle: 685, launch: 742, min: 640, unit: "WHP" },
  boost: { idle: 24.5, launch: 29.2, min: 18, unit: "PSI" },
  egt: { idle: 820, launch: 918, min: 760, unit: "°C" },
} as const;

/* ------------------------------------------------------------------ */
/* Specs                                                                */
/* ------------------------------------------------------------------ */

export interface SpecRow {
  label: string;
  value: string;
}

export const engineSpecs: SpecRow[] = [
  { label: "Platform", value: "4.0 L naturally aspirated flat-six → APEX twin-turbo conversion" },
  { label: "Turbochargers", value: "Twin ball-bearing 62 mm billet, water-cooled" },
  { label: "Peak output", value: "742 WHP @ 8,400 rpm (launch map)" },
  { label: "Peak torque", value: "598 lb-ft @ 5,600 rpm" },
  { label: "Redline", value: "9,000 rpm" },
  { label: "Boost control", value: "4-port closed-loop, gear-based, 18–29 PSI" },
  { label: "Fueling", value: "Port + direct, E85 flex-fuel, 1,300 cc injectors" },
  { label: "Intercooling", value: "Air-to-water, dual heat exchangers" },
  { label: "Exhaust", value: "Inconel 625 headers, titanium cat-back, anti-lag pops" },
  { label: "Transmission", value: "7-speed PDK, reinforced clutch packs, launch-control TCU" },
  { label: "0–60 mph", value: "2.4 s (measured, 1-ft rollout)" },
  { label: "¼ mile", value: "9.6 s @ 151 mph" },
];

export interface AeroRow {
  label: string;
  value: string;
  /** 0–1 for the visual meter. */
  meter: number;
}

export const aeroSpecs: AeroRow[] = [
  { label: "Drag coefficient (Cd)", value: "0.39", meter: 0.39 },
  { label: "Lift coefficient (Cl)", value: "−0.42", meter: 0.42 },
  { label: "Downforce @ 150 mph", value: "1,040 lb", meter: 0.78 },
  { label: "Front / rear balance", value: "38 / 62 %", meter: 0.62 },
  { label: "Frontal area", value: "2.04 m²", meter: 0.51 },
  { label: "Swan-neck wing AoA", value: "4 positions · 6°–14°", meter: 0.6 },
];

/** Dyno curve sample generator (deterministic) — rpm → wheel hp / torque. */
export interface DynoPoint {
  rpm: number;
  whp: number;
  tq: number;
}

export function buildDynoCurve(): DynoPoint[] {
  const points: DynoPoint[] = [];
  for (let rpm = 2000; rpm <= 9000; rpm += 125) {
    const spool = 1 / (1 + Math.exp(-(rpm - 3600) / 420));
    const fall = rpm > 6200 ? 1 - Math.pow((rpm - 6200) / 4200, 2) * 0.55 : 1;
    const tq = (175 + 423 * spool) * fall;
    const whp = (tq * rpm) / 5252;
    points.push({ rpm, whp: Math.round(Math.min(whp, 742)), tq: Math.round(tq) });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Configurator                                                         */
/* ------------------------------------------------------------------ */

export interface ConfigOption {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export interface PaintOption extends ConfigOption {
  hex: string;
}

export interface ExhaustOption extends ConfigOption {
  /** Hue rotation (radians) applied to the flame pixels by the shader. */
  hue: number;
  swatch: string;
}

export const trims: ConfigOption[] = [
  { id: "stage1", name: "Stage 1 · Street", detail: "Tune + intake + flex fuel · 560 WHP", price: 18500 },
  { id: "stage2", name: "Stage 2 · Track", detail: "Twin-turbo kit + intercooling · 685 WHP", price: 46900 },
  { id: "apexr", name: "APEX R · Launch", detail: "Full build + PDK upgrade + anti-lag · 742 WHP", price: 78400 },
];

export const paints: PaintOption[] = [
  { id: "obsidian", name: "Obsidian Black", detail: "Deep-gloss, ceramic coated", price: 0, hex: "#0b0d14" },
  { id: "volt", name: "Cyan Volt", detail: "Pearl tri-coat", price: 9800, hex: "#06b6d4" },
  { id: "chalk", name: "Chalk Stone", detail: "Solid matte", price: 7400, hex: "#c9c6bd" },
  { id: "gunmetal", name: "Gunmetal Satin", detail: "Satin PPF wrap", price: 6200, hex: "#4b5563" },
  { id: "lava", name: "Lava Orange", detail: "Metallic tri-coat", price: 9800, hex: "#f97316" },
];

export const wheels: ConfigOption[] = [
  { id: "forged-black", name: "Forged Monoblock · Gloss Black", detail: "20/21\" centre-lock", price: 8900 },
  { id: "forged-bronze", name: "Forged Monoblock · Satin Bronze", detail: "20/21\" centre-lock", price: 9400 },
  { id: "magnesium", name: "Magnesium Race · Raw", detail: "−11.8 lb unsprung", price: 17600 },
];

export const exhaustTones: ExhaustOption[] = [
  { id: "cyan", name: "Cryo Cyan", detail: "Stock APEX calibration", price: 0, hue: 0, swatch: "#22d3ee" },
  { id: "violet", name: "Plasma Violet", detail: "Titanium tips + tuned pops", price: 2400, hue: 0.55, swatch: "#a78bfa" },
  { id: "inferno", name: "Inferno", detail: "Anti-lag map + Inconel tips", price: 3900, hue: 2.55, swatch: "#fb923c" },
];

export const aeroPacks: ConfigOption[] = [
  { id: "none", name: "Factory aero", detail: "Retain OEM wing", price: 0 },
  { id: "carbon", name: "Carbon Track Pack", detail: "Splitter + canards + swan-neck wing", price: 14200 },
];

export const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
