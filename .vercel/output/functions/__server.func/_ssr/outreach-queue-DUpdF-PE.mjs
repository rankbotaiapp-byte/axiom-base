//#region node_modules/.nitro/vite/services/ssr/assets/outreach-queue-DUpdF-PE.js
/** Anything other than an explicit live value stays in simulation. */
function parseOutreachMode(value) {
	return value?.trim().toLowerCase() === "live" ? "live" : "simulation";
}
/** Configurable gap between chunks. Values outside 30–60 seconds clamp into that range. */
function parseTrickleSeconds(value) {
	const raw = String(value ?? "").trim();
	if (!raw) return 45;
	const n = Number(raw);
	if (!Number.isFinite(n)) return 45;
	return Math.min(60, Math.max(30, Math.round(n)));
}
/** Leads released together. Defaults to 5, and stays between 1 and 20. */
function parseChunkSize(value) {
	const raw = String(value ?? "").trim();
	if (!raw) return 5;
	const n = Number(raw);
	if (!Number.isFinite(n)) return 5;
	return Math.min(20, Math.max(1, Math.round(n)));
}
/** A later chunk may leave the queue only after the previous release has aged a full interval. */
function trickleMayRelease(lastSentAt, now, intervalSeconds) {
	if (!lastSentAt) return true;
	const then = new Date(lastSentAt).getTime();
	if (!Number.isFinite(then)) return true;
	return now.getTime() - then >= intervalSeconds * 1e3;
}
/** Simulation never calls a provider. Live is the only mode allowed to. */
function outreachMayCallProviders(mode) {
	return mode === "live";
}
/** Home-region clock. Vercel runs in UTC, so wall-clock hours are Pacific. */
var OUTREACH_TIME_ZONE = "America/Los_Angeles";
var WEEKDAYS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
var GUARDRAIL = {
	days: /* @__PURE__ */ new Set([
		1,
		2,
		3,
		4
	]),
	ranges: [{
		start: 480,
		end: 1140
	}]
};
var PROFILE_CLOCKS = {
	trades: {
		days: /* @__PURE__ */ new Set([
			1,
			2,
			3,
			4
		]),
		ranges: [{
			start: 420,
			end: 510
		}, {
			start: 990,
			end: 1080
		}]
	},
	salon: {
		days: /* @__PURE__ */ new Set([1, 2]),
		ranges: [{
			start: 480,
			end: 660
		}]
	},
	general: {
		days: /* @__PURE__ */ new Set([
			1,
			2,
			3,
			4
		]),
		ranges: [{
			start: 600,
			end: 840
		}]
	}
};
var TRADE_PROFILES = /* @__PURE__ */ new Set([
	"contractor",
	"clean",
	"field",
	"hvac",
	"plumbing",
	"electrical",
	"roofing",
	"landscaping",
	"air-conditioning"
]);
var SALON_PROFILES = /* @__PURE__ */ new Set(["salon", "beauty"]);
function parseSendTiming(value) {
	return value === "smart" ? "smart" : "immediate";
}
function parseTimingProfile(value) {
	return value === "trades" || value === "salon" || value === "general" ? value : "general";
}
/** HVAC, plumbing, contractors, and the other home-service keys share the early/late window. */
function timingProfileFor(tradeType) {
	const key = tradeType.trim().toLowerCase();
	if (SALON_PROFILES.has(key)) return "salon";
	if (TRADE_PROFILES.has(key)) return "trades";
	if (key.includes("hvac") || key.includes("plumb") || key.includes("air-condition")) return "trades";
	return "general";
}
function sendWindowBlurb(timing, profile) {
	if (timing === "immediate") return "Monday–Thursday, 8:00 AM–7:00 PM Pacific. A launch outside that window stays queued until it opens.";
	if (profile === "trades") return "Home services wait for 7:00–8:30 AM or 4:30–6:00 PM, Monday–Thursday.";
	if (profile === "salon") return "Salons and beauty wait for Monday or Tuesday, 8:00–11:00 AM.";
	if (profile === "general") return "This trade waits for Monday–Thursday, 10:00 AM–2:00 PM.";
	return "Home services use early morning or late afternoon. Salons and beauty use Monday and Tuesday mornings. Every other trade uses 10:00 AM–2:00 PM.";
}
function zonedParts(date, timeZone) {
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	});
	const bag = {};
	for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
	let hour = Number(bag.hour);
	if (hour === 24) hour = 0;
	const weekday = WEEKDAYS.indexOf(bag.weekday);
	return {
		year: Number(bag.year),
		month: Number(bag.month),
		day: Number(bag.day),
		weekday: weekday < 0 ? 0 : weekday,
		minutes: hour * 60 + Number(bag.minute)
	};
}
function timeZoneOffsetMs(instant, timeZone) {
	const parts = zonedParts(instant, timeZone);
	return Date.UTC(parts.year, parts.month - 1, parts.day, Math.floor(parts.minutes / 60), parts.minutes % 60, 0) - instant.getTime();
}
function zonedDateTime(year, month, day, minutes, timeZone) {
	const hour = Math.floor(minutes / 60);
	const minute = minutes % 60;
	const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
	let utc = utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone);
	const adjusted = utcGuess - timeZoneOffsetMs(new Date(utc), timeZone);
	if (adjusted !== utc) utc = adjusted;
	return new Date(utc);
}
function addCalendarDays(year, month, day, add) {
	const utc = new Date(Date.UTC(year, month - 1, day + add));
	return {
		year: utc.getUTCFullYear(),
		month: utc.getUTCMonth() + 1,
		day: utc.getUTCDate(),
		weekday: utc.getUTCDay()
	};
}
function sendClock(timing, profile) {
	return timing === "smart" ? PROFILE_CLOCKS[profile] : GUARDRAIL;
}
function minuteInside(minutes, clock, weekday) {
	if (!clock.days.has(weekday)) return false;
	return clock.ranges.some((range) => minutes >= range.start && minutes < range.end);
}
/** True when this instant is inside the guardrail, or inside the niche window when smart timing is on. */
function insideSendWindow(now, timing, profile, timeZone = OUTREACH_TIME_ZONE) {
	const parts = zonedParts(now, timeZone);
	return minuteInside(parts.minutes, sendClock(parseSendTiming(timing), parseTimingProfile(profile)), parts.weekday);
}
/**
* The next moment a chunk may leave. Inside the window, that moment is `now`.
* Nights, Fridays, and weekends move to the next open morning.
*/
function nextSendInstant(now, timing, profile, timeZone = OUTREACH_TIME_ZONE) {
	const clock = sendClock(parseSendTiming(timing), parseTimingProfile(profile));
	const parts = zonedParts(now, timeZone);
	if (minuteInside(parts.minutes, clock, parts.weekday)) return now;
	const ranges = [...clock.ranges].sort((a, b) => a.start - b.start);
	for (let add = 0; add < 8; add += 1) {
		const day = addCalendarDays(parts.year, parts.month, parts.day, add);
		if (!clock.days.has(day.weekday)) continue;
		for (const range of ranges) {
			if (add === 0 && parts.minutes >= range.start) continue;
			const instant = zonedDateTime(day.year, day.month, day.day, range.start, timeZone);
			if (instant.getTime() >= now.getTime() - 1e3) return instant;
		}
	}
	return now;
}
function formatSendSlot(date, timeZone = OUTREACH_TIME_ZONE) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "long",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short"
	}).format(date);
}
/**
* Same spacing as `planTrickleChunks`, with each slot snapped into the send window.
* A chunk that would land after close waits until the next open morning.
*/
function planWindowedChunks(items, options) {
	const size = Math.max(1, Math.floor(options.chunkSize));
	const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1e3;
	const timeZone = options.timeZone ?? "America/Los_Angeles";
	const chunks = [];
	let cursor = nextSendInstant(options.start, options.timing, options.profile, timeZone);
	for (let offset = 0; offset < items.length; offset += size) {
		chunks.push({
			index: chunks.length,
			items: items.slice(offset, offset + size),
			scheduledAt: cursor.toISOString()
		});
		cursor = nextSendInstant(new Date(cursor.getTime() + intervalMs), options.timing, options.profile, timeZone);
	}
	return chunks;
}
/**
* Immediate mode keeps one list on the weekday window.
* Smart mode splits the list by trade so a salon lead does not ride an HVAC clock.
*/
function planSmartChunks(items, options) {
	const timing = parseSendTiming(options.timing);
	const groups = /* @__PURE__ */ new Map();
	for (const item of items) {
		const profile = timing === "smart" ? timingProfileFor(item.tradeType ?? "") : "general";
		const list = groups.get(profile) ?? [];
		list.push(item);
		groups.set(profile, list);
	}
	const planned = [];
	for (const [profile, group] of groups) for (const chunk of planWindowedChunks(group, {
		...options,
		timing,
		profile
	})) planned.push({
		...chunk,
		profile
	});
	planned.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
	return planned.map((chunk, index) => ({
		...chunk,
		index
	}));
}
//#endregion
export { parseChunkSize as a, parseTimingProfile as c, sendWindowBlurb as d, timingProfileFor as f, outreachMayCallProviders as i, parseTrickleSeconds as l, insideSendWindow as n, parseOutreachMode as o, trickleMayRelease as p, nextSendInstant as r, parseSendTiming as s, formatSendSlot as t, planSmartChunks as u };
