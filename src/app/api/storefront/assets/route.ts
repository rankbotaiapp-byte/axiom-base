import { NextResponse } from "next/server";
import { uploadLayoutAssetToStorage } from "@/lib/axiom/storefront-layout.server";
import { DEFAULT_SHOP_SLUG } from "@/lib/axiom/storefront-layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const slugRaw = form.get("slug");
    const slug =
      typeof slugRaw === "string" && slugRaw.trim() ? slugRaw.trim() : DEFAULT_SHOP_SLUG;

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
    }
    if (file.size > 40 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File exceeds 40MB limit." }, { status: 413 });
    }

    const remoteUrl = await uploadLayoutAssetToStorage(slug, file);
    if (!remoteUrl) {
      return NextResponse.json({
        ok: true,
        remote: false,
        url: null,
        message: "Supabase storage unavailable — use local object URL on client.",
      });
    }

    return NextResponse.json({
      ok: true,
      remote: true,
      url: remoteUrl,
      name: file.name,
      mime: file.type || "application/octet-stream",
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upload failed.";
    console.error("[storefront/assets]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
