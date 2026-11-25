"use client";

import { leadSlugFrom } from "@/lib/axiom/funnel";
import type { OnboardPayload } from "./types";

/**
 * Hands the Studio $1 action to the existing Next checkout route.
 * Uploaded files stay in the browser until a storage endpoint exists — sample URLs travel in the payload.
 */
export async function startAxiomTrial(payload: OnboardPayload, _files: File[]): Promise<string> {
  const shopSlug = leadSlugFrom(payload.businessName, payload.niche || "shop");
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      shopSlug,
      planId: "trial",
      namedPriceDollars: "1",
      businessName: payload.businessName,
      niche: payload.niche,
      showcaseThemeId: payload.showcaseThemeId || "solar_gold",
    }),
  });
  const json = (await response.json()) as { url?: string; signInUrl?: string; error?: string };
  if (response.status === 401 && json.signInUrl) return json.signInUrl;
  if (!response.ok || !json.url) throw new Error(json.error || "Checkout failed");
  return json.url;
}
