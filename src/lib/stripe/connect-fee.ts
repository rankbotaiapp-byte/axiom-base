/**
 * Gear Guardian LLC (platform) 1.5% Connect revenue share.
 * Destination charges: guest pays the platform; transfer_data sends the remainder
 * to the shop's connected account; application_fee_amount stays on Gear Guardian.
 * Stripe Checkout/PaymentIntents take a cents fee, not a percent field — we always
 * stamp application_fee_percent=1.5 in metadata so the cut is auditable.
 */
import {
  GEAR_GUARDIAN_BPS,
  GEAR_GUARDIAN_FEE_PERCENT,
  gearGuardianFeeCents,
} from "../axiom/merchant-pricing.ts";

export const APPLICATION_FEE_PERCENT = GEAR_GUARDIAN_FEE_PERCENT;

export type ConnectChargeOpts = {
  destination: string;
  amountCents: number;
  /** Ignored when missing — always recomputed at 1.5% so callers cannot drop the cut. */
  feeCents?: number;
};

export function resolveApplicationFeeCents(amountCents: number, feeCents?: number): number {
  const due = Math.max(0, Math.round(amountCents));
  const computed = gearGuardianFeeCents(due);
  const requested = feeCents == null ? computed : Math.max(0, Math.round(feeCents));
  const fee = requested > 0 ? requested : computed;
  if (fee <= 0) return 0;
  if (fee >= due) return Math.max(0, due - 1);
  return fee;
}

function nest(prefix: string, path: string): string {
  if (!prefix) return path;
  const parts = path.replace(/\]/g, "").split("[");
  return `${prefix}${parts.map((part) => `[${part}]`).join("")}`;
}

/**
 * Mutates Stripe form params for a destination charge.
 * `prefix` is empty on PaymentIntents, `payment_intent_data` on Checkout Sessions.
 */
export function stampConnectRevenueShare(
  params: URLSearchParams,
  opts: ConnectChargeOpts,
  prefix = "",
): { feeCents: number; percent: number } {
  const destination = opts.destination.trim();
  if (!destination) throw new Error("Connect destination account is required");
  const feeCents = resolveApplicationFeeCents(opts.amountCents, opts.feeCents);
  params.set(nest(prefix, "transfer_data[destination]"), destination);
  params.set(nest(prefix, "on_behalf_of"), destination);
  if (feeCents > 0) {
    params.set(nest(prefix, "application_fee_amount"), String(feeCents));
  }
  params.set(nest(prefix, "metadata[application_fee_percent]"), String(APPLICATION_FEE_PERCENT));
  params.set(nest(prefix, "metadata[gear_guardian_bps]"), String(GEAR_GUARDIAN_BPS));
  params.set(nest(prefix, "metadata[gear_guardian_cents]"), String(feeCents));
  params.set(nest(prefix, "metadata[gear_guardian_llc]"), "platform");
  return { feeCents, percent: APPLICATION_FEE_PERCENT };
}

export function stampCheckoutSessionShare(params: URLSearchParams, opts: ConnectChargeOpts) {
  const result = stampConnectRevenueShare(params, opts, "payment_intent_data");
  params.set("metadata[application_fee_percent]", String(APPLICATION_FEE_PERCENT));
  params.set("metadata[gear_guardian_bps]", String(GEAR_GUARDIAN_BPS));
  params.set("metadata[gear_guardian_cents]", String(result.feeCents));
  params.set("metadata[gear_guardian_llc]", "platform");
  return result;
}
