/** Stable URL for a cached branded demo plate. Safe to call from the browser. */

export type DemoPlateSlot = "hero" | "proof" | "services";

const SLOTS = new Set<DemoPlateSlot>(["hero", "proof", "services"]);

export function demoPlatePath(input: {
  businessName: string;
  niche: string;
  slot?: DemoPlateSlot;
  accent?: string;
  city?: string;
  /** Business-owned still. Only the hero plate uses it as the recreation source. */
  src?: string;
}): string {
  const biz = input.businessName.replace(/\s+/g, " ").trim().slice(0, 80);
  const niche = input.niche.replace(/\s+/g, " ").trim().slice(0, 40) || "contractor";
  const slot = input.slot && SLOTS.has(input.slot) ? input.slot : "hero";
  const params = new URLSearchParams({ biz, niche, slot });
  const accent = (input.accent ?? "").replace("#", "").trim();
  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(accent)) params.set("accent", accent);
  const city = (input.city ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (city) params.set("city", city);
  const src = (input.src ?? "").trim();
  if (slot === "hero" && isDemoPlateSource(src)) params.set("src", src.slice(0, 500));
  return `/api/axiom/demo-plate?${params.toString()}`;
}

export function isDemoPlateSource(url: string): boolean {
  if (!url || url.includes("..") || /\s/.test(url)) return false;
  if (url.startsWith("/media/") || url.startsWith("/axiom/")) return true;
  return /^https:\/\/.+/i.test(url);
}
