import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, S as useNavigate, b as Link, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as isShopNiche } from "./types-TYGEZdcs.mjs";
import { a as NICHE_MEDIA, i as NICHES, o as NICHE_ORDER } from "./intro-MrMOJI2L.mjs";
import { t as LEAD_STORAGE_KEY } from "./funnel-CYpq-UDZ.mjs";
import { T as listMyShops, v as createShopFromNiche } from "./router-Co1j6ZW7.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { d as Wordmark, i as LoopVideo, o as RedirectToSignIn } from "./shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { t as nicheIcon } from "./niche-icon-DpVGJd95.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboard-D0kiwHtn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Onboard() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [existing, setExisting] = (0, import_react.useState)(null);
	const [niche, setNiche] = (0, import_react.useState)(null);
	const [solo, setSolo] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [leadSlug, setLeadSlug] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		try {
			const raw = sessionStorage.getItem(LEAD_STORAGE_KEY);
			if (!raw) return;
			const saved = JSON.parse(raw);
			if (typeof saved.leadSlug === "string") setLeadSlug(saved.leadSlug);
			if (typeof saved.tradeType === "string" && saved.tradeType) setNiche(isShopNiche(saved.tradeType) ? saved.tradeType : "trade");
		} catch {}
	}, []);
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
				name: name.trim() || NICHES[niche].defaultName,
				solo: solo === true,
				ownerName: user?.displayName ?? "",
				leadSlug
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
					children: "Who is on the book?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-lg text-muted",
					children: "Some trades are one person. Some have a station for each person. Pick that first, then the trade. You can rename every line after."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSolo(true),
						className: "rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						style: solo === true ? { boxShadow: "0 0 0 1px var(--color-fg)" } : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: "Just me"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Clients book you. There is no staff list to hand out."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSolo(false),
						className: "rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						style: solo === false ? { boxShadow: "0 0 0 1px var(--color-fg)" } : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: "A team"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Each person gets a station and sees their own book."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-12 font-display text-3xl",
					children: "What do you sell?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3",
					children: NICHE_ORDER.map((key) => {
						const n = NICHES[key];
						const selected = niche === key;
						const Icon = nicheIcon(key);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setNiche(key);
								if (!name) setName(n.defaultName);
							},
							className: "w-72 shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)] transition-[box-shadow] duration-150",
							style: selected ? { boxShadow: `0 0 0 1px ${n.ringColor}` } : void 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "relative -mx-0 block aspect-[16/10] overflow-hidden bg-surface-2",
								children: NICHE_MEDIA[key].heroVideoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoopVideo, {
									src: NICHE_MEDIA[key].heroVideoUrl,
									className: "pointer-events-none absolute inset-0"
								}) : NICHE_MEDIA[key].heroImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: NICHE_MEDIA[key].heroImageUrl,
									alt: "",
									className: "media-drift pointer-events-none absolute inset-0 h-full w-full object-cover outline-none"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-full place-items-center text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-8" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-9 place-items-center rounded-lg bg-surface-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-4 block text-[11px] uppercase tracking-[0.18em] text-muted",
										children: n.kicker
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block font-display text-2xl",
										children: n.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-2 block text-sm text-muted",
										children: n.blurb
									})
								]
							})]
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
							disabled: busy || solo === null,
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
