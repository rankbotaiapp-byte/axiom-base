import { i as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { n as classifyTrade, r as isTradeKey, t as classifyFiling } from "./directory-LRUyGbzu.mjs";
import { I as createSsrRpc } from "./server-CiF75qCF.mjs";
import { C as parseReviewScore, S as parseReviewCount, _ as packOutreachPackage, b as parseHasWebsite, g as outreachStrategy, l as isLeadSlug, p as leadSlugFrom, v as parseFunnelQuery, x as parsePhoneLine } from "./funnel-DCLKTLeU.mjs";
import { s as parseSendTiming } from "./outreach-queue-DUpdF-PE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/master-DEaTtFOs.js
var masterGate = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("25f0e0bdcc66f9ac529ba34007dc7f691a379b30ab4170eb2166a320b8b710ef"));
var getMasterDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5624f699119e3f57dd0f89aed9a663864d25ef72d40ab8e3a7022c6b9dff71ca"));
function cleanLead(input) {
	const businessName = (input.businessName ?? "").trim().slice(0, 80);
	const city = (input.city ?? "").trim().slice(0, 80);
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (businessName.length < 2) throw new Error("Business name is required");
	if (city.length < 2) throw new Error("City is required");
	if (county.length < 2) throw new Error("County is required");
	const classified = classifyFiling(businessName, trade);
	const requested = (input.leadSlug ?? "").trim().toLowerCase();
	const leadSlug = requested ? requested : leadSlugFrom(businessName, city);
	if (!isLeadSlug(leadSlug)) throw new Error("Lead slug must be lowercase letters, numbers, and hyphens");
	return {
		businessName,
		tradeType: classified.tradeType,
		tradeLabel: classified.tradeLabel,
		city,
		county,
		leadSlug,
		contactEmail: (input.contactEmail ?? "").trim().toLowerCase().slice(0, 120),
		contactPhone: (input.contactPhone ?? "").trim().slice(0, 40),
		contactName: (input.contactName ?? "").trim().slice(0, 80),
		reviewScore: parseReviewScore(input.reviewScore),
		reviewCount: parseReviewCount(input.reviewCount),
		hasWebsite: parseHasWebsite(input.hasWebsite),
		phoneLine: parsePhoneLine(input.phoneLine)
	};
}
var addPreloadedLeads = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.leads) || input.leads.length === 0) throw new Error("Add at least one business");
	if (input.leads.length > 40) throw new Error("Add up to 40 businesses at a time");
	return { leads: input.leads.map(cleanLead) };
}).handler(createSsrRpc("1657405ce36a9728aef08b3fa66bfaccdd216476322818c662342a2b03e11fb3"));
var createOutreachFunnel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const businessName = String(input?.businessName ?? "").trim();
	const niche = String(input?.niche ?? "").trim();
	const contact = String(input?.contact ?? "").trim().slice(0, 120);
	const city = String(input?.city ?? "").trim();
	const county = String(input?.county ?? "").trim() || city;
	const email = contact.includes("@") ? contact.toLowerCase() : "";
	const phone = email ? "" : contact;
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email required");
	if (!email && phone.replace(/\D/g, "").length < 7) throw new Error("Email or phone is required");
	return {
		businessName,
		niche,
		email,
		phone,
		city,
		county
	};
}).handler(createSsrRpc("6172ae183243a885e65a1b480a2fe058ded31ff69b1bd6726db21406af78894b"));
var listOutreachFunnels = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("25aac99d9d6c41b17f829c31947aa784c57b81b505a660a6ebf5a09aadf38a53"));
var preloadRegionalRoster = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("7ce0b5f5c0b136fb8438d5c59127d37136ea6e6d43f8c0a054dd519980156ea4"));
var generateRegionalFunnel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (county.length < 2) throw new Error("County is required");
	return {
		county,
		tradeType: classifyTrade(trade).tradeType
	};
}).handler(createSsrRpc("ad9b78312bd633e05d837f9c4e72348bb4f198db9b029c944d73009a252f1ac5"));
function readRegion(input, allowAll = false) {
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (county.length < 2) throw new Error("County is required");
	if (allowAll && (trade === "all" || trade === "")) return {
		county,
		tradeType: "all"
	};
	if (!isTradeKey(trade)) throw new Error("Pick a trade");
	return {
		county,
		tradeType: trade
	};
}
var previewOutreach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => readRegion(input, true)).handler(createSsrRpc("eba6b1256b54f5e888a20aeae4b537e1f860b277d18aefcdce44e24f9550a6da"));
var launchOutreachBatch = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const region = readRegion(input, true);
	const rawChannel = input.channel === "email" || input.channel === "sms" ? input.channel : "";
	if (rawChannel !== "email" && rawChannel !== "sms") throw new Error("Pick a channel");
	const channel = rawChannel;
	const text = (input.text ?? "").trim().slice(0, 1e3);
	const emailSubject = (input.emailSubject ?? "").trim().slice(0, 200);
	const emailBody = (input.emailBody ?? "").trim().slice(0, 4e3);
	if (channel === "sms" && text.length < 2) throw new Error("Write a text first");
	if (channel === "email" && (emailSubject.length < 2 || emailBody.length < 2)) throw new Error("Write the email first");
	const strategy = outreachStrategy(input.strategy ?? "").id;
	return {
		...region,
		channel,
		strategy,
		text,
		emailSubject,
		emailBody,
		template: packOutreachPackage({
			strategy,
			text,
			emailSubject,
			emailBody,
			channel
		}),
		timing: parseSendTiming(input.timing)
	};
}).handler(createSsrRpc("6f95e4a4a8d9a276a33faa8df724bf173a741a4708c33bd70b6c0219ec535e0f"));
var ensureFunnelSession = createServerFn({ method: "POST" }).handler(createSsrRpc("b19422a4a01c081349d7be298a91341f84c834a405334af7fbd1671af476111c"));
var recordFunnelHit = createServerFn({ method: "POST" }).validator((input) => {
	return parseFunnelQuery({
		b: input?.leadSlug,
		utm_source: input?.utmSource,
		county: input?.county,
		t: input?.stopToken
	});
}).handler(createSsrRpc("820f9d0c90440fce6be84c7237481eb461570abab4896925ad6f27c5a9e54eea"));
var recordMasterDeskOpen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug.trim()).handler(createSsrRpc("3ced656494e31ea1642e9193d1ef20073eb05eaedaaf4f9dd08f7df17271e018"));
var getLeadPreview = createServerFn({ method: "POST" }).validator((leadSlug) => {
	const slug = String(leadSlug ?? "").trim().toLowerCase();
	if (!isLeadSlug(slug)) throw new Error("Unknown business");
	return slug;
}).handler(createSsrRpc("eae2583b6326e6c757210ab39a75b70a29abe38acefc49085f43acdfa5f86df8"));
var beginTerritoryCheckout = createServerFn({ method: "POST" }).validator((input) => {
	const leadSlug = String(input?.leadSlug ?? "").trim().toLowerCase();
	const planId = String(input?.planId ?? "").trim();
	if (!isLeadSlug(leadSlug)) throw new Error("Unknown business");
	if (planId !== "trial" && planId !== "growth" && planId !== "lifetime") throw new Error("Unknown plan");
	return {
		leadSlug,
		planId
	};
}).handler(createSsrRpc("533135ce7d5eec3875c191f959caba10e53b833331ace11336fc51ccbc4f05d2"));
var finishTerritoryCheckout = createServerFn({ method: "POST" }).validator((input) => {
	const checkoutId = String(input?.checkoutId ?? "").trim();
	const paymentRef = String(input?.paymentRef ?? "").trim();
	if (!/^chk_[a-z0-9]{8,32}$/.test(checkoutId)) throw new Error("Checkout expired");
	return {
		checkoutId,
		paymentRef
	};
}).handler(createSsrRpc("18918988fb06c6da077e07ca93dadcf3c24f014bed4c5f909832b29572a1a90f"));
var confirmTerritorySession = createServerFn({ method: "POST" }).validator((sessionId) => {
	const id = String(sessionId ?? "").trim();
	if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error("Invalid session");
	return id;
}).handler(createSsrRpc("9d92570641b61199c336ae9ef8f4d708444908294fa01e098f9727f39828fb45"));
var listPlatformPulse = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("94db8e265ded376e8ded8c0babbc78337d0ad1dfad7ef5a766821cb209cb2a65"));
//#endregion
export { recordMasterDeskOpen as _, ensureFunnelSession as a, getLeadPreview as c, listOutreachFunnels as d, listPlatformPulse as f, recordFunnelHit as g, previewOutreach as h, createOutreachFunnel as i, getMasterDesk as l, preloadRegionalRoster as m, beginTerritoryCheckout as n, finishTerritoryCheckout as o, masterGate as p, confirmTerritorySession as r, generateRegionalFunnel as s, addPreloadedLeads as t, launchOutreachBatch as u };
