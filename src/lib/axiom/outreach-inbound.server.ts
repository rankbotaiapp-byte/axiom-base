import { getSql } from "../db.ts";
import { newId } from "../utils.ts";
import { haltLeadDrip } from "./funnel-guard.server";
import { finalizeOutreachBody, isMessagingOptOut, OPT_OUT_CONFIRMATION } from "./legal-notices";
import { toE164 } from "./notify-target";
import { shouldPauseSmsDrip, smsDripHaltReason } from "./sms-drip";
import {
  emptySmsDecision,
  heuristicSmsDecision,
  parseGrokSmsJson,
  roundUpHalfHourIso,
  matchServiceName,
  twimlResponse,
  type SmsInboundDecision,
} from "./sms-inbound";

type Sql = Awaited<ReturnType<typeof getSql>>;

type ResolvedLead = {
  leadSlug: string;
  contactName: string;
  businessName: string;
  shopId: string;
  shopSlug: string;
  shopName: string;
};

type BookableDesk = {
  employeeId: string;
  employeeName: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
};

function formValue(body: URLSearchParams, key: string): string {
  return (body.get(key) ?? "").trim();
}

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

async function resolveLead(sql: Sql, e164: string): Promise<ResolvedLead | null> {
  const digits = digitsOf(e164);
  if (digits.length < 10) return null;
  const leads = await sql<{
    lead_slug: string;
    business_name: string;
    contact_name: string | null;
    shop_id: string | null;
    shop_slug: string | null;
    shop_name: string | null;
    resolved_id: string | null;
  }>`
    select
      l.lead_slug,
      l.business_name,
      coalesce(nullif(l.contact_name, ''), l.business_name) as contact_name,
      l.shop_id,
      s.slug as shop_slug,
      s.name as shop_name,
      s.id as resolved_id
    from preloaded_leads l
    left join shops s on s.id = l.shop_id or s.slug = l.lead_slug
    where regexp_replace(coalesce(l.contact_phone, ''), '\\D', '', 'g') = ${digits}
      and l.lead_slug <> ''
    limit 1
  `.catch(() => [] as never[]);
  const row = leads[0];
  if (row?.resolved_id && row.shop_slug) {
    return {
      leadSlug: row.lead_slug,
      contactName: row.contact_name || row.business_name || "Guest",
      businessName: row.business_name,
      shopId: row.resolved_id,
      shopSlug: row.shop_slug,
      shopName: row.shop_name || row.business_name,
    };
  }
  const shops = await sql<{ id: string; slug: string; name: string }>`
    select id, slug, name from shops
    where regexp_replace(coalesce(notify_phone, ''), '\\D', '', 'g') = ${digits}
    limit 1
  `.catch(() => [] as { id: string; slug: string; name: string }[]);
  const shop = shops[0];
  if (!shop) return row?.lead_slug
    ? {
        leadSlug: row.lead_slug,
        contactName: row.contact_name || row.business_name || "Guest",
        businessName: row.business_name,
        shopId: "",
        shopSlug: "",
        shopName: row.business_name,
      }
    : null;
  return {
    leadSlug: shop.slug,
    contactName: shop.name,
    businessName: shop.name,
    shopId: shop.id,
    shopSlug: shop.slug,
    shopName: shop.name,
  };
}

async function loadTurns(sql: Sql, from: string): Promise<{ role: "user" | "assistant"; body: string }[]> {
  const rows = await sql<{ role: "user" | "assistant"; body: string }>`
    select role, body from sms_inbound_turns
    where from_e164 = ${from}
    order by created_at desc
    limit 12
  `.catch(() => [] as { role: "user" | "assistant"; body: string }[]);
  return rows.reverse();
}

async function saveTurn(
  sql: Sql,
  input: { from: string; leadSlug: string; shopId: string; role: "user" | "assistant"; body: string },
) {
  await sql`
    insert into sms_inbound_turns (id, from_e164, lead_slug, shop_id, role, body)
    values (
      ${newId("sms")}, ${input.from}, ${input.leadSlug}, ${input.shopId || null}, ${input.role}, ${input.body.slice(0, 2000)}
    )
  `.catch(() => undefined);
}

