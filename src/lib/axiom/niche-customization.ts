/** Tenant storefront niche customization — client-safe types + helpers. */

export const NICHE_CUSTOM_STORAGE_KEY = "axiom.storefront.nicheCustom.v1";

export type NicheTradeId =
  | "hvac"
  | "plumbing"
  | "electrical"
  | "auto"
  | "welding"
  | "general";

export type AccentGlowId = "solar-gold" | "electric-cyan" | "emergency-amber";

export type NicheServicePackage = {
  id: string;
  name: string;
  priceLabel: string;
  enabled: boolean;
};

export type NicheCustomizationConfig = {
  version: 1;
  updatedAt: string;
  shopSlug: string;
  businessName: string;
  logoUrl: string;
  avatarUrl: string;
  dispatchPhone: string;
  niche: NicheTradeId;
  accent: AccentGlowId;
  services: NicheServicePackage[];
};

export const ACCENT_GLOWS: Record<
  AccentGlowId,
  { id: AccentGlowId; label: string; hex: string; glow: string }
> = {
  "solar-gold": {
    id: "solar-gold",
    label: "Molten Solar Gold",
    hex: "#FFE500",
    glow: "rgba(255,229,0,0.35)",
  },
  "electric-cyan": {
    id: "electric-cyan",
    label: "Electric Cyan",
    hex: "#00f2fe",
    glow: "rgba(0,242,254,0.35)",
  },
  "emergency-amber": {
    id: "emergency-amber",
    label: "Emergency Amber",
    hex: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
  },
};

export const NICHE_TRADES: {
  id: NicheTradeId;
  label: string;
  defaults: Omit<NicheServicePackage, "enabled">[];
}[] = [
  {
    id: "hvac",
    label: "HVAC",
    defaults: [
      { id: "hvac-no-heat", name: "No heat / emergency", priceLabel: "From $189" },
      { id: "hvac-ac", name: "AC not cooling", priceLabel: "From $149" },
      { id: "hvac-tune", name: "Seasonal tune-up", priceLabel: "$129" },
    ],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    defaults: [
      { id: "pl-burst", name: "Burst pipe / flood", priceLabel: "From $249" },
      { id: "pl-drain", name: "Drain clearing", priceLabel: "From $129" },
      { id: "pl-water", name: "No hot water", priceLabel: "From $179" },
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    defaults: [
      { id: "el-out", name: "Power outage triage", priceLabel: "From $199" },
      { id: "el-panel", name: "Panel / breaker work", priceLabel: "From $249" },
      { id: "el-outlet", name: "Outlet / sparking", priceLabel: "From $149" },
    ],
  },
  {
    id: "auto",
    label: "Auto repair",
    defaults: [
      { id: "auto-diag", name: "Diagnostic scan", priceLabel: "From $99" },
      { id: "auto-brake", name: "Brake service", priceLabel: "From $189" },
      { id: "auto-tow", name: "Roadside / tow assist", priceLabel: "From $129" },
    ],
  },
  {
    id: "welding",
    label: "Welding",
    defaults: [
      { id: "weld-fab", name: "Custom fab", priceLabel: "Quote" },
      { id: "weld-repair", name: "On-site repair", priceLabel: "From $159" },
      { id: "weld-gate", name: "Gate / rail weld", priceLabel: "From $199" },
    ],
  },
  {
    id: "general",
    label: "General contractor",
    defaults: [
      { id: "gc-est", name: "Site estimate", priceLabel: "Free" },
      { id: "gc-repair", name: "Handyman repair", priceLabel: "From $99" },
      { id: "gc-emergency", name: "Emergency dispatch", priceLabel: "From $179" },
    ],
  },
];

export function servicesForNiche(niche: NicheTradeId): NicheServicePackage[] {
  const trade = NICHE_TRADES.find((t) => t.id === niche) ?? NICHE_TRADES[0]!;
  return trade.defaults.map((d) => ({ ...d, enabled: true }));
}

export function defaultNicheConfig(shopSlug = "axiom-demo"): NicheCustomizationConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    shopSlug,
    businessName: "Apex Trade Co.",
    logoUrl: "",
    avatarUrl: "",
    dispatchPhone: "",
    niche: "plumbing",
    accent: "electric-cyan",
    services: servicesForNiche("plumbing"),
  };
}

export function readNicheConfigFromStorage(slug?: string): NicheCustomizationConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(NICHE_CUSTOM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NicheCustomizationConfig;
    if (parsed?.version !== 1) return null;
    if (slug && parsed.shopSlug !== slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeNicheConfigToStorage(config: NicheCustomizationConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NICHE_CUSTOM_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* private mode */
  }
}

export function accentHex(id: AccentGlowId): string {
  return ACCENT_GLOWS[id].hex;
}
