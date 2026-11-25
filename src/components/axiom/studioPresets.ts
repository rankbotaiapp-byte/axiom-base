import type { AccentKey, AxiomStudioApi, NichePreset, SlotId, StudioPhoto } from "./types";

export const SLOT_META: Record<SlotId, { label: string; hint: string }> = {
  hero: { label: "Hero slot", hint: "Top of page — your best shot" },
  proof: { label: "Proof-of-work slot", hint: "A finished job customers can trust" },
  services: { label: "Services slot", hint: "Shop, truck, or crew in action" },
};

export const ACCENTS: Record<AccentKey, { label: string; hex: string; ink: string }> = {
  cyan: { label: "Cyan", hex: "#00ffcc", ink: "#03140f" },
  amber: { label: "Amber", hex: "#ffb547", ink: "#1a1003" },
  magenta: { label: "Magenta", hex: "#ff4fb3", ink: "#1a0310" },
};

export const NICHES: NichePreset[] = [
  { key: "plumbing", label: "Plumbing", tagline: (b) => `${b}: burst pipe at 2 AM? We're already on it.`, services: ["Emergency leak repair", "Water heater install", "Drain clearing", "Fixture upgrades"] },
  { key: "hvac", label: "HVAC", tagline: (b) => `${b} keeps your home comfortable — book a tech in 30 seconds.`, services: ["AC / furnace tune-up", "System replacement", "Duct cleaning", "Emergency no-heat call"] },
  { key: "roofing", label: "Roofing", tagline: (b) => `${b}: roofs done right, estimates booked tonight.`, services: ["Free roof inspection", "Leak repair", "Full replacement", "Gutter install"] },
  { key: "landscaping", label: "Landscaping", tagline: (b) => `${b} turns yards into the best house on the block.`, services: ["Weekly maintenance", "Design & install", "Irrigation repair", "Seasonal cleanup"] },
  { key: "electrical", label: "Electrical", tagline: (b) => `${b}: licensed, fast, and bookable any hour.`, services: ["Panel upgrade", "EV charger install", "Lighting", "Troubleshooting"] },
  { key: "auto", label: "Auto Repair", tagline: (b) => `${b} — honest repairs, booked online in seconds.`, services: ["Diagnostics", "Brakes", "Oil & fluids", "Pre-purchase inspection"] },
  { key: "barber", label: "Barber", tagline: (b) => `${b}: sharp cuts, zero phone tag. Book your chair.`, services: ["Signature cut", "Skin fade", "Beard trim", "Hot towel shave"] },
  { key: "cleaning", label: "Cleaning", tagline: (b) => `${b} — spotless homes, booked while you sleep.`, services: ["Standard clean", "Deep clean", "Move-out clean", "Recurring service"] },
];

export const DEFAULT_NICHE = NICHES[0];

export function findNiche(input: string): NichePreset {
  const q = input.trim().toLowerCase();
  return (
    NICHES.find((n) => n.key === q || n.label.toLowerCase() === q) ?? {
      key: q || "general",
      label: input.trim() || "Local Pro",
      tagline: (b) => `${b}: real work, real reviews, booking open 24/7.`,
      services: ["Free estimate", "Standard service", "Emergency call", "Maintenance plan"],
    }
  );
}

/** Replace these SVGs with real job photos (same paths) whenever you have them. */
export const SAMPLE_PHOTOS: StudioPhoto[] = [
  { id: "sample-1", url: "/axiom/samples/sample-hero.svg", name: "Job site (sample)", source: "sample" },
  { id: "sample-2", url: "/axiom/samples/sample-proof.svg", name: "Finished work (sample)", source: "sample" },
  { id: "sample-3", url: "/axiom/samples/sample-shop.svg", name: "Truck & crew (sample)", source: "sample" },
];

export const SAMPLE_BUSINESS = { businessName: "Rogue Valley Plumbing", niche: "Plumbing" };

/**
 * Local stand-in until the AI media endpoint exists.
 * Returns the same URLs; the preview applies a CSS "enhanced" grade.
 */
export const mockStudioApi: AxiomStudioApi = {
  async enhancePhotos(photos) {
    await new Promise((r) => setTimeout(r, 900));
    return photos.map((p) => ({ id: p.id, url: p.url }));
  },
};

/**
 * Real endpoint shape, ready to pass as `api` to <AxiomStudioFunnel />.
 * Expects JSON back: [{ id, url }]
 */
export function createHttpStudioApi(endpoint = "/api/axiom/enhance"): AxiomStudioApi {
  return {
    async enhancePhotos(photos) {
      const body = new FormData();
      photos.forEach((p) => {
        if (p.file) body.append(p.id, p.file, p.name);
        else body.append(`${p.id}:url`, p.url);
      });
      const res = await fetch(endpoint, { method: "POST", body });
      if (!res.ok) throw new Error(`Enhance failed (${res.status})`);
      return res.json();
    },
  };
}
