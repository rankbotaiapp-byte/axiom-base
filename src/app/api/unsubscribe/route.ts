import { NextResponse } from "next/server";
import { suppressContact } from "@/lib/axiom/lifecycle.server";
import { unsubscribeSecretConfigured, verifyUnsubscribeToken } from "@/lib/axiom/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = (url.searchParams.get("token") || "").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });
  }
  if (!unsubscribeSecretConfigured()) {
    return NextResponse.json({ ok: false, error: "Unsubscribe signing is not configured." }, { status: 503 });
  }
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ ok: false, error: "Invalid unsubscribe link." }, { status: 401 });
  }
  await suppressContact({ email, reason: "unsubscribe" });
  void import("@/lib/axiom/growth-engine.server")
    .then((mod) =>
      mod.recordFunnelEvent({
        leadId: email.slice(0, 80),
        event: "unsubscribed",
      }),
    )
    .catch(() => undefined);
  return NextResponse.json({ ok: true, suppressed: email });
}
