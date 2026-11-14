import { NextResponse, type NextRequest } from "next/server";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { updateTenant } from "@/lib/tenants/store";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 501 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { metadata?: Record<string, string> } } };
  const tenantId = event.data.object.metadata?.tenant_id;
  if (tenantId) {
    if (event.type === "checkout.session.completed") await updateTenant(tenantId, { status: "active" });
    if (event.type === "customer.subscription.deleted") await updateTenant(tenantId, { status: "paused" });
  }
  return NextResponse.json({ received: true });
}
