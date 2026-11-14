/** Client-safe Stripe Payment Link URLs (Vite exposes NEXT_PUBLIC_ and VITE_). */
export function publicStripeLink(kind: "lifetime" | "cinematic"): string {
  const env = import.meta.env as Record<string, string | undefined>;
  if (kind === "lifetime") {
    return (env.NEXT_PUBLIC_STRIPE_LIFETIME_LINK || env.VITE_STRIPE_LIFETIME_LINK || "").trim();
  }
  return (env.NEXT_PUBLIC_STRIPE_CINEMATIC_LINK || env.VITE_STRIPE_CINEMATIC_LINK || "").trim();
}
