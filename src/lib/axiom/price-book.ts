/** Tenant service/price catalog used by the live AI receptionist. Pure helpers. */

export type PricingMode = "fixed" | "range" | "starting_at";

export type PriceBookItem = {
  id: string;
  shopId: string;
  name: string;
  trade: string;
  description: string;
  pricingMode: PricingMode;
  baseCents: number;
  minCents: number;
  maxCents: number;
  depositCents: number;
  durationMin: number;
  sortOrder: number;
  active: boolean;
};

export type PriceBookDraft = {
  name: string;
  trade?: string;
  description?: string;
  pricingMode?: PricingMode;
  baseCents?: number;
  minCents?: number;
  maxCents?: number;
  depositCents?: number;
  durationMin?: number;
  sortOrder?: number;
  active?: boolean;
};

const PRICING_MODES: PricingMode[] = ["fixed", "range", "starting_at"];

export function parsePricingMode(raw: unknown): PricingMode {
  const value = String(raw || "").trim().toLowerCase();
  return PRICING_MODES.includes(value as PricingMode) ? (value as PricingMode) : "starting_at";
}

export function dollarsToCents(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 500 ? Math.round(raw) : Math.round(raw * 100);
  }
  const text = String(raw ?? "").replace(/[$,\s]/g, "");
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return 0;
  return text.includes(".") || n < 500 ? Math.round(n * 100) : Math.round(n);
}

export function formatPriceSpeech(item: Pick<PriceBookItem, "name" | "pricingMode" | "baseCents" | "minCents" | "maxCents">): string {
  const name = item.name.replace(/\s+/g, " ").trim() || "that service";
  const min = item.minCents || item.baseCents;
  const max = item.maxCents || item.baseCents;
  const money = (cents: number) => `$${Math.round(cents / 100)}`;
  if (item.pricingMode === "fixed" && item.baseCents > 0) return `${name} is ${money(item.baseCents)}`;
  if (item.pricingMode === "range" && min > 0 && max > min) return `${name} usually runs ${money(min)} to ${money(max)}`;
  if (item.baseCents > 0 || min > 0) return `${name} starts at ${money(min || item.baseCents)}`;
  return `${name} is quoted on site after a short diagnose`;
}

export function catalogSpeechLine(items: PriceBookItem[]): string {
  const live = items.filter((row) => row.active).slice(0, 8);
  if (!live.length) return "Quote on site after a short diagnose. Never invent a price that is not in the book.";
  return live.map((row) => formatPriceSpeech(row)).join(". ");
}

