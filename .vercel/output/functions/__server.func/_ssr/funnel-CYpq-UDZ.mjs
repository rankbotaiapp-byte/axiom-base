//#region node_modules/.nitro/vite/services/ssr/assets/funnel-CYpq-UDZ.js
/** Saved on the visitor's browser until onboarding claims the business. */
var LEAD_STORAGE_KEY = "axiom.lead";
var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function clip(value, max) {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, max);
}
function isLeadSlug(value) {
	return SLUG.test(value);
}
/** Business + city becomes the tracking slug. */
function leadSlugFrom(businessName, city) {
	return `${businessName} ${city}`.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64) || "lead";
}
function parseFunnelQuery(source) {
	const fromB = clip(source.b, 64).toLowerCase();
	const fromLead = clip(source.lead_slug, 64).toLowerCase();
	const leadSlug = isLeadSlug(fromB) ? fromB : isLeadSlug(fromLead) ? fromLead : "";
	const stopToken = clip(source.t, 80).toLowerCase();
	return {
		leadSlug,
		utmSource: clip(source.utm_source, 80),
		county: clip(source.county, 80),
		stopToken: /^[a-f0-9]{32,80}$/.test(stopToken) ? stopToken : ""
	};
}
/** Optional keys only, so existing links to the homepage stay valid. */
function parseFunnelSearch(source) {
	const query = parseFunnelQuery(source);
	return {
		...query.leadSlug ? {
			b: query.leadSlug,
			lead_slug: query.leadSlug
		} : {},
		...query.utmSource ? { utm_source: query.utmSource } : {},
		...query.county ? { county: query.county } : {},
		...query.stopToken ? { t: query.stopToken } : {},
		...source.pitch === true || source.pitch === "1" || source.pitch === "true" ? { pitch: true } : {},
		...source.greet === true || source.greet === "1" || source.greet === "true" ? { greet: true } : {},
		...clip(source.biz, 80) ? { biz: clip(source.biz, 80) } : {},
		...clip(source.trade, 80) ? { trade: clip(source.trade, 80) } : {},
		...clip(source.city, 80) ? { city: clip(source.city, 80) } : {},
		.../^cs_[A-Za-z0-9_]+$/.test(clip(source.session_id, 80)) ? { session_id: clip(source.session_id, 80) } : {}
	};
}
var OUTREACH_STRATEGIES = [
	{
		id: "done-for-you",
		label: "Done-For-You Hook",
		line: "The booking page is already built. They only claim it.",
		text: "{owner} — {business} has {website}. A {trade} booking page for {city} is already built. Claim it before another shop in {county} does.\n{url}\nAsk Eric greets {business} on that page.",
		emailSubject: "{owner}, the {business} page is already live",
		emailBody: "Hi {owner},\n\n{business} has {website}. The {trade} page for {city} is built, ahead of the other shops in {county}. Reviews on file: {reviews}.\n\nClaim it here:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOnce you open it, the page is yours."
	},
	{
		id: "missed-calls",
		label: "Missed Calls Hook",
		line: "A call they miss while with a client becomes a booking.",
		text: "{owner}, calls to the {line} at {business} go quiet mid-appointment. Your {trade} page in {city} takes the request.\n{url}\nAsk Eric greets {business} on that page.",
		emailSubject: "The {line} at {business} didn't pick up",
		emailBody: "Hi {owner},\n\nWhile you're with a client, the {line} at {business} goes to voicemail and that {trade} job walks to the next shop in {county}.\n\nThis page takes the booking instead:\n{url}\n\nAsk Eric greets {business} on that page.\n\nThey pick a time. You see it when you're free."
	},
	{
		id: "competitor-edge",
		label: "Competitor Edge Hook",
		line: "Other shops in the county already take the online book.",
		text: "{owner} — other {trade} shops in {county} are taking the online book. {business} is listed with {reviews} and {website}.\n{url}\nAsk Eric greets {business} on that page.",
		emailSubject: "{county} shops are ahead of {business}",
		emailBody: "Hi {owner},\n\nPeople in {county} already book {trade} work without calling. {business} is listed with {reviews} and {website}.\n\nYour page is ready:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOpen it and the link is yours."
	}
];
function outreachStrategy(id) {
	return OUTREACH_STRATEGIES.find((item) => item.id === id) ?? OUTREACH_STRATEGIES[0];
}
function parsePhoneLine(value) {
	const raw = String(value ?? "").trim().toLowerCase();
	if (raw === "" || raw === "unknown") return "";
	if (raw === "mobile" || raw === "cell") return "mobile";
	if (raw === "landline" || raw === "land line") return "landline";
	throw new Error("Phone line must be mobile or landline");
}
function parseHasWebsite(value) {
	if (value == null || value === "" || value === "unknown") return null;
	if (typeof value === "boolean") return value;
	const raw = String(value).trim().toLowerCase();
	if (raw === "yes" || raw === "true") return true;
	if (raw === "no" || raw === "false") return false;
	throw new Error("Website status must be yes or no");
}
function parseReviewScore(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(String(value).trim());
	if (!Number.isFinite(n) || n < 0 || n > 5) throw new Error("Review score must be between 0 and 5");
	return Math.round(n * 10) / 10;
}
function parseReviewCount(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(String(value).trim());
	if (!Number.isInteger(n) || n < 0 || n > 1e6) throw new Error("Review count must be a whole number");
	return n;
}
function readScore(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
function readCount(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	return Number.isInteger(n) ? n : null;
}
function publicLeadFromRow(row) {
	const line = String(row.phone_line ?? "").trim().toLowerCase();
	return {
		contactName: (row.contact_name ?? "").trim(),
		reviewScore: readScore(row.review_score),
		reviewCount: readCount(row.review_count),
		hasWebsite: typeof row.has_website === "boolean" ? row.has_website : null,
		phoneLine: line === "mobile" || line === "landline" ? line : ""
	};
}
function outreachPublicTokens(facts, business) {
	const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
	const reviews = facts.reviewScore == null ? "no public reviews" : facts.reviewCount == null ? `${score} on public reviews` : `${score} from ${facts.reviewCount} reviews`;
	const website = facts.hasWebsite == null ? "no website listed" : facts.hasWebsite ? "a website already up" : "no website";
	const line = facts.phoneLine === "mobile" ? "mobile" : facts.phoneLine === "landline" ? "landline" : "listed number";
	return {
		owner: facts.contactName || business || "{owner}",
		reviews,
		website,
		line
	};
}
var EMAIL_READY = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
/** A lead is email-ready only when the address is present and shaped like one. */
function isEmailReady(value) {
	const email = value.trim().toLowerCase();
	if (email.length < 6 || email.length > 120) return false;
	return EMAIL_READY.test(email);
}
/** A lead is SMS-ready only when the listed line is classified as mobile. */
function isSmsReady(phoneLine) {
	return phoneLine === "mobile";
}
function leadChannelTags(lead) {
	const tags = [];
	if (isSmsReady(lead.phoneLine)) tags.push("SMS-ready");
	if (isEmailReady(lead.contactEmail)) tags.push("Email-ready");
	if (tags.length === 0) tags.push("No channel");
	return tags;
}
/** Short labels for the lead grid. */
function leadPublicTags(facts) {
	const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
	const reviews = facts.reviewScore == null ? "No reviews" : facts.reviewCount == null ? score : `${score} · ${facts.reviewCount}`;
	return [
		facts.contactName || "No owner",
		reviews,
		facts.hasWebsite == null ? "Website unknown" : facts.hasWebsite ? "Has website" : "No website",
		facts.phoneLine === "mobile" ? "Mobile" : facts.phoneLine === "landline" ? "Landline" : "Line unknown"
	];
}
/** Fill the lead, its public listing, and its tracking link into a text or email draft. */
function renderOutreachMessage(template, lead) {
	return template.replaceAll("{business}", lead.business).replaceAll("{url}", lead.url).replaceAll("{trade}", lead.trade ?? "").replaceAll("{county}", lead.county ?? "").replaceAll("{city}", lead.city ?? "").replaceAll("{owner}", lead.owner ?? "").replaceAll("{reviews}", lead.reviews ?? "").replaceAll("{website}", lead.website ?? "").replaceAll("{line}", lead.line ?? "");
}
function packOutreachPackage(draft) {
	const channel = draft.channel === "email" || draft.channel === "sms" ? draft.channel : "";
	return JSON.stringify({
		strategy: outreachStrategy(draft.strategy).id,
		text: draft.text,
		emailSubject: draft.emailSubject,
		emailBody: draft.emailBody,
		channel,
		queue: channel ? "trickle" : ""
	});
}
var FOLLOW_UP_STEPS = [
	{
		day: 0,
		label: "Day 0 Initial Hook"
	},
	{
		day: 3,
		label: "Day 3 Competitor Proof Bump"
	},
	{
		day: 6,
		label: "Day 6 Loss Aversion Final Call"
	}
];
/** Day 0 goes out with the launch. Day 3 and Day 6 wait, unless the lead already clicked. */
function followUpSchedule(from) {
	return FOLLOW_UP_STEPS.map((step) => ({
		day: step.day,
		label: step.label,
		scheduledAt: new Date(from.getTime() + step.day * 864e5).toISOString(),
		status: step.day === 0 ? "sent" : "scheduled"
	}));
}
/** Template for one step. Day 0 reuses the hook that launched the batch. */
function followUpBody(day, channel, launched) {
	if (day === 0) return channel === "sms" ? launched.text : `${launched.emailSubject}\n\n${launched.emailBody}`;
	if (day === 3) return channel === "sms" ? "{owner} — {business} still has not opened the page. Other {trade} shops in {county} took the book. Listed with {reviews}.\n{url}" : "{county} booked while {business} waited\n\nHi {owner},\n\nOther {trade} shops in {county} kept taking the online book. {business} is still listed with {reviews} and {website}, and the page has not been opened.\n\nThe proof is the link:\n{url}";
	return channel === "sms" ? "{owner}, last note for {business}. The {city} page is pulled if it stays unclaimed.\n{url}" : "Last call for the {business} page\n\nHi {owner},\n\nThis is the last note. The {trade} page for {city} comes off the book if {business} leaves it unclaimed.\n\n{url}";
}
function nurtureStatus(input) {
	if (input.touches.length === 0) return "none";
	if (input.clicked) return "stopped";
	if (input.touches.some((touch) => touch.status === "scheduled")) return "active";
	return "complete";
}
function channelFromPackage(stored) {
	if (!stored.startsWith("{")) return "";
	try {
		const parsed = JSON.parse(stored);
		return parsed.channel === "email" || parsed.channel === "sms" ? parsed.channel : "";
	} catch {
		return "";
	}
}
function strategyLabelFromPackage(stored) {
	if (!stored.startsWith("{")) return "";
	try {
		const parsed = JSON.parse(stored);
		if (!parsed.strategy) return "";
		return OUTREACH_STRATEGIES.find((item) => item.id === parsed.strategy)?.label ?? "";
	} catch {
		return "";
	}
}
function funnelUrl(origin, lead) {
	const base = origin.replace(/\/$/, "");
	const url = new URL("/", base.endsWith("/") ? base : `${base}/`);
	url.searchParams.set("b", lead.leadSlug);
	if (lead.county) url.searchParams.set("county", lead.county);
	url.searchParams.set("utm_source", "regional");
	if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
	if (lead.greet) {
		url.searchParams.set("greet", "1");
		const business = (lead.businessName ?? "").trim().slice(0, 80);
		const trade = (lead.trade ?? "").trim().slice(0, 80);
		const city = (lead.city ?? "").trim().slice(0, 80);
		if (business) url.searchParams.set("biz", business);
		if (trade) url.searchParams.set("trade", trade);
		if (city) url.searchParams.set("city", city);
	}
	return url.toString();
}
//#endregion
export { publicLeadFromRow as C, parseReviewScore as S, strategyLabelFromPackage as T, parseFunnelQuery as _, followUpSchedule as a, parsePhoneLine as b, isLeadSlug as c, leadPublicTags as d, leadSlugFrom as f, packOutreachPackage as g, outreachStrategy as h, followUpBody as i, isSmsReady as l, outreachPublicTokens as m, OUTREACH_STRATEGIES as n, funnelUrl as o, nurtureStatus as p, channelFromPackage as r, isEmailReady as s, LEAD_STORAGE_KEY as t, leadChannelTags as u, parseFunnelSearch as v, renderOutreachMessage as w, parseReviewCount as x, parseHasWebsite as y };
