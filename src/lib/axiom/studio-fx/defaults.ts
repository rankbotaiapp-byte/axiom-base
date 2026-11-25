import type {
  StudioAssetSlot,
  StudioFxState,
  StudioGlobalLibrary,
  StudioPromptTuning,
  StudioTenantRow,
  StudioTradeCategory,
} from "./types";

export const STUDIO_CYAN = "#00ffcc";
export const STUDIO_COPPER = "#b87333";
export const STUDIO_OBSIDIAN = "#050507";
export const STUDIO_PANEL = "#07080C";

/** Local plates shipped in `public/`. Replaced the moment a tenant uploads or renders. */
export const STUDIO_PLATES = {
  raw: "/textures/car-driving-night.png",
  branded: "/apex-moto-gt3/apex-poster.jpg",
  video: "/apex-moto-gt3/apex-clean-loop.mp4",
  frames: [
    "/textures/car-driving-night.png",
    "/showcase/studio/media/plumbing-emergency-hero.jpg",
    "/apex-moto-gt3/apex-poster.jpg",
    "/media/axio-plumber-hero.jpg",
    "/media/heroes/contractor.jpg",
    "/media/auto-hero.jpg",
  ],
} as const;

const DEMO_RAW = STUDIO_PLATES.raw;
const DEMO_AFTER = STUDIO_PLATES.branded;

export const DEFAULT_PROMPT_TUNING: StudioPromptTuning = {
  stillPrompt:
    "Cinematic branded trade photo, matte black vehicle wrap, neon cyan (#00ffcc) headlight glow, copper-bronze Axiom badge, volumetric smoke, wet asphalt reflections, HUD telemetry frame",
  videoPrompt:
    "6s looping cinematic motion: smoke drift, neon pulse, particle ember field, slow camera push on branded asset",
  negativePrompt: "blurry, watermark, low-res, cartoon, text artifacts",
  strength: 0.72,
};

export function studioFxSettingKey(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  return `axiom_studio_fx:${safe}`;
}

export const STUDIO_GLOBAL_KEY = "axiom_studio_global";

export function defaultStudioFxState(slug = "default"): StudioFxState {
  const now = new Date().toISOString();
  return {
    version: 1,
    slug: slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default",
    updatedAt: now,
    rawUrl: DEMO_RAW,
    brandedUrl: DEMO_AFTER,
    autopilotVideoUrl: STUDIO_PLATES.video,
    toggles: {
      axiomBadge: true,
      neonGlow: true,
      copperWrap: true,
      hudFrame: true,
      cinematicSmoke: true,
      wetMud: true,
      snowEmber: false,
    },
    levels: { smoke: 0.62, mud: 0.34, glow: 0.78, copper: 0.7 },
    activeStage: "branded",
    scrubMatrix: [...STUDIO_PLATES.frames],
    promptTuning: { ...DEFAULT_PROMPT_TUNING },
  };
}

export function defaultStudioGlobalLibrary(): StudioGlobalLibrary {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    assets: [
      { id: "muscle-1", label: "Muscle Carvers", trade: "muscle", thumbUrl: "/apex-moto-gt3/apex-poster.jpg" },
      { id: "barber-1", label: "Barbers", trade: "barbers", thumbUrl: "/media/studio-cyan-fog-poster.jpg" },
      { id: "mech-1", label: "Mechanics", trade: "mechanics", thumbUrl: "/textures/car-driving-night.png" },
      { id: "plumb-1", label: "Plumbers", trade: "plumbers", thumbUrl: "/showcase/studio/media/plumbing-emergency-hero.jpg" },
      { id: "contractor-1", label: "Contractors", trade: "towing", thumbUrl: "/media/heroes/contractor.jpg" },
      { id: "auto-1", label: "Auto", trade: "mechanics", thumbUrl: "/media/auto-hero.jpg" },
    ],
    tenants: [
      {
        slug: "a1-towing",
        name: "A1 Towing",
        niche: "towing",
        studioUsage: 42,
        stripeConnected: true,
        lastRenderAt: nowIsoOffset(-2),
      },
      {
        slug: "main-st-barbers",
        name: "Main St. Barbers",
        niche: "barbers",
        studioUsage: 18,
        stripeConnected: true,
        lastRenderAt: nowIsoOffset(-8),
      },
      {
        slug: "precision-auto",
        name: "Precision Auto",
        niche: "mechanics",
        studioUsage: 31,
        stripeConnected: false,
        lastRenderAt: nowIsoOffset(-26),
      },
    ],
    promptTuning: { ...DEFAULT_PROMPT_TUNING },
    queueJobs: [
      { id: "job-1", slug: "a1-towing", label: "Branded still", progress: 0.72 },
      { id: "job-2", slug: "precision-auto", label: "Autopilot loop", progress: 0.38 },
    ],
  };
}

