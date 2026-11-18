import { readLayoutFromStorage, type StorefrontLayoutConfig } from "@/lib/axiom/storefront-layout";

export type CinemagraphPreset = "exhaust_haze" | "dust_motes" | "embers";

export const STOREFRONT_ATMOSPHERE_EVENT = "axiom:storefront-atmosphere";

export function atmosphereStorageKey(shopSlug: string): string {
  return `axiom.storefront.atmosphere.v1:${shopSlug.trim().toLowerCase()}`;
}

export function cinemagraphPresetForNiche(niche?: string | null): CinemagraphPreset {
  const n = (niche || "").toLowerCase();
  if (n.includes("hvac") || n.includes("weld") || n.includes("forge")) return "exhaust_haze";
  if (n.includes("roof") || n.includes("outdoor") || n.includes("landsc")) return "dust_motes";
  return "embers";
}

export function readAtmosphereEnabled(shopSlug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = atmosphereStorageKey(shopSlug);
    const raw = window.localStorage.getItem(key);
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    const layout = readLayoutFromStorage();
    if (layout?.shopSlug === shopSlug.trim().toLowerCase() && layout.atmosphereEnabled) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function writeAtmosphereEnabled(shopSlug: string, enabled: boolean): void {
  if (typeof window === "undefined") return;
  const key = atmosphereStorageKey(shopSlug);
  window.localStorage.setItem(key, enabled ? "1" : "0");
  window.dispatchEvent(
    new CustomEvent(STOREFRONT_ATMOSPHERE_EVENT, {
      detail: { shopSlug: shopSlug.trim().toLowerCase(), enabled },
    }),
  );
}