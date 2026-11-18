export const STOREFRONT_ACCENT_KEY = "axiom-storefront-accent";
export const STOREFRONT_CONFIG_KEY = "axiom-storefront-config";

export type StorefrontDraft = {
  accent: string;
  niche: string;
  businessName: string;
  imageDataUrl: string;
};

export const STUDIO_SWATCHES = [
  { id: "cyan", label: "Cyber Cyan", value: "#00ffcc" },
  { id: "amber", label: "Warm Amber", value: "#ffb020" },
  { id: "purple", label: "Electric Purple", value: "#a855f7" },
  { id: "blue", label: "Laser Blue", value: "#3b82f6" },
  { id: "emerald", label: "Emerald Green", value: "#10b981" },
] as const;

export const DEFAULT_STUDIO_ACCENT = STUDIO_SWATCHES[0].value;

const HEX = /^#?[0-9a-fA-F]{6}$/;

export function normalizeAccent(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (!HEX.test(raw)) return "";
  return `#${raw.replace(/^#/, "").toLowerCase()}`;
}

export function readStorefrontAccent(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromUrl = normalizeAccent(new URLSearchParams(window.location.search).get("accent"));
    if (fromUrl) return fromUrl;
    return normalizeAccent(window.localStorage.getItem(STOREFRONT_ACCENT_KEY));
  } catch {
    return "";
  }
}

export function readStorefrontDraft(): StorefrontDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = window.localStorage.getItem(STOREFRONT_CONFIG_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<StorefrontDraft>) : {};
    const accent = normalizeAccent(params.get("accent")) || normalizeAccent(stored.accent);
    const niche = (params.get("niche") || stored.niche || "").trim().slice(0, 40);
    if (!accent && !niche) return null;
    const image = typeof stored.imageDataUrl === "string" && stored.imageDataUrl.startsWith("data:image/") ? stored.imageDataUrl : "";
    return {
      accent,
      niche,
      businessName: typeof stored.businessName === "string" ? stored.businessName.slice(0, 48) : "",
      imageDataUrl: image.length <= 480000 ? image : "",
    };
  } catch {
    return null;
  }
}

export function writeStorefrontDraft(draft: StorefrontDraft): StorefrontDraft {
  const accent = normalizeAccent(draft.accent);
  const next: StorefrontDraft = {
    accent,
    niche: draft.niche.trim().slice(0, 40),
    businessName: draft.businessName.trim().slice(0, 48),
    imageDataUrl: draft.imageDataUrl.startsWith("data:image/") && draft.imageDataUrl.length <= 480000 ? draft.imageDataUrl : "",
  };
  if (typeof window === "undefined" || !next.accent) return next;
  try {
    window.localStorage.setItem(STOREFRONT_ACCENT_KEY, next.accent);
    window.localStorage.setItem(STOREFRONT_CONFIG_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function writeStorefrontAccent(value: string): string {
  const accent = normalizeAccent(value);
  if (!accent) return "";
  const current = readStorefrontDraft();
  writeStorefrontDraft({
    accent,
    niche: current?.niche || "",
    businessName: current?.businessName || "",
    imageDataUrl: current?.imageDataUrl || "",
  });
  return accent;
}
