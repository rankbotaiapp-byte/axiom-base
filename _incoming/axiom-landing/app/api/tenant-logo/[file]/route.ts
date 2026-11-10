import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_LOGO_DIR } from "@/lib/tenants/store";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" };

// Serves logos in local (no-Supabase) mode only.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[a-z0-9-]+\.(png|jpg|webp|svg)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(LOCAL_LOGO_DIR, file));
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "Content-Security-Policy": "script-src 'none'" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
