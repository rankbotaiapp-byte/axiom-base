import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { v as ImagePlus } from "../_libs/lucide-react.mjs";
import { i as estimateJob, t as JOB_LANES, u as serviceLane } from "./storefront-6qzZj7oY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/snap-estimate-70hpQ9yG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LANE_LABEL = {
	residential: "Residential",
	commercial: "Commercial",
	emergency: "Emergency"
};
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
function SnapEstimate({ lines, bookTo }) {
	const [lane, setLane] = (0, import_react.useState)("residential");
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [preview, setPreview] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const visible = (0, import_react.useMemo)(() => lines.map((line) => ({
		...line,
		lane: serviceLane(line.name, line.description)
	})), [lines]).filter((line) => line.lane === lane);
	const priced = (visible.length > 0 ? visible : lines).map((line) => line.priceCents);
	const range = fileName ? estimateJob(priced, lane) : null;
	const splitNote = fileName && visible.length === 0 ? "This book doesn't split that way yet. The range uses the full menu." : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "lift-card rounded-[28px] bg-surface/80 p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Snap-to-Fix"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: "Instant estimate"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-lg text-sm text-muted",
				children: "The photo stays on this device. The range comes from this shop's own prices."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: JOB_LANES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": lane === item,
					onClick: () => setLane(item),
					className: `glass-btn h-11 rounded-full px-4 text-sm ${lane === item ? "text-fg" : "text-muted"}`,
					children: LANE_LABEL[item]
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "glass-btn mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
						className: "size-4",
						"aria-hidden": true
					}),
					"Upload photo for instant estimate",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "image/*",
						className: "sr-only",
						onChange: (event) => {
							const file = event.target.files?.[0];
							if (!file) return;
							if (!file.type.startsWith("image/")) {
								setNote("Use a photo of the job.");
								return;
							}
							setFileName(file.name);
							setPreview(URL.createObjectURL(file));
							setNote("");
						}
					})
				]
			}),
			preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: preview,
				alt: "",
				className: "mt-4 h-40 w-full rounded-2xl object-cover"
			}) : null,
			note || splitNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: note || splitNote
			}) : null,
			!fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-faint",
				children: "Add a photo before the range appears."
			}) : range ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-3xl tabular",
				children: range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)} – ${formatMoney(range.high)}`
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "This menu has no priced lines yet."
			}),
			bookTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: bookTo,
				className: "glass-btn mt-4 inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium",
				children: "Book now"
			}) : null
		]
	});
}
//#endregion
export { SnapEstimate as n, NeonField as t };
