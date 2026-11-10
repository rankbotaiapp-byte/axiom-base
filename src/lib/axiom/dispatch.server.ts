import { getSql } from "@/lib/db";
import { isLeadSlug } from "./funnel";
import {
  collectedDispatchPhone,
  isPlaceholderDispatchPhone,
  maskDispatchPhone,
  testDispatchCopy,
} from "./dispatch-phone";
import { sendTwilioSms } from "./notify.server";

const hits = new Map<string, number>();

function rateLimited(slug: string): boolean {
  const now = Date.now();
  const last = hits.get(slug) ?? 0;
  if (now - last < 20_000) return true;
  hits.set(slug, now);
  return false;
}

export async function lockDispatchPhone(slug: string, rawPhone: string): Promise<{
  phone: string;
  masked: string;
}> {
  if (!isLeadSlug(slug)) throw Object.assign(new Error("Unknown shop"), { status: 400 });
  const trimmed = (rawPhone ?? "").trim();
  if (!trimmed) {
    throw Object.assign(new Error("Enter the cell in your pocket — not a shop line placeholder."), { status: 400 });
  }
  if (isPlaceholderDispatchPhone(trimmed)) {
    throw Object.assign(new Error("Skip sample numbers like 555. Use the phone in your pocket."), { status: 400 });
  }
  const phone = collectedDispatchPhone(trimmed);
  if (!phone) throw Object.assign(new Error("Enter the cell in your pocket — not a shop line placeholder."), { status: 400 });

  try {
    const sql = await getSql();
    try {
      await sql`
        update shops
        set notify_phone = ${phone}, dispatch_phone_locked = true
        where slug = ${slug}
      `;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/dispatch_phone_locked/i.test(message)) {
        await sql`update shops set notify_phone = ${phone} where slug = ${slug}`;
      } else if (!/does not exist|relation/i.test(message)) {
        throw err;
      }
    }
  } catch {
    /* Neon optional — Supabase is the durable tenant record. */
  }

  const { getTenantBySlug, updateTenant } = await import("@/lib/axiom-landing/tenants/store");
  const tenant = await getTenantBySlug(slug, { fresh: true });
  if (tenant) {
    await updateTenant(tenant.id, {
      dispatch_phone: phone,
      dispatch_phone_locked: true,
      status: tenant.status === "pending_payment" ? "active" : tenant.status,
      activated_at: tenant.activated_at ?? new Date().toISOString(),
    }).catch(() => undefined);
  }

  return { phone, masked: maskDispatchPhone(phone) };
}

export async function testLiveDispatch(slug: string): Promise<{
  ok: boolean;
  masked: string;
  sid: string;
  detail: string;
}> {
  if (!isLeadSlug(slug)) throw Object.assign(new Error("Unknown shop"), { status: 400 });
  if (rateLimited(slug)) {
    throw Object.assign(new Error("Wait a few seconds before sending another test."), { status: 429 });
  }

  let phone = "";
  let shopName = slug;
  try {
    const sql = await getSql();
    const rows = await sql<{ notify_phone: string; name: string }>`
      select notify_phone, name from shops where slug = ${slug} limit 1
    `;
    phone = collectedDispatchPhone(rows[0]?.notify_phone ?? "");
    shopName = rows[0]?.name?.trim() || shopName;
  } catch {
    phone = "";
  }

  if (!phone) {
    const { getTenantBySlug } = await import("@/lib/axiom-landing/tenants/store");
    const tenant = await getTenantBySlug(slug, { fresh: true }).catch(() => null);
    phone = collectedDispatchPhone(tenant?.dispatch_phone ?? tenant?.phone ?? "");
    shopName = tenant?.business_name?.trim() || shopName;
  }

  if (!phone) {
    throw Object.assign(new Error("Lock your cell first — then this text proves the line."), { status: 409 });
  }

  const result = await sendTwilioSms(phone, testDispatchCopy(shopName));
  if (result.status === "skipped") {
    throw Object.assign(new Error("Twilio is not configured for live SMS."), { status: 503 });
  }
  if (result.status !== "sent") {
    throw Object.assign(new Error(result.detail || "Twilio did not send the test."), { status: 502 });
  }
  return { ok: true, masked: maskDispatchPhone(phone), sid: result.detail, detail: "sent" };
}
