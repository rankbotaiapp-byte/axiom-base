import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getAxiomConfig, putAxiomConfig } from "@/lib/axiom/landing/server";

export const dynamic = "force-dynamic";

const slugOf = (req: NextRequest) =>
  (req.nextUrl.searchParams.get("slug") || "default").replace(/[^a-z0-9-_]/gi, "").slice(0, 64) ||
  "default";

function authorized(req: NextRequest) {
  const expected = process.env.AXIOM_ADMIN_KEY;
  const given = req.headers.get("x-axiom-admin-key") || "";
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const config = await getAxiomConfig(slugOf(req));
  return NextResponse.json({ config }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Wrong admin key" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const config = await putAxiomConfig(slugOf(req), body);
    return NextResponse.json({ config });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
