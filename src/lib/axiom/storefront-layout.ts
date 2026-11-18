/** Shared storefront layout config — serializable, SSR-safe types. */

export type LayoutSlotId =
  | "slot-hero"
  | "slot-pow"
  | "slot-booking"
  | "slot-trust"
  | "slot-cta";

export type LayoutSlotCategory =
  | "Hero"
  | "Proof of Work"
  | "Booking Engine"
  | "Trust & Badges"
  | "CTA";

export type LayoutSlotStatus = "Empty" | "Assigned" | "Optimized";

export type LayoutSlot = {
  id: LayoutSlotId;
  label: string;
  category: LayoutSlotCategory;
  assignedAsset: string | null;
  status: LayoutSlotStatus;
};

export type TradeFrequencyId = "drilling" | "hammering" | "cutting" | "welding";

export type TradeFrequency = {
  id: TradeFrequencyId;
  trade: string;
  frequencyHz: number;
  frequencyLabel: string;
  status: "Locked" | "Calibrating" | "Active" | "Standby";
  orbAction: "hum" | "drill" | "hammer" | "idle";
};

export type ThemedBackground = {
  id: string;
  name: string;
  videoUrl: string;
  previewColor: string;
};

export type UploadedAsset = {
  id: string;
  name: string;
  url: string;
  mime: string;
  remote: boolean;
  createdAt: string;
};

export type AcousticLogEntry = {
  id: string;
  at: string;
  trade: string;
  frequencyHz: number;
  message: string;
};

export type StorefrontLayoutConfig = {
  version: 1;
  updatedAt: string;
  shopSlug: string;
  backgroundId: string;
  backgroundUrl: string;
  activeTradeId: TradeFrequencyId;
  slots: LayoutSlot[];
  assets: UploadedAsset[];
  /** Living atmosphere + cinemagraph overlays on deployed storefront. */
  atmosphereEnabled?: boolean;
  cinemagraphPreset?: "exhaust_haze" | "dust_motes" | "embers";
};

export const STOREFRONT_LAYOUT_STORAGE_KEY = "axiom.storefront.layoutStack.v1";
export const DEFAULT_SHOP_SLUG = "axiom-demo";

export const TRADE_FREQUENCIES: TradeFrequency[] = [
  {
    id: "drilling",
    trade: "Drilling",
    frequencyHz: 420,
    frequencyLabel: "420 Hz",
    status: "Locked",
    orbAction: "drill",
  },
  {
    id: "hammering",
    trade: "Hammering",
    frequencyHz: 115,
    frequencyLabel: "115 Hz",
    status: "Calibrating",
    orbAction: "hammer",
  },
  {
    id: "cutting",
    trade: "Cutting",
    frequencyHz: 850,
    frequencyLabel: "850 Hz",
    status: "Active",
    orbAction: "hum",
  },
  {
    id: "welding",
    trade: "Welding",
    frequencyHz: 310,
    frequencyLabel: "310 Hz",
    status: "Standby",
    orbAction: "idle",
  },
];

/** Primary Axiom hero loop — clean path under public/media. */
export const AXIOM_HERO_LOOP_SRC = "/media/axiom-robot-hero.mp4";

export const THEMED_BACKGROUNDS: ThemedBackground[] = [
  {
    id: "bg-crimson",
    name: "Solar Crimson Warp",
    videoUrl: AXIOM_HERO_LOOP_SRC,
    previewColor: "from-red-600/40 to-[#030712]",
  },
  {
    id: "bg-cyan",
    name: "Obsidian Cyan Pulse",
    videoUrl: "/media/ai-guy.mp4",
    previewColor: "from-cyan-600/40 to-[#030712]",
  },
  {
    id: "bg-amber",
    name: "Thermal Amber Stream",
    videoUrl: "/media/axiom-robot-hero.mp4",
    previewColor: "from-amber-500/40 to-[#030712]",
  },
];

export const INITIAL_SLOTS: LayoutSlot[] = [
  {
    id: "slot-hero",
    label: "Hero Portal (3D Orb / Video Loop)",
    category: "Hero",
    assignedAsset: AXIOM_HERO_LOOP_SRC,
    status: "Optimized",
  },
  {
    id: "slot-pow",
    label: "Proof of Work (Cyber Girl / Portfolio Grid)",
    category: "Proof of Work",
    assignedAsset: null,
    status: "Empty",
  },
  {
    id: "slot-booking",
    label: "24/7 AI Booking Widget (Twilio / Stripe)",
    category: "Booking Engine",
    assignedAsset: "Axiom Smart Booking Engine v3",
    status: "Assigned",
  },
  {
    id: "slot-trust",
    label: "Verified Trade Badges & Certifications",
    category: "Trust & Badges",
    assignedAsset: null,
    status: "Empty",
  },
  {
    id: "slot-cta",
    label: "Conversion Action Bar & Dynamic Pricing",
    category: "CTA",
    assignedAsset: null,
    status: "Empty",
  },
];

export function slotStatusForAsset(
  slotId: LayoutSlotId,
  asset: string | null,
  backgroundUrl: string,
): LayoutSlotStatus {
  if (!asset) return "Empty";
  if (slotId === "slot-hero" && asset === backgroundUrl) return "Optimized";
  return "Assigned";
}

export function completionPercent(slots: LayoutSlot[]): number {
  const assigned = slots.filter((s) => s.status !== "Empty").length;
  return Math.round((assigned / Math.max(1, slots.length)) * 100);
}

export function buildLayoutConfig(input: {
  shopSlug?: string;
  background: ThemedBackground;
  activeTradeId: TradeFrequencyId;
  slots: LayoutSlot[];
  assets: UploadedAsset[];
  atmosphereEnabled?: boolean;
  cinemagraphPreset?: StorefrontLayoutConfig["cinemagraphPreset"];
}): StorefrontLayoutConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    shopSlug: (input.shopSlug || DEFAULT_SHOP_SLUG).trim() || DEFAULT_SHOP_SLUG,
    backgroundId: input.background.id,
    backgroundUrl: input.background.videoUrl,
    activeTradeId: input.activeTradeId,
    atmosphereEnabled: input.atmosphereEnabled ?? false,
    cinemagraphPreset: input.cinemagraphPreset,
    slots: input.slots,
    assets: input.assets.map((a) => ({
      ...a,
      // Never persist ephemeral blob URLs into durable remote config blobs list
      url: a.remote ? a.url : a.url.startsWith("blob:") ? "" : a.url,
    })),
  };
}

export function readLayoutFromStorage(): StorefrontLayoutConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STOREFRONT_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorefrontLayoutConfig;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.slots)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLayoutToStorage(config: StorefrontLayoutConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STOREFRONT_LAYOUT_STORAGE_KEY, JSON.stringify(config));
}

export function tradeById(id: TradeFrequencyId): TradeFrequency {
  return TRADE_FREQUENCIES.find((t) => t.id === id) ?? TRADE_FREQUENCIES[2]!;
}
