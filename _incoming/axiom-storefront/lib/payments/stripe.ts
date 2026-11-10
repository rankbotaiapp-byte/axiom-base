import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "@/config/storefront";
import { site } from "@/config/storefront";

const KEY = process.env.STRIPE_SECRET_KEY;
export const stripeEnabled = Boolean(KEY);

function form(obj: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== "") p.append(k, String(v));
  return p;
}

/**
 * Hosted Checkout. Starter = $150/mo subscription with a 30-day trial plus a one-time
 * $1 line item (so the customer pays $1 today, $150 from month two).
 */
export async function createCheckout(opts: { plan: PlanId; tenantId: string; slug: string; email: string }): Promise<string | null> {
  if (!KEY || opts.plan === "custom") return null;
  const success = `${site.url}/b/${opts.slug}?welcome=1`;
  const cancel = `${site.url}/start?plan=${opts.plan}&cancelled=1`;
  const common = {
    success_url: success,
    cancel_url: cancel,
    customer_email: opts.email,
    client_reference_id: opts.tenantId,
    "metadata[tenant_id]": opts.tenantId,
    "metadata[slug]": opts.slug,
    "metadata[plan]": opts.plan,
    allow_promotion_codes: "true",
  };
  const body =
    opts.plan === "starter"
      ? form({
          ...common,
          mode: "subscription",
          "line_items[0][price]": process.env.STRIPE_PRICE_MONTHLY,
          "line_items[0][quantity]": 1,
          "line_items[1][price]": process.env.STRIPE_PRICE_FIRST_MONTH,
          "line_items[1][quantity]": 1,
          "subscription_data[trial_period_days]": 30,
          "subscription_data[metadata][tenant_id]": opts.tenantId,
        })
      : form({
          ...common,
          mode: "payment",
          "line_items[0][price]": process.env.STRIPE_PRICE_LIFETIME,
          "line_items[0][quantity]": 1,
        });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body,
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { url: string }).url;
}

/** Verifies a Stripe-Signature header (v1 scheme, 5-minute tolerance). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
  return header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .some((kv) => {
      const sig = Buffer.from(kv.slice(3), "hex");
      return sig.length === expected.length && timingSafeEqual(sig, expected);
    });
}
