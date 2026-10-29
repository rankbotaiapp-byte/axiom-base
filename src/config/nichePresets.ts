import { CATALOG, type CatalogNiche } from "@/config/catalog";
import type { ShopNiche } from "@/lib/axiom/types";

/** One tap choice on an audit question. The value is what gets saved. */
export interface AuditChoice {
  value: string;
  label: string;
}

/** A question the storefront audit can ask without the owner writing it. */
export interface AuditQuestion {
  id: string;
  label: string;
  choices: readonly AuditChoice[];
}

/** A service line the owner can start from. Prices are already written. */
export interface PresetService {
  name: string;
  detail: string;
  priceLabel: string;
  durationMin: number;
}

/**
 * A finished starting page for one local trade.
 * Built from the verified 21-loop catalog only.
 */
export interface NichePreset {
  id: string;
  shopNiche: ShopNiche;
  label: string;
  title: string;
  tagline: string;
  accent: string;
  keywords: readonly string[];
  auditTitle: string;
  auditNote: string;
  auditQuestions: readonly AuditQuestion[];
  services: readonly PresetService[];
  bookingCta: string;
}

const ACCENTS = ["#2EE6D6", "#E7B48A", "#7EC8E3", "#E07A73", "#C9A227", "#B388FF"] as const;

function presetFromCatalog(niche: CatalogNiche, index: number): NichePreset {
  const entry = CATALOG.find((row) => row.id === niche)!;
  return {
    id: niche,
    shopNiche: niche,
    label: entry.label,
    title: entry.defaultName,
    tagline: entry.tagline,
    accent: ACCENTS[index % ACCENTS.length]!,
    keywords: [entry.label.toLowerCase(), entry.id.replace(/-/g, " ")],
    auditTitle: `How soon do you need ${entry.label.toLowerCase()}?`,
    auditNote: "A short check so the shop can hold the right block.",
    auditQuestions: [
      {
        id: "need",
        label: "What do you need?",
        choices: [
          { value: "Visit", label: "A site visit" },
          { value: "Service", label: "Standard service" },
          { value: "Day", label: "A full day" },
        ],
      },
    ],
    services: [
      { name: "Site visit", detail: "Scope and next steps.", priceLabel: "$89", durationMin: 60 },
      { name: "Standard service", detail: "The usual ticket.", priceLabel: "$189", durationMin: 120 },
      { name: "Full day", detail: "A full crew day.", priceLabel: "$680", durationMin: 480 },
    ],
    bookingCta: `Book ${entry.label.toLowerCase()}`,
  };
}

export const NICHE_PRESETS: readonly NichePreset[] = CATALOG.map((row, index) =>
  presetFromCatalog(row.id, index),
);

export const GENERAL_PRESET: NichePreset = NICHE_PRESETS.find((row) => row.shopNiche === "contractor")!;

export function presetsForShop(niche: ShopNiche): NichePreset[] {
  return NICHE_PRESETS.filter((row) => row.shopNiche === niche);
}

export function presetForShopNiche(niche: ShopNiche): NichePreset {
  return presetsForShop(niche)[0] ?? GENERAL_PRESET;
}
