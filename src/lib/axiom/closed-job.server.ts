import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { shopCity } from "./avatar";
import { applyAxiomBrandStamp } from "./brand-stamp.server.ts";
import { lastMmsIsFresh, parseLastMmsUpload } from "./owner-mms.ts";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate";
import { toE164 } from "./notify-target";
import { nationalDigits } from "./axiom-business-number";
import { resolvePublicAppOrigin } from "./public-app-url";
import { sanitizeGoogleReviewUrl } from "./google-review-request.ts";
import { appendMessagingNotice } from "./legal-notices";
import {
  autoReviewSms,
  customerQuoteSms,
  customerReceiptSms,
  isOwnerPublishReply,
  matchCustomerPhone,
  missedCallSlotSms,
  missedCallStatuses,
  ownerPaidSms,
  ownerProofPromptSms,
  ownerSlotAlertSms,
  parsePaidCommand,
  parseQuoteCommand,
  parseSlotReply,
  quoteDepositCents,
  reviewSendAt,
  formatNetRoiDigest,
} from "./closed-job.ts";
import {
  nextOpenArrivalWindows,
  parseAvailabilityJson,
  parseShopHoursJson,
  type ArrivalWindow,
} from "./slot-windows.ts";
import { persistConversation, sendSms } from "./twilio-booking.server";
import { resolveChaChingMetrics } from "./cha-ching.server";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  hours_json: string | null;
  notify_phone: string | null;
  notification_phone: string | null;
  owner_phone: string | null;
  google_review_url: string | null;
  phone: string | null;
  address: string | null;
  last_mms_upload: unknown;
  license_number: string | null;
  ad_tagline: string | null;
  tagline: string | null;
};

async function loadShop(shopId: string): Promise<ShopRow | null> {
  const sql = await getSql();
  try {
    const rows = await sql<ShopRow>`
      select id, slug, name, hours_json, notify_phone, notification_phone, owner_phone,
             google_review_url, phone, address, last_mms_upload, license_number, ad_tagline, tagline
      from shops where id = ${shopId} limit 1
    `;
    return rows[0] ?? null;
  } catch {
    const rows = await sql<ShopRow>`
      select id, slug, name, hours_json, notify_phone, notification_phone, phone, address
      from shops where id = ${shopId} limit 1
    `.catch(() => [] as ShopRow[]);
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      owner_phone: row.notify_phone,
      google_review_url: "",
      last_mms_upload: null,
      license_number: "",
      ad_tagline: "",
      tagline: "",
    };
  }
}

export async function computeShopArrivalWindows(shopId: string, now = new Date()): Promise<ArrivalWindow[]> {
  const sql = await getSql();
  const shop = await loadShop(shopId);
  if (!shop) return [];
  const staff = await sql<{ id: string; availability_json: string | null }>`
    select id, availability_json from employees where shop_id = ${shopId} order by created_at asc
  `.catch(() => [] as { id: string; availability_json: string | null }[]);
  const services = await sql<{ duration_min: number }>`
    select duration_min from services where shop_id = ${shopId} order by sort_order asc, created_at asc limit 1
  `.catch(() => [] as { duration_min: number }[]);
  const busy = await sql<{ employee_id: string; starts_at: string }>`
    select employee_id, starts_at::text as starts_at
    from appointments
    where shop_id = ${shopId}
      and status in ('pending', 'confirmed')
      and starts_at > now() - interval '2 hours'
  `.catch(() => [] as { employee_id: string; starts_at: string }[]);
  return nextOpenArrivalWindows({
    now,
    hours: parseShopHoursJson(shop.hours_json),
    staff: staff.map((row) => ({ id: row.id, availability: parseAvailabilityJson(row.availability_json) })),
    busy: busy.map((row) => ({ employeeId: row.employee_id, startsAt: row.starts_at })),
    serviceDurationMin: Number(services[0]?.duration_min) || 120,
    count: 2,
  });
}

async function ownerPhones(shop: ShopRow): Promise<string[]> {
  return [shop.owner_phone, shop.notify_phone, shop.notification_phone].filter(Boolean) as string[];
}