async function loadDesk(sql: Sql, shopId: string, wantedService: string): Promise<BookableDesk | null> {
  const catalog = await sql<{ id: string; name: string; price_cents: number }>`
    select id, name, price_cents from services
    where shop_id = ${shopId}
    order by sort_order, name
    limit 12
  `.catch(() => [] as { id: string; name: string; price_cents: number }[]);
  const service = matchServiceName(catalog, wantedService);
  if (!service) return null;
  const staff = await sql<{ id: string; display_name: string }>`
    select e.id, e.display_name
    from employees e
    join employee_services es on es.employee_id = e.id
    where e.shop_id = ${shopId} and es.service_id = ${service.id}
    order by e.created_at
    limit 1
  `.catch(() => [] as { id: string; display_name: string }[]);
  if (!staff[0]) {
    const any = await sql<{ id: string; display_name: string }>`
      select id, display_name from employees where shop_id = ${shopId} order by created_at limit 1
    `.catch(() => [] as { id: string; display_name: string }[]);
    if (!any[0]) return null;
    return {
      employeeId: any[0].id,
      employeeName: any[0].display_name,
      serviceId: service.id,
      serviceName: service.name,
      priceCents: Number(service.price_cents) || 0,
    };
  }
  return {
    employeeId: staff[0].id,
    employeeName: staff[0].display_name,
    serviceId: service.id,
    serviceName: service.name,
    priceCents: Number(service.price_cents) || 0,
  };
}

async function classifyWithGrok(
  inbound: string,
  history: { role: "user" | "assistant"; body: string }[],
  shopName: string,
  services: string[],
): Promise<SmsInboundDecision> {
  const fallback = heuristicSmsDecision(inbound);
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return fallback;
  const transcript = history
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? "Lead" : "Axiom"}: ${turn.body.slice(0, 280)}`)
    .join("\n");
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You qualify inbound SMS for a local trade shop and book jobs. Return JSON only with keys: intent (booking|qualify|question|other), wantsSlot (bool), serviceName, startsAt (ISO 8601 or empty), customerName, projectSummary, reply (one SMS, no markdown, no prices you invent). If they name a time, set wantsSlot true and startsAt. If they say ASAP/today without a clock, leave startsAt empty. Never collect card numbers.",
          },
          {
            role: "user",
            content: `Shop: ${shopName}\nServices: ${services.slice(0, 8).join("; ") || "emergency plumbing"}\nThread:\n${transcript || "(new)"}\nLatest: ${inbound.slice(0, 600)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseGrokSmsJson(body.choices?.[0]?.message?.content ?? "", fallback);
  } catch {
    return fallback;
  }
}

