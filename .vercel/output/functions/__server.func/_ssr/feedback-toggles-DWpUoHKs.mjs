import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as readFeedback, r as writeFeedback } from "./feedback-CaqQu69G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/feedback-toggles-DWpUoHKs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FeedbackToggles({ scope }) {
	const [prefs, setPrefs] = (0, import_react.useState)({
		neon: true,
		haptics: true
	});
	(0, import_react.useEffect)(() => {
		const sync = () => setPrefs(readFeedback(scope));
		sync();
		window.addEventListener("axiom-feedback", sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener("axiom-feedback", sync);
			window.removeEventListener("storage", sync);
		};
	}, [scope]);
	function update(patch) {
		const next = {
			...prefs,
			...patch
		};
		setPrefs(next);
		writeFeedback(scope, next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
			label: "Neon flash",
			hint: "Pulse the screen edge when a lead or confirmation arrives.",
			on: prefs.neon,
			onChange: (neon) => update({ neon })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
			label: "Haptic pulse",
			hint: "Vibrate this device for incoming leads and outgoing confirms.",
			on: prefs.haptics,
			onChange: (haptics) => update({ haptics })
		})]
	});
}
function Toggle({ label, hint, on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-pressed": on,
		onClick: () => onChange(!on),
		className: "flex w-full items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-sm text-muted",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `shrink-0 text-sm ${on ? "text-fg" : "text-faint"}`,
			children: on ? "On" : "Off"
		})]
	});
}
//#endregion
export { FeedbackToggles as t };
