/** Client-safe Stripe Payment Link URLs for Next.js (NEXT_PUBLIC_*). */
export function publicStripeLink(kind: "lifetime" | "cinematic"): string {
  if (typeof process === "undefined" || !process.env) return "";
  if (kind === "lifetime") {
    return (process.env.NEXT_PUBLIC_STRIPE_LIFETIME_LINK || "").trim();
  }
  return (process.env.NEXT_PUBLIC_STRIPE_CINEMATIC_LINK || "").trim();
}
