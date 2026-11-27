import { NextResponse } from "next/server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import { listShopDispatchJobs } from "@/lib/axiom/sprint2-dispatch.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = cleanShopSlug(new URL(request.url).searchParams.get("slug") || "");
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const jobs = await listShopDispatchJobs(slug);
  return NextResponse.json({ jobs });
}
