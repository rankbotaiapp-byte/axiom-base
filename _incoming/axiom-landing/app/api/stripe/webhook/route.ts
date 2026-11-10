import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getTenantById, updateTenant } from "@/lib/tenants/store";

export const runtime = "nodejs";

const TOLERANCE_S = 300;

/** Verifies Stripe's signature header (t=…,v1=…) without the Stripe SDK. */
function verify(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const raw = await req.text();
  if (!verify(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const s = event.data?.object ?? {};
  if (s.payment_status !== "paid") return NextResponse.json({ received: true, skipped: "unpaid" });

  const tenantId: string | undefined = s.client_reference_id;
  const tenant = tenantId ? await getTenantById(tenantId) : null;
  if (!tenant) {
    console.error("[stripe] paid session with no matching tenant", s.id, tenantId);
    return NextResponse.json({ received: true, warning: "no tenant" }); // 200 so Stripe stops retrying; investigate in logs
  }
  if (tenant.status !== "active") {
    await updateTenant(tenant.id, {
      status: "active",
      stripe_session_id: s.id,
      amount_paid_cents: s.amount_total ?? null,
      activated_at: new Date().toISOString(),
    });
    console.log(`[stripe] tenant ${tenant.slug} activated`);
  }
  return NextResponse.json({ received: true });
}
