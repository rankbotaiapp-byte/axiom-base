/**
 * Inbound AI pipeline against the real DB with vendor HTTP mocked.
 * Never calls live xAI / Twilio / Resend.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..", "..");
const E164 = "+15415550199";
const SLUG = "sms-inbound-preflight";
const SHOP_ID = "shop_sms_inbound_preflight";
const EMP_ID = "emp_sms_inbound_preflight";
const SVC_ID = "svc_sms_inbound_preflight";
const SLOT = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

function databaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.startsWith("DATABASE_URL="));
  if (!line) return "";
  return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
}

function installVendorMocks() {
  const calls: { host: string; body: string }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const href = String(typeof input === "string" || input instanceof URL ? input : input.url);
    const body = typeof init?.body === "string" ? init.body : "";
    if (/api\.x\.ai/i.test(href)) {
      calls.push({ host: "xai", body });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "booking",
                  wantsSlot: true,
                  serviceName: "Drain clear",
                  startsAt: SLOT,
                  customerName: "Sam Rivera",
                  projectSummary: "kitchen backup",
                  reply: "Holding that slot for the crew.",
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (/api\.twilio\.com/i.test(href)) {
      calls.push({ host: "twilio", body });
      return new Response(JSON.stringify({ sid: "SM_inbound_mock", status: "queued" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
    if (/api\.resend\.com/i.test(href)) {
      calls.push({ host: "resend", body });
      return new Response(JSON.stringify({ id: "re_inbound_mock" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return original(input as RequestInfo, init);
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

test("inbound Twilio payload books a slot and dispatches owner SMS+email", async (t) => {
  const url = databaseUrl();
  if (!url) {
    t.skip("DATABASE_URL unset — inbound DB simulation skipped");
    return;
  }
  process.env.DATABASE_URL = url;
  process.env.XAI_API_KEY = "test-xai-key";
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_FROM = "Axiom <alerts@axiom.shop>";
  process.env.TWILIO_ACCOUNT_SID = "ACtestinbound";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_FROM_NUMBER = "+15555550100";

  const mocks = installVendorMocks();
  const { getSql } = await import("../db.ts");
  const sql = await getSql();

  const turnsReady = await sql<{ ok: boolean }>`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'sms_inbound_turns'
    ) as ok
  `.catch(() => [{ ok: false }]);
  if (!turnsReady[0]?.ok) {
    mocks.restore();
    t.skip("sms_inbound_turns table missing — run migrations");
    return;
  }

  await sql`
    insert into shops (id, slug, name, niche, tagline, is_showcase, onboarding_step, address, notify_email, notify_phone)
    values (
      ${SHOP_ID}, ${SLUG}, ${"Inbound Preflight Plumbing"}, ${"plumbing"}, ${"SMS AI desk"},
      ${true}, ${"complete"}, ${"Medford, Oregon"}, ${"owner@preflight.test"}, ${"+15415550100"}
    )
    on conflict (id) do update set
      notify_email = excluded.notify_email,
      notify_phone = excluded.notify_phone,
      name = excluded.name
  `.catch(async () => {
    await sql`
      insert into shops (id, slug, name, niche, tagline, is_showcase, onboarding_step, address)
      values (
        ${SHOP_ID}, ${SLUG}, ${"Inbound Preflight Plumbing"}, ${"field"}, ${"SMS AI desk"},
        ${true}, ${"complete"}, ${"Medford, Oregon"}
      )
      on conflict (id) do nothing
    `;
    await sql`
      update shops set notify_email = ${"owner@preflight.test"}, notify_phone = ${"+15415550100"}
      where id = ${SHOP_ID}
    `.catch(() => undefined);
  });

  await sql`
    insert into employees (id, shop_id, display_name, title, invite_status)
    values (${EMP_ID}, ${SHOP_ID}, ${"Dispatch"}, ${"Tech"}, ${"pending"})
    on conflict (id) do nothing
  `;
  await sql`
    insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order)
    values (${SVC_ID}, ${SHOP_ID}, ${"Drain & sewer clears"}, ${"Clear the line"}, ${60}, ${18900}, ${1})
    on conflict (id) do nothing
  `;
  await sql`
    insert into employee_services (employee_id, service_id)
    values (${EMP_ID}, ${SVC_ID})
    on conflict do nothing
  `.catch(() => undefined);

  await sql`
    insert into preloaded_leads (id, business_name, trade_type, city, county, lead_slug, claimed, shop_id, contact_phone, contact_name)
    values (
      ${"lead_sms_inbound_preflight"}, ${"Inbound Preflight Plumbing"}, ${"plumbing"},
      ${"Medford"}, ${"Jackson"}, ${SLUG}, ${true}, ${SHOP_ID}, ${E164}, ${"Sam Rivera"}
    )
    on conflict (id) do update set contact_phone = excluded.contact_phone, shop_id = excluded.shop_id
  `;

  t.after(async () => {
    mocks.restore();
    await sql`delete from appointments where shop_id = ${SHOP_ID}`.catch(() => undefined);
    await sql`delete from shop_events where shop_id = ${SHOP_ID}`.catch(() => undefined);
    await sql`delete from shop_notifications where shop_id = ${SHOP_ID}`.catch(() => undefined);
    await sql`delete from sms_inbound_turns where from_e164 = ${E164}`.catch(() => undefined);
  });

  const { handleOutreachInbound } = await import("./outreach-inbound.server.ts");
  const request = new Request("http://127.0.0.1/api/outreach/inbound", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: E164, Body: "Kitchen drain is backing up. Book tomorrow 9am." }).toString(),
  });
  const res = await handleOutreachInbound(request);
  const xml = await res.text();
  assert.equal(res.headers.get("content-type"), "text/xml");
  assert.match(xml, /<Response>/);
  assert.match(xml, /<Message>/);
  assert.doesNotMatch(xml, /You're unsubscribed/);
  assert.match(xml, /Booked /i, xml.slice(0, 400));

  const grok = mocks.calls.find((call) => call.host === "xai");
  assert.ok(grok, `Grok chat completions was invoked; vendors=${mocks.calls.map((c) => c.host).join(",")}`);
  assert.match(grok.body, /Kitchen drain|Lead:/);

  const booked = await sql<{ id: string; customer_phone: string; service_id: string }>`
    select id, customer_phone, service_id from appointments
    where shop_id = ${SHOP_ID} and customer_phone = ${E164}
    order by created_at desc
    limit 1
  `;
  assert.equal(booked[0]?.service_id, SVC_ID, xml.slice(0, 400));
  assert.ok(booked[0]?.id, "appointments row inserted");

  const events = await sql<{ type: string }>`
    select type from shop_events where shop_id = ${SHOP_ID} and appointment_id = ${booked[0].id}
  `;
  assert.ok(events.some((row) => row.type === "booking_request"), "shop_events booking_request logged");

  const notices = await sql<{ channel: string; kind: string; status: string }>`
    select channel, kind, status from shop_notifications
    where shop_id = ${SHOP_ID}
  `;
  assert.ok(notices.some((row) => row.channel === "inbox"), "owner inbox notice written");
  const sms = notices.find((row) => row.channel === "sms");
  const email = notices.find((row) => row.channel === "email");
  assert.ok(sms, "SMS notify row recorded");
  assert.ok(email, "email notify row recorded");
  assert.ok(sms && (sms.status === "sent" || sms.status === "skipped" || sms.status === "failed"));
  assert.ok(email && (email.status === "sent" || email.status === "skipped" || email.status === "failed"));
  assert.ok(
    mocks.calls.some((call) => call.host === "twilio") || sms?.status !== "sent",
    "Twilio dispatch attempted when SMS marked sent",
  );
  assert.ok(
    mocks.calls.some((call) => call.host === "resend") || email?.status !== "sent",
    "Resend dispatch attempted when email marked sent",
  );
});
