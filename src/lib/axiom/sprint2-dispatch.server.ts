import { getSql } from "@/lib/db";
import { appendMessagingNotice } from "./legal-notices";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate";
import { toE164 } from "./notify-target";
import { resolvePublicAppOrigin } from "./public-app-url";
import { persistConversation, sendSms } from "./twilio-booking.server";
import {
  customerFirstName,
  hoursJsonFromServiceWindow,
  isQuoteNudgeSendWindow,
  matchOmwAppointment,
  omwClarifySms,
  omwCustomerSms,
  omwOwnerSms,
  parseDay1Onboarding,
  parseOmwCommand,
  quoteIsNudgeEligible,
  quoteNudgeSms,
  welcomeCheatSheetSms,
  type OmwCandidate,
} from "./sprint2-dispatch.ts";
import { deliverUnlockWelcomeSms, ownerNotifyPhone } from "./unlock-welcome.ts";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  owner_phone: string | null;
  notify_phone: string | null;
  notification_phone: string | null;
  shop_timezone: string | null;
  welcome_sms_sent_at: string | null;
  axiom_phone_number?: string | null;
};

async function loadShop(shopId: string): Promise<ShopRow | null> {
  const sql = await getSql();
  try {
    const rows = await sql<ShopRow>`
      select id, slug, name, owner_phone, notify_phone, notification_phone, shop_timezone,
             welcome_sms_sent_at, axiom_phone_number
      from shops where id = ${shopId} limit 1
    `;
    return rows[0] ?? null;
  } catch {
    const rows = await sql<ShopRow>`
      select id, slug, name, owner_phone, notify_phone, notification_phone
      from shops where id = ${shopId} limit 1
    `.catch(() => [] as ShopRow[]);
    return rows[0] ?? null;
  }
}

async function loadShopBySlug(slug: string): Promise<ShopRow | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const sql = await getSql();
  const rows = await sql<ShopRow>`
    select id, slug, name, owner_phone, notify_phone, notification_phone, shop_timezone,
           welcome_sms_sent_at, axiom_phone_number
    from shops where slug = ${key} limit 1
  `.catch(async () => {
    return sql<ShopRow>`
      select id, slug, name, owner_phone, notify_phone, notification_phone
      from shops where slug = ${key} limit 1
    `.catch(() => [] as ShopRow[]);
  });
  return rows[0] ?? null;
}

async function persistOwnerPhone(shopId: string, phone: string): Promise<void> {
  const sql = await getSql();
  await sql`
    update shops
    set owner_phone = coalesce(nullif(btrim(owner_phone), ''), ${phone}),
        notify_phone = coalesce(nullif(btrim(notify_phone), ''), ${phone}),
        notification_phone = coalesce(nullif(btrim(notification_phone), ''), ${phone})
    where id = ${shopId}
  `.catch(() => undefined);
  await sql`
    update tenants
    set owner_phone = coalesce(nullif(btrim(owner_phone), ''), ${phone})
    where shop_id = ${shopId}
  `.catch(() => undefined);
}

async function claimWelcomeSmsStamp(shopId: string): Promise<boolean> {
  const sql = await getSql();
  const claimed = await sql<{ id: string }>`
    update shops
    set welcome_sms_sent_at = now()
    where id = ${shopId} and welcome_sms_sent_at is null
    returning id
  `.catch(() => [] as { id: string }[]);
  if (!claimed[0]) return false;
  await sql`
    update tenants
    set welcome_sms_sent_at = coalesce(welcome_sms_sent_at, now())
    where shop_id = ${shopId}
  `.catch(() => undefined);
  return true;
}

/** Immediate $1-unlock proof-of-life SMS. Idempotent via welcome_sms_sent_at. */
export async function sendUnlockWelcomeSms(input: {
  shopId?: string;
  slug?: string;
  ownerPhone?: string | null;
  shopName?: string;
}): Promise<{ sent: boolean; reason: string }> {
  const shop = input.shopId
    ? await loadShop(input.shopId)
    : input.slug
      ? await loadShopBySlug(input.slug)
      : null;
  if (!shop) return { sent: false, reason: "no_shop" };
  const ownerE164 = ownerNotifyPhone(
    input.ownerPhone,
    shop.owner_phone,
    shop.notify_phone,
    shop.notification_phone,
  );
  if (ownerE164) await persistOwnerPhone(shop.id, ownerE164);

  let suppressed = false;
  if (ownerE164) {
    try {
      const { isSuppressed } = await import("./lifecycle.server");
      suppressed = await isSuppressed("", ownerE164);
    } catch {
      suppressed = false;
    }
  }

  return deliverUnlockWelcomeSms({
    alreadySent: Boolean(shop.welcome_sms_sent_at),
    ownerE164,
    suppressed,
    shopName: input.shopName || shop.name,
    claim: () => claimWelcomeSmsStamp(shop.id),
    send: async (body) => {
      const sent = await smsOut(ownerE164 || "", body, shop, "unlock_welcome");
      return sent.ok;
    },
  });
}

