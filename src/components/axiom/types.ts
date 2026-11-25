// Axiom landing — shared types. No runtime code here.

export type StudioMode = "autopilot" | "manual";

/** Template slots the branded page exposes. Add new slots here first. */
export type SlotId = "hero" | "proof" | "services";

export type AccentKey = "cyan" | "amber" | "magenta";
export type ShowcaseThemeId = "solar_gold" | "pure_cyan" | "emergency_amber" | "cobalt_ice";

export interface StudioPhoto {
  id: string;
  /** Object URL (uploads) or public path (samples). */
  url: string;
  name: string;
  source: "upload" | "sample";
  /** Present for uploads only — what you send to storage / AI. */
  file?: File;
  /** True once the enhance API has returned for this photo. */
  enhanced?: boolean;
  /** Inlay used for the stored remake. A matching reload does not call Replicate. */
  inlay?: string;
  /** Motion of this remake. Same frame, background only. */
  backgroundVideo?: string;
  /** Preset that produced `backgroundVideo`. */
  motion?: string;
}

/** photo id (or null) per slot */
export type SlotMap = Record<SlotId, string | null>;

export type StudioStatus = "idle" | "enhancing" | "ready" | "error";

export interface StudioState {
  businessName: string;
  niche: string;
  mode: StudioMode;
  photos: StudioPhoto[];
  /** Only used in manual mode. Autopilot mapping is derived. */
  manualSlots: SlotMap;
  accent: AccentKey;
  showcaseThemeId: ShowcaseThemeId;
  heroMotion: boolean;
  status: StudioStatus;
  error?: string;
}

export interface NichePreset {
  key: string;
  label: string;
  tagline: (business: string) => string;
  services: string[];
}

/** What the $1 Test Drive hands to /onboard (sessionStorage + query). */
export interface OnboardPayload {
  businessName: string;
  niche: string;
  mode: StudioMode;
  accent: AccentKey;
  showcaseThemeId?: ShowcaseThemeId;
  heroMotion: boolean;
  slots: SlotMap;
  photos: Array<{
    id: string;
    name: string;
    source: StudioPhoto["source"];
    /** Only for samples; uploads must be sent via onCheckout (object URLs die on navigation). */
    url?: string;
  }>;
  createdAt: string;
}

/** Swap the mock for your real endpoint in Cursor — the UI won't change. */
export interface AxiomStudioApi {
  enhancePhotos(photos: StudioPhoto[]): Promise<Array<{ id: string; url: string }>>;
}
