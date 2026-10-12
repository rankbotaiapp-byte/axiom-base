import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { h as ShieldCheck, w as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gear-guardian-checkout-CDPe_sWt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GearGuardianCheckout({ amountCents, shopName, onPaid, onCancel }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function pay() {
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/gear-guardian/checkout", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					amountCents,
					shopName
				})
			});
			const json = await res.json();
			if (!res.ok || json.status !== "success" || !json.paymentId) throw new Error(json.error || "Payment failed");
			await onPaid(json.paymentId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Payment failed");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-xl bg-surface-2 text-accent",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "Gear Guardian"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Mock processor · 2 second settle"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gg-name",
						children: "Name on card"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gg-name",
						autoComplete: "cc-name",
						placeholder: "Sal Moretti"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gg-num",
						children: "Card number"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gg-num",
						inputMode: "numeric",
						autoComplete: "cc-number",
						placeholder: "4242 4242 4242 4242",
						defaultValue: "4242 4242 4242 4242"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "gg-exp",
							children: "Expiry"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "gg-exp",
							placeholder: "12 / 28",
							defaultValue: "12 / 28",
							autoComplete: "cc-exp"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "gg-cvc",
							children: "CVC"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "gg-cvc",
							placeholder: "123",
							defaultValue: "123",
							autoComplete: "cc-csc"
						})] })]
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "lg",
					onClick: () => void pay(),
					disabled: busy,
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Authorizing"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Pay ", formatMoney(amountCents)] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: onCancel,
					disabled: busy,
					children: "Cancel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-[11px] text-faint",
				children: "Card details stay in this browser. Nothing is stored or charged."
			})
		]
	});
}
//#endregion
export { GearGuardianCheckout as t };