export function matchServiceFromSpeech(items: PriceBookItem[], speech: string): PriceBookItem | null {
  const live = items.filter((row) => row.active);
  const hay = speech.toLowerCase();
  let best: { item: PriceBookItem; score: number } | null = null;
  for (const item of live) {
    const tokens = `${item.name} ${item.description} ${item.trade}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3);
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += token.length;
    }
    if (score > (best?.score ?? 0)) best = { item, score };
  }
  return best && best.score >= 4 ? best.item : live[0] ?? null;
}

export function quoteCentsFromBook(item: PriceBookItem): { spoken: string; quoteCents: number; depositCents: number } {
  const quoteCents =
    item.pricingMode === "range"
      ? item.minCents || item.baseCents
      : item.baseCents || item.minCents;
  const depositCents = item.depositCents > 0 ? item.depositCents : quoteCents > 0 ? Math.min(quoteCents, Math.max(5000, Math.round(quoteCents * 0.3))) : 0;
  return { spoken: formatPriceSpeech(item), quoteCents, depositCents };
}

export type TradeDefaultService = {
  name: string;
  trade: string;
  description: string;
  pricingMode: PricingMode;
  baseCents: number;
  minCents: number;
  maxCents: number;
  depositCents: number;
  durationMin: number;
};

const PLUMBING_DEFAULTS: TradeDefaultService[] = [
  {
    name: "Service call / diagnose",
    trade: "plumbing",
    description: "Show up, find the leak, quote the fix before work starts.",
    pricingMode: "fixed",
    baseCents: 8900,
    minCents: 8900,
    maxCents: 8900,
    depositCents: 4900,
    durationMin: 60,
  },
  {
    name: "Leak or burst pipe",
    trade: "plumbing",
    description: "Find it, stop it, repair the line.",
    pricingMode: "range",
    baseCents: 18000,
    minCents: 18000,
    maxCents: 45000,
    depositCents: 7500,
    durationMin: 120,
  },
  {
    name: "Clogged drain",
    trade: "plumbing",
    description: "Sink, tub, toilet, or main line.",
    pricingMode: "range",
    baseCents: 15000,
    minCents: 15000,
    maxCents: 35000,
    depositCents: 5000,
    durationMin: 90,
  },
  {
    name: "Water heater",
    trade: "plumbing",
    description: "Repair or replace, tank or tankless.",
    pricingMode: "starting_at",
    baseCents: 18000,
    minCents: 18000,
    maxCents: 220000,
    depositCents: 9900,
    durationMin: 180,
  },
];

const ELECTRICAL_DEFAULTS: TradeDefaultService[] = [
  {
    name: "Panel / breaker diagnose",
    trade: "electrical",
    description: "Tripping breaker or partial outage.",
    pricingMode: "range",
    baseCents: 15000,
    minCents: 15000,
    maxCents: 40000,
    depositCents: 7500,
    durationMin: 90,
  },
  {
    name: "Emergency no-power",
    trade: "electrical",
    description: "Same-day restore attempt.",
    pricingMode: "starting_at",
    baseCents: 18900,
    minCents: 18900,
    maxCents: 89000,
    depositCents: 9900,
    durationMin: 120,
  },
];

const HVAC_DEFAULTS: TradeDefaultService[] = [
  {
    name: "No-cool / no-heat diagnose",
    trade: "hvac",
    description: "System running but not heating or cooling.",
    pricingMode: "range",
    baseCents: 15000,
    minCents: 15000,
    maxCents: 45000,
    depositCents: 7500,
    durationMin: 90,
  },
];

export function tradeDefaultCatalog(niche: string): TradeDefaultService[] {
  const key = niche.toLowerCase();
  if (/(plumb|pipe|drain|sewer)/.test(key)) return PLUMBING_DEFAULTS;
  if (/(electric|panel|breaker)/.test(key)) return ELECTRICAL_DEFAULTS;
  if (/(hvac|heat|air|furnace|cool)/.test(key)) return HVAC_DEFAULTS;
  return PLUMBING_DEFAULTS.map((row) => ({
    ...row,
    trade: key.slice(0, 40) || "trades",
    name: row.name.replace(/plumbing/i, "service"),
  }));
}

export function parsePriceBookDraft(raw: Record<string, unknown>, shopId: string, id: string): PriceBookItem {
  const pricingMode = parsePricingMode(raw.pricingMode ?? raw.pricing_mode);
  const baseCents = Math.max(0, Number(raw.baseCents ?? raw.price_cents ?? raw.priceCents) || 0);
  const minCents = Math.max(0, Number(raw.minCents ?? raw.min_price_cents) || baseCents);
  const maxCents = Math.max(minCents, Number(raw.maxCents ?? raw.max_price_cents) || baseCents);
  return {
    id,
    shopId,
    name: String(raw.name || "").replace(/\s+/g, " ").trim().slice(0, 80) || "Service call",
    trade: String(raw.trade || "").replace(/\s+/g, " ").trim().slice(0, 40),
    description: String(raw.description || "").replace(/\s+/g, " ").trim().slice(0, 240),
    pricingMode,
    baseCents,
    minCents,
    maxCents,
    depositCents: Math.max(0, Number(raw.depositCents ?? raw.deposit_cents) || 0),
    durationMin: Math.min(480, Math.max(15, Number(raw.durationMin ?? raw.duration_min) || 60)),
    sortOrder: Math.max(0, Number(raw.sortOrder ?? raw.sort_order) || 0),
    active: raw.active === false ? false : true,
  };
}
