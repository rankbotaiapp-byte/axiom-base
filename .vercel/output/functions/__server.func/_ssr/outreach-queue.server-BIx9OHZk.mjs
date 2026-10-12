import { a as newId } from "./utils-BkNFIPfO.mjs";
import { a as getSql } from "./db-BbGQAJUy.mjs";
import { t as env } from "./env.server-wS9zOhV6.mjs";
import { l as isLeadSlug } from "./funnel-DCLKTLeU.mjs";
import { a as parseChunkSize, c as parseTimingProfile, f as timingProfileFor, i as outreachMayCallProviders, l as parseTrickleSeconds, n as insideSendWindow, o as parseOutreachMode, p as trickleMayRelease, r as nextSendInstant, s as parseSendTiming } from "./outreach-queue-DUpdF-PE.mjs";
import { a as nurtureReleasePlan, o as splitOutreachEmail, r as isDueNurtureStep } from "./funnel-guard-BnfVmfEx.mjs";
import { n as toE164 } from "./notify-target-BTgSqjpY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/outreach-queue.server-BIx9OHZk.js
function readOutreachConfig() {
	return {
		mode: parseOutreachMode(env("OUTREACH_MODE")),
		intervalSeconds: parseTrickleSeconds(env("OUTREACH_TRICKLE_SECONDS")),
		chunkSize: parseChunkSize(env("OUTREACH_CHUNK_SIZE"))
	};
}
function slugList(slugs) {
	return [...new Set(slugs.filter((slug) => isLeadSlug(slug)))].join(",");
}
function missingRelation(err, name) {
	const message = err instanceof Error ? err.message : "";
	return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}
