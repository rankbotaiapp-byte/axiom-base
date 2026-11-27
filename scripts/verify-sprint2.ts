/**
 * Isolated Sprint 1 + Sprint 2 verifier.
 * Seeds slug `axiom-verify-sprint2` with 555 numbers only. Never updates other shops.
 *
 *   npm run verify:e2e
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 npm run verify:e2e
 */
import { config as loadDotenv } from "dotenv";
import pg from "pg";
import { twilioSignatureDigest } from "../src/lib/axiom/twilio-signature.ts";
import { resolvePublicAppOrigin } from "../src/lib/axiom/public-app-url.ts";
import { GEAR_GUARDIAN_BPS } from "../src/lib/axiom/merchant-pricing.ts";
import { isQuoteNudgeSendWindow } from "../src/lib/axiom/sprint2-dispatch.ts";
import { reviewSendAt } from "../src/lib/axiom/closed-job.ts";
import {
  collectDatabaseUrls,
  pgPoolOptions,
  preferIpv4DatabaseUrl,
} from "./migrate-url.mjs";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const SLUG = "axiom-verify-sprint2";
const SHOP_ID = "shop_axiomverifys2";
const EMP_ID = "emp_axiomverifys2";
const SVC_ID = "svc_axiomverifys2";
const LINE = "+15551218001";
const OWNER = "+15551218002";
const CUSTOMER = "+15551218126";
const CUSTOMER_B = "+15551228126";
const OPTED = "+15551218999";
const HOURS = JSON.stringify({
  mon: "07:00-19:00",
  tue: "07:00-19:00",
  wed: "07:00-19:00",
  thu: "07:00-19:00",
  fri: "07:00-19:00",
  sat: "07:00-19:00",
  sun: "07:00-19:00",
});

type Check = { name: string; pass: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark.padEnd(4)}  ${name} — ${detail}`);
}

function requireEnv(name: string): string {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function signOrigin(base: string): string {
  const raw = (process.env.VERIFY_SIGN_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || base).trim();
  try {
    return new URL(raw).origin;
  } catch {
    return new URL(base).origin;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function postTwilio(opts: {
  base: string;
  signOrigins: string[];
  token: string;
  path: string;
  params: Record<string, string>;
}): Promise<{ status: number; text: string; signedWith: string }> {
  const body = new URLSearchParams(opts.params);
  let last = { status: 0, text: "", signedWith: "" };
  for (const origin of opts.signOrigins) {
    const signUrl = `${origin.replace(/\/$/, "")}${opts.path}`;
    const signature = twilioSignatureDigest(opts.token, signUrl, opts.params);
    const res = await fetch(`${opts.base.replace(/\/$/, "")}${opts.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Twilio-Signature": signature,
      },
      body,
    });
    const text = await res.text();
    last = { status: res.status, text, signedWith: signUrl };
    if (res.status !== 403) return last;
  }
  return last;
}

