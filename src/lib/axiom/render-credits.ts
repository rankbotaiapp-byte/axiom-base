/**
 * Prepaid render wallet: $15 buys 20 AI / Blender hero animations.
 * Sale price per unit must stay above GPU cost so Autopilot never runs at a loss.
 */

export const RENDER_CREDIT_PACK = 20;
export const RENDER_CREDIT_PACK_CENTS = 1_500;
export const RENDER_IMAGE_UNITS = 1;
export const RENDER_VIDEO_UNITS = 1;

/** Internal GPU / Imagine / Blender cost floor (cents) per billed unit. Cloud loop ~$0.47 vs $0.75 pack unit. */
export const GPU_IMAGE_COST_CENTS = 8;
export const GPU_VIDEO_COST_CENTS = 47;
/** Minimum profit on a sold unit after GPU cost. */
export const RENDER_MIN_MARGIN_CENTS = 20;

export const RENDER_SPEND_LIMIT_MIN_CENTS = RENDER_CREDIT_PACK_CENTS;
export const RENDER_SPEND_LIMIT_MAX_CENTS = 30_000;
export const RENDER_AUTO_RELOAD_THRESHOLD = 2;

export type RenderKind = "image" | "video";

export function centsPerRenderCredit(): number {
  return Math.floor(RENDER_CREDIT_PACK_CENTS / RENDER_CREDIT_PACK);
}

export function gpuCostCents(kind: RenderKind, units: number): number {
  const each = kind === "video" ? GPU_VIDEO_COST_CENTS : GPU_IMAGE_COST_CENTS;
  return each * Math.max(0, units);
}

export function saleCents(units: number): number {
  return centsPerRenderCredit() * Math.max(0, units);
}

export function renderMarginCents(kind: RenderKind, units = 1): number {
  return saleCents(units) - gpuCostCents(kind, units);
}

export function assertRenderProfit(kind: RenderKind, units: number): void {
  const margin = renderMarginCents(kind, units);
  if (units <= 0 || margin < RENDER_MIN_MARGIN_CENTS * units) {
    throw new Error("Render blocked: GPU cost would erase the credit margin");
  }
}

export function clampMonthlySpendLimitCents(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return RENDER_SPEND_LIMIT_MIN_CENTS;
  const packs = Math.round(n / RENDER_CREDIT_PACK_CENTS);
  const cents = packs * RENDER_CREDIT_PACK_CENTS;
  return Math.min(RENDER_SPEND_LIMIT_MAX_CENTS, Math.max(RENDER_SPEND_LIMIT_MIN_CENTS, cents));
}

export function spendLimitPacks(cents: number): number {
  return Math.max(1, Math.round(clampMonthlySpendLimitCents(cents) / RENDER_CREDIT_PACK_CENTS));
}

export function canPurchasePack(monthSpendCents: number, limitCents: number, packCents = RENDER_CREDIT_PACK_CENTS): boolean {
  return monthSpendCents + packCents <= clampMonthlySpendLimitCents(limitCents);
}

export function needsAutoReload(balance: number, autoReload: boolean, threshold = RENDER_AUTO_RELOAD_THRESHOLD): boolean {
  return autoReload && balance < threshold;
}

export function currentSpendMonth(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
