module.exports = [
(()=>{"use strict";return[
"[project]/scripts/migration-plan.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// @ts-check
/**
 * Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
 * (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
 *
 * Applied files are keyed by BASENAME, so the same file applies once no matter
 * which directory it is globbed from. That is what makes the auth schema safe to
 * copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
 * a database that already has `0001_auth.sql` will not re-run it.
 *
 * Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
 * out of scope for both until it is copied up.
 */ /**
 * The `_migrations` key for a migration path (or bare filename).
 * @param {string} path
 * @returns {string}
 */ __turbopack_context__.s([
    "isMigrationFile",
    ()=>isMigrationFile,
    "migrationName",
    ()=>migrationName,
    "pendingMigrations",
    ()=>pendingMigrations
]);
function migrationName(path) {
    return path.split("/").pop() ?? path;
}
function isMigrationFile(path) {
    return path.endsWith(".sql");
}
function pendingMigrations(paths, applied) {
    const done = new Set(applied);
    return [
        ...paths
    ].filter(isMigrationFile).map((path)=>({
            name: migrationName(path),
            path
        })).sort((a, b)=>a.name.localeCompare(b.name)).filter(({ name })=>!done.has(name));
}
}),
"[project]/src/lib/axiom/booking-notice.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bookingNoticeCopy",
    ()=>bookingNoticeCopy,
    "formatBookingWhen",
    ()=>formatBookingWhen,
    "noticeKindFor",
    ()=>noticeKindFor
]);
function formatBookingWhen(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}
function noticeKindFor(phase) {
    if (phase === "confirmed") return "booking_confirmed";
    if (phase === "paid") return "booking_paid";
    return "booking_request";
}
function bookingNoticeCopy(input) {
    const { shopName, guestName, serviceName, employeeName, when } = input;
    const withWhom = `${serviceName} with ${employeeName} at ${when}`;
    if (input.phase === "confirmed") {
        return {
            kind: "booking_confirmed",
            owner: {
                subject: `Confirmed · ${guestName}`,
                body: `${guestName} is confirmed for ${withWhom}.`
            },
            staff: {
                subject: `Confirmed · ${guestName}`,
                body: `${guestName} is confirmed for ${serviceName} at ${when}.`
            },
            guest: {
                subject: `${shopName} confirmed your time`,
                body: `${shopName} confirmed ${withWhom}.`
            }
        };
    }
    if (input.phase === "paid") {
        return {
            kind: "booking_paid",
            owner: {
                subject: `Paid booking · ${guestName}`,
                body: `${guestName} paid for ${withWhom}.`
            },
            staff: {
                subject: `Paid booking · ${guestName}`,
                body: `${guestName} paid for ${serviceName} at ${when}.`
            },
            guest: {
                subject: `${shopName} received your payment`,
                body: `${shopName} received payment for ${withWhom}. The time is still waiting on a confirmation.`
            }
        };
    }
    return {
        kind: "booking_request",
        owner: {
            subject: `New booking · ${guestName}`,
            body: `${guestName} requested ${withWhom}.`
        },
        staff: {
            subject: `New booking · ${guestName}`,
            body: `${guestName} requested ${serviceName} at ${when}.`
        },
        guest: {
            subject: `${shopName} received your request`,
            body: `${shopName} received your request for ${withWhom}. The time is held until they confirm it.`
        }
    };
}
}),
"[project]/src/lib/axiom/notify-target.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isNotifyEmail",
    ()=>isNotifyEmail,
    "toE164",
    ()=>toE164
]);
function isNotifyEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function toE164(raw) {
    const trimmed = raw.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
}
}),
"[project]/src/lib/axiom/notify.server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allowInquiry",
    ()=>allowInquiry,
    "deliverOutreachMessage",
    ()=>deliverOutreachMessage,
    "missingOutreachCredentials",
    ()=>missingOutreachCredentials,
    "notifyBookingParties",
    ()=>notifyBookingParties,
    "notifyShop",
    ()=>notifyShop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$booking$2d$notice$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/booking-notice.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/notify-target.ts [app-route] (ecmascript)");