async function shopFromNumber(from: string, shop: ShopRow): Promise<boolean> {
  return mmsSenderMayUpdateProof(from, [shop.owner_phone, shop.notify_phone, shop.notification_phone]);
}

async function twilioFrom(shopId: string): Promise<string | undefined> {
  const sql = await getSql();
  const rows = await sql<{ twilio_number: string | null }>`
    select twilio_number from shop_billing where shop_id = ${shopId} limit 1
  `.catch(() => [] as { twilio_number: string | null }[]);
  return rows[0]?.twilio_number || undefined;
}

async function smsOut(to: string, body: string, shop: ShopRow, kind: string) {
  const text = appendMessagingNotice(body, "sms");
  const fromOverride = (await twilioFrom(shop.id)) || shop.axiom_phone_number || undefined;
  const sent = await sendSms(to, text, fromOverride);
  await persistConversation({
    shopId: shop.id,
    channel: "sms",
    direction: "outbound",
    fromPhone: fromOverride || "",
    toPhone: to,
    body: text,
    status: sent.ok ? "sent" : "failed",
    providerRef: sent.sid,
    kind,
  });
  return sent;
}

export async function handleOwnerOmwSms(input: {
  shopId: string;
  from: string;
  body: string;
  origin?: string;
}): Promise<{ handled: boolean; reply: string }> {
  const command = parseOmwCommand(input.body);
  if (!command) return { handled: false, reply: "" };
  const shop = await loadShop(input.shopId);
  if (!shop) return { handled: false, reply: "" };
  if (!(await shopFromNumber(input.from, shop))) return { handled: false, reply: "" };

  const sql = await getSql();
  const rows = await sql<{
    id: string;
    customer_name: string;
    customer_phone: string;
    starts_at: string;
    status: string;
  }>`
    select id, customer_name, customer_phone, starts_at::text as starts_at, status
    from appointments
    where shop_id = ${shop.id}
      and status in ('pending', 'confirmed', 'en_route')
      and coalesce(is_simulated, false) = false
      and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = ${command.last4}
    order by starts_at asc
    limit 12
  `.catch(async () => {
    return sql<{
      id: string;
      customer_name: string;
      customer_phone: string;
      starts_at: string;
      status: string;
    }>`
      select id, customer_name, customer_phone, starts_at::text as starts_at, status
      from appointments
      where shop_id = ${shop.id}
        and status in ('pending', 'confirmed')
        and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = ${command.last4}
      order by starts_at asc
      limit 12
    `.catch(() => []);
  });

  const candidates: OmwCandidate[] = rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    startsAt: row.starts_at,
    status: row.status,
  }));
  const matched = matchOmwAppointment(candidates, command.last4, new Date(), shop.shop_timezone || undefined);
  if (matched.action === "none") {
    return { handled: true, reply: `No active job ends in ${command.last4}.` };
  }
  if (matched.action === "clarify") {
    return { handled: true, reply: omwClarifySms(matched.jobs) };
  }

  const job = matched.job;
  const customerPhone = toE164(job.customerPhone) || job.customerPhone;
  try {
    const { isSuppressed } = await import("./lifecycle.server");
    if (await isSuppressed("", customerPhone)) {
      return { handled: true, reply: "That customer opted out of SMS. Job was not marked En Route." };
    }
  } catch {
    /* suppressions optional */
  }

  await sql`
    update appointments
    set status = 'en_route',
        dispatched_at = now(),
        eta_minutes = ${command.etaMinutes}
    where id = ${job.id} and shop_id = ${shop.id}
  `.catch(async () => {
    await sql`
      update appointments
      set status = 'confirmed'
      where id = ${job.id} and shop_id = ${shop.id}
    `.catch(() => undefined);
  });

  const origin = (input.origin || resolvePublicAppOrigin() || "https://rankbotapp.com").replace(/\/$/, "");
  await smsOut(
    customerPhone,
    omwCustomerSms({
      shopName: shop.name,
      etaMinutes: command.etaMinutes,
      origin,
      shopSlug: shop.slug,
    }),
    shop,
    "omw_customer",
  );
  return {
    handled: true,
    reply: omwOwnerSms({
      customerName: job.customerName,
      last4: command.last4,
      etaMinutes: command.etaMinutes,
    }),
  };
}

