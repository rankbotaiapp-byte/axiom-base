import { NextResponse } from "next/server";
import { z } from "zod";
import { persistLayoutToSupabase } from "@/lib/axiom/storefront-layout.server";
import type { StorefrontLayoutConfig } from "@/lib/axiom/storefront-layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slotSchema = z.object({
  id: z.enum(["slot-hero", "slot-pow", "slot-booking", "slot-trust", "slot-cta"]),
  label: z.string(),
  category: z.enum(["Hero", "Proof of Work", "Booking Engine", "Trust & Badges", "CTA"]),
  assignedAsset: z.string().nullable(),
  status: z.enum(["Empty", "Assigned", "Optimized"]),
});

const bodySchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  shopSlug: z.string().min(1),
  backgroundId: z.string(),
  backgroundUrl: z.string(),
  activeTradeId: z.enum(["drilling", "hammering", "cutting", "welding"]),
  slots: z.array(slotSchema).min(1),
  assets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      mime: z.string(),
      remote: z.boolean(),
      createdAt: z.string(),
    }),
  ),
  atmosphereEnabled: z.boolean().optional(),
  cinemagraphPreset: z.enum(["exhaust_haze", "dust_motes", "embers"]).optional(),
});

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid layout payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const config = parsed.data as StorefrontLayoutConfig;
    const empty = config.slots.filter((s) => s.status === "Empty");
    if (empty.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot deploy — ${empty.length} slot(s) still empty.`,
          empty: empty.map((s) => s.id),
        },
        { status: 409 },
      );
    }

    const result = await persistLayoutToSupabase(config);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      target: result.target,
      updatedAt: config.updatedAt,
      shopSlug: config.shopSlug,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Layout deploy failed.";
    console.error("[storefront/layout]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
