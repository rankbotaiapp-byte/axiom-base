import { NextRequest, NextResponse } from "next/server";
import { uploadStudioBytes } from "@/lib/axiom/studio-fx/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const slug = String(form.get("slug") || "default")
      .replace(/[^a-z0-9-_]/gi, "")
      .slice(0, 64) || "default";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (12MB max)" }, { status: 413 });
    }
    const bytes = await file.arrayBuffer();
    const url = await uploadStudioBytes(slug, bytes, file.name, file.type || "application/octet-stream");
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
