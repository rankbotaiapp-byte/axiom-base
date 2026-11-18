"use client";

/**
 * When generation APIs return 401/402, send the visitor to the $1 Name Your Price trial checkout.
 */
export async function redirectToAxiomTrialCheckout(shopSlug = "axiom-trial"): Promise<void> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      shopSlug,
      planId: "trial",
      namedPriceCents: 100,
      businessName: "Axiom 2-Week Trial",
      niche: "contractor",
      origin: window.location.origin,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error || "Checkout did not start");
  }
  window.location.href = json.url;
}

export async function handleGenerationGuardHttpStatus(
  status: number,
  shopSlug?: string,
): Promise<boolean> {
  if (status !== 401 && status !== 402) return false;
  await redirectToAxiomTrialCheckout(shopSlug || "axiom-trial");
  return true;
}