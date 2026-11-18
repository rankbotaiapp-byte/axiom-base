import { NextResponse } from "next/server";
import { z } from "zod";
import { persistNicheCustomization } from "@/lib/axiom/niche-customization.server";
import type { NicheCustomizationConfig } from "@/lib/axiom/niche-customization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceLabel: z.string().min(1),
  enabled: z.boolean(),
});

const bodySchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  shopSlug: z.string().min(2).max(80),
  businessName: z.string().max(80),
  logoUrl: z.string().max(2000),
  avatarUrl: z.string().max(2000),
  dispatchPhone: z.string().max(40),
  niche: z.enum(["hvac", "plumbing", "electrical", "auto", "welding", "general"]),
  accent: z.enum(["solar-gold", "electric-cyan", "emergency-amber"]),
  services: z.array(serviceSchema).min(1).max(24),
});

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid niche customization payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const config = parsed.data as NicheCustomizationConfig;
    const result = await persistNicheCustomization(config, request.headers);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status ?? 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      target: result.target,
      enforcedOwner: result.enforcedOwner,
      updatedAt: config.updatedAt,
      shopSlug: config.shopSlug,
      accent: config.accent,
      niche: config.niche,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Niche save failed.";
    console.error("[storefront/niche]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
