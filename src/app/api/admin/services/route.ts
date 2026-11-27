import { NextResponse } from "next/server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import {
  deletePriceBookItem,
  httpStatus,
  listPriceBookForSlug,
  saveVoiceSettings,
  upsertPriceBookItem,
} from "@/lib/axiom/price-book.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = cleanShopSlug(new URL(request.url).searchParams.get("slug") || "");
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const book = await listPriceBookForSlug(slug);
  return NextResponse.json(book);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = cleanShopSlug(String(body?.slug ?? ""));
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  try {
    if (body?.voiceAnswerMode || body?.voiceDailyCapCents) {
      const settings = await saveVoiceSettings(request, slug, body);
      return NextResponse.json({ ok: true, ...settings });
    }
    const item = await upsertPriceBookItem(request, slug, body || {});
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Save failed." }, { status: httpStatus(err) });
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown; id?: unknown } | null;
  const slug = cleanShopSlug(String(body?.slug ?? ""));
  const id = String(body?.id ?? "").trim();
  if (!slug || !id) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  try {
    await deletePriceBookItem(request, slug, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Delete failed." }, { status: httpStatus(err) });
  }
}