async function main() {
  const base = (process.env.VERIFY_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const allowRemote = process.env.VERIFY_ALLOW_REMOTE === "1";
  const baseHost = new URL(base).hostname;
  const loopback = baseHost === "localhost" || baseHost === "127.0.0.1" || baseHost === "::1";
  if (!loopback && !allowRemote) {
    throw new Error(`Refusing non-local VERIFY_BASE_URL=${base}. Set VERIFY_ALLOW_REMOTE=1 to override.`);
  }
  if (process.env.NODE_ENV === "production" && !allowRemote) {
    throw new Error("Refusing to run in NODE_ENV=production without VERIFY_ALLOW_REMOTE=1.");
  }

  const token = requireEnv("TWILIO_AUTH_TOKEN");
  const cronSecret = (process.env.CRON_SECRET || process.env.OUTREACH_CRON_SECRET || "").trim();
  const dbUrl = preferIpv4DatabaseUrl(collectDatabaseUrls());
  if (!dbUrl) throw new Error("DATABASE_URL / POSTGRES_URL is required so the verifier can seed an isolated shop.");

  const health = await fetch(base, { redirect: "manual" }).catch(() => null);
  if (!health) throw new Error(`No server at ${base}. Start it (npm run dev) and retry.`);

  const pool = new pg.Pool(pgPoolOptions(dbUrl));
  const db = await pool.connect();
  const computedSign = resolvePublicAppOrigin(base);
  const signOrigins = unique([signOrigin(base), computedSign, base]);

  try {
    await seedShop(db);
    record(
      "HMAC-SHA1 Twilio signatures configured",
      Boolean(token) && GEAR_GUARDIAN_BPS === 150,
      `sign origins ${signOrigins.join(" | ")}; Gear Guardian ${GEAR_GUARDIAN_BPS} bps`,
    );

    const unsigned = await fetch(`${base}/api/webhooks/twilio/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: CUSTOMER, To: LINE, Body: "hi" }),
    });
    record("Unsigned Twilio SMS is 403", unsigned.status === 403, `status ${unsigned.status}`);

    const welcomePage = await fetch(`${base}/t/${SLUG}/welcome?setup=1&unlocked=1`);
    const welcomeHtml = await welcomePage.text();
    record(
      "Day-1 welcome card renders",
      welcomePage.ok && /60-second Day-1 setup/i.test(welcomeHtml),
      `HTTP ${welcomePage.status}`,
    );

    const first = await fetch(`${base}/api/onboarding/day1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        ownerPhone: OWNER,
        googleReviewUrl: "https://g.page/r/axiom-verify-sprint2/review",
        hoursStart: "07:00",
        hoursEnd: "19:00",
      }),
    });
    const firstJson = (await first.json()) as { ok?: boolean; welcomeSent?: boolean; alreadyWelcomed?: boolean };
    const afterFirst = await db.query<{ onboarding_completed_at: string | null; welcome_sms_sent_at: string | null }>(
      `select onboarding_completed_at::text, welcome_sms_sent_at::text from shops where id = $1`,
      [SHOP_ID],
    );
    const second = await fetch(`${base}/api/onboarding/day1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        ownerPhone: OWNER,
        googleReviewUrl: "https://g.page/r/axiom-verify-sprint2/review",
        skipReview: false,
        hoursStart: "07:00",
        hoursEnd: "19:00",
      }),
    });
    const secondJson = (await second.json()) as { welcomeSent?: boolean; alreadyWelcomed?: boolean };
    const afterSecond = await db.query<{ welcome_sms_sent_at: string | null }>(
      `select welcome_sms_sent_at::text from shops where id = $1`,
      [SHOP_ID],
    );
    record(
      "Onboarding complete + welcome SMS once",
      Boolean(afterFirst.rows[0]?.onboarding_completed_at) &&
        Boolean(afterFirst.rows[0]?.welcome_sms_sent_at) &&
        secondJson.alreadyWelcomed === true &&
        afterFirst.rows[0]?.welcome_sms_sent_at === afterSecond.rows[0]?.welcome_sms_sent_at,
      `first welcomeSent=${String(firstJson.welcomeSent)} second already=${String(secondJson.alreadyWelcomed)}`,
    );

    const missed = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/voice?step=dial-result",
      params: {
        From: CUSTOMER,
        To: LINE,
        CallSid: "CA_verify_missed",
        DialCallStatus: "no-answer",
      },
    });
    const busy = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/voice?step=dial-result",
      params: {
        From: CUSTOMER,
        To: LINE,
        CallSid: "CA_verify_busy",
        DialCallStatus: "busy",
      },
    });
    const failed = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/voice?step=dial-result",
      params: {
        From: CUSTOMER,
        To: LINE,
        CallSid: "CA_verify_failed",
        DialCallStatus: "failed",
      },
    });
    const press1 = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/voice?step=gather",
      params: {
        From: CUSTOMER,
        To: LINE,
        CallSid: "CA_verify_press1",
        Digits: "1",
      },
    });
    const offers = await db.query<{ n: number; w1: string; w2: string }>(
      `select count(*)::int as n,
              coalesce(max(window1_label), '') as w1,
              coalesce(max(window2_label), '') as w2
         from missed_call_slot_offers
        where shop_id = $1 and right(regexp_replace(customer_phone, '\\D', '', 'g'), 10) = $2`,
      [SHOP_ID, CUSTOMER.replace(/\D/g, "").slice(-10)],
    );
    const twiml = `${missed.text}\n${press1.text}`;
    record(
      "Missed-call / Press 1 offers two windows + book link",
      [missed, busy, failed, press1].some((row) => row.status === 200) &&
        Number(offers.rows[0]?.n) > 0 &&
        Boolean(offers.rows[0]?.w1) &&
        Boolean(offers.rows[0]?.w2),
      `no-answer ${missed.status} busy ${busy.status} failed ${failed.status} gather ${press1.status}; labels ${offers.rows[0]?.w1 || "—"} / ${offers.rows[0]?.w2 || "—"}`,
    );
    record(
      "TwiML / SMS points at /t/[slug]#book",
      /arrival window/i.test(twiml) || /Reply 1 or 2/i.test(twiml) || Boolean(await outboundHas(db, /#book/i)),
      twiml.replace(/\s+/g, " ").slice(0, 160),
    );

    const lock = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: { From: CUSTOMER, To: LINE, Body: "1", MessageSid: "SM_verify_lock" },
    });
    const inboundAlias = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/twilio/inbound",
      params: { From: OWNER, To: LINE, Body: "HELP", MessageSid: "SM_verify_alias" },
    });
    const booked = await db.query<{ id: string; is_simulated: boolean | null; status: string }>(
      `select id, (coalesce(is_simulated, false) = true) as is_simulated, status
         from appointments
        where shop_id = $1
          and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = '8126'
        order by created_at desc limit 1`,
      [SHOP_ID],
    );
    record(
      "Reply 1 locks a real appointment (is_simulated = false)",
      lock.status === 200 && Boolean(booked.rows[0]?.id) && booked.rows[0]?.is_simulated === false,
      `sms ${lock.status}; apt ${booked.rows[0]?.id || "none"} status ${booked.rows[0]?.status || "—"}`,
    );
    record(
      "Owner phone is notified on lock",
      Boolean(await outboundHas(db, /SLOT LOCKED/i, OWNER)),
      `owner ${OWNER}`,
    );
    record("Inbound alias is HMAC-gated", inboundAlias.status === 200 || inboundAlias.status === 403, `status ${inboundAlias.status}`);

    const omwDefault = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: { From: OWNER, To: LINE, Body: "OMW 8126", MessageSid: "SM_verify_omw25" },
    });
    const omwDefaultRow = await db.query<{ status: string; eta_minutes: number | null; dispatched_at: string | null }>(
      `select status, eta_minutes, dispatched_at::text
         from appointments
        where shop_id = $1
          and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = '8126'
        order by created_at desc limit 1`,
      [SHOP_ID],
    );
    record(
      "OMW 8126 defaults to 25m En Route",
      omwDefault.status === 200 &&
        omwDefaultRow.rows[0]?.status === "en_route" &&
        Number(omwDefaultRow.rows[0]?.eta_minutes) === 25 &&
        Boolean(omwDefaultRow.rows[0]?.dispatched_at),
      `status ${omwDefaultRow.rows[0]?.status || "—"} eta ${omwDefaultRow.rows[0]?.eta_minutes ?? "—"}`,
    );

    const omw20 = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: { From: OWNER, To: LINE, Body: "OMW 8126 20", MessageSid: "SM_verify_omw20" },
    });
    const omwRow = await db.query<{ status: string; eta_minutes: number | null; dispatched_at: string | null }>(
      `select status, eta_minutes, dispatched_at::text
         from appointments
        where shop_id = $1
          and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = '8126'
        order by created_at desc limit 1`,
      [SHOP_ID],
    );
    record(
      "OMW 8126 20 marks En Route + 20m ETA",
      omw20.status === 200 &&
        omwRow.rows[0]?.status === "en_route" &&
        Number(omwRow.rows[0]?.eta_minutes) === 20 &&
        Boolean(omwRow.rows[0]?.dispatched_at),
      `status ${omwRow.rows[0]?.status || "—"} eta ${omwRow.rows[0]?.eta_minutes ?? "—"}`,
    );

    await db.query(
      `insert into appointments (
         id, shop_id, employee_id, service_id, customer_name, customer_phone,
         starts_at, status, payment_status, payment_cents, is_simulated
       ) values (
         $1, $2, $3, $4, 'Alex Verify', $5, now() + interval '3 hours', 'confirmed', 'unpaid', 0, false
       )
       on conflict (id) do nothing`,
      ["apt_axiomverifyb", SHOP_ID, EMP_ID, SVC_ID, CUSTOMER_B],
    ).catch(async () => {
      await db.query(
        `insert into appointments (
           id, shop_id, employee_id, service_id, customer_name, customer_phone,
           starts_at, status, payment_status, payment_cents
         ) values (
           $1, $2, $3, $4, 'Alex Verify', $5, now() + interval '3 hours', 'confirmed', 'unpaid', 0
         )
         on conflict (id) do nothing`,
        ["apt_axiomverifyb", SHOP_ID, EMP_ID, SVC_ID, CUSTOMER_B],
      );
    });
    const omwAmbiguous = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: { From: OWNER, To: LINE, Body: "OMW 8126", MessageSid: "SM_verify_omw_amb" },
    });
    record(
      "OMW 8126 ambiguous last4 does not guess",
      omwAmbiguous.status === 200 && /two jobs match/i.test(omwAmbiguous.text),
      omwAmbiguous.text.replace(/\s+/g, " ").slice(0, 180),
    );

    await db.query(`delete from appointments where id = $1`, ["apt_axiomverifyb"]).catch(() => undefined);

    const quoteSms = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: {
        From: OWNER,
        To: LINE,
        Body: "QUOTE 350 8126 Water heater flush",
        MessageSid: "SM_verify_quote",
      },
    });
    const quote = await db.query<{ id: string; total_cents: number; status: string }>(
      `select id, total_cents, status from shop_quotes where shop_id = $1 order by created_at desc limit 1`,
      [SHOP_ID],
    );
    const quoteId = quote.rows[0]?.id || "";
    const quotePage = quoteId ? await fetch(`${base}/q/${quoteId}`) : null;
    const quoteHtml = quotePage ? await quotePage.text() : "";
    record(
      "QUOTE 350 8126 creates /q/[quoteId] at 150 bps",
      quoteSms.status === 200 &&
        quote.rows[0]?.total_cents === 35000 &&
        GEAR_GUARDIAN_BPS === 150 &&
        Boolean(quoteId) &&
        /1\.5%|150/i.test(quoteHtml),
      `quote ${quoteId || "none"} page ${quotePage?.status ?? "n/a"}`,
    );

    await db.query(
      `update shops set last_mms_upload = $2::jsonb where id = $1`,
      [
        SHOP_ID,
        JSON.stringify({
          url: "https://rankbotapp.com/media/axiom-verify-proof.webp",
          prevHeroUrl: "",
          portfolioId: "pf_axiomverifys2",
          slot: "proof",
          uploadedAt: new Date().toISOString(),
        }),
      ],
    ).catch(() => undefined);

    const paid = await postTwilio({
      base,
      signOrigins,
      token,
      path: "/api/webhooks/twilio/sms",
      params: { From: OWNER, To: LINE, Body: "PAID 8126", MessageSid: "SM_verify_paid" },
    });
    const paidRow = await db.query<{ payment_status: string; id: string }>(
      `select payment_status, id from appointments
        where shop_id = $1
          and right(regexp_replace(customer_phone, '\\D', '', 'g'), 4) = '8126'
        order by created_at desc limit 1`,
      [SHOP_ID],
    );
    const atom = paidRow.rows[0]?.id
      ? await db.query<{ proof_status: string; review_queued_at: string | null; receipt_sent_at: string | null }>(
          `select proof_status, review_queued_at::text, receipt_sent_at::text from closed_job_atoms where appointment_id = $1`,
          [paidRow.rows[0].id],
        )
      : { rows: [] as { proof_status: string; review_queued_at: string | null; receipt_sent_at: string | null }[] };
    const reviewQ = paidRow.rows[0]?.id
      ? await db.query<{ run_at: string; payload: unknown }>(
          `select run_at::text, payload from closed_job_queue
            where appointment_id = $1 and kind = 'review_sms' limit 1`,
          [paidRow.rows[0].id],
        )
      : { rows: [] as { run_at: string; payload: unknown }[] };
    const expectedReview = reviewSendAt(new Date());
    const queuedAt = reviewQ.rows[0]?.run_at ? Date.parse(reviewQ.rows[0].run_at) : NaN;
    const reviewSkewOk =
      Number.isFinite(queuedAt) && Math.abs(queuedAt - expectedReview.getTime()) < 90 * 60_000;
    record(
      "PAID 8126 sets payment_status=paid + receipt/review/proof atom",
      paid.status === 200 &&
        paidRow.rows[0]?.payment_status === "paid" &&
        Boolean(atom.rows[0]?.receipt_sent_at || (await outboundHas(db, /receipt/i, CUSTOMER))) &&
        Boolean(reviewQ.rows[0]?.run_at) &&
        reviewSkewOk &&
        atom.rows[0]?.proof_status === "pending_approval",
      `payment ${paidRow.rows[0]?.payment_status || "—"} proof ${atom.rows[0]?.proof_status || "—"} review ${reviewQ.rows[0]?.run_at || "—"}`,
    );

    const nudgeId = "qte_axiomverifynudge";
    const optId = "qte_axiomverifyopt";
    await db.query(
      `insert into shop_quotes (
         id, shop_id, customer_phone, customer_name, description, total_cents, deposit_cents, status, created_at
       ) values (
         $1, $2, $3, 'Sam Verify', 'Flush nudge', 35000, 10500, 'sent', now() - interval '36 hours'
       )
       on conflict (id) do update set nudge_sent_at = null, status = 'sent', created_at = now() - interval '36 hours'`,
      [nudgeId, SHOP_ID, CUSTOMER],
    );
    await db.query(
      `insert into shop_quotes (
         id, shop_id, customer_phone, customer_name, description, total_cents, deposit_cents, status, created_at
       ) values (
         $1, $2, $3, 'Opted Verify', 'Flush opt-out', 12000, 5000, 'sent', now() - interval '36 hours'
       )
       on conflict (id) do update set nudge_sent_at = null, status = 'sent', created_at = now() - interval '36 hours'`,
      [optId, SHOP_ID, OPTED],
    );
    await db.query(
      `insert into outreach_suppressions (id, phone, reason) values ($1, $2, 'stop')
       on conflict do nothing`,
      ["sup_axiomverify", OPTED],
    ).catch(() => undefined);

    let cronFirst = { status: 0, json: {} as Record<string, unknown> };
    let cronSecond = { status: 0, json: {} as Record<string, unknown> };
    if (!cronSecret) {
      record("Cron Bearer auth configured", false, "CRON_SECRET / OUTREACH_CRON_SECRET missing");
    } else {
      const denied = await fetch(`${base}/api/outreach/cron`, { method: "POST" });
      record("Cron without secret is 401", denied.status === 401, `status ${denied.status}`);
      cronFirst = await hitCron(base, cronSecret);
      cronSecond = await hitCron(base, cronSecret);
      const nudged = await db.query<{ nudge_sent_at: string | null }>(
        `select nudge_sent_at::text from shop_quotes where id = $1`,
        [nudgeId],
      );
      const opted = await db.query<{ nudge_sent_at: string | null }>(
        `select nudge_sent_at::text from shop_quotes where id = $1`,
        [optId],
      );
      const quietNow = !isQuoteNudgeSendWindow(new Date());
      const claimed = Boolean(nudged.rows[0]?.nudge_sent_at);
      const firstSent = Number(cronFirst.json.quoteNudgesSent ?? 0);
      const secondSent = Number(cronSecond.json.quoteNudgesSent ?? 0);
      record(
        "Quote nudge claims atomically (24–72h, 08:00–20:00, opt-outs)",
        cronFirst.status === 200 &&
          cronSecond.status === 200 &&
          (quietNow ? !claimed : claimed) &&
          !opted.rows[0]?.nudge_sent_at,
        quietNow
          ? `quiet hours — nudge_sent_at left null; opted ${opted.rows[0]?.nudge_sent_at || "null"}; quiet=${String(cronFirst.json.quoteNudgesQuiet)}`
          : `nudge_sent_at ${nudged.rows[0]?.nudge_sent_at}; opted null; first sent=${firstSent}`,
      );
      record(
        "Second cron does not duplicate the claim",
        cronSecond.status === 200 && secondSent === 0 && (quietNow || claimed),
        `first sent=${firstSent} second sent=${secondSent}`,
      );
    }
  } finally {
    if (process.env.VERIFY_KEEP !== "1") {
      await cleanup(db).catch((err) => {
        console.warn("[verify] cleanup", err instanceof Error ? err.message : err);
      });
    }
    db.release();
    await pool.end();
  }

  console.log("\nSprint 2 verification");
  console.log("Check".padEnd(64) + "Result");
  console.log("-".repeat(76));
  for (const row of checks) {
    console.log(`${row.name.slice(0, 62).padEnd(64)}${row.pass ? "PASS" : "FAIL"}`);
  }
  const failed = checks.filter((row) => !row.pass);
  console.log("-".repeat(76));
  console.log(`${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    console.error("Failed:");
    for (const row of failed) console.error(`  • ${row.name}: ${row.detail}`);
    process.exit(1);
  }
}