async function smsOut(to: string, body: string, shop: ShopRow, kind: string) {
  const text = appendMessagingNotice(body, "sms");
  const sent = await sendSms(to, text);
  await persistConversation({
    shopId: shop.id,
    channel: "sms",
    direction: "outbound",
    fromPhone: "",
    toPhone: to,
    body: text,
    status: sent.ok ? "sent" : "failed",
    providerRef: sent.sid,
    kind,
  });
  return sent;
}

export async function offerMissedCallSlots(input: {
  shopId: string;
  customerPhone: string;
  origin?: string;
}): Promise<{ ok: boolean; body: string; windows: ArrivalWindow[] }> {
  const shop = await loadShop(input.shopId);
  if (!shop) return { ok: false, body: "", windows: [] };
  const windows = await computeShopArrivalWindows(shop.id);
  const origin = input.origin || resolvePublicAppOrigin() || "https://rankbotapp.com";
  const body = missedCallSlotSms({
    shopName: shop.name,
    shopSlug: shop.slug,
    origin,
    windows,
  });
  const sql = await getSql();
  const id = newId("slot");
  const w1 = windows[0];
  const w2 = windows[1];
  await sql`
    insert into missed_call_slot_offers (
      id, shop_id, customer_phone,
      window1_start, window1_end, window1_label, window1_employee_id,
      window2_start, window2_end, window2_label, window2_employee_id
    ) values (
      ${id}, ${shop.id}, ${toE164(input.customerPhone) || input.customerPhone},
      ${w1?.startsAt ?? null}, ${w1?.endsAt ?? null}, ${w1?.label ?? ""}, ${w1?.employeeId ?? null},
      ${w2?.startsAt ?? null}, ${w2?.endsAt ?? null}, ${w2?.label ?? ""}, ${w2?.employeeId ?? null}
    )
  `.catch(() => undefined);
  await smsOut(input.customerPhone, body, shop, "missed_call_slots");
  return { ok: true, body, windows };
}

async function ensureStaffAndService(shopId: string): Promise<{ employeeId: string; serviceId: string } | null> {
  const sql = await getSql();
  const emp = await sql<{ id: string }>`
    select id from employees where shop_id = ${shopId} order by created_at asc limit 1
  `.catch(() => [] as { id: string }[]);
  const svc = await sql<{ id: string }>`
    select id from services where shop_id = ${shopId} order by sort_order asc, created_at asc limit 1
  `.catch(() => [] as { id: string }[]);
  let employeeId = emp[0]?.id;
  let serviceId = svc[0]?.id;
  if (!employeeId) {
    employeeId = newId("emp");
    await sql`
      insert into employees (id, shop_id, display_name, title)
      values (${employeeId}, ${shopId}, ${"Owner"}, ${"Owner"})
    `.catch(() => {
      employeeId = "";
    });
  }
  if (!serviceId) {
    serviceId = newId("svc");
    await sql`
      insert into services (id, shop_id, name, duration_min, price_cents)
      values (${serviceId}, ${shopId}, ${"Service call"}, 120, 0)
    `.catch(() => {
      serviceId = "";
    });
  }
  if (!employeeId || !serviceId) return null;
  return { employeeId, serviceId };
}

async function insertAppointmentRequest(input: {
  shopId: string;
  phone: string;
  name: string;
  issue: string;
  windowLabel: string;
  startsAt: string | null;
}) {
  const sql = await getSql();
  const id = newId("areq");
  await sql`
    insert into appointment_requests (
      id, shop_id, caller_name, caller_phone, requested_service, transcript, vapi_call_id, status
    ) values (
      ${id}, ${input.shopId}, ${input.name}, ${input.phone}, ${input.issue.slice(0, 120)},
      ${`${input.issue} · ${input.windowLabel}`.slice(0, 2000)}, ${`sms-${id}`}, ${"booked"}
    )
  `.catch(() => undefined);
}

