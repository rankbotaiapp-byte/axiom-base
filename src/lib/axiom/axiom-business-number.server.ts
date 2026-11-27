import "server-only";

import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { toE164 } from "./notify-target";
import { parseOutreachMode } from "./outreach-queue";
import {
  a2pOutboundLive,
  axiomWelcomeSmsBody,
  decideWelcomeSms,
  formatAxiomPhoneDisplay,
  isTwilioAuthError,
  parsePoolList,
  resolveNumberAssignment,
  type AxiomBusinessNumberView,
  type AxiomPhoneStatus,
} from "./axiom-business-number";

type ShopPhoneRow = {
  id: string;
  slug: string;
  name: string;
  axiom_phone_number: string | null;
  axiom_phone_status: string | null;
  axiom_phone_assigned_at: string | null;
  axiom_welcome_sms_at: string | null;
  notify_phone: string | null;
  notification_phone: string | null;
};

function twilioCreds(): { sid: string; token: string } | null {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return null;
  return { sid, token };
}

function asStatus(value: string | null | undefined): AxiomPhoneStatus {
  if (
    value === "assigned" ||
    value === "simulated" ||
    value === "pending_pool" ||
    value === "reserved" ||
    value === "none"
  ) {
    return value;
  }
  return "none";
}

async function seedPoolFromEnv(): Promise<void> {
  const numbers = parsePoolList(env("AXIOM_TWILIO_NUMBER_POOL"));
  if (!numbers.length) return;
  const sql = await getSql();
  for (const e164 of numbers) {
    await sql`
      insert into axiom_phone_pool (e164, status)
      values (${e164}, 'available')
      on conflict (e164) do nothing
    `.catch(() => undefined);
  }
}

async function claimPoolNumber(shopId: string): Promise<string | null> {
  const sql = await getSql();
  try {
    const existing = await sql<{ e164: string }>`
      select e164 from axiom_phone_pool where shop_id = ${shopId} limit 1
    `;
    if (existing[0]?.e164) return existing[0].e164;

    const claimed = await sql<{ e164: string }>`
      update axiom_phone_pool
      set status = 'assigned', shop_id = ${shopId}, assigned_at = now()
      where e164 = (
        select e164 from axiom_phone_pool
        where status = 'available' and shop_id is null
        order by created_at asc
        for update skip locked
        limit 1
      )
      returning e164
    `;
    return claimed[0]?.e164 ?? null;
  } catch {
    return null;
  }
}

