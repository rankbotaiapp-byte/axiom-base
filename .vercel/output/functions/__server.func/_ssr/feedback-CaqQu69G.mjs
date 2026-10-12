//#region node_modules/.nitro/vite/services/ssr/assets/feedback-CaqQu69G.js
var DEFAULTS = {
	neon: true,
	haptics: true
};
function key(scope) {
	return `axiom:feedback:${scope}`;
}
function readFeedback(scope) {
	if (typeof window === "undefined") return DEFAULTS;
	try {
		const raw = window.localStorage.getItem(key(scope));
		if (!raw) return DEFAULTS;
		const parsed = JSON.parse(raw);
		return {
			neon: parsed.neon !== false,
			haptics: parsed.haptics !== false
		};
	} catch {
		return DEFAULTS;
	}
}
function writeFeedback(scope, next) {
	window.localStorage.setItem(key(scope), JSON.stringify(next));
	window.dispatchEvent(new Event("axiom-feedback"));
}
function pulseHaptic(kind) {
	if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
	navigator.vibrate(kind === "incoming" ? [
		28,
		36,
		28,
		36,
		90
	] : [
		18,
		24,
		18
	]);
}
//#endregion
export { readFeedback as n, writeFeedback as r, pulseHaptic as t };
