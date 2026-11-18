import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createTenantLicenseCheckout,
  requestOrigin,
  stripeConfigured,
  stripePublishableKey,
} from "@/lib/axiom/payments.server";
import { clampNamedPriceCents, dollarsToNamedPriceCents, NAME_YOUR_PRICE_MIN_CENTS } from "@/lib/stripe/commercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  shopSlug: z.string().min(2).max(80),
  planId: z.enum(["trial", "lifetime"]).default("trial"),
  namedPriceCents: z.number().int().positive().optional(),
  namedPriceDollars: z.string().optional(),
  businessName: z.string().max(80).optional(),
  niche: z.string().max(40).optional(),
  userId: z.string().max(80).optional(),
  origin: z.string().url().optional(),
});

/**
 * Multi-tier SaaS checkout: Name Your Price (month 1 → recurring $150) or lifetime.
 * Passes shopSlug + user_id in Stripe session metadata for webhook provisioning.
 */
export async function POST(request: Request) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
    }
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid checkout payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    let namedPriceCents: number | undefined;
    if (data.planId === "trial") {
      if (typeof data.namedPriceCents === "number") {
        namedPriceCents = clampNamedPriceCents(data.namedPriceCents);
      } else if (data.namedPriceDollars?.trim()) {
        namedPriceCents = dollarsToNamedPriceCents(data.namedPriceDollars);
      } else {
        namedPriceCents = clampNamedPriceCents(NAME_YOUR_PRICE_MIN_CENTS);
      }
    }

    let userId = data.userId || "";
    if (!userId) {
      try {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser(undefined, request.headers);
        if (user?.id && user.id !== "dev-user") userId = user.id;
      } catch {
        /* guest */
      }
    }

    if (!userId) {
      const origin = (data.origin || requestOrigin()).replace(/\/$/, "");
      const nextPath = data.shopSlug.trim() ? `/${encodeURIComponent(data.shopSlug)}/admin` : "/axiom-studio";
      const signInUrl = `${origin}/login?next=${encodeURIComponent(`${origin}${nextPath}`)}`;
      return NextResponse.json(
        {
          ok: false,
          code: "AUTH_REQUIRED",
          error: "Sign in before checkout so generation credits attach to your account.",
          signInUrl,
        },
        { status: 401 },
      );
    }

    const session = await createTenantLicenseCheckout({
      slug: data.shopSlug,
      origin: (data.origin || requestOrigin()).replace(/\/$/, ""),
      planId: data.planId,
      namedPriceCents,
      businessName: data.businessName,
      niche: data.niche,
      userId,
    });

    return NextResponse.json({
      ok: true,
      id: session.id,
      url: session.url,
      planId: data.planId,
      shopSlug: data.shopSlug,
      namedPriceCents: namedPriceCents ?? null,
      publishableKey: stripePublishableKey(),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Checkout failed.";
    console.error("[stripe/checkout]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
