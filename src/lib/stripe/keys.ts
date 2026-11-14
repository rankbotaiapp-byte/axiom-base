/** Resolve test vs live Stripe secrets so the publishable key and secret always match. */

export type StripeMode = "test" | "live";

export type StripeKeySet = {
  secret: string;
  publishable: string;
  mode: StripeMode;
};

function read(name: string, env: Record<string, string | undefined> = process.env): string {
  return (env[name] ?? "").trim();
}

export function stripeModeFromSecret(secret: string): StripeMode | null {
  if (secret.startsWith("sk_live_")) return "live";
  if (secret.startsWith("sk_test_")) return "test";
  return null;
}

export function stripeModeFromPublishable(publishable: string): StripeMode | null {
  if (publishable.startsWith("pk_live_")) return "live";
  if (publishable.startsWith("pk_test_")) return "test";
  return null;
}

export function preferLiveStripe(env: Record<string, string | undefined> = process.env): boolean {
  const vercel = read("VERCEL_ENV", env);
  if (vercel === "production") return true;
  if (vercel === "preview" || vercel === "development") return false;
  return read("NODE_ENV", env) === "production";
}

/**
 * Live production uses STRIPE_SECRET_KEY_LIVE (or a sk_live_ STRIPE_SECRET_KEY).
 * Local/preview uses STRIPE_SECRET_KEY_TEST (or a sk_test_ STRIPE_SECRET_KEY).
 * Publishable key must be the same mode or checkout is rejected.
 */
export function resolveStripeKeys(env: Record<string, string | undefined> = process.env): StripeKeySet {
  const live = preferLiveStripe(env);
  const secretLive = read("STRIPE_SECRET_KEY_LIVE", env);
  const secretTest = read("STRIPE_SECRET_KEY_TEST", env);
  const secretFallback = read("STRIPE_SECRET_KEY", env);
  const pubLive = read("STRIPE_PUBLISHABLE_KEY_LIVE", env) || read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE", env);
  const pubTest = read("STRIPE_PUBLISHABLE_KEY_TEST", env) || read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST", env);
  const pubFallback =
    read("STRIPE_PUBLISHABLE_KEY", env) ||
    read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", env) ||
    read("VITE_STRIPE_PUBLISHABLE_KEY", env);

  const secret = live
    ? secretLive || (secretFallback.startsWith("sk_live_") ? secretFallback : "") || secretFallback
    : secretTest || (secretFallback.startsWith("sk_test_") ? secretFallback : "") || secretFallback;
  const publishable = live
    ? pubLive || (pubFallback.startsWith("pk_live_") ? pubFallback : "") || pubFallback
    : pubTest || (pubFallback.startsWith("pk_test_") ? pubFallback : "") || pubFallback;

  if (!secret) throw new Error("Card payments are not configured");
  const secretMode = stripeModeFromSecret(secret);
  if (!secretMode) throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_");
  const pubMode = publishable ? stripeModeFromPublishable(publishable) : secretMode;
  if (publishable && pubMode && pubMode !== secretMode) {
    throw new Error(
      `Stripe key mismatch: secret is ${secretMode} but publishable is ${pubMode}. Align STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.`,
    );
  }
  return { secret, publishable, mode: secretMode };
}