export async function loadDay1Onboarding(slug: string) {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  try {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    slug: string;
    name: string;
    owner_phone: string | null;
    notify_phone: string | null;
    google_review_url: string | null;
    service_hours_start: string | null;
    service_hours_end: string | null;
    onboarding_completed_at: string | null;
    address: string | null;
    niche: string | null;
  }>`
    select id, slug, name, owner_phone, notify_phone, google_review_url,
           service_hours_start, service_hours_end, onboarding_completed_at, address, niche
    from shops where slug = ${key} limit 1
  `.catch(async () => {
    return sql<{
      id: string;
      slug: string;
      name: string;
      owner_phone: string | null;
      notify_phone: string | null;
      google_review_url: string | null;
      service_hours_start: string | null;
      service_hours_end: string | null;
      onboarding_completed_at: string | null;
      address: string | null;
      niche: string | null;
    }>`
      select id, slug, name, owner_phone, notify_phone, google_review_url, address, niche
      from shops where slug = ${key} limit 1
    `.catch(() => []);
  });
  return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function saveDay1Onboarding(input: {
  slug: string;
  ownerPhone: string;
  googleReviewUrl?: string;
  hoursStart?: string;
  hoursEnd?: string;
  skipReview?: boolean;
}): Promise<{
  ok: boolean;
  error?: string;
  welcomeSent: boolean;
  alreadyWelcomed: boolean;
  ownerPhone?: string;
  googleReviewUrl?: string;
}> {
  const parsed = parseDay1Onboarding(input);
  if (!parsed.ok) return { ok: false, error: parsed.error, welcomeSent: false, alreadyWelcomed: false };
  const shop = await loadDay1Onboarding(input.slug);
  if (!shop) return { ok: false, error: "Unknown shop", welcomeSent: false, alreadyWelcomed: false };
  const sql = await getSql();
  const hoursJson = hoursJsonFromServiceWindow(parsed.hoursStart, parsed.hoursEnd);
  await sql`
    update shops
    set owner_phone = ${parsed.ownerPhone},
        notify_phone = case when coalesce(notify_phone, '') = '' then ${parsed.ownerPhone} else notify_phone end,
        notification_phone = case when coalesce(notification_phone, '') = '' then ${parsed.ownerPhone} else notification_phone end,
        google_review_url = ${parsed.googleReviewUrl},
        service_hours_start = ${parsed.hoursStart},
        service_hours_end = ${parsed.hoursEnd},
        hours_json = ${hoursJson},
        onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = ${shop.id}
  `.catch(async () => {
    await sql`
      update shops
      set owner_phone = ${parsed.ownerPhone},
          google_review_url = ${parsed.googleReviewUrl},
          onboarding_completed_at = coalesce(onboarding_completed_at, now())
      where id = ${shop.id}
    `.catch(() => undefined);
  });
  await sql`
    update tenants
    set owner_phone = ${parsed.ownerPhone},
        google_review_url = ${parsed.googleReviewUrl},
        onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where shop_id = ${shop.id}
  `.catch(() => undefined);

  const live = await loadShop(shop.id);
  const already = Boolean(live?.welcome_sms_sent_at);
  if (already) {
    return {
      ok: true,
      welcomeSent: false,
      alreadyWelcomed: true,
      ownerPhone: parsed.ownerPhone,
      googleReviewUrl: parsed.googleReviewUrl,
    };
  }
  const claimed = await sql<{ id: string }>`
    update shops
    set welcome_sms_sent_at = now()
    where id = ${shop.id} and welcome_sms_sent_at is null
    returning id
  `.catch(() => [] as { id: string }[]);
  if (!claimed[0]) {
    return {
      ok: true,
      welcomeSent: false,
      alreadyWelcomed: true,
      ownerPhone: parsed.ownerPhone,
      googleReviewUrl: parsed.googleReviewUrl,
    };
  }
  const row = live ?? {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    owner_phone: parsed.ownerPhone,
    notify_phone: parsed.ownerPhone,
    notification_phone: parsed.ownerPhone,
    shop_timezone: null,
    welcome_sms_sent_at: null,
  };
  await smsOut(parsed.ownerPhone, welcomeCheatSheetSms(shop.name), row, "welcome_cheatsheet");
  return {
    ok: true,
    welcomeSent: true,
    alreadyWelcomed: false,
    ownerPhone: parsed.ownerPhone,
    googleReviewUrl: parsed.googleReviewUrl,
  };
}

export async function listShopDispatchJobs(slug: string) {
  const sql = await getSql();
  const key = slug.trim().toLowerCase();
  return sql<{
    id: string;
    customer_name: string;
    customer_phone: string;
    starts_at: string;
    status: string;
    eta_minutes: number | null;
    dispatched_at: string | null;
  }>`
    select a.id, a.customer_name, a.customer_phone, a.starts_at::text as starts_at, a.status,
           a.eta_minutes, a.dispatched_at::text as dispatched_at
    from appointments a
    join shops s on s.id = a.shop_id
    where s.slug = ${key}
      and a.status in ('pending', 'confirmed', 'en_route')
      and coalesce(a.is_simulated, false) = false
    order by a.starts_at asc
    limit 24
  `.catch(() => []);
}

export async function sweepUnpaidQuoteNudges(
  limit = 20,
  shopSlug?: string,
): Promise<{ sent: number; skipped: number; quiet: number }> {
  const sql = await getSql();
  const origin = (resolvePublicAppOrigin() || "https://rankbotapp.com").replace(/\/$/, "");
  const slugFilter = (shopSlug || "").trim().toLowerCase();
  const rows = await sql<{
    id: string;
    shop_id: string;
    customer_phone: string;
    customer_name: string;
    description: string;
    total_cents: number;
    status: string;
    nudge_sent_at: string | null;
    created_at: string;
    shop_name: string;
    shop_slug: string;
    shop_timezone: string | null;
    is_showcase: boolean | null;
  }>`
    select q.id, q.shop_id, q.customer_phone, q.customer_name, q.description, q.total_cents, q.status,
           q.nudge_sent_at::text as nudge_sent_at, q.created_at::text as created_at,
           s.name as shop_name, s.slug as shop_slug, s.shop_timezone, s.is_showcase
    from shop_quotes q
    join shops s on s.id = q.shop_id
    where q.status in ('pending', 'sent')
      and q.nudge_sent_at is null
      and q.created_at <= now() - interval '24 hours'
      and q.created_at >= now() - interval '72 hours'
      and (q.expires_at is null or q.expires_at > now())
      and coalesce(s.is_showcase, false) = false
      and (${!slugFilter} or s.slug = ${slugFilter || "-"})
    order by q.created_at asc
    limit ${limit}
  `.catch(() => []);

  let sent = 0;
  let skipped = 0;
  let quiet = 0;
  for (const row of rows) {
    if (
      !quoteIsNudgeEligible({
        status: row.status,
        nudgeSentAt: row.nudge_sent_at,
        createdAt: row.created_at,
      })
    ) {
      skipped += 1;
      continue;
    }
    if (!isQuoteNudgeSendWindow(new Date(), row.shop_timezone || undefined)) {
      quiet += 1;
      continue;
    }
    const simulated = await sql<{ n: number }>`
      select count(*)::int as n from appointments
      where id = (select appointment_id from shop_quotes where id = ${row.id})
        and coalesce(is_simulated, false) = true
    `.catch(() => [{ n: 0 }]);
    if (Number(simulated[0]?.n) > 0) {
      skipped += 1;
      continue;
    }
    const phone = toE164(row.customer_phone) || "";
    if (!phone) {
      skipped += 1;
      continue;
    }
    try {
      const { isSuppressed } = await import("./lifecycle.server");
      if (await isSuppressed("", phone)) {
        skipped += 1;
        continue;
      }
    } catch {
      /* optional */
    }
    const claimed = await sql<{ id: string }>`
      update shop_quotes
      set nudge_sent_at = now()
      where id = ${row.id} and nudge_sent_at is null
      returning id
    `.catch(() => [] as { id: string }[]);
    if (!claimed[0]) {
      skipped += 1;
      continue;
    }
    const shop = await loadShop(row.shop_id);
    if (!shop) {
      skipped += 1;
      continue;
    }
    await smsOut(
      phone,
      quoteNudgeSms({
        customerFirstName: customerFirstName(row.customer_name),
        shopName: row.shop_name,
        amountCents: Number(row.total_cents) || 0,
        description: row.description,
        origin,
        quoteId: row.id,
      }),
      shop,
      "quote_nudge",
    );
    sent += 1;
  }
  return { sent, skipped, quiet };
}