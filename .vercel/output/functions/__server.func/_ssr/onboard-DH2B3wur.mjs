import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, S as useNavigate, b as Link, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as NICHES } from "./niches-ClhwYU5r.mjs";
import { r as Store, t as Truck } from "../_libs/lucide-react.mjs";
import { b as listMyShops, m as createShopFromNiche } from "./router-Cz9T8z2K.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { o as Wordmark, t as RedirectToSignIn } from "./shop-chrome-JtjEzse-.mjs";
import { t as Button } from "./button-BTEaNPOc.mjs";
import { n as Label, t as Input } from "./input-DmlJju-z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboard-DH2B3wur.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Onboard() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [existing, setExisting] = (0, import_react.useState)(null);
	const [niche, setNiche] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		listMyShops().then(setExisting).catch(() => setExisting([]));
	}, [user]);
	if (isPending || user && existing === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-48 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	const owned = existing?.find((s) => s.ownerUserId === user.id);
	if (owned) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/$shopSlug",
		params: { shopSlug: owned.slug },
		search: { tour: owned.onboardingStep !== "complete" }
	});
	async function generate() {
		if (!niche) return;
		setBusy(true);
		setError(null);
		try {
			const result = await createShopFromNiche({ data: {
				niche,
				name: name.trim() || NICHES[niche].defaultName
			} });
			await navigate({
				to: "/$shopSlug",
				params: { shopSlug: result.slug },
				search: { tour: true }
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create shop");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg px-5 py-6 sm:px-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-12 max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-muted",
					children: "Guided loop"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-4xl leading-none sm:text-5xl",
					children: "What kind of shop is this?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-lg text-muted",
					children: "We generate a live booking site with dummy staff, services, and a cinematic hero. You can rename it in the next breath."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-3 sm:grid-cols-2",
					children: Object.keys(NICHES).map((key) => {
						const n = NICHES[key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setNiche(key);
								if (!name) setName(n.defaultName);
							},
							className: "rounded-[24px] bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)] transition-[box-shadow] duration-150",
							style: niche === key ? { boxShadow: `0 0 0 1px ${n.ringColor}` } : void 0,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-9 place-items-center rounded-lg bg-surface-2",
									children: key === "location" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-[11px] uppercase tracking-[0.18em] text-muted",
									children: n.kicker
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-display text-2xl",
									children: n.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: n.blurb
								})
							]
						}, key);
					})
				}),
				niche ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "shop-name",
							children: "Shop name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "shop-name",
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: NICHES[niche].defaultName
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-4 w-full",
							size: "lg",
							disabled: busy,
							onClick: () => void generate(),
							children: busy ? "Generating site…" : "Generate live site"
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-10 text-sm text-faint",
					children: [
						"Want to browse first?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "text-muted underline-offset-4 hover:underline",
							children: "See live shops"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { Onboard as component };
