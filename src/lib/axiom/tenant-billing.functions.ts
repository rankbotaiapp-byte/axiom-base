import { createServerFn } from "@tanstack/react-start";
import { isLeadSlug } from "./funnel";
import { unwrapCheckoutPayload } from "./plumbing-checkout";
import { clampNamedPriceCents, dollarsToNamedPriceCents, NAME_YOUR_PRICE_MIN_CENTS } from "@/lib/stripe/commercial";

export const openTenantBilling = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; intent?: "upgrade" | "manage" }) => {
    const slug = String(input?.slug ?? "")
      .trim()
      .toLowerCase();
    if (!isLeadSlug(slug)) throw new Error("Unknown shop");
    const intent = input?.intent === "manage" ? "manage" : "upgrade";
    return { slug, intent } as const;
  })
  .handler(async ({ data }) => {
    const payments = await import("./payments.server");
    if (!payments.stripeConfigured()) throw new Error("Card checkout is not configured");
    const origin = payments.requestOrigin();
    const returnUrl = `${origin}/admin/tenant?slug=${encodeURIComponent(data.slug)}`;

    if (data.intent === "manage") {
      const customerId = await payments.findShopStripeCustomer(data.slug);
      if (customerId) {
        const portal = await payments.createBillingPortalSession({ customerId, returnUrl });
        return { processor: "stripe" as const, url: portal.url, kind: "portal" as const };
      }
    }

    try {
      const { beginTerritoryCheckoutHandler } = await import("./master.server");
      const started = await beginTerritoryCheckoutHandler({
        data: {
          leadSlug: data.slug,
          planId: "lifetime",
        },
      });
      if (started.url) return { processor: "stripe" as const, url: started.url, kind: "checkout" as const };
    } catch {
      /* Shop may not be a preloaded territory lead — still open Stripe. */
    }

    const session = await payments.createTenantLicenseCheckout({ slug: data.slug, origin });
    return { processor: "stripe" as const, url: session.url, kind: "checkout" as const };
  });

/** Tenant storefront $1 Trial / Founder's License — never the "unlinked preview" path. */
export const startTenantStorefrontCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const opened = unwrapCheckoutPayload(input);
    const leadSlug = opened.leadSlug;
    if (!isLeadSlug(leadSlug)) throw new Error("This storefront is missing its territory slug.");
    const planId = opened.planId === "lifetime" ? "lifetime" : "trial";
    let namedPriceCents: number | undefined;
    if (planId === "trial") {
      if (typeof opened.namedPriceCents === "number") {
        namedPriceCents = clampNamedPriceCents(opened.namedPriceCents);
      } else if (typeof opened.namedPriceDollars === "string" && opened.namedPriceDollars.trim()) {
        namedPriceCents = dollarsToNamedPriceCents(opened.namedPriceDollars);
      } else {
        namedPriceCents = clampNamedPriceCents(NAME_YOUR_PRICE_MIN_CENTS);
      }
    }
    const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const nested = raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>) : raw;
    const businessName = String(nested.businessName ?? "").trim().slice(0, 80);
    const tradeType = String(nested.tradeType ?? nested.niche ?? "").trim().slice(0, 40);
    const logoUrl = String(nested.logoUrl ?? "").trim().slice(0, 400);
    const accent = String(nested.accent ?? "").trim().slice(0, 16);
    return { leadSlug, planId, namedPriceCents, businessName, tradeType, logoUrl, accent } as const;
  })
  .handler(async ({ data }) => {
    const payments = await import("./payments.server");
    if (!payments.stripeConfigured()) throw new Error("Card checkout is not configured");
    const origin = payments.requestOrigin();
    try {
      const { ensureTerritoryLead } = await import("./territory.server");
      await ensureTerritoryLead(data.leadSlug, {
        businessName: data.businessName,
        tradeType: data.tradeType || "plumbing",
        tradeLabel: data.tradeType,
      });
    } catch {
      /* Stripe session still opens with the storefront slug as lead_slug. */
    }
    try {
      const { beginTerritoryCheckoutHandler } = await import("./master.server");
      const started = await beginTerritoryCheckoutHandler({ data });
      if (started.processor === "stripe" && started.url?.startsWith("https://")) return started;
    } catch {
      /* Fall through to a direct Stripe session bound to this tenant slug. */
    }
    const session = await payments.createTenantLicenseCheckout({
      slug: data.leadSlug,
      origin,
      planId: data.planId,
      namedPriceCents: data.namedPriceCents,
      businessName: data.businessName,
      niche: data.tradeType,
      logoUrl: data.logoUrl,
    });
    return { processor: "stripe" as const, url: session.url, checkoutId: session.id };
  });
