import { NextRequest, NextResponse } from "next/server";
import { materializeDemoPlate } from "@/lib/axiom/branded-demo.server";
import { isDemoPlateSource, type DemoPlateSlot } from "@/lib/axiom/branded-demo-url";

export const dynamic = "force-dynamic";

const SLOTS = new Set<DemoPlateSlot>(["hero", "proof", "services"]);

function accentCss(raw: string | null): string | undefined {
  const hex = (raw ?? "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  return `#${hex}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slotRaw = params.get("slot") || "hero";
  const slot: DemoPlateSlot = SLOTS.has(slotRaw as DemoPlateSlot) ? (slotRaw as DemoPlateSlot) : "hero";
  const src = params.get("src") || "";
  const plate = await materializeDemoPlate({
    businessName: params.get("biz") || params.get("business") || "",
    niche: params.get("niche") || params.get("trade") || "contractor",
    slot,
    accent: accentCss(params.get("accent")),
    city: params.get("city") || "",
    overrideUrl: slot === "hero" && isDemoPlateSource(src) ? src : "",
  });
  return new NextResponse(plate.svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      "x-axiom-plate-source": plate.source,
    },
  });
}