async function bookFromSms(
  sql: Sql,
  input: {
    shopId: string;
    shopName: string;
    desk: BookableDesk;
    guestName: string;
    guestPhone: string;
    startsAt: string;
    summary: string;
  },
): Promise<{ ok: true; when: string } | { ok: false; reason: "taken" | "failed" }> {
  const clash = await sql<{ id: string }>`
    select id from appointments
    where employee_id = ${input.desk.employeeId}
      and starts_at = ${input.startsAt}
      and status in ('pending', 'confirmed')
    limit 1
  `.catch(() => [] as { id: string }[]);
  if (clash[0]) return { ok: false, reason: "taken" };

  const id = newId("apt");
  try {
    await sql`
      insert into appointments (
        id, shop_id, employee_id, service_id, customer_name, customer_phone, customer_email,
        starts_at, status, payment_status, payment_cents
      ) values (
        ${id}, ${input.shopId}, ${input.desk.employeeId}, ${input.desk.serviceId},
        ${input.guestName.slice(0, 80)}, ${input.guestPhone.slice(0, 20)}, ${""},
        ${input.startsAt}, 'pending', 'unpaid', ${input.desk.priceCents}
      )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("23505") || message.includes("appointments_no_double_booking")) {
      return { ok: false, reason: "taken" };
    }
    console.error("sms inbound book failed", message);
    return { ok: false, reason: "failed" };
  }

  await sql`
    insert into shop_events (id, shop_id, type, appointment_id, payload)
    values (
      ${newId("evt")}, ${input.shopId}, 'booking_request', ${id},
      ${`${input.desk.serviceName} · SMS · ${input.summary.slice(0, 120)}`}
    )
  `.catch(() => undefined);

  const { notifyBookingParties } = await import("./notify.server");
  await notifyBookingParties({
    shopId: input.shopId,
    shopName: input.shopName,
    employeeId: input.desk.employeeId,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    guestEmail: "",
    serviceName: input.desk.serviceName,
    employeeName: input.desk.employeeName,
    startsAt: input.startsAt,
    phase: "request",
  });
  return { ok: true, when: input.startsAt };
}

async function notifyFirstReply(shopId: string, name: string, phone: string, body: string) {
  if (!shopId) return;
  const { notifyShop } = await import("./notify.server");
  await notifyShop(shopId, {
    kind: "inquiry",
    subject: `SMS reply · ${name}`,
    body: `${name} (${phone}) wrote: ${body.slice(0, 280)}`,
  }).catch(() => undefined);
}

export async function handleOutreachInbound(request: Request): Promise<Response> {
  const raw = await request.text();
  const params = new URLSearchParams(raw.includes("=") ? raw : "");
  const from = toE164(formValue(params, "From") || formValue(params, "from"));
  const inbound = formValue(params, "Body") || formValue(params, "body");
  if (!from) return twimlResponse();

  const sql = await getSql();
  const lead = await resolveLead(sql, from);
  const slugs = lead?.leadSlug ? [lead.leadSlug] : [];
  if (!lead) {
    const digits = digitsOf(from);
    const rows = await sql<{ lead_slug: string }>`
      select lead_slug from preloaded_leads
      where regexp_replace(coalesce(contact_phone, ''), '\\D', '', 'g') = ${digits}
        and lead_slug <> ''
      limit 8
    `.catch(() => [] as { lead_slug: string }[]);
    slugs.push(...rows.map((row) => row.lead_slug));
  }

  const pauseEvent = isMessagingOptOut(inbound) ? "opt_out" : "reply";
  if (shouldPauseSmsDrip(pauseEvent)) {
    const reason = smsDripHaltReason(pauseEvent);
    for (const slug of [...new Set(slugs)]) await haltLeadDrip(sql, slug, reason);
  }

  if (isMessagingOptOut(inbound)) return twimlResponse(OPT_OUT_CONFIRMATION);

  const history = await loadTurns(sql, from);
  const isFirst = history.length === 0;
  await saveTurn(sql, {
    from,
    leadSlug: lead?.leadSlug ?? "",
    shopId: lead?.shopId ?? "",
    role: "user",
    body: inbound || "(empty)",
  });

  if (isFirst && lead?.shopId) {
    await notifyFirstReply(lead.shopId, lead.contactName, from, inbound);
  }

  const deskCatalog = lead?.shopId
    ? await sql<{ name: string }>`select name from services where shop_id = ${lead.shopId} order by sort_order limit 8`.catch(
        () => [] as { name: string }[],
      )
    : [];
  const decision = await classifyWithGrok(
    inbound,
    [...history, { role: "user", body: inbound }],
    lead?.shopName || "the shop",
    deskCatalog.map((row) => row.name),
  );

  let reply = decision.reply || emptySmsDecision().reply;
  let booked = false;

  if (lead?.shopId && decision.wantsSlot) {
    const desk = await loadDesk(sql, lead.shopId, decision.serviceName);
    const startsAt =
      decision.startsAt || (/\b(asap|today|right now)\b/i.test(inbound) ? roundUpHalfHourIso() : null);
    if (desk && startsAt) {
      const guestName = (decision.customerName || lead.contactName || "SMS guest").slice(0, 80);
      const result = await bookFromSms(sql, {
        shopId: lead.shopId,
        shopName: lead.shopName,
        desk,
        guestName: guestName.length >= 2 ? guestName : "SMS guest",
        guestPhone: from,
        startsAt,
        summary: decision.projectSummary || inbound,
      });
      if (result.ok) {
        booked = true;
        const when = new Date(result.when).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        reply = `Booked ${desk.serviceName} for ${when}. The shop just got your name and this number.`;
        await haltLeadDrip(sql, lead.leadSlug, "booked").catch(() => 0);
      } else if (result.reason === "taken") {
        reply = "That time just filled. Reply with another day and time and I will lock it.";
      }
    } else if (decision.wantsSlot && !startsAt) {
      reply =
        decision.reply ||
        "I can book the crew. Reply with a day and time, like tomorrow 9am, plus the job (leak, drain, heater).";
    }
  }

  const outbound = finalizeOutreachBody(reply, "sms");
  await saveTurn(sql, {
    from,
    leadSlug: lead?.leadSlug ?? "",
    shopId: lead?.shopId ?? "",
    role: "assistant",
    body: outbound,
  });
  void booked;
  return twimlResponse(outbound);
}
