import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { j as submitAudit } from "./server-CiF75qCF.mjs";
import { d as quoteProfile, f as serviceLane, i as impactScore, r as estimateRange } from "./storefront-CStpLjPF.mjs";
import { E as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { a as ensureFunnelSession, g as recordFunnelHit } from "./master-DEaTtFOs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/snap-estimate-CPgJSk33.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AUDIT_STEPS = [
	"Analyzing wear...",
	"Calculating impact score...",
	"Building the bracket..."
];
function NeonField({ active }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const node = ref.current?.parentElement;
		if (!node || !active) return;
		const paint = () => {
			const depth = Math.min(1, window.scrollY / 480);
			node.style.setProperty("--glow", String(.35 + depth * .65));
		};
		paint();
		window.addEventListener("scroll", paint, { passive: true });
		return () => window.removeEventListener("scroll", paint);
	}, [active]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		hidden: true
	});
}
function SnapEstimate({ lines, bookTo, niche = "trade", bookLabel = "Book now", shopSlug = "", leadSlug = "" }) {
	const profile = quoteProfile(niche);
	const [laneId, setLaneId] = (0, import_react.useState)(profile.lanes[0]?.id ?? "");
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [preview, setPreview] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [step, setStep] = (0, import_react.useState)(-1);
	const [channel, setChannel] = (0, import_react.useState)("text");
	const [name, setName] = (0, import_react.useState)("");
	const [contact, setContact] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [sent, setSent] = (0, import_react.useState)("");
	const [sendError, setSendError] = (0, import_react.useState)("");
	const lane = profile.lanes.find((item) => item.id === laneId) ?? profile.lanes[0];
	const tagged = (0, import_react.useMemo)(() => lines.map((line) => ({
		...line,
		lane: serviceLane(line.name, line.description)
	})), [lines]);
	const keyword = profile.filter === "keyword" && lane ? lane.id : "";
	const visible = keyword ? tagged.filter((line) => line.lane === keyword) : lines;
	const priced = (visible.length > 0 ? visible : lines).map((line) => line.priceCents);
	const range = (profile.photo === "off" || phase === "ready") && lane ? estimateRange(priced, lane.multiplier) : null;
	const impact = range && lane ? impactScore(lane.multiplier, range.low, range.high) : 0;
	const splitNote = fileName && keyword && visible.length === 0 ? profile.emptyLane : "";
	(0, import_react.useEffect)(() => {
		if (!preview) return;
		return () => URL.revokeObjectURL(preview);
	}, [preview]);
	function markTried() {
		if (!leadSlug) return;
		const key = `axiom.snap:${leadSlug}`;
		if (sessionStorage.getItem(key) === "1") return;
		sessionStorage.setItem(key, "1");
		ensureFunnelSession().then(() => recordFunnelHit({ data: {
			leadSlug,
			utmSource: "snap"
		} })).catch(() => void 0);
	}
	(0, import_react.useEffect)(() => {
		if (phase === "ready") markTried();
	}, [phase, leadSlug]);
	(0, import_react.useEffect)(() => {
		if (!fileName) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setStep(AUDIT_STEPS.length - 1);
			setPhase("ready");
			return;
		}
		setPhase("scan");
		setStep(0);
		let index = 0;
		const timer = window.setInterval(() => {
			index += 1;
			if (index >= AUDIT_STEPS.length) {
				setPhase("ready");
				window.clearInterval(timer);
				return;
			}
			setStep(index);
		}, 800);
		return () => window.clearInterval(timer);
	}, [fileName]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "lift-card rounded-[28px] bg-surface/80 p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: profile.kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: profile.heading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-lg text-sm text-muted",
				children: profile.helper
			}),
			profile.lanes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: profile.lanes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": lane?.id === item.id,
					onClick: () => {
						setLaneId(item.id);
						markTried();
					},
					className: `glass-btn h-11 rounded-full px-4 text-sm ${lane?.id === item.id ? "text-fg" : "text-muted"}`,
					children: item.label
				}, item.id))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "audit-well mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2/80 px-4 py-6 text-sm font-medium",
				children: [
					preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: preview,
						alt: "",
						className: "absolute inset-0 h-full w-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
						className: "relative size-4",
						"aria-hidden": true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "relative",
						children: "Upload photo for instant estimate"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "audit-laser",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "image/*",
						className: "sr-only",
						onChange: (event) => {
							const file = event.target.files?.[0];
							if (!file) return;
							if (!file.type.startsWith("image/")) {
								setNote(profile.photoNote || "Use a photo.");
								return;
							}
							setSent("");
							setSendError("");
							setFileName(`${file.name}:${file.size}:${file.lastModified}`);
							setPreview(URL.createObjectURL(file));
							setNote("");
						}
					})
				]
			}),
			phase === "scan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-4 grid gap-1",
				children: AUDIT_STEPS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: index <= step ? "text-sm text-fg" : "text-sm text-faint",
					children: label
				}, label))
			}) : null,
			note || splitNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: note || splitNote
			}) : null,
			profile.photo === "required" && phase === "idle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-faint",
				children: "Add a photo before the range appears."
			}) : range && phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl tabular",
						children: range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)} – ${formatMoney(range.high)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted",
								children: "Before"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted",
								children: "After"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3 text-muted",
								children: "Unscoped photo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3",
								children: lane?.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3 text-muted",
								children: "Impact open"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3 tabular",
								children: impact
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3 text-muted",
								children: "Price open"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "bg-surface px-3 py-3 tabular",
								children: range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)}–${formatMoney(range.high)}`
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "The score is a bracket from this shop's prices. The photo stays on this device."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-4 grid gap-3",
						onSubmit: (event) => {
							event.preventDefault();
							if (!lane || sending) return;
							setSending(true);
							setSendError("");
							submitAudit({ data: {
								shopSlug,
								leadSlug,
								name,
								channel,
								contact,
								lane: lane.label,
								lowCents: range.low,
								highCents: range.high,
								impact
							} }).then((result) => {
								if (result.id) sessionStorage.setItem("axiom:audit-watch", result.id);
								setSent(result.delivered ? "Saved on the shop's desk. They have the bracket and how to reach you." : "Saved with this business. The desk gets it when the shop is open.");
							}).catch((err) => setSendError(err instanceof Error ? err.message : "Could not save the audit")).finally(() => setSending(false));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "audit-name",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "audit-name",
									value: name,
									onChange: (event) => setName(event.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: ["text", "email"].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": channel === item,
									onClick: () => setChannel(item),
									className: `glass-btn h-11 rounded-full px-4 text-sm ${channel === item ? "text-fg" : "text-muted"}`,
									children: item === "text" ? "Text" : "Email"
								}, item))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "audit-contact",
									children: channel === "text" ? "Mobile" : "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "audit-contact",
									type: channel === "text" ? "tel" : "email",
									value: contact,
									onChange: (event) => setContact(event.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: sending,
								className: "glass-btn h-12 rounded-xl px-5 text-sm font-medium",
								children: sending ? "Saving" : channel === "text" ? "Text me this audit report" : "Email me this audit report"
							}),
							sendError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-danger",
								children: sendError
							}) : null,
							sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: sent
							}) : null
						]
					})
				]
			}) : profile.photo === "off" && range ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-3xl tabular",
				children: range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)} – ${formatMoney(range.high)}`
			}) : phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "This menu has no priced lines yet."
			}) : null,
			bookTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: bookTo,
				className: "glass-btn mt-4 inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium",
				children: bookLabel
			}) : null
		]
	});
}
//#endregion
export { SnapEstimate as n, NeonField as t };
