export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function stripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || "";
}

export function requestOrigin() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function processStripePayment(data: Record<string, unknown>) {
  return { success: true, chargeId: `ch_${Date.now()}`, ...data };
}

export async function getStripeSubscriptionStatus(_tenantId: string) {
  return { status: "active", tier: "growth", feeSplit: 0.015 };
}

export async function createTenantLicenseCheckout(opts: { slug: string; origin: string }) {
  return { url: `${opts.origin}/onboard?slug=${encodeURIComponent(opts.slug)}` };
}

export default processStripePayment;
