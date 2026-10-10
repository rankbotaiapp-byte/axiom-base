//#region node_modules/.nitro/vite/services/ssr/assets/funnel-guard-BnfVmfEx.js
function newStopToken() {
	const bytes = /* @__PURE__ */ new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function hashStopToken(token) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
/** Constant-time compare for two hex digests. An empty stored hash never matches. */
function tokenHashMatches(actual, stored) {
	if (!actual || !stored || actual.length !== stored.length) return false;
	let diff = 0;
	for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ stored.charCodeAt(i);
	return diff === 0;
}
function funnelBucketOpen(hitsInWindow, limit) {
	return hitsInWindow < limit;
}
function isDueNurtureStep(step) {
	return step === 3 || step === 6;
}
/** Simulation logs the touch. Live sends only when both providers are configured. */
function nurtureReleasePlan(mode, credentialsReady) {
	if (mode !== "live") return "log";
	if (!credentialsReady) return "hold";
	return "send";
}
/** Day 3 and Day 6 emails are stored as subject, blank line, then body. */
function splitOutreachEmail(body) {
	const breakAt = body.indexOf("\n\n");
	if (breakAt === -1) return {
		subject: body.slice(0, 140),
		text: body
	};
	return {
		subject: body.slice(0, breakAt).slice(0, 200),
		text: body.slice(breakAt + 2)
	};
}
//#endregion
export { nurtureReleasePlan as a, newStopToken as i, hashStopToken as n, splitOutreachEmail as o, isDueNurtureStep as r, tokenHashMatches as s, funnelBucketOpen as t };
