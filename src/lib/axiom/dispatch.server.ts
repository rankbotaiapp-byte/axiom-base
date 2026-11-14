import { getSql } from "@/lib/db";
import { isLeadSlug } from "./funnel";
import {
  collectedDispatchPhone,
  isPlaceholderDispatchPhone,
  maskDispatchPhone,
  testDispatchCopy,
} from "./dispatch-phone";
import { sendTwilioSms } from "./notify.server";
import { resolveShopLeadAlerts } from "./notify-prefs";

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
        set notify_phone = ${phone},
            notification_phone = ${phone},
            notify_sms_enabled = true,
            dispatch_phone_locked = true
        where slug = ${slug}
      `;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/dispatch_phone_locked|notification_phone|notify_sms_enabled/i.test(message)) {
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
      notification_phone: phone,
      notify_sms_enabled: true,
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
    const rows = await sql<{
      notify_phone: string;
      name: string;
      notification_phone?: string | null;
      notify_sms_enabled?: boolean | null;
    }>`
      select notify_phone, name, notification_phone, notify_sms_enabled
      from shops where slug = ${slug} limit 1
    `;
    const alerts = resolveShopLeadAlerts(rows[0]);
    if (rows[0] && !alerts.smsEnabled) {
      throw Object.assign(new Error("SMS alerts are off for this shop."), { status: 409 });
    }
    phone = collectedDispatchPhone(alerts.phone);
    shopName = rows[0]?.name?.trim() || shopName;
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 409) throw err;
    phone = "";
  }

  if (!phone) {
    const { getTenantBySlug } = await import("@/lib/axiom-landing/tenants/store");
    const tenant = await getTenantBySlug(slug, { fresh: true }).catch(() => null);
    const tenantAlerts = resolveShopLeadAlerts({
      notify_phone: tenant?.dispatch_phone ?? tenant?.phone ?? "",
      notification_phone: tenant?.notification_phone,
      notify_sms_enabled: tenant?.notify_sms_enabled,
      notify_email: tenant?.email,
      notification_email: tenant?.notification_email,
      notify_email_enabled: tenant?.notify_email_enabled,
    });
    if (tenant && !tenantAlerts.smsEnabled) {
      throw Object.assign(new Error("SMS alerts are off for this shop."), { status: 409 });
    }
    phone = collectedDispatchPhone(tenantAlerts.phone);
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