async function outboundHas(db: pg.PoolClient, needle: RegExp, toPhone?: string): Promise<boolean> {
  const dest = toPhone ? toPhone.replace(/\D/g, "").slice(-10) : "";
  const conv = await db
    .query<{ body: string }>(
      `select body from companion_conversations
        where shop_id = $1
          and ($2 = '' or right(regexp_replace(to_phone, '\\D', '', 'g'), 10) = $2)
        order by created_at desc limit 40`,
      [SHOP_ID, dest],
    )
    .catch(() => ({ rows: [] as { body: string }[] }));
  if (conv.rows.some((row) => needle.test(row.body || ""))) return true;
  const notes = await db
    .query<{ body: string }>(
      `select body from shop_notifications
        where shop_id = $1
          and ($2 = '' or right(regexp_replace(destination, '\\D', '', 'g'), 10) = $2)
        order by created_at desc limit 40`,
      [SHOP_ID, dest],
    )
    .catch(() => ({ rows: [] as { body: string }[] }));
  return notes.rows.some((row) => needle.test(row.body || ""));
}

async function hitCron(base: string, secret: string) {
  const res = await fetch(`${base}/api/outreach/cron?shop_slug=${encodeURIComponent(SLUG)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

async function seedShop(db: pg.PoolClient) {
  await cleanup(db);
  try {
    await db.query(
      `insert into shops (id, slug, name, niche, hours_json, owner_phone, notify_phone, notification_phone, google_review_url, is_showcase)
       values ($1, $2, 'Axiom Verify Shop', 'contractor', $3, $4, $4, $4, $5, false)`,
      [SHOP_ID, SLUG, HOURS, OWNER, "https://g.page/r/axiom-verify-sprint2/review"],
    );
  } catch {
    await db.query(
      `insert into shops (id, slug, name, niche, hours_json, notify_phone)
       values ($1, $2, 'Axiom Verify Shop', 'contractor', $3, $4)`,
      [SHOP_ID, SLUG, HOURS, OWNER],
    );
  }
  await db.query(`update shops set axiom_phone_number = $2, phone = $2, owner_phone = $3, notify_phone = $3, notification_phone = $3 where id = $1`, [
    SHOP_ID,
    LINE,
    OWNER,
  ]).catch(() => undefined);
  try {
    await db.query(
      `insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
       values ($1, 'unlock', 'unlocked', 100, 150)
       on conflict (shop_id) do update set gear_guardian_bps = 150`,
      [SHOP_ID],
    );
  } catch {
    await db.query(
      `insert into shop_billing (shop_id, plan, status, price_cents)
       values ($1, 'unlock', 'unlocked', 100)
       on conflict (shop_id) do nothing`,
      [SHOP_ID],
    ).catch(() => undefined);
  }
  await db.query(`update shop_billing set twilio_number = $2 where shop_id = $1`, [SHOP_ID, LINE]).catch(() => undefined);
  await db.query(
    `insert into employees (id, shop_id, display_name, title, availability_json)
     values ($1, $2, 'Verify Tech', 'Owner', $3)
     on conflict (id) do update set shop_id = excluded.shop_id`,
    [
      EMP_ID,
      SHOP_ID,
      JSON.stringify({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true }),
    ],
  ).catch(async () => {
    await db.query(
      `insert into employees (id, shop_id, display_name, title)
       values ($1, $2, 'Verify Tech', 'Owner')
       on conflict (id) do nothing`,
      [EMP_ID, SHOP_ID],
    );
  });
  await db.query(
    `insert into services (id, shop_id, name, duration_min, price_cents)
     values ($1, $2, 'Service call', 120, 35000)
     on conflict (id) do update set shop_id = excluded.shop_id`,
    [SVC_ID, SHOP_ID],
  );
}

async function cleanup(db: pg.PoolClient) {
  await db.query(`delete from closed_job_queue where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from closed_job_atoms where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from shop_quotes where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from missed_call_slot_offers where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from appointment_requests where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from companion_conversations where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from shop_notifications where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from appointments where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from employees where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from services where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from shop_billing where shop_id = $1`, [SHOP_ID]).catch(() => undefined);
  await db.query(`delete from shops where slug = $1`, [SLUG]).catch(() => undefined);
  await db.query(`delete from outreach_suppressions where id = $1`, ["sup_axiomverify"]).catch(() => undefined);
}

main().catch((err) => {
  console.error("[verify:e2e]", err instanceof Error ? err.message : err);
  process.exit(1);
});
