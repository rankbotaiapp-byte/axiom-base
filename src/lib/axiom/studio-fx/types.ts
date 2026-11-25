/** Axiom Studio FX state — persisted in Supabase `app_settings`. */

export type StudioTradeCategory =
  | "mechanics"
  | "barbers"
  | "detailers"
  | "tattoo"
  | "plumbers"
  | "muscle"
  | "towing";

export type StudioFxToggles = {
  axiomBadge: boolean;
  neonGlow: boolean;
  copperWrap: boolean;
  hudFrame: boolean;
  cinematicSmoke: boolean;
  wetMud: boolean;
  snowEmber: boolean;
};

export type StudioFxLevels = {
  smoke: number;
  mud: number;
  glow: number;
  /** 0–1 copper-bronze wrap intensity. Drives the wrap toggle when above zero. */
  copper: number;
};

export type StudioPipelineStage = "raw" | "branded" | "autopilot";

export type StudioAssetSlot = {
  id: string;
  label: string;
  trade: StudioTradeCategory;
  thumbUrl: string;
};

export type StudioTenantRow = {
  slug: string;
  name: string;
  niche: string;
  studioUsage: number;
  stripeConnected: boolean;
  lastRenderAt: string | null;
};

export type StudioPromptTuning = {
  stillPrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  strength: number;
};

export type StudioFxState = {
  version: 1;
  slug: string;
  updatedAt: string;
  rawUrl: string;
  brandedUrl: string;
  autopilotVideoUrl: string;
  toggles: StudioFxToggles;
  levels: StudioFxLevels;
  activeStage: StudioPipelineStage;
  scrubMatrix: string[];
  promptTuning: StudioPromptTuning;
};

export type StudioGlobalLibrary = {
  version: 1;
  updatedAt: string;
  assets: StudioAssetSlot[];
  tenants: StudioTenantRow[];
  promptTuning: StudioPromptTuning;
  queueJobs: { id: string; slug: string; label: string; progress: number }[];
};