;
;
;
;
;
const inquiryHits = new Map();
function allowInquiry(shopId) {
    const now = Date.now();
    const recent = (inquiryHits.get(shopId) ?? []).filter((t)=>now - t < 10 * 60 * 1000);
    if (recent.length >= 5) {
        inquiryHits.set(shopId, recent);
        return false;
    }
    recent.push(now);
    inquiryHits.set(shopId, recent);
    return true;
}
async function record(shopId, kind, channel, destination, subject, body, status, detail, employeeId) {
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    const note = detail.slice(0, 240);
    try {
        await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail, employee_id
      ) values (
        ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["newId"])("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
        ${subject}, ${body}, ${status}, ${note}, ${employeeId}
      )
    `;
    } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!/employee_id/i.test(message)) throw err;
        await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail
      ) values (
        ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["newId"])("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
        ${subject}, ${body}, ${status}, ${note}
      )
    `;
    }
}
async function sendEmail(to, subject, body) {
    const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("RESEND_API_KEY");
    const from = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("RESEND_FROM");
    if (!key || !from) return {
        status: "skipped",
        detail: "Email provider is not configured"
    };
    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from,
                to: [
                    to
                ],
                subject,
                text: body
            })
        });
        if (!res.ok) return {
            status: "failed",
            detail: "Email provider rejected the message"
        };
        return {
            status: "sent",
            detail: ""
        };
    } catch  {
        return {
            status: "failed",
            detail: "Email request failed"
        };
    }
}
const OUTREACH_CREDENTIALS = [
    "RESEND_API_KEY",
    "RESEND_FROM",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER"
];
function missingOutreachCredentials() {
    return OUTREACH_CREDENTIALS.filter((key)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])(key));
}
async function deliverOutreachMessage(input) {
    if (input.channel === "email") return sendEmail(input.to, input.subject, input.body);
    return sendSms(input.to, input.body);
}
async function sendSms(to, body) {
    const sid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("TWILIO_ACCOUNT_SID");
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("TWILIO_AUTH_TOKEN");
    const from = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("TWILIO_FROM_NUMBER");
    if (!sid || !token || !from) return {
        status: "skipped",
        detail: "SMS provider is not configured"
    };
    try {
        const auth = Buffer.from(`${sid}:${token}`).toString("base64");
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                To: to,
                From: from,
                Body: body.slice(0, 640)
            })
        });
        if (!res.ok) return {
            status: "failed",
            detail: "SMS provider rejected the message"
        };
        return {
            status: "sent",
            detail: ""
        };
    } catch  {
        return {
            status: "failed",
            detail: "SMS request failed"
        };
    }
}
function logSkip(channel, detail) {
    if (detail) console.info(`notify ${channel} skipped: ${detail}`);
}
async function sendWebhook(shopId, notice, email, phone) {
    const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("NOTIFY_WEBHOOK_URL");
    if (!url) return;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                shopId,
                kind: notice.kind,
                subject: notice.subject,
                body: notice.body,
                email,
                phone
            })
        });
        await record(shopId, notice.kind, "webhook", "hook", notice.subject, notice.body, res.ok ? "sent" : "failed", res.ok ? "" : "Webhook returned an error", null);
    } catch  {
        await record(shopId, notice.kind, "webhook", "hook", notice.subject, notice.body, "failed", "Webhook request failed", null);
    }
}
async function reach(opts) {
    await record(opts.shopId, opts.notice.kind, "inbox", opts.destination, opts.notice.subject, opts.notice.body, "sent", opts.inboxDetail, opts.employeeId);
    const email = opts.email.trim();
    if (email && !opts.skipEmail) {
        const result = await sendEmail(email, opts.notice.subject, opts.notice.body);
        if (result.status === "skipped") logSkip("email", result.detail);
        await record(opts.shopId, opts.notice.kind, "email", email, opts.notice.subject, opts.notice.body, result.status, result.detail, opts.employeeId);
    }
    const smsTo = opts.phone.trim() ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toE164"])(opts.phone) : null;
    if (opts.phone.trim() && !smsTo && !opts.skipSms) {
        await record(opts.shopId, opts.notice.kind, "sms", opts.phone.trim().slice(0, 20), opts.notice.subject, opts.notice.body, "skipped", "Phone is not a mobile number we can text", opts.employeeId);
    } else if (smsTo && !opts.skipSms) {
        const result = await sendSms(smsTo, `${opts.notice.subject}\n${opts.notice.body}`);
        if (result.status === "skipped") logSkip("sms", result.detail);
        await record(opts.shopId, opts.notice.kind, "sms", smsTo, opts.notice.subject, opts.notice.body, result.status, result.detail, opts.employeeId);
    }
}
async function notifyShop(shopId, notice) {
    try {
        const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
        const rows = await sql`
      select notify_email, notify_phone from shops where id = ${shopId} limit 1
    `;
        const email = rows[0]?.notify_email?.trim() ?? "";
        const phone = rows[0]?.notify_phone?.trim() ?? "";
        await reach({
            shopId,
            employeeId: null,
            destination: "console",
            email,
            phone,
            notice,
            inboxDetail: "",
            skipEmail: false,
            skipSms: false
        });
        await sendWebhook(shopId, notice, email, phone);
    } catch (err) {
        console.error("notify failed", shopId, notice.kind, err instanceof Error ? err.message : "error");
    }
}
async function loadStaffContact(shopId, employeeId) {
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    const rows = await sql`
    select e.display_name, e.phone,
      coalesce(
        nullif(u.email, ''),
        case when s.works_alone then owner.email else '' end
      ) as email
    from employees e
    join shops s on s.id = e.shop_id
    left join "user" u on u.id = e.claimed_user_id
    left join "user" owner on owner.id = s.owner_user_id
    where e.id = ${employeeId} and e.shop_id = ${shopId}
    limit 1
  `;
    const row = rows[0];
    if (!row) return null;
    return {
        name: row.display_name,
        email: row.email?.trim().toLowerCase() ?? "",
        phone: row.phone?.trim() ?? ""
    };
}
async function notifyBookingParties(input) {
    try {
        const when = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$booking$2d$notice$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatBookingWhen"])(input.startsAt);
        const copy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$booking$2d$notice$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bookingNoticeCopy"])({
            phase: input.phase,
            shopName: input.shopName,
            guestName: input.guestName,
            serviceName: input.serviceName,
            employeeName: input.employeeName,
            when
        });
        const phoneNote = input.guestPhone ? ` Phone: ${input.guestPhone}` : "";
        const emailNote = input.guestEmail ? ` Email: ${input.guestEmail}` : "";
        await notifyShop(input.shopId, {
            kind: copy.kind,
            subject: copy.owner.subject,
            body: `${copy.owner.body}${phoneNote}${emailNote}`
        });
        const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
        const shops = await sql`
      select notify_email, notify_phone from shops where id = ${input.shopId} limit 1
    `;
        const shopEmail = shops[0]?.notify_email?.trim().toLowerCase() ?? "";
        const shopPhone = shops[0]?.notify_phone ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toE164"])(shops[0].notify_phone) : null;
        const staff = await loadStaffContact(input.shopId, input.employeeId);
        const staffPhone = staff?.phone ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toE164"])(staff.phone) : null;
        if (staff) {
            await reach({
                shopId: input.shopId,
                employeeId: input.employeeId,
                destination: staff.name,
                email: staff.email,
                phone: staff.phone,
                notice: {
                    kind: copy.kind,
                    subject: copy.staff.subject,
                    body: copy.staff.body
                },
                inboxDetail: "",
                skipEmail: !staff.email || staff.email === shopEmail,
                skipSms: !staffPhone || staffPhone === shopPhone
            });
        }
        const guestDest = input.guestEmail || input.guestPhone || "guest";
        await reach({
            shopId: input.shopId,
            employeeId: null,
            destination: guestDest,
            email: input.guestEmail,
            phone: input.guestPhone,
            notice: {
                kind: copy.kind,
                subject: copy.guest.subject,
                body: copy.guest.body
            },
            inboxDetail: input.guestEmail || input.guestPhone ? "" : "Guest left no email or phone",
            skipEmail: false,
            skipSms: false
        });
    } catch (err) {
        console.error("booking notify failed", input.shopId, input.phase, err instanceof Error ? err.message : "error");
    }
}
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dbSource",
    ()=>dbSource,
    "ensureDbReady",
    ()=>ensureDbReady,
    "getPglite",
    ()=>getPglite,
    "getSql",
    ()=>getSql,
    "withTransaction",
    ()=>withTransaction
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/scripts/migration-plan.mjs [app-route] (ecmascript)");
var __TURBOPACK__import$2e$meta__ = {
    get url () {
        return __turbopack_context__.F("src/lib/db.ts");
    },
    env: {
        DEV: true,
        PROD: false,
        MODE: "development",
        BASE_URL: "/",
        SSR: true
    },
    get turbopackHot () {
        return __turbopack_context__.m.hot;
    }
};
;
;
;
;
// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;
const dbSource = databaseUrl ? "neon" : "pglite";
/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */ const globalRef = globalThis;
/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */ const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v)=>v;
function transientDbError(err) {
    const message = err instanceof Error ? err.message : "";
    const code = err && typeof err === "object" && "code" in err ? String(err.code ?? "") : "";
    if (code === "57014" || /statement timeout/i.test(message)) return false;
    return code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "08000" || code === "08003" || code === "08006" || code === "57P01" || /connection terminated|connection timeout|timeout expired|ENOTFOUND|ECONNRESET|EAI_AGAIN/i.test(message);
}
async function withDbRetry(run) {
    let last;
    for(let attempt = 0; attempt < 3; attempt++){
        try {
            return await run();
        } catch (err) {
            last = err;
            if (!transientDbError(err) || attempt === 2) throw err;
            await new Promise((resolve)=>setTimeout(resolve, 250 * (attempt + 1)));
        }
    }
    throw last;
}
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */ function toSql(run) {
    const sql = async (strings, ...values)=>{
        // Rebuild with $1, $2, … placeholders so values stay parameterized.
        let text = strings[0];
        for(let i = 0; i < values.length; i += 1)text += `$${i + 1}${strings[i + 1]}`;
        return run(text, values);
    };
    sql.query = (text, params = [])=>run(text, params);
    return sql;
}
function migrationSources() {
    try {
        return __turbopack_context__.r("[project]/src/lib/db.ts [app-route] (import.meta.glob /migrations/*.sql eager import=default query=?raw)");
    } catch (err) {
        // Vite replaces the glob call. A plain Node script, such as the California
        // seed, reads the same files from disk.
        if (!(err instanceof TypeError)) throw err;
        const dir = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"])(__TURBOPACK__import$2e$meta__.url)), "../../migrations");
        const sources = {};
        for (const name of (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readdirSync"])(dir)){
            if (!name.endsWith(".sql")) continue;
            sources[`/migrations/${name}`] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readFileSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(dir, name), "utf8");
        }
        return sources;
    }
}
/**
 * Apply pending `migrations/*.sql` to the Postgres named by `DATABASE_URL`.
 * The build step also runs this. Boot runs it again so a long-lived server
 * picks up a new file without waiting for the next deploy, including send-window
 * columns. Applied names live
 * in `_migrations`, so a restart does not re-run them or touch existing rows.
 */ async function migratePostgres() {
    if (!databaseUrl) return;
    await withDbRetry(()=>migratePostgresConnected());
}
async function migratePostgresConnected() {
    if (!databaseUrl) return;
    const { Pool } = await __turbopack_context__.A("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg, async loader)");
    const pool = new Pool({
        connectionString: databaseUrl,
        max: 1
    });
    try {
        const client = await pool.connect();
        try {
            await client.query("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
            const applied = (await client.query("select name from _migrations")).rows.map((row)=>row.name);
            const migrations = migrationSources();
            for (const { name, path } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingMigrations"])(Object.keys(migrations), applied)){
                try {
                    await client.query("BEGIN");
                    await client.query(migrations[path]);
                    await client.query("insert into _migrations (name) values ($1)", [
                        name
                    ]);
                    await client.query("COMMIT");
                    console.info(`[db] applied ${name}`);
                } catch (err) {
                    try {
                        await client.query("ROLLBACK");
                    } catch  {
                    // Keep the original migration error if the connection already died.
                    }
                    console.error(`[db] migration failed: ${name}`);
                    throw err;
                }
            }
        } finally{
            client.release();
        }
    } finally{
        await pool.end();
    }
}
function migratePostgresOnce() {
    globalRef.__pgMigratePromise__ ??= migratePostgres().catch((err)=>{
        globalRef.__pgMigratePromise__ = undefined;
        throw err;
    });
    return globalRef.__pgMigratePromise__;
}
function createNeonSql() {
    globalRef.__pgSqlPromise__ ??= (async ()=>{
        // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
        // pooled endpoint. One pool per process; warm serverless instances reuse it.
        const { Pool, types } = await __turbopack_context__.A("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg, async loader)");
        types.setTypeParser(OID_INT8, Number);
        types.setTypeParser(OID_DATE, identity);
        types.setTypeParser(OID_INTERVAL, identity);
        // One pool per process. Bulk import holds a single client for each
        // stage-and-promote transaction so the batch is not split across connections.
        const pool = new Pool({
            connectionString: databaseUrl,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 15_000
        });
        // A reset from the pooler emits `error` on an idle client. Without a
        // listener Node treats that as fatal and exits the dev server.
        pool.on("error", (err)=>{
            console.error("[db] connection dropped", err instanceof Error ? err.message : err);
        });
        pool.on("connect", (client)=>{
            client.on("error", (err)=>{
                console.error("[db] connection dropped", err instanceof Error ? err.message : err);
            });
        });
        globalRef.__pgPool__ = pool;
        return toSql(async (text, params)=>withDbRetry(async ()=>{
                const res = await pool.query(text, params);
                return res.rows;
            }));
    })().catch((err)=>{
        globalRef.__pgSqlPromise__ = undefined;
        throw err;
    });
    return globalRef.__pgSqlPromise__;
}
/** PGLite asks the engine for a 2GB block. On an 8GB machine that reservation
 *  starves the dev server. Cap it at 256MB before the database module loads. */ function capDatabaseMemory() {
    const Memory = WebAssembly.Memory;
    if (Memory.capped) return;
    const maxPages = 4096;
    function CappedMemory(descriptor) {
        const maximum = Math.min(descriptor.maximum ?? maxPages, maxPages);
        const initial = Math.min(descriptor.initial, maximum);
        return new Memory({
            ...descriptor,
            initial,
            maximum
        });
    }
    CappedMemory.prototype = Memory.prototype;
    Object.setPrototypeOf(CappedMemory, Memory);
    CappedMemory.capped = true;
    WebAssembly.Memory = CappedMemory;
}
async function createPgliteSql() {
    // Embedded Postgres, imported on demand so it never loads on the Neon path.
    // One in-memory instance per process, shared across HMR module instances, so
    // data survives source edits (it resets on dev-server restart).
    globalRef.__pgliteInstance__ ??= (async ()=>{
        capDatabaseMemory();
        const { PGlite } = await __turbopack_context__.A("[project]/node_modules/@electric-sql/pglite/dist/index.js [app-route] (ecmascript, async loader)");
        const pg = new PGlite({
            parsers: {
                [OID_INT8]: Number,
                [OID_DATE]: identity,
                [OID_INTERVAL]: identity
            }
        });
        await pg.waitReady;
        await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
        return pg;
    })().catch((err)=>{
        globalRef.__pgliteInstance__ = undefined;
        throw err;
    });
    const pg = await globalRef.__pgliteInstance__;
    // Apply migrations/ (the single schema source, including open trades) so preview matches production.
    // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
    // files are tracked in _migrations. The glob does not descend, so the opt-in
    // auth schema under migrations/auth/ stays out. Runs once per module instance
    // — so an HMR reload after adding a migration file applies it live — with
    // passes serialized on a global chain so concurrent callers never
    // double-apply.
    const migrate = async ()=>{
        const migrations = migrationSources();
        const doneRows = await pg.query("select name from _migrations");
        const done = doneRows.rows.map((r)=>r.name);
        for (const { name, path } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingMigrations"])(Object.keys(migrations), done)){
            // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
            // statement can't leave a file half-applied but untracked.
            await pg.transaction(async (tx)=>{
                await tx.exec(migrations[path]);
                await tx.query("insert into _migrations (name) values ($1)", [
                    name
                ]);
            });
        }
    };
    const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(()=>undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
    globalRef.__pgliteMigrateChain__ = pass;
    await pass;
    return toSql(async (text, params)=>{
        const result = await pg.query(text, params);
        return result.rows;
    });
}
let sqlPromise = null;
async function createSql() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (dbSource === "neon") {
        await migratePostgresOnce();
        return createNeonSql();
    }
    return createPgliteSql();
}
async function withTransaction(fn) {
    if (dbSource === "neon") {
        await getSql();
        const pool = globalRef.__pgPool__;
        if (!pool) throw new Error("Postgres pool is not ready");
        const client = await withDbRetry(()=>pool.connect());
        try {
            await client.query("BEGIN");
            await client.query("SET LOCAL statement_timeout = '120s'");
            const sql = toSql(async (text, params)=>{
                const res = await client.query(text, params);
                return res.rows;
            });
            const result = await fn(sql);
            await client.query("COMMIT");
            return result;
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch  {
            // Keep the original error if the connection already died.
            }
            throw err;
        } finally{
            client.release();
        }
    }
    const pg = await getPglite();
    return pg.transaction(async (tx)=>{
        const sql = toSql(async (text, params)=>{
            const result = await tx.query(text, params);
            return result.rows;
        });
        return fn(sql);
    });
}
function getSql() {
    sqlPromise ??= createSql().catch((err)=>{
        sqlPromise = null; // don't memoize failures — let the next call retry
        throw err;
    });
    return sqlPromise;
}
async function getPglite() {
    if (dbSource !== "pglite") {
        throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
    }
    await getSql();
    const pg = await globalRef.__pgliteInstance__;
    if (!pg) throw new Error("PGLite instance failed to initialize");
    return pg;
}
function ensureDbReady() {
    if (dbSource === "neon") return migratePostgresOnce();
    return getSql().then(()=>undefined);
}
// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis;
if ("TURBOPACK compile-time truthy", 1) {
    console.info(dbSource === "neon" ? "[db] postgres via DATABASE_URL" : "[db] in-memory postgres — DATABASE_URL is unset, so rows reset when this process stops");
    globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err)=>{
        globalBoot.__pgBootstrapPromise__ = undefined;
        console.error("[db] bootstrap failed:", err);
        throw err;
    });
}
}),
"[project]/src/lib/env.server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "env",
    ()=>env,
    "isWorkspacePreview",
    ()=>isWorkspacePreview
]);
function env(key) {
    const v = process.env[key]?.trim();
    return v || undefined;
}
function isWorkspacePreview() {
    return !env("GROK_PROJECT_ID");
}
}),
"[project]/src/lib/utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatMoney",
    ()=>formatMoney,
    "formatPhone",
    ()=>formatPhone,
    "initials",
    ()=>initials,
    "newId",
    ()=>newId,
    "slugify",
    ()=>slugify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-route] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(cents / 100);
}
function slugify(input) {
    const s = input.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
    return s || "shop";
}
function newId(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function initials(name) {
    return name.split(/\s+/).slice(0, 2).map((p)=>p[0] ?? "").join("").toUpperCase();
}
function formatPhone(raw) {
    const d = raw.replace(/\D/g, "");
    if (d.length === 10) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length === 11 && d[0] === "1") {
        return `${d.slice(1, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
    }
    return raw;
}
}),
]})(),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (import.meta.glob /migrations/*.sql eager import=default query=?raw)", (function(__turbopack_context__){

__turbopack_context__.v({
    "/migrations/0001_auth.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0002_schema.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0003_seed.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0004_rebrand.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0005_intro.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0006_tenant_platform.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0007_hero_video.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0008_music_and_contractor.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0009_dashboard_override.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0010_tattoo_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0011_guide_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0012_universal_niches.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0013_booking_notices.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0014_master_funnel.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0015_outreach.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0016_lead_public.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0017_followups.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0018_outreach_queue.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0019_nurture_guard.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0020_territory_activation.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0021_open_trades.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0022_appointment_slot.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0023_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0024_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0025_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0026_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0027_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0028_send_windows.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0029_security_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0030_storefront.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0031_niche_hero_films.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0032_retail_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0033_lead_audits.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0034_audit_status.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0035_funnel_source.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0036_lead_website.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0037_locksmith_combat.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0038_trade_profile.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0039_lead_staging.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0040_client_audit_submissions.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0041_creator_entertainer.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0042_landscaper_foodtruck.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0043_auth_identity.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0044_consumer_prospects.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0045_dogwalk_detailer.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0046_handle_new_user.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0047_tenant_scan_limit.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0048_hunting_therapy.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0049_bowtech.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0050_custom_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0051_prompt.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0052_lead_targeting_index.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0053_merchant_pricing_settings.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0054_pricing_collection.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0055_shop_copilot_memory.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0056_copilot_stage.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0057_business_memories.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0058_hero_text_layers.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0059_auto_hero_film.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0060_preloaded_lead_geo.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0061_profiles.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0062_consumer_leads.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0063_shop_memberships.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0064_active_shop_memberships.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"]
});
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1qlheyjrgv5iv._.js.map