function nowIsoOffset(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

export function normalizeStudioFxState(raw: unknown, slug = "default"): StudioFxState {
  const base = defaultStudioFxState(slug);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const toggles = (o.toggles ?? {}) as Partial<StudioFxState["toggles"]>;
  const levels = (o.levels ?? {}) as Partial<StudioFxState["levels"]>;
  const prompt = (o.promptTuning ?? {}) as Partial<StudioFxState["promptTuning"]>;
  return {
    ...base,
    ...pickStrings(o, ["slug", "updatedAt", "rawUrl", "brandedUrl", "autopilotVideoUrl"]),
    rawUrl: repairMedia(typeof o.rawUrl === "string" ? o.rawUrl : "", base.rawUrl),
    brandedUrl: repairMedia(typeof o.brandedUrl === "string" ? o.brandedUrl : "", base.brandedUrl),
    autopilotVideoUrl: repairMedia(
      typeof o.autopilotVideoUrl === "string" ? o.autopilotVideoUrl : "",
      base.autopilotVideoUrl,
    ),
    slug: String(o.slug || slug).replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default",
    version: 1,
    toggles: { ...base.toggles, ...boolMap(toggles, base.toggles) },
    levels: {
      smoke: num(levels.smoke, base.levels.smoke),
      mud: num(levels.mud, base.levels.mud),
      glow: num(levels.glow, base.levels.glow),
      copper: num(levels.copper, base.levels.copper),
    },
    activeStage:
      o.activeStage === "raw" || o.activeStage === "branded" || o.activeStage === "autopilot"
        ? o.activeStage
        : base.activeStage,
    scrubMatrix: sixFrames(
      Array.isArray(o.scrubMatrix) ? o.scrubMatrix.map(String) : [],
      base.scrubMatrix,
    ).map((url, i) => repairMedia(url, base.scrubMatrix[i] || base.brandedUrl)),
    promptTuning: {
      stillPrompt: String(prompt.stillPrompt ?? base.promptTuning.stillPrompt),
      videoPrompt: String(prompt.videoPrompt ?? base.promptTuning.videoPrompt),
      negativePrompt: String(prompt.negativePrompt ?? base.promptTuning.negativePrompt),
      strength: num(prompt.strength, base.promptTuning.strength),
    },
  };
}

export function normalizeStudioGlobal(raw: unknown): StudioGlobalLibrary {
  const base = defaultStudioGlobalLibrary();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    ...base,
    updatedAt: String(o.updatedAt ?? base.updatedAt),
    version: 1,
    assets: normalizeAssets(o.assets, base.assets),
    tenants: normalizeTenants(o.tenants, base.tenants),
    queueJobs: normalizeJobs(o.queueJobs, base.queueJobs),
    promptTuning: normalizeStudioFxState({ promptTuning: o.promptTuning }).promptTuning,
  };
}

const TRADES = new Set<StudioTradeCategory>([
  "mechanics",
  "barbers",
  "detailers",
  "tattoo",
  "plumbers",
  "muscle",
  "towing",
]);

function sixFrames(list: string[], fallback: string[]): string[] {
  const out = list.map((s) => s.trim()).filter(Boolean);
  let i = 0;
  while (out.length < 6) {
    out.push(fallback[i] || fallback[fallback.length - 1] || out[out.length - 1] || "");
    i += 1;
    if (i > 8) break;
  }
  return out.slice(0, 6);
}

function normalizeAssets(raw: unknown, fallback: StudioAssetSlot[]): StudioAssetSlot[] {
  if (!Array.isArray(raw)) return fallback;
  const out = raw.flatMap((item, i) => {
    if (!item || typeof item !== "object") return [];
    const a = item as Partial<StudioAssetSlot>;
    const thumbUrl = repairMedia(String(a.thumbUrl || "").trim(), fallback[i]?.thumbUrl || fallback[0]?.thumbUrl || "");
    if (!thumbUrl) return [];
    const trade = TRADES.has(a.trade as StudioTradeCategory) ? (a.trade as StudioTradeCategory) : "mechanics";
    return [{ id: String(a.id || `asset-${i}`), label: String(a.label || "Plate").slice(0, 48), trade, thumbUrl }];
  });
  return out;
}

function normalizeTenants(raw: unknown, fallback: StudioTenantRow[]): StudioTenantRow[] {
  if (!Array.isArray(raw)) return fallback;
  const out = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const t = item as Partial<StudioTenantRow>;
    const slug = String(t.slug || "").replace(/[^a-z0-9-_]/gi, "").slice(0, 64);
    if (!slug) return [];
    return [{
      slug,
      name: String(t.name || slug).slice(0, 64),
      niche: String(t.niche || "contractor").slice(0, 32),
      studioUsage: Math.max(0, Math.round(Number(t.studioUsage) || 0)),
      stripeConnected: Boolean(t.stripeConnected),
      lastRenderAt: t.lastRenderAt ? String(t.lastRenderAt) : null,
    }];
  });
  return out;
}

function normalizeJobs(
  raw: unknown,
  fallback: StudioGlobalLibrary["queueJobs"],
): StudioGlobalLibrary["queueJobs"] {
  if (!Array.isArray(raw)) return fallback;
  const out = raw.flatMap((item, i) => {
    if (!item || typeof item !== "object") return [];
    const j = item as { id?: string; slug?: string; label?: string; progress?: number };
    const slug = String(j.slug || "").replace(/[^a-z0-9-_]/gi, "").slice(0, 64);
    if (!slug) return [];
    return [{
      id: String(j.id || `job-${i}`),
      slug,
      label: String(j.label || "Render").slice(0, 48),
      progress: num(j.progress, 0),
    }];
  });
  return out.slice(0, 8);
}

function repairMedia(url: string, fallback: string): string {
  const clean = url.trim();
  if (!clean || /hero-studio-reference|obsidian-burst/.test(clean)) return fallback;
  return clean;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function boolMap<T extends Record<string, boolean>>(partial: Partial<T>, base: T): T {
  const out = { ...base };
  for (const key of Object.keys(base) as (keyof T)[]) {
    if (typeof partial[key] === "boolean") out[key] = partial[key] as T[keyof T];
  }
  return out;
}

function pickStrings(o: Record<string, unknown>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (typeof o[k] === "string" && o[k]) out[k] = o[k] as string;
  }
  return out;
}