/** One in-process tick. The desk poll also drains, so a quiet tab still releases the next due chunk. */
function ensureOutreachWorker() {
	const host = globalThis;
	if (host.__axiomOutreachWorker) return;
	host.__axiomOutreachWorker = true;
	const timer = setInterval(() => {
		tickOutreachQueue();
	}, 15e3);
	if (typeof timer === "object" && timer && "unref" in timer) timer.unref();
}
async function tickOutreachQueue() {
	try {
		const sql = await getSql();
		await drainOutreachQueue(sql);
		await drainNurtureTouches(sql);
	} catch (err) {
		if (missingRelation(err, "outreach_dispatches") || missingRelation(err, "outreach_touches") || missingRelation(err, "attempts")) return;
		console.error("outreach queue", err instanceof Error ? err.message : err);
	}
}
function dispatchWindow(row) {
	const timing = parseSendTiming(row.timing);
	return {
		timing,
		profile: timing === "smart" ? parseTimingProfile(row.profile) : "general"
	};
}
/**
* Release at most one due chunk. Overdue chunks stay queued until a full
* interval has passed since the previous release, so a restart cannot dump the backlog.
* Nights, Fridays, and weekends push the chunk to the next open window.
*/
async function drainOutreachQueue(sql) {
	await sql`
    update outreach_dispatches
    set status = 'queued'
    where status = 'releasing'
      and scheduled_at <= now() - interval '2 minutes'
  `;
	const due = await sql`
    select id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
      payload, interval_seconds, county, timing, profile
    from outreach_dispatches
    where status = 'queued' and scheduled_at <= now()
    order by scheduled_at asc, chunk_index asc
    limit 12
  `;
	const now = /* @__PURE__ */ new Date();
	let row;
	for (const candidate of due) {
		const window = dispatchWindow(candidate);
		if (insideSendWindow(now, window.timing, window.profile)) {
			row = candidate;
			break;
		}
		await sql`
      update outreach_dispatches
      set scheduled_at = ${nextSendInstant(now, window.timing, window.profile).toISOString()}
      where id = ${candidate.id} and status = 'queued'
    `;
	}
	if (!row) return { released: false };
	const intervalSeconds = parseTrickleSeconds(String(row.interval_seconds));
	const lastSent = (await sql`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null
        and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `)[0]?.sent_at;
	const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
	if (!trickleMayRelease(lastSentAt, /* @__PURE__ */ new Date(), intervalSeconds)) return { released: false };
	if (!(await sql`
    update outreach_dispatches
    set status = 'releasing'
    where id = ${row.id} and status = 'queued'
    returning id
  `)[0]) return { released: false };
	const channel = row.channel === "sms" ? "sms" : "email";
	const mode = parseOutreachMode(row.mode);
	let messages = [];
	try {
		const parsed = JSON.parse(row.payload);
		messages = Array.isArray(parsed) ? parsed : [];
	} catch {
		messages = [];
	}
	const slugs = slugList(messages.map((message) => message.leadSlug));
	const clicked = /* @__PURE__ */ new Set();
	if (slugs) {
		const hits = await sql`
      select distinct lead_slug from funnel_visits
      where lead_slug <> ''
        and verified = true
        and lead_slug = any(string_to_array(${slugs}, ','))
    `;
		for (const hit of hits) clicked.add(hit.lead_slug);
	}
	let status = "skipped";
	let detail = "Nothing to release";
	const delivered = [];
	const stopped = [];
	if (messages.length === 0) {
		status = "failed";
		detail = "Chunk payload was empty";
	} else if (!outreachMayCallProviders(mode)) {
		for (const message of messages) if (clicked.has(message.leadSlug)) stopped.push(message.leadSlug);
		else delivered.push(message.leadSlug);
		status = delivered.length === 0 ? "skipped" : "logged";
		detail = stopped.length > 0 ? `Simulation log for ${delivered.length} leads. ${stopped.length} stopped after opening the booking link. No provider call.` : `Simulation log for ${delivered.length} leads. No provider call.`;
	} else {
		const { missingOutreachCredentials, deliverOutreachMessage } = await import("./notify.server-CC7V6aj_.mjs");
		const missing = missingOutreachCredentials();
		if (missing.length > 0) {
			status = "failed";
			detail = `Live outreach needs ${missing.join(", ")}`;
		} else {
			const notes = [];
			let failed = 0;
			for (const message of messages) {
				if (clicked.has(message.leadSlug)) {
					stopped.push(message.leadSlug);
					continue;
				}
				if (channel === "sms" && !message.to.startsWith("+")) {
					failed += 1;
					notes.push(`${message.leadSlug}: phone is not dialable`);
					continue;
				}
				const result = await deliverOutreachMessage({
					channel,
					to: message.to,
					subject: message.subject,
					body: message.body
				});
				if (result.status === "sent") delivered.push(message.leadSlug);
				else {
					failed += 1;
					notes.push(`${message.leadSlug}: ${result.detail || result.status}`);
				}
			}
			if (delivered.length === 0 && failed === 0) status = "skipped";
			else if (failed > 0) status = "failed";
			else status = "sent";
			const summary = `${delivered.length} sent, ${stopped.length} stopped, ${failed} failed`;
			detail = notes.length > 0 ? `${summary}. ${notes.slice(0, 3).join("; ")}` : summary;
		}
	}
	await sql`
    update outreach_dispatches
    set status = ${status}, sent_at = now(), detail = ${detail.slice(0, 400)}
    where id = ${row.id}
  `;
	if (delivered.length > 0) await markDayZero(sql, row.campaign_id, delivered, "sent");
	if (stopped.length > 0) await markDayZero(sql, row.campaign_id, stopped, "skipped");
	return { released: true };
}
/**
* Send due Day 3 and Day 6 touches. Simulation writes the live wire.
* Live mode calls Resend or Twilio, and only then marks the touch sent.
*/
async function drainNurtureTouches(sql) {
	const config = readOutreachConfig();
	const credentialsReady = config.mode === "live" ? (await import("./notify.server-CC7V6aj_.mjs")).missingOutreachCredentials().length === 0 : false;
	const plan = nurtureReleasePlan(config.mode, credentialsReady);
	if (plan === "hold") return { released: 0 };
	const due = await sql`
    select t.id, t.step, t.body, t.attempts, s.id as sequence_id, s.lead_slug, s.channel, s.county,
      s.trade_type, s.timing, l.contact_email, l.contact_phone
    from outreach_touches t
    join outreach_sequences s on s.id = t.sequence_id
    left join preloaded_leads l on l.lead_slug = s.lead_slug
    where t.status = 'scheduled'
      and t.step in (3, 6)
      and t.scheduled_at <= now()
      and s.status = 'active'
    order by t.scheduled_at asc, t.step asc
    limit 24
  `;
	const now = /* @__PURE__ */ new Date();
	const batch = [];
	for (const row of due) {
		if (!isDueNurtureStep(numStep(row.step))) continue;
		const timing = parseSendTiming(row.timing);
		const profile = timing === "smart" ? timingProfileFor(row.trade_type) : "general";
		if (!insideSendWindow(now, timing, profile)) {
			await sql`
        update outreach_touches
        set scheduled_at = ${nextSendInstant(now, timing, profile).toISOString()}
        where id = ${row.id} and status = 'scheduled'
      `;
			continue;
		}
		batch.push(row);
		if (batch.length >= config.chunkSize) break;
	}
	if (batch.length === 0) return { released: 0 };
	const lastSent = (await sql`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `)[0]?.sent_at;
	const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
	if (!trickleMayRelease(lastSentAt, /* @__PURE__ */ new Date(), config.intervalSeconds)) return { released: 0 };
	let sent = 0;
	let failed = 0;
	const channel = batch[0]?.channel === "sms" ? "sms" : "email";
	const county = batch[0]?.county ?? "";
	for (const touch of batch) {
		if (!(await sql`
      update outreach_touches
      set attempts = attempts + 1
      where id = ${touch.id} and status = 'scheduled' and attempts < 3
      returning id
    `)[0]) continue;
		if (await releaseNurtureTouch(touch, touch.channel === "sms" ? "sms" : "email", plan) === "sent") {
			sent += 1;
			await sql`update outreach_touches set status = 'sent' where id = ${touch.id}`;
			await sql`
        update outreach_sequences s
        set status = 'complete', stopped_reason = ''
        where s.id = ${touch.sequence_id}
          and s.status = 'active'
          and not exists (
            select 1 from outreach_touches t
            where t.sequence_id = s.id and t.status = 'scheduled'
          )
      `;
		} else {
			failed += 1;
			if (numStep(touch.attempts) + 1 >= 3) await sql`update outreach_touches set status = 'skipped' where id = ${touch.id} and status = 'scheduled'`;
			else await sql`
          update outreach_touches
          set scheduled_at = ${new Date(Date.now() + config.intervalSeconds * 1e3).toISOString()}
          where id = ${touch.id} and status = 'scheduled'
        `;
		}
	}
	if (sent + failed === 0) return { released: 0 };
	const status = plan === "log" ? "logged" : failed > 0 ? "failed" : "sent";
	const summary = plan === "log" ? `Day 3/6 simulation log for ${sent} leads. No provider call.` : `${sent} sent, ${failed} failed`;
	await sql`
    insert into outreach_events (id, county, channel, summary, status)
    values (${newId("evt")}, ${county}, ${channel}, ${summary}, ${status})
  `;
	return { released: sent };
}
async function releaseNurtureTouch(touch, channel, plan) {
	if (plan === "log") return "sent";
	const { deliverOutreachMessage } = await import("./notify.server-CC7V6aj_.mjs");
	if (channel === "sms") {
		const to = toE164(touch.contact_phone ?? "");
		if (!to) return "failed";
		return (await deliverOutreachMessage({
			channel,
			to,
			subject: "",
			body: touch.body.slice(0, 640)
		})).status === "sent" ? "sent" : "failed";
	}
	const to = (touch.contact_email ?? "").trim();
	if (!to) return "failed";
	const message = splitOutreachEmail(touch.body);
	return (await deliverOutreachMessage({
		channel,
		to,
		subject: message.subject,
		body: message.text
	})).status === "sent" ? "sent" : "failed";
}
function numStep(value) {
	if (typeof value === "bigint") return Number(value);
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
async function markDayZero(sql, campaignId, slugs, status) {
	const list = slugList(slugs);
	if (!list) return;
	await sql`
    update outreach_touches
    set status = ${status}
    where step = 0
      and status = 'scheduled'
      and sequence_id in (
        select id from outreach_sequences
        where campaign_id = ${campaignId}
          and lead_slug = any(string_to_array(${list}, ','))
      )
  `;
}
//#endregion
export { drainNurtureTouches, drainOutreachQueue, ensureOutreachWorker, readOutreachConfig };
