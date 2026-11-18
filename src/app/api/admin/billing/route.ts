import { NextResponse } from "next/server";
import { cancelBillingSubscription, readBillingHub } from "@/lib/axiom/billing-hub.server";

export const runtime = "nodejs";

function slugFrom(value: unknown): string {
  const slug = String(value ?? "").trim();
  return /^[a-z0-9-]{1,80}$/i.test(slug) ? slug : "";
}

export async function GET(request: Request) {
  const slug = slugFrom(new URL(request.url).searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const hub = await readBillingHub(slug);
  return NextResponse.json(hub);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { slug?: unknown; action?: unknown };
  const slug = slugFrom(body.slug);
  if (!slug || body.action !== "cancel") {
    return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  }
  try {
    const hub = await cancelBillingSubscription(slug);
    return NextResponse.json(hub);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel did not finish";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
