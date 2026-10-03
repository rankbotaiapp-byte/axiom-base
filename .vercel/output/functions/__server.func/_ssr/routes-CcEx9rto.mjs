import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as AppWindow, o as ArrowUpRight, r as Store, t as Truck } from "../_libs/lucide-react.mjs";
import { S as listShowcaseShops, b as listMyShops } from "./router-MEFXtEX6.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { a as SignedOut, i as SignedIn, o as UserButton, s as Wordmark } from "./shop-chrome-B-tJ9Hij.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CcEx9rto.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { user, isPending } = useCurrentUserState();
	const [mine, setMine] = (0, import_react.useState)(null);
	const [showcases, setShowcases] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		listShowcaseShops().then(setShowcases).catch(() => setShowcases([]));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setMine(null);
			return;
		}
		listMyShops().then(setMine).catch(() => setMine([]));
	}, [user]);
	const owned = mine?.filter((s) => s.ownerUserId === user?.id) ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between px-5 py-5 sm:px-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-3",
					children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-8 animate-pulse rounded-full bg-fg/10" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "text-sm text-muted hover:text-fg",
						children: "Sign in"
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) })] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-10 sm:pt-16",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.28em] text-muted",
						children: "Vertical SaaS · local services"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.6rem)] leading-[0.95] tracking-[-0.03em]",
						children: "Your shop, live before the second cup of coffee."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg",
						children: "Pick a niche. Axiom stands up a booking site, an operator console, and a staff station — then lights the edge of the screen when the first appointment lands."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-col gap-3 sm:flex-row",
						children: [owned[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/$shopSlug",
							params: { shopSlug: owned[0].slug },
							className: "inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg",
							children: ["Open ", owned[0].name]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/onboard",
							className: "inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg",
							children: "Create your shop"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#live",
							className: "inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.1)] hover:text-fg",
							children: "See live shops"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-14 grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NicheCard, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-4" }),
								title: "Storefront",
								copy: "Barbers, salons, studios. They walk in. You run the chair."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NicheCard, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { className: "size-4" }),
								title: "Field service",
								copy: "Auto, HVAC, trades. You go to the curb — or they come to the lift."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NicheCard, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { className: "size-4" }),
								title: "Studio",
								copy: "Web apps, contractors. You build the shop that books itself."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "live",
				className: "border-t border-line px-5 py-16 sm:px-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-6xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.22em] text-muted",
							children: "Live tenants · New Era Apps"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-3xl sm:text-4xl",
							children: "Three shops. Already taking chairs."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid gap-4 md:grid-cols-3",
							children: showcases.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/$shopSlug",
								params: { shopSlug: s.slug },
								className: "group overflow-hidden rounded-[28px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative aspect-[16/10] overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: s.heroImageUrl,
										alt: "",
										className: "h-full w-full object-cover outline-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end justify-between gap-3 p-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] uppercase tracking-[0.18em] text-faint",
											children: "Powered by Axiom"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 font-display text-2xl",
											children: s.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: s.tagline
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-5 shrink-0 text-muted" })]
								})]
							}, s.id))
						})
					]
				})
			})
		]
	});
}
function NicheCard({ icon, title, copy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-9 items-center justify-center rounded-lg bg-surface-2 text-fg",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: copy
			})
		]
	});
}
//#endregion
export { Home as component };
