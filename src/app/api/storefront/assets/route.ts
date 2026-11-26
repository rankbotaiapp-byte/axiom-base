import { NextResponse } from "next/server";
import { uploadLayoutAssetBundle } from "@/lib/axiom/storefront-layout.server";
import { DEFAULT_SHOP_SLUG } from "@/lib/axiom/storefront-layout";
import { validateStorefrontUpload, type StorefrontUploadKind } from "@/lib/axiom/storefront-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const slugRaw = form.get("slug");
    const kindRaw = String(form.get("kind") ?? "hero");
    const kind: StorefrontUploadKind = kindRaw === "proof" ? "proof" : "hero";
    const slug =
      typeof slugRaw === "string" && slugRaw.trim() ? slugRaw.trim() : DEFAULT_SHOP_SLUG;

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
    }
    const check = validateStorefrontUpload(file, kind);
    if (!check.ok) {
      return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
    }

    const stored = await uploadLayoutAssetBundle(slug, file, kind);
    if (!stored?.url) {
      return NextResponse.json(
        { ok: false, error: "Supabase storage (axiom-media) is unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      remote: true,
      url: stored.url,
      thumbnailUrl: stored.thumbnailUrl ?? null,
      kind: check.media,
      name: file.name,
      mime: check.media === "image" ? "image/webp" : file.type || "application/octet-stream",
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upload failed.";
    console.error("[storefront/assets]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
