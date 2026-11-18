import { NextResponse } from "next/server";
import { renderAndSyncStudioHero } from "@/lib/axiom/ai-client";
import {
  authorizeAndConsumeGeneration,
  generationGuardJson,
  refundGeneration,
} from "@/lib/axiom/generation-guard";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const guard = await authorizeAndConsumeGeneration(null, request.headers);
  if (!guard.allowed) {
    return NextResponse.json(generationGuardJson(guard), { status: guard.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    shopSlug?: unknown;
    niche?: unknown;
    shopName?: unknown;
    tagline?: unknown;
    prompt?: unknown;
  };
  const shopSlug = String(body.shopSlug ?? "").trim();
  if (!/^[a-z0-9-]{1,80}$/i.test(shopSlug)) {
    await refundGeneration(guard.userId);
    return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  }
  try {
    const result = await renderAndSyncStudioHero({
      shopSlug,
      niche: String(body.niche ?? "plumbing"),
      shopName: String(body.shopName ?? ""),
      tagline: String(body.tagline ?? ""),
      prompt: String(body.prompt ?? ""),
    });
    return NextResponse.json(result);
  } catch (err) {
    await refundGeneration(guard.userId);
    const message = err instanceof Error ? err.message : "The studio render did not finish";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}