export async function lockCalendarSlot(input: {
  shop: ShopRow;
  customerPhone: string;
  issue: string;
  startsAt: string;
  employeeId: string;
  windowLabel: string;
  serviceId?: string;
}): Promise<string | null> {
  const desk = await ensureStaffAndService(input.shop.id);
  if (!desk) return null;
  const sql = await getSql();
  const id = newId("apt");
  const name = input.customerPhone.slice(-4);
  const serviceId = input.serviceId || desk.serviceId;
  try {
    await sql`
      insert into appointments (
        id, shop_id, employee_id, service_id, customer_name, customer_phone,
        starts_at, status, payment_status, payment_cents, is_simulated
      ) values (
        ${id}, ${input.shop.id}, ${input.employeeId || desk.employeeId}, ${serviceId},
        ${`Caller ${name}`}, ${input.customerPhone},
        ${input.startsAt}, ${"confirmed"}, ${"unpaid"}, 0, false
      )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/is_simulated/.test(message)) {
      await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone,
          starts_at, status, payment_status, payment_cents
        ) values (
          ${id}, ${input.shop.id}, ${input.employeeId || desk.employeeId}, ${serviceId},
          ${`Caller ${name}`}, ${input.customerPhone},
          ${input.startsAt}, ${"confirmed"}, ${"unpaid"}, 0
        )
      `.catch(() => undefined);
    } else if (message.includes("23505")) {
      return null;
    } else {
      console.error("[closed-job] lock slot", message.slice(0, 200));
      return null;
    }
  }
  await insertAppointmentRequest({
    shopId: input.shop.id,
    phone: input.customerPhone,
    name: `Caller ${name}`,
    issue: input.issue,
    windowLabel: input.windowLabel,
    startsAt: input.startsAt,
  });
  return id;
}

export async function handleCustomerSlotReply(input: {
  shopId: string;
  from: string;
  body: string;
}): Promise<{ handled: boolean; reply: string; booked: boolean }> {
  const choice = parseSlotReply(input.body);
  if (!choice) return { handled: false, reply: "", booked: false };
  const shop = await loadShop(input.shopId);
  if (!shop) return { handled: false, reply: "", booked: false };
  if (mmsSenderMayUpdateProof(input.from, await ownerPhones(shop))) {
    return { handled: false, reply: "", booked: false };
  }
  const sql = await getSql();
  const phone = toE164(input.from) || input.from;
  const offers = await sql<{
    id: string;
    window1_start: string | null;
    window1_end: string | null;
    window1_label: string;
    window1_employee_id: string | null;
    window2_start: string | null;
    window2_end: string | null;
    window2_label: string;
    window2_employee_id: string | null;
  }>`
    select id,
           window1_start::text as window1_start, window1_end::text as window1_end, window1_label, window1_employee_id,
           window2_start::text as window2_start, window2_end::text as window2_end, window2_label, window2_employee_id
    from missed_call_slot_offers
    where shop_id = ${shop.id}
      and right(regexp_replace(customer_phone, '\\D', '', 'g'), 10) = ${nationalDigits(phone)}
      and expires_at > now()
      and appointment_id is null
    order by created_at desc
    limit 1
  `.catch(() => []);
  const offer = offers[0];
  if (!offer) {
    if (choice === "issue") return { handled: false, reply: "", booked: false };
    return { handled: false, reply: "", booked: false };
  }
  const pickFirst = choice === 1 || choice === "issue";
  const startsAt = pickFirst ? offer.window1_start : offer.window2_start;
  const label = pickFirst ? offer.window1_label : offer.window2_label;
  const employeeId = (pickFirst ? offer.window1_employee_id : offer.window2_employee_id) || "";
  if (!startsAt || !label) {
    return { handled: true, reply: "That window is no longer open. Reply BOOK for the next two arrival windows.", booked: false };
  }
  const issue = choice === "issue" ? input.body.trim().slice(0, 180) : "Locked SMS window";
  const appointmentId = await lockCalendarSlot({
    shop,
    customerPhone: phone,
    issue,
    startsAt,
    employeeId,
    windowLabel: label,
  });
  if (appointmentId) {
    await sql`
      update missed_call_slot_offers set appointment_id = ${appointmentId} where id = ${offer.id}
    `.catch(() => undefined);
  }
  const owner = shop.notify_phone || shop.notification_phone || shop.owner_phone;
  if (owner) {
    await smsOut(
      owner,
      ownerSlotAlertSms({
        customerName: `Caller ${phone.slice(-4)}`,
        customerPhone: phone,
        issue,
        windowLabel: label,
      }),
      shop,
      "owner_slot_alert",
    );
  }
  return {
    handled: true,
    reply: `${shop.name} locked ${label}. We'll see you then. Reply STOP to cancel.`,
    booked: Boolean(appointmentId),
  };
}

