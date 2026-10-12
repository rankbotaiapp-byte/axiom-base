import { a as newId } from "./utils-BkNFIPfO.mjs";
import { a as getSql } from "./db-BbGQAJUy.mjs";
import { t as env } from "./env.server-wS9zOhV6.mjs";
import { n as toE164 } from "./notify-target-BTgSqjpY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notify.server-CC7V6aj_.js
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
/** Copy for the shop inbox, the assigned station, and the guest. */
function bookingNoticeCopy(input) {
	const { shopName, guestName, serviceName, employeeName, when } = input;
	const withWhom = `${serviceName} with ${employeeName} at ${when}`;
	if (input.phase === "confirmed") return {
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
	if (input.phase === "paid") return {
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
var inquiryHits = /* @__PURE__ */ new Map();
function allowInquiry(shopId) {
	const now = Date.now();
	const recent = (inquiryHits.get(shopId) ?? []).filter((t) => now - t < 6e5);
	if (recent.length >= 5) {
		inquiryHits.set(shopId, recent);
		return false;
	}
	recent.push(now);
	inquiryHits.set(shopId, recent);
	return true;
}
async function record(shopId, kind, channel, destination, subject, body, status, detail, employeeId) {
	const sql = await getSql();
	const note = detail.slice(0, 240);
	try {
		await sql`
      insert into shop_notifications (
        id, shop_id, channel, kind, destination, subject, body, status, detail, employee_id
      ) values (
        ${newId("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
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
        ${newId("ntf")}, ${shopId}, ${channel}, ${kind}, ${destination},
        ${subject}, ${body}, ${status}, ${note}
      )
    `;
	}
}
async function sendEmail(to, subject, body) {
	const key = env("RESEND_API_KEY");
	const from = env("RESEND_FROM");
	if (!key || !from) return {
		status: "skipped",
		detail: "Email provider is not configured"
	};
	try {
		if (!(await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				from,
				to: [to],
				subject,
				text: body
			})
		})).ok) return {
			status: "failed",
			detail: "Email provider rejected the message"
		};
		return {
			status: "sent",
			detail: ""
		};
	} catch {
		return {
			status: "failed",
			detail: "Email request failed"
		};
	}
}
var OUTREACH_CREDENTIALS = [
	"RESEND_API_KEY",
	"RESEND_FROM",
	"TWILIO_ACCOUNT_SID",
	"TWILIO_AUTH_TOKEN",
	"TWILIO_FROM_NUMBER"
];
/** Names of the Resend and Twilio settings a live outreach batch requires. Empty means ready. */
function missingOutreachCredentials() {
	return OUTREACH_CREDENTIALS.filter((key) => !env(key));
}
/** Provider send used only by the live outreach queue. Simulation must not call this. */
async function deliverOutreachMessage(input) {
	if (input.channel === "email") return sendEmail(input.to, input.subject, input.body);
	return sendSms(input.to, input.body);
}
async function sendSms(to, body) {
	const sid = env("TWILIO_ACCOUNT_SID");
	const token = env("TWILIO_AUTH_TOKEN");
	const from = env("TWILIO_FROM_NUMBER");
	if (!sid || !token || !from) return {
		status: "skipped",
		detail: "SMS provider is not configured"
	};
	try {
		const auth = Buffer.from(`${sid}:${token}`).toString("base64");
		if (!(await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
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
		})).ok) return {
			status: "failed",
			detail: "SMS provider rejected the message"
		};
		return {
			status: "sent",
			detail: ""
		};
	} catch {
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
	const url = env("NOTIFY_WEBHOOK_URL");
	if (!url) return;
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
	} catch {
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
	const smsTo = opts.phone.trim() ? toE164(opts.phone) : null;
	if (opts.phone.trim() && !smsTo && !opts.skipSms) await record(opts.shopId, opts.notice.kind, "sms", opts.phone.trim().slice(0, 20), opts.notice.subject, opts.notice.body, "skipped", "Phone is not a mobile number we can text", opts.employeeId);
	else if (smsTo && !opts.skipSms) {
		const result = await sendSms(smsTo, `${opts.notice.subject}\n${opts.notice.body}`);
		if (result.status === "skipped") logSkip("sms", result.detail);
		await record(opts.shopId, opts.notice.kind, "sms", smsTo, opts.notice.subject, opts.notice.body, result.status, result.detail, opts.employeeId);
	}
}
/** Inbox always. Email and SMS fire only to the shop's own saved contacts. */
async function notifyShop(shopId, notice) {
	try {
		const rows = await (await getSql())`
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
	const row = (await (await getSql())`
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
  `)[0];
	if (!row) return null;
	return {
		name: row.display_name,
		email: row.email?.trim().toLowerCase() ?? "",
		phone: row.phone?.trim() ?? ""
	};
}
/**
* Shop inbox, the assigned station's inbox, and the guest.
* Missing email or SMS keys are recorded as skipped. This never throws.
*/
async function notifyBookingParties(input) {
	try {
		const when = formatBookingWhen(input.startsAt);
		const copy = bookingNoticeCopy({
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
		const shops = await (await getSql())`
      select notify_email, notify_phone from shops where id = ${input.shopId} limit 1
    `;
		const shopEmail = shops[0]?.notify_email?.trim().toLowerCase() ?? "";
		const shopPhone = shops[0]?.notify_phone ? toE164(shops[0].notify_phone) : null;
		const staff = await loadStaffContact(input.shopId, input.employeeId);
		const staffPhone = staff?.phone ? toE164(staff.phone) : null;
		if (staff) await reach({
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
//#endregion
export { allowInquiry, deliverOutreachMessage, missingOutreachCredentials, notifyBookingParties, notifyShop };