async function listUnassignedTwilioNumbers(taken: Set<string>): Promise<string | null> {
  const creds = twilioCreds();
  if (!creds) return null;
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/IncomingPhoneNumbers.json?PageSize=50`,
    {
      headers: { Authorization: `Basic ${Buffer.from(`${creds.sid}:${creds.token}`).toString("base64")}` },
      signal: AbortSignal.timeout(10_000),
    },
  ).catch(() => null);
  if (!res?.ok) return null;
  const json = (await res.json().catch(() => ({}))) as {
    incoming_phone_numbers?: { phone_number?: string }[];
  };
  for (const row of json.incoming_phone_numbers ?? []) {
    const e164 = toE164(row.phone_number || "");
    if (e164 && !taken.has(e164)) return e164;
  }
  return null;
}

async function persistAssignment(
  shopId: string,
  slug: string,
  e164: string,
  status: AxiomPhoneStatus,
): Promise<void> {
  const sql = await getSql();
  await sql`
    update shops
    set axiom_phone_number = case when axiom_phone_number = '' then ${e164} else axiom_phone_number end,
        axiom_phone_status = case when axiom_phone_number = '' then ${status} else axiom_phone_status end,
        axiom_phone_assigned_at = coalesce(axiom_phone_assigned_at, now())
    where id = ${shopId}
  `.catch(() => undefined);
  await sql`
    insert into shop_billing (shop_id, twilio_number, axiom_phone_status, axiom_phone_assigned_at, updated_at)
    values (${shopId}, ${e164}, ${status}, now(), now())
    on conflict (shop_id) do update set
      twilio_number = case when shop_billing.twilio_number = '' then excluded.twilio_number else shop_billing.twilio_number end,
      axiom_phone_status = case when shop_billing.twilio_number = '' then excluded.axiom_phone_status else shop_billing.axiom_phone_status end,
      axiom_phone_assigned_at = coalesce(shop_billing.axiom_phone_assigned_at, excluded.axiom_phone_assigned_at),
      updated_at = now()
  `.catch(() => undefined);

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      axiom_phone_number: e164,
      axiom_phone_status: status,
      axiom_phone_assigned_at: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

async function takenNumbers(): Promise<Set<string>> {
  const sql = await getSql();
  try {
    const rows = await sql<{ axiom_phone_number: string }>`
      select axiom_phone_number from shops where axiom_phone_number <> ''
    `;
    return new Set(rows.map((row) => row.axiom_phone_number));
  } catch {
    return new Set();
  }
}

export async function readAxiomBusinessNumber(slug: string): Promise<AxiomBusinessNumberView | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  try {
    const sql = await getSql();
    const rows = await sql<ShopPhoneRow>`
      select
        s.id, s.slug, s.name,
        s.axiom_phone_number, s.axiom_phone_status, s.axiom_phone_assigned_at, s.axiom_welcome_sms_at,
        s.notify_phone, s.notification_phone
      from shops s
      where s.slug = ${key}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const e164 = row.axiom_phone_number || "";
    return {
      slug: row.slug,
      businessName: row.name,
      e164,
      display: formatAxiomPhoneDisplay(e164),
      status: asStatus(row.axiom_phone_status) || (e164 ? "assigned" : "none"),
      assignedAt: row.axiom_phone_assigned_at,
      welcomeSms: row.axiom_welcome_sms_at ? "sent" : "none",
    };
  } catch {
    return null;
  }
}

export async function assignAxiomBusinessNumber(input: {
  shopId: string;
  slug: string;
  businessName?: string;
}): Promise<AxiomBusinessNumberView> {
  await seedPoolFromEnv();
  const sql = await getSql();
  const existing = await sql<ShopPhoneRow>`
    select
      s.id, s.slug, s.name,
      s.axiom_phone_number, s.axiom_phone_status, s.axiom_phone_assigned_at, s.axiom_welcome_sms_at,
      s.notify_phone, s.notification_phone
    from shops s
    where s.id = ${input.shopId}
    limit 1
  `.catch(() => [] as ShopPhoneRow[]);
  const row = existing[0];
  const live = a2pOutboundLive(parseOutreachMode(env("OUTREACH_MODE")), env("TWILIO_A2P_LIVE"));
  const poolE164 = row?.axiom_phone_number ? null : await claimPoolNumber(input.shopId);
  let inventoryE164: string | null = null;
  if (!row?.axiom_phone_number && !poolE164) {
    const taken = await takenNumbers();
    inventoryE164 = await listUnassignedTwilioNumbers(taken);
    if (inventoryE164) {
      await sql`
        insert into axiom_phone_pool (e164, status, shop_id, assigned_at)
        values (${inventoryE164}, 'assigned', ${input.shopId}, now())
        on conflict (e164) do update set
          shop_id = coalesce(axiom_phone_pool.shop_id, excluded.shop_id),
          status = 'assigned',
          assigned_at = coalesce(axiom_phone_pool.assigned_at, now())
      `.catch(() => undefined);
    }
  }
  const picked = resolveNumberAssignment({
    existingE164: row?.axiom_phone_number,
    poolE164,
    inventoryE164,
    fallbackE164: env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER") || "",
    liveA2P: live,
  });
  const e164 = picked.e164;
  const status = picked.reused ? asStatus(row?.axiom_phone_status) || picked.status : picked.status;

  if (e164 && !picked.reused) await persistAssignment(input.shopId, input.slug, e164, status);

  return {
    slug: input.slug,
    businessName: row?.name || input.businessName || "Shop",
    e164,
    display: formatAxiomPhoneDisplay(e164),
    status,
    assignedAt: new Date().toISOString(),
    welcomeSms: "pending",
  };
}

async function sendFromNumber(
  from: string,
  to: string,
  body: string,
): Promise<{ ok: boolean; sid?: string; detail: string; authFailed?: boolean }> {
  const creds = twilioCreds();
  if (!creds) return { ok: false, detail: "Twilio is not configured" };
  const dest = toE164(to);
  const origin = toE164(from);
  if (!dest || !origin) return { ok: false, detail: "Invalid destination phone" };
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.sid}:${creds.token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: dest, From: origin, Body: body.slice(0, 1500) }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  const json = (res ? await res.json().catch(() => ({})) : {}) as {
    sid?: string;
    message?: string;
    code?: number;
    status?: number;
  };
  if (isTwilioAuthError(json) || res?.status === 401) {
    return { ok: false, detail: json.message || "Twilio 20003", authFailed: true };
  }
  if (!res?.ok) return { ok: false, detail: json.message || "Twilio rejected SMS" };
  return { ok: true, sid: json.sid, detail: "sent" };
}

export async function sendAxiomWelcomeSms(input: {
  shopId: string;
  slug: string;
  businessName: string;
  ownerPhone?: string;
  e164: string;
}): Promise<AxiomBusinessNumberView["welcomeSms"]> {
  const sql = await getSql();
  const shop = await sql<ShopPhoneRow>`
    select
      s.id, s.slug, s.name,
      s.axiom_phone_number, s.axiom_phone_status, s.axiom_phone_assigned_at, s.axiom_welcome_sms_at,
      s.notify_phone, s.notification_phone
    from shops s
    where s.id = ${input.shopId}
    limit 1
  `.catch(() => [] as ShopPhoneRow[]);
  const row = shop[0];
  if (row?.axiom_welcome_sms_at) return "sent";

  const owner = toE164(input.ownerPhone || row?.notification_phone || row?.notify_phone || "");
  let suppressed = false;
  try {
    const { isSuppressed } = await import("./lifecycle.server");
    suppressed = owner ? await isSuppressed("", owner) : false;
  } catch {
    /* table may be missing */
  }
  const live = a2pOutboundLive(parseOutreachMode(env("OUTREACH_MODE")), env("TWILIO_A2P_LIVE"));
  const decision = decideWelcomeSms({
    alreadySent: Boolean(row?.axiom_welcome_sms_at),
    ownerE164: owner,
    fromE164: input.e164,
    suppressed,
    liveA2P: live,
  });
  if (decision === "already") return "sent";
  if (decision === "skipped") return "skipped";
  if (decision === "suppressed") return "suppressed";
  const body = axiomWelcomeSmsBody({ businessName: input.businessName, e164: input.e164 });
  if (decision === "simulated") {
    console.info("[axiom-number] welcome SMS simulated", {
      slug: input.slug,
      to: (owner || "").slice(-4),
      from: input.e164.slice(-4),
    });
    await sql`
      update shops set axiom_welcome_sms_at = now() where id = ${input.shopId} and axiom_welcome_sms_at is null
    `.catch(() => undefined);
    return "simulated";
  }

  if (!owner) return "skipped";
  const sent = await sendFromNumber(input.e164, owner, body);
  if (sent.authFailed) {
    console.error("[axiom-number] Twilio 20003 — welcome SMS not sent");
    return "auth_failed";
  }
  if (!sent.ok) {
    console.error("[axiom-number] welcome SMS failed", sent.detail.slice(0, 160));
    return "skipped";
  }
  await sql`
    update shops set axiom_welcome_sms_at = now() where id = ${input.shopId} and axiom_welcome_sms_at is null
  `.catch(() => undefined);
  return "sent";
}

export async function provisionAxiomNumberAfterUnlock(input: {
  shopId: string;
  slug: string;
  businessName: string;
  ownerPhone?: string;
}): Promise<AxiomBusinessNumberView> {
  const assigned = await assignAxiomBusinessNumber(input);
  const welcomeSms = assigned.e164
    ? await sendAxiomWelcomeSms({
        shopId: input.shopId,
        slug: input.slug,
        businessName: input.businessName || assigned.businessName,
        ownerPhone: input.ownerPhone,
        e164: assigned.e164,
      })
    : "skipped";
  return { ...assigned, welcomeSms };
}