export async function handleOwnerQuoteSms(input: {
  shopId: string;
  from: string;
  body: string;
  origin?: string;
}): Promise<{ handled: boolean; reply: string }> {
  const command = parseQuoteCommand(input.body);
  if (!command) return { handled: false, reply: "" };
  const shop = await loadShop(input.shopId);
  if (!shop) return { handled: false, reply: "" };
  if (!mmsSenderMayUpdateProof(input.from, await ownerPhones(shop))) {
    return { handled: false, reply: "" };
  }
  const sql = await getSql();
  const recent = await sql<{ customer_phone: string; customer_name: string }>`
    select customer_phone, customer_name from appointments
    where shop_id = ${shop.id}
    order by created_at desc
    limit 40
  `.catch(() => [] as { customer_phone: string; customer_name: string }[]);
  const customerPhone =
    matchCustomerPhone(
      command.customerToken,
      recent.map((row) => row.customer_phone),
    ) || toE164(command.customerToken);
  if (!customerPhone) {
    return { handled: true, reply: "Could not match that customer. Use QUOTE 350 5415550148 description." };
  }
  const customerName =
    recent.find((row) => nationalDigits(row.customer_phone) === nationalDigits(customerPhone))?.customer_name ||
    `Customer ${customerPhone.slice(-4)}`;
  const deposit = quoteDepositCents(command.amountCents);
  const quoteId = newId("qte");
  const origin = (input.origin || resolvePublicAppOrigin() || "https://rankbotapp.com").replace(/\/$/, "");
  const quoteUrl = `${origin}/q/${quoteId}`;
  const desk = await ensureStaffAndService(shop.id);
  let appointmentId: string | null = null;
  if (desk) {
    const windows = await computeShopArrivalWindows(shop.id);
    appointmentId = newId("apt");
    await sql`
      insert into appointments (
        id, shop_id, employee_id, service_id, customer_name, customer_phone,
        starts_at, status, payment_status, payment_cents, quote_id, is_simulated
      ) values (
        ${appointmentId}, ${shop.id}, ${desk.employeeId}, ${desk.serviceId},
        ${customerName}, ${customerPhone},
        ${windows[0]?.startsAt ?? new Date(Date.now() + 24 * 3600_000).toISOString()},
        ${"pending"}, ${"unpaid"}, ${deposit}, ${quoteId}, false
      )
    `.catch(async () => {
      await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone,
          starts_at, status, payment_status, payment_cents
        ) values (
          ${appointmentId}, ${shop.id}, ${desk.employeeId}, ${desk.serviceId},
          ${customerName}, ${customerPhone},
          ${windows[0]?.startsAt ?? new Date(Date.now() + 24 * 3600_000).toISOString()},
          ${"pending"}, ${"unpaid"}, ${deposit}
        )
      `.catch(() => {
        appointmentId = null;
      });
    });
  }
  let checkoutUrl = quoteUrl;
  try {
    const { createConnectCheckout } = await import("./payments.server");
    const billing = await sql<{ stripe_account_id: string | null; stripe_charges_enabled: boolean | null }>`
      select stripe_account_id, stripe_charges_enabled from shop_billing where shop_id = ${shop.id} limit 1
    `;
    const destination = billing[0]?.stripe_account_id;
    if (destination && billing[0]?.stripe_charges_enabled && appointmentId) {
      const session = await createConnectCheckout({
        destination,
        amountCents: deposit,
        serviceName: command.description.slice(0, 120),
        shopId: shop.id,
        appointmentId,
        shopSlug: shop.slug,
        successUrl: `${quoteUrl}?paid=1`,
        cancelUrl: `${quoteUrl}?canceled=1`,
      });
      checkoutUrl = session.url;
      await sql`
        update appointments set payment_ref = ${session.id} where id = ${appointmentId}
      `.catch(() => undefined);
      await sql`
        insert into shop_quotes (
          id, shop_id, appointment_id, customer_phone, customer_name, description,
          total_cents, deposit_cents, stripe_session_id, stripe_checkout_url, status, expires_at
        ) values (
          ${quoteId}, ${shop.id}, ${appointmentId}, ${customerPhone}, ${customerName},
          ${command.description}, ${command.amountCents}, ${deposit}, ${session.id}, ${session.url}, ${"pending"},
          ${new Date(Date.now() + 72 * 3600_000).toISOString()}
        )
      `.catch(() => undefined);
    } else {
      await sql`
        insert into shop_quotes (
          id, shop_id, appointment_id, customer_phone, customer_name, description,
          total_cents, deposit_cents, stripe_checkout_url, status, expires_at
        ) values (
          ${quoteId}, ${shop.id}, ${appointmentId}, ${customerPhone}, ${customerName},
          ${command.description}, ${command.amountCents}, ${deposit}, ${""}, ${"pending"},
          ${new Date(Date.now() + 72 * 3600_000).toISOString()}
        )
      `.catch(() => undefined);
    }
  } catch (err) {
    console.error("[closed-job] quote checkout", err instanceof Error ? err.message.slice(0, 200) : err);
    await sql`
      insert into shop_quotes (
        id, shop_id, appointment_id, customer_phone, customer_name, description,
        total_cents, deposit_cents, stripe_checkout_url, status, expires_at
      ) values (
        ${quoteId}, ${shop.id}, ${appointmentId}, ${customerPhone}, ${customerName},
        ${command.description}, ${command.amountCents}, ${deposit}, ${""}, ${"pending"},
        ${new Date(Date.now() + 72 * 3600_000).toISOString()}
      )
    `.catch(() => undefined);
  }
  await smsOut(
    customerPhone,
    customerQuoteSms({
      shopName: shop.name,
      amountCents: command.amountCents,
      description: command.description,
      quoteUrl: checkoutUrl.startsWith("http") ? quoteUrl : quoteUrl,
    }),
    shop,
    "quote_sms",
  );
  return { handled: true, reply: `Quote sent to ${customerPhone} for $${(command.amountCents / 100).toFixed(0)}.` };
}

export async function loadShopQuote(quoteId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    appointment_id: string | null;
    customer_phone: string;
    customer_name: string;
    description: string;
    total_cents: number;
    deposit_cents: number;
    stripe_checkout_url: string;
    status: string;
    shop_name: string;
    shop_slug: string;
    phone: string | null;
  }>`
    select q.id, q.shop_id, q.appointment_id, q.customer_phone, q.customer_name, q.description,
           q.total_cents, q.deposit_cents, q.stripe_checkout_url, q.status,
           s.name as shop_name, s.slug as shop_slug, s.phone
    from shop_quotes q
    join shops s on s.id = q.shop_id
    where q.id = ${quoteId}
    limit 1
  `.catch(() => []);
  return rows[0] ?? null;
}

export async function markQuotePaid(
  sessionId: string,
  paidCents: number,
): Promise<{ appointmentId?: string; shopId?: string; already?: boolean; fullPay: boolean } | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    appointment_id: string | null;
    customer_name: string;
    description: string;
    total_cents: number;
    deposit_cents: number;
    status: string;
  }>`
    select id, shop_id, appointment_id, customer_name, description, total_cents, deposit_cents, status
    from shop_quotes where stripe_session_id = ${sessionId} limit 1
  `.catch(() => []);
  const quote = rows[0];
  if (!quote) return null;
  const full = paidCents >= Number(quote.total_cents);
  if (quote.status === "paid" || quote.status === "deposit_paid") {
    return {
      appointmentId: quote.appointment_id || undefined,
      shopId: quote.shop_id,
      already: true,
      fullPay: quote.status === "paid" || full,
    };
  }
  await sql`
    update shop_quotes set status = ${full ? "paid" : "deposit_paid"} where id = ${quote.id}
  `;
  if (quote.appointment_id) {
    await sql`
      update appointments
      set status = 'confirmed',
          payment_status = ${full ? "paid" : "processing"},
          deposit_paid = true,
          payment_cents = ${paidCents}
      where id = ${quote.appointment_id}
    `.catch(async () => {
      await sql`
        update appointments
        set status = 'confirmed',
            payment_status = ${full ? "paid" : "processing"},
            payment_cents = ${paidCents}
        where id = ${quote.appointment_id}
      `.catch(() => undefined);
    });
  }
  const shop = await loadShop(quote.shop_id);
  if (shop) {
    const owner = shop.notify_phone || shop.notification_phone || shop.owner_phone;
    if (owner) {
      await smsOut(
        owner,
        ownerPaidSms({
          paidAmountCents: paidCents,
          customerName: quote.customer_name,
          description: quote.description,
        }),
        shop,
        "owner_paid",
      );
    }
    if (full && quote.appointment_id) {
      await fireClosedJobAtom({
        shopId: shop.id,
        appointmentId: quote.appointment_id,
        paidCents,
      });
    }
  }
  return { appointmentId: quote.appointment_id || undefined, shopId: quote.shop_id, already: false, fullPay: full };
}

export async function handleOwnerPaidSms(input: {
  shopId: string;
  from: string;
  body: string;
}): Promise<{ handled: boolean; reply: string }> {
  const token = parsePaidCommand(input.body);
  if (!token) return { handled: false, reply: "" };
  const shop = await loadShop(input.shopId);
  if (!shop) return { handled: false, reply: "" };
  if (!mmsSenderMayUpdateProof(input.from, await ownerPhones(shop))) {
    return { handled: false, reply: "" };
  }
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    customer_name: string;
    customer_phone: string;
    payment_cents: number;
    payment_status: string;
  }>`
    select id, customer_name, customer_phone, payment_cents, payment_status
    from appointments
    where shop_id = ${shop.id}
      and payment_status is distinct from 'paid'
      and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = ${nationalDigits(token).slice(-4)}
    order by created_at desc
    limit 1
  `.catch(() => []);
  const row = rows[0];
  if (!row) return { handled: true, reply: "No unpaid job matched that last 4." };
  await sql`
    update appointments set payment_status = 'paid' where id = ${row.id} and shop_id = ${shop.id}
  `;
  await fireClosedJobAtom({
    shopId: shop.id,
    appointmentId: row.id,
    paidCents: Number(row.payment_cents) || 0,
  });
  return { handled: true, reply: `Marked paid for ${row.customer_name || row.customer_phone}. Receipt + review queued.` };
}

export async function fireClosedJobAtom(input: {
  shopId: string;
  appointmentId: string;
  paidCents: number;
}): Promise<{ already: boolean }> {
  const sql = await getSql();
  const claimed = await sql<{ appointment_id: string }>`
    insert into closed_job_atoms (appointment_id, shop_id, paid_cents)
    values (${input.appointmentId}, ${input.shopId}, ${input.paidCents})
    on conflict (appointment_id) do nothing
    returning appointment_id
  `.catch(() => [] as { appointment_id: string }[]);
  if (!claimed[0]) return { already: true };

  const shop = await loadShop(input.shopId);
  if (!shop) return { already: false };
  const appt = await sql<{
    customer_phone: string;
    customer_name: string;
    payment_cents: number;
  }>`
    select customer_phone, customer_name, payment_cents from appointments where id = ${input.appointmentId} limit 1
  `.catch(() => []);
  const customerPhone = toE164(appt[0]?.customer_phone || "") || appt[0]?.customer_phone || "";
  const origin = (resolvePublicAppOrigin() || "https://rankbotapp.com").replace(/\/$/, "");
  const receiptUrl = `${origin}/q/receipt/${input.appointmentId}`;

  if (customerPhone) {
    await smsOut(
      customerPhone,
      customerReceiptSms({
        shopName: shop.name,
        receiptUrl,
        shopPhone: shop.phone || shop.notify_phone,
      }),
      shop,
      "paid_receipt",
    );
    await sql`
      update closed_job_atoms set receipt_sent_at = now() where appointment_id = ${input.appointmentId}
    `.catch(() => undefined);
  }

  const reviewUrl = sanitizeGoogleReviewUrl(shop.google_review_url || "");
  if (reviewUrl && customerPhone) {
    const runAt = reviewSendAt(new Date());
    await sql`
      insert into closed_job_queue (id, shop_id, appointment_id, kind, run_at, status, payload)
      values (
        ${newId("cjq")}, ${shop.id}, ${input.appointmentId}, ${"review_sms"}, ${runAt.toISOString()},
        ${"pending"}, ${JSON.stringify({ customerPhone, googleReviewUrl: reviewUrl, shopName: shop.name })}::jsonb
      )
      on conflict do nothing
    `.catch(() => undefined);
    await sql`
      update closed_job_atoms set review_queued_at = now() where appointment_id = ${input.appointmentId}
    `.catch(() => undefined);
  }

  const pointer = parseLastMmsUpload(shop.last_mms_upload);
  if (lastMmsIsFresh(pointer) && pointer) {
    const owner = shop.notify_phone || shop.notification_phone || shop.owner_phone;
    await sql`
      update closed_job_atoms
      set proof_status = 'pending_approval', proof_asset_url = ${pointer.url}
      where appointment_id = ${input.appointmentId}
    `.catch(() => undefined);
    if (owner) {
      await smsOut(owner, ownerProofPromptSms({ amountCents: input.paidCents }), shop, "proof_prompt");
    }
  }
  return { already: false };
}

export async function handleOwnerProofPublishReply(input: {
  shopId: string;
  from: string;
  body: string;
}): Promise<{ handled: boolean; reply: string }> {
  if (!isOwnerPublishReply(input.body)) return { handled: false, reply: "" };
  const shop = await loadShop(input.shopId);
  if (!shop) return { handled: false, reply: "" };
  if (!mmsSenderMayUpdateProof(input.from, await ownerPhones(shop))) {
    return { handled: false, reply: "" };
  }
  const sql = await getSql();
  const pending = await sql<{ appointment_id: string; proof_asset_url: string }>`
    select appointment_id, proof_asset_url from closed_job_atoms
    where shop_id = ${shop.id} and proof_status = 'pending_approval'
    order by created_at desc
    limit 1
  `.catch(() => []);
  const row = pending[0];
  if (!row?.proof_asset_url) return { handled: false, reply: "" };
  try {
    const image = await fetch(row.proof_asset_url, { signal: AbortSignal.timeout(12_000) });
    const bytes = Buffer.from(await image.arrayBuffer());
    const city = shopCity(shop.address || "");
    const ig = await applyAxiomBrandStamp({
      imageBuffer: bytes,
      shop: {
        name: shop.name,
        city,
        phone: shop.phone || shop.notify_phone,
        license_number: shop.license_number,
        ad_tagline: shop.ad_tagline || shop.tagline,
      },
      platform: "instagram",
    });
    await applyAxiomBrandStamp({
      imageBuffer: bytes,
      shop: {
        name: shop.name,
        city,
        phone: shop.phone,
        license_number: shop.license_number,
        ad_tagline: shop.ad_tagline || shop.tagline,
      },
      platform: "google_business",
    });
    const { uploadPreparedWebpToStorage } = await import("./storefront-layout.server");
    const stored = await uploadPreparedWebpToStorage(shop.slug, ig.webp, "proof");
    await sql`
      insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
      values (
        ${newId("soc")}, ${shop.id}, ${stored?.url || row.proof_asset_url},
        ${`${shop.name} — job complete.`},
        ${JSON.stringify(["facebook", "instagram", "gbp"])},
        ${"pending_approval"},
        now()
      )
    `.catch(() => undefined);
  } catch (err) {
    console.error("[closed-job] proof publish", err instanceof Error ? err.message.slice(0, 200) : err);
  }
  await sql`
    update closed_job_atoms set proof_status = 'published' where appointment_id = ${row.appointment_id}
  `.catch(() => undefined);
  return { handled: true, reply: "Proof card queued to GBP & Socials (pending_approval)." };
}

export async function drainClosedJobQueue(limit = 20): Promise<{ sent: number; skipped: number }> {
  const sql = await getSql();
  const due = await sql<{
    id: string;
    shop_id: string;
    appointment_id: string | null;
    kind: string;
    payload: unknown;
  }>`
    select id, shop_id, appointment_id, kind, payload
    from closed_job_queue
    where status = 'pending' and run_at <= now()
    order by run_at asc
    limit ${limit}
  `.catch(() => []);
  let sent = 0;
  let skipped = 0;
  for (const row of due) {
    const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<string, string>;
    if (row.kind === "review_sms") {
      const shop = await loadShop(row.shop_id);
      const url = sanitizeGoogleReviewUrl(payload.googleReviewUrl || shop?.google_review_url || "");
      const phone = payload.customerPhone;
      if (!shop || !url || !phone) {
        await sql`update closed_job_queue set status = 'skipped' where id = ${row.id}`.catch(() => undefined);
        skipped += 1;
        continue;
      }
      await smsOut(phone, autoReviewSms({ shopName: payload.shopName || shop.name, googleReviewUrl: url }), shop, "review_sms");
      await sql`update closed_job_queue set status = 'sent' where id = ${row.id}`.catch(() => undefined);
      if (row.appointment_id) {
        await sql`
          update closed_job_atoms set review_sent_at = now() where appointment_id = ${row.appointment_id}
        `.catch(() => undefined);
      }
      sent += 1;
      continue;
    }
    if (row.kind === "owner_digest") {
      const shop = await loadShop(row.shop_id);
      if (!shop) {
        skipped += 1;
        continue;
      }
      const metrics = await resolveChaChingMetrics(shop.slug);
      const owner = shop.notify_phone || shop.notification_phone || shop.owner_phone;
      if (owner) {
        await smsOut(
          owner,
          formatNetRoiDigest({
            shopName: shop.name,
            verifiedRevenueCents: Math.max(metrics.paidRevenueCents, metrics.pipelineRevenueCents),
            netRoiCents: metrics.netRoiCents,
            subscriptionCostCents: metrics.subscriptionCostCents,
            emptyBook: metrics.emptyBook,
          }),
          shop,
          "owner_roi_digest",
        );
        sent += 1;
      } else skipped += 1;
      await sql`update closed_job_queue set status = 'sent' where id = ${row.id}`.catch(() => undefined);
    }
  }
  return { sent, skipped };
}

export async function enqueueDailyOwnerRoiDigests(): Promise<number> {
  const sql = await getSql();
  const shops = await sql<{ id: string }>`
    select id from shops where coalesce(is_showcase, false) = false limit 200
  `.catch(() => [] as { id: string }[]);
  let n = 0;
  const runAt = new Date();
  for (const shop of shops) {
    const id = newId("cjq");
    const existing = await sql<{ id: string }>`
      select id from closed_job_queue
      where shop_id = ${shop.id} and kind = ${"owner_digest"}
        and created_at > now() - interval '20 hours'
      limit 1
    `.catch(() => []);
    if (existing[0]) continue;
    await sql`
      insert into closed_job_queue (id, shop_id, appointment_id, kind, run_at, status, payload)
      values (${id}, ${shop.id}, null, ${"owner_digest"}, ${runAt.toISOString()}, ${"pending"}, '{}'::jsonb)
    `.catch(() => undefined);
    n += 1;
  }
  return n;
}

export async function handleVoiceMissedOrPress1(input: {
  shopId: string;
  customerPhone: string;
  dialStatus?: string | null;
  digits?: string | null;
}): Promise<boolean> {
  if (input.digits === "1") {
    await offerMissedCallSlots({ shopId: input.shopId, customerPhone: input.customerPhone });
    return true;
  }
  if (input.dialStatus && missedCallStatuses(input.dialStatus)) {
    await offerMissedCallSlots({ shopId: input.shopId, customerPhone: input.customerPhone });
    return true;
  }
  return false;
}

