import crypto from "node:crypto";
import { getShowcase } from "@/lib/axiom-landing/showcase";
import { MAX_LOGO_BYTES, cleanText, normalizePhone, slugify, sniffLogo } from "@/lib/axiom-landing/tenants/validate";
import { SlugTakenError, createTenant, storeMode, uploadLogo, type TenantStatus } from "@/lib/axiom-landing/tenants/store";
import { normalizeAccent } from "@/lib/axiom/accent-color";
import { provisionTenant } from "@/lib/axiom/provision";

function describe(err: unknown): string {
  if (err && typeof err === "object") {
    const row = err as { message?: string; code?: string; detail?: string; hint?: string };
    const parts = [row.message, row.code ? `code ${row.code}` : "", row.detail, row.hint].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return err instanceof Error ? err.message : String(err);
}

function fail(scope: string, err: unknown, status = 502, extra?: Record<string, unknown>) {
  const error = describe(err);
  console.error(`[storefront] ${scope}`, error, extra ?? "", err);
  return Response.json({ ok: false, error }, { status });
}

export async function handleLeadPost(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (err) {
    return fail("lead payload", err instanceof Error ? err : new Error("Invalid JSON"), 400);
  }

  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true });

  const str = (key: string, max = 200) => (typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "");
  const lead = {
    business: str("business"),
    name: str("name"),
    phone: str("phone", 40),
    email: str("email", 120).toLowerCase(),
    city: str("city"),
    template: str("template"),
    plan: str("plan", 40) || "free-setup",
    source: str("source", 60),
    accent: normalizeAccent(str("accent", 7)),
    niche: str("niche", 40),
  };

  const missing: string[] = [];
  if (!lead.business) missing.push("business name");
  if (!lead.name) missing.push("your name");
  if (!/\S+@\S+\.\S+$/.test(lead.email)) missing.push("a valid email");
  if (lead.phone.replace(/\D/g, "").length < 10) missing.push("a 10-digit phone number");
  if (missing.length) {
    const error = `Missing ${missing.join(", ")}.`;
    console.error("[storefront] lead rejected", { plan: lead.plan, error });
    return Response.json({ ok: false, error }, { status: 422 });
  }

  const slug = slugify(lead.business);
  const billingStatus = lead.plan === "lifetime" ? "active" : "trialing";
  let shop: Awaited<ReturnType<typeof provisionTenant>>;
  try {
    shop = await provisionTenant({
      slug,
      shopName: lead.business,
      niche: lead.niche || lead.template,
      status: billingStatus,
      plan: lead.plan,
      accent: lead.accent,
    });
  } catch (err) {
    return fail("provision tenant", err, 502, { slug, plan: lead.plan, database: process.env.DATABASE_URL ? "DATABASE_URL" : "missing DATABASE_URL" });
  }
  if (!shop.slug || shop.skipped) {
    const error = "The business name did not produce a storefront slug.";
    console.error("[storefront] empty slug", lead.business);
    return Response.json({ ok: false, error }, { status: 422 });
  }

  if (lead.plan === "trial" && !process.env.STRIPE_SECRET_KEY?.trim()) {
    console.error("[storefront] STRIPE_SECRET_KEY is not set. The $1 trial checkout session was not created.", { slug: shop.slug });
  }

  const hook = process.env.LEAD_WEBHOOK_URL?.trim();
  let forwarded = false;
  if (!hook) {
    console.error("[storefront] LEAD_WEBHOOK_URL is not set. The lead was saved on the shop row only.", { slug: shop.slug, plan: lead.plan });
  } else {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...lead,
          slug: shop.slug,
          shopId: shop.shopId,
          accent: lead.accent,
          _subject: `New Axiom lead: ${lead.business} (${lead.plan})`,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[storefront] lead webhook failed", res.status, text.slice(0, 500));
      } else {
        forwarded = true;
      }
    } catch (err) {
      console.error("[storefront] lead webhook threw", describe(err), err);
    }
  }

  return Response.json({
    ok: true,
    slug: shop.slug,
    shopId: shop.shopId,
    status: shop.status,
    siteUrl: `/${shop.slug}`,
    forwarded,
    billing: lead.plan === "trial" && !process.env.STRIPE_SECRET_KEY?.trim() ? "STRIPE_SECRET_KEY is not set" : null,
  });
}

export async function handleTenantPost(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    return fail("tenant form", err instanceof Error ? err : new Error("Expected form data"), 400);
  }

  if (cleanText(form.get("website"), 200)) return Response.json({ ok: true });

  const build = getShowcase(cleanText(form.get("build_id"), 60));
  const business = cleanText(form.get("business_name"), 80);
  const owner = cleanText(form.get("owner_name"), 80);
  const email = cleanText(form.get("email"), 120).toLowerCase();
  const phone = normalizePhone(cleanText(form.get("phone"), 40));

  const errors: string[] = [];
  if (!build) errors.push("Unknown build");
  if (!business) errors.push("Business name is required");
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email is required");
  if (!phone) errors.push("A valid 10-digit phone number is required");

  let logo: { bytes: Buffer; type: string; ext: string } | null = null;
  const file = form.get("logo");
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > MAX_LOGO_BYTES) errors.push("Logo must be under 2 MB");
    else {
      const bytes = Buffer.from(await file.arrayBuffer());
      const kind = sniffLogo(bytes);
      if (!kind) errors.push("Logo must be a PNG, JPG, WEBP or SVG");
      else logo = { bytes, ...kind };
    }
  }
  if (errors.length) {
    const error = errors.join(". ");
    console.error("[storefront] tenant rejected", error);
    return Response.json({ ok: false, error }, { status: 422 });
  }

  const checkoutLink = process.env.NEXT_PUBLIC_STRIPE_CINEMATIC_LINK || process.env.VITE_STRIPE_CINEMATIC_LINK;
  const simulate = process.env.AXIOM_SIMULATE_CHECKOUT === "1";
  const status: TenantStatus = checkoutLink ? "pending_payment" : simulate ? "active" : "pending_review";
  if (status === "pending_payment" && !checkoutLink) {
    console.error("[storefront] NEXT_PUBLIC_STRIPE_CINEMATIC_LINK is not set");
  }

  const base = slugify(business);
  try {
    const logoUrl = logo ? await uploadLogo(logo.bytes, logo.ext, logo.type) : null;
    let tenant;
    for (let attempt = 0; ; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${crypto.randomBytes(2).toString("hex")}`;
      try {
        tenant = await createTenant({
          slug,
          status,
          build_id: build!.id,
          plan: "cinematic",
          business_name: business,
          phone: phone!,
          logo_url: logoUrl,
          owner_name: owner || null,
          email,
        });
        break;
      } catch (err) {
        if (err instanceof SlugTakenError && attempt < 4) continue;
        throw err;
      }
    }

    let next: "checkout" | "live" | "review" = status === "active" ? "live" : "review";
    let checkoutUrl: string | undefined;
    if (status === "pending_payment" && checkoutLink) {
      const url = new URL(checkoutLink);
      url.searchParams.set("prefilled_email", email);
      url.searchParams.set("client_reference_id", tenant.id);
      checkoutUrl = url.toString();
      next = "checkout";
    }

    return Response.json({
      ok: true,
      id: tenant.id,
      slug: tenant.slug,
      status: tenant.status,
      store: storeMode,
      next,
      checkoutUrl,
      siteUrl: `/t/${tenant.slug}`,
    });
  } catch (err) {
    return fail("create tenant", err, 502, { store: storeMode, business });
  }
}
