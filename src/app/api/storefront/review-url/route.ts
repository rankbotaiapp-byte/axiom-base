import { NextResponse } from "next/server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import { httpStatus, readGoogleReviewUrl, saveGoogleReviewUrl } from "@/lib/axiom/storefront-unlock.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = cleanShopSlug(new URL(request.url).searchParams.get("slug") || "");
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const url = await readGoogleReviewUrl(slug);
  return NextResponse.json({ slug, url });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown; url?: unknown } | null;
  const slug = cleanShopSlug(String(body?.slug ?? ""));
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  try {
    const saved = await saveGoogleReviewUrl(request, slug, body?.url);
    return NextResponse.json({ ok: true, ...saved });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Save failed.";
    return NextResponse.json({ ok: false, error }, { status: httpStatus(err) });
  }
}
