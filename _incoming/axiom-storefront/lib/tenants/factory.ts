import { niches, type NicheId } from "@/config/storefront";
import type { TenantConfig } from "./types";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

/** Everything a brand-new tenant app needs on day one, derived from niche + city. */
export function defaultConfig(niche: NicheId, name: string, city: string, region: string): TenantConfig {
  const n = niches[niche];
  return {
    tagline: `${n.label} in ${city}, ${region}`,
    services: n.services.map((s) => ({ name: s })),
    hours: [
      { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
      { days: ["Saturday"], opens: "10:00", closes: "16:00" },
    ],
    faqs: [
      {
        q: `How do I book with ${name}?`,
        a: `Use the booking form on this page any time, day or night. You'll get a confirmation by text, and ${name} will follow up if anything needs adjusting.`,
      },
      {
        q: `What areas does ${name} serve?`,
        a: `${name} serves ${city}, ${region} and the surrounding area.`,
      },
      {
        q: `What services does ${name} offer?`,
        a: `${n.services.join(", ")}. Ask in your booking message if you need something not listed.`,
      },
    ],
    serviceArea: [city],
    social: {},
    colors: { accent: "#38c8ff", glow: "#ff7a1a" },
    content: { cadencePerWeek: 3, pillars: [...n.pillars], autoPublish: true },
  };
}
