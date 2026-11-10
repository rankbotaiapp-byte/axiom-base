import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nicheIds, plans, type NicheId, type PlanId } from "@/config/storefront";
import { bootstrapContent } from "@/lib/content-engine/run";
import { createCheckout, stripeEnabled } from "@/lib/payments/stripe";
import { defaultConfig, slugify } from "@/lib/tenants/factory";
import { createTenant, slugTaken } from "@/lib/tenants/store";

const schema = z.object({
  plan: z.enum(Object.keys(plans) as [PlanId, ...PlanId[]]),
  name: z.string().trim().min(2).max(80),
  niche: z.enum(nicheIds as [NicheId, ...NicheId[]]),
  city: z.string().trim().min(2).max(60),
  region: z.string().trim().length(2).transform((s) => s.toUpperCase()),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(120),
  website: z.union([z.string().trim().url().max(200), z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
});

// Basic abuse guard (per-instance). Put Vercel Firewall / Upstash in front for production.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts — try again in a few minutes." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: `Check ${String(first?.path[0] ?? "the form")}: ${first?.message}` }, { status: 400 });
  }
  const d = parsed.data;

  // Unique, readable, local slug: business-name-city(-n)
  const base = slugify(`${d.name} ${d.city}`) || "business";
  let slug = base;
  for (let i = 2; await slugTaken(slug); i++) slug = `${base}-${i}`;

  const tenant = await createTenant({
    slug,
    name: d.name,
    niche: d.niche,
    city: d.city,
    region: d.region,
    phone: d.phone,
    email: d.email,
    website: d.website || null,
    plan: d.plan,
    // Live immediately as a preview; Stripe webhook flips to active on payment.
    status: stripeEnabled && d.plan !== "custom" ? "preview" : "active",
    config: defaultConfig(d.niche, d.name, d.city, d.region),
  });

  // Day-one content runs after the response is sent — the user isn't kept waiting.
  after(async () => {
    try {
      await bootstrapContent(tenant);
    } catch (e) {
      console.error("[provision] bootstrap content failed", tenant.slug, e);
    }
    const hook = process.env.LEAD_NOTIFY_WEBHOOK;
    if (hook) {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "axiom.signup", plan: d.plan, slug, name: d.name, city: d.city, phone: d.phone, email: d.email, notes: d.notes ?? "" }),
      }).catch(() => {});
    }
  });

  let url = `/b/${slug}?welcome=${d.plan === "custom" ? "custom" : "1"}`;
  try {
    const checkout = await createCheckout({ plan: d.plan, tenantId: tenant.id, slug, email: d.email });
    if (checkout) url = checkout;
  } catch (e) {
    console.error("[provision] checkout failed", e);
  }
  return NextResponse.json({ slug, url });
}
