import { createHmac, timingSafeEqual } from "node:crypto";
import { grantTrialStudioAccess } from "./studio-credits.server";
import { TRIAL_MONTHLY_CENTS } from "./studio-credits";

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};

function headerValue(header: string | null): string {
  return (header || "").trim();
}

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const fields = header.split(",").map((part) => part.trim());
  const timestamp = fields.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = fields.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((signature) => {
    const given = Buffer.from(signature);
    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf);
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function metadataSlug(meta: Record<string, unknown>): string {
  return text(meta.shop_slug) || text(meta.lead_slug) || text(meta.slug) || text(meta.tenant_slug);
}

function slugFromObject(object: Record<string, unknown>): string {
  const direct = metadataSlug(asRecord(object.metadata));
  if (direct) return direct;
  const details = asRecord(object.subscription_details);
  const fromDetails = metadataSlug(asRecord(details.metadata));
  if (fromDetails) return fromDetails;
  const parent = asRecord(asRecord(object.parent).subscription_details);
  return metadataSlug(asRecord(parent.metadata)) || text(object.client_reference_id);
}

function customerId(object: Record<string, unknown>): string {
  const customer = object.customer;
  if (typeof customer === "string") return customer;
  return text(asRecord(customer).id);
}

/** $1 trial start, or the later $150 invoice on that same subscription. */
function isTrialCheckout(type: string, object: Record<string, unknown>): boolean {
  if (type === "customer.subscription.created") {
    const status = text(object.status);
    const meta = asRecord(object.metadata);
    const plan = text(meta.plan) || text(meta.tier) || text(meta.kind);
    return status === "trialing" || status === "active" || /trial|starter|name_your_price/i.test(plan) || Boolean(object.trial_end);
  }
  if (type === "invoice.payment_succeeded") {
    const paid = Number(object.amount_paid);
    const reason = text(object.billing_reason);
    return paid === 100 || paid === TRIAL_MONTHLY_CENTS || reason === "subscription_create" || reason === "subscription_cycle";
  }
  return false;
}

/** Grants the studio trial pool for a verified subscription or invoice event. */
export async function grantStudioTrialFromEvent(event: StripeEvent): Promise<Response | null> {
  const type = event.type || "";
  if (type !== "customer.subscription.created" && type !== "invoice.payment_succeeded") return null;
  const object = asRecord(event.data?.object);
  if (!isTrialCheckout(type, object)) return Response.json({ received: true, ignored: "unrelated invoice" });
  const slug = slugFromObject(object);
  if (!slug || !event.id) return Response.json({ received: true, ignored: "missing tenant slug" });
  const access = await grantTrialStudioAccess({
    slug,
    eventId: event.id,
    customerId: customerId(object),
  });
  return Response.json({
    received: true,
    slug: access.slug,
    isActive: access.isActive,
    credits: access.credits,
  });
}

export async function handleStudioStripeWebhook(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Stripe webhook secret is not set" }, { status: 500 });
  }
  const payload = await request.text();
  const signature = headerValue(request.headers.get("stripe-signature"));
  if (!verifyStripeSignature(payload, signature, secret)) {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }
  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Invalid Stripe payload" }, { status: 400 });
  }
  return (await grantStudioTrialFromEvent(event)) ?? Response.json({ received: true });
}
