import { o as __toESM } from "./_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney, r as initials } from "./_ssr/utils-Dzshj1Ep.mjs";
import { r as WEEKDAYS } from "./_ssr/niches-ClhwYU5r.mjs";
import { o as ArrowUpRight, s as ArrowRight } from "./_libs/lucide-react.mjs";
import { _ as getShopAccess, l as Route$10, s as Route$7 } from "./_ssr/router-Cz9T8z2K.mjs";
import { n as useCurrentUserState } from "./_ssr/use-current-user-BYyFvsCd.mjs";
import { n as ShopNav } from "./_ssr/shop-chrome-JtjEzse-.mjs";
import { t as motion } from "./_libs/framer-motion+[...].mjs";
import { t as CinematicHero } from "./_ssr/cinematic-hero-udUXGdfY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_shopSlug-D3oA02Cq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TourOverlay({ slug }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 12,
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			y: 0,
			filter: "blur(0px)"
		},
		transition: {
			duration: .4,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-md rounded-2xl bg-surface/95 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.1)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: "Guided loop · 1 of 3"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-2xl leading-tight",
					children: "This page is already live."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Dummy staff, services, and a hero are in. Open Admin to put your face on it, then book a test chair."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/$shopSlug/admin",
					params: { shopSlug: slug },
					className: "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg",
					children: ["Open Admin", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
				})
			]
		})
	});
}
function LoopOverlay({ slug, employeeId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 12,
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			y: 0,
			filter: "blur(0px)"
		},
		transition: {
			duration: .4,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-md rounded-2xl bg-surface/95 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.1)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: "Guided loop · book a test"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-2xl leading-tight",
					children: "Close the loop."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Book with the person you just invited. Pay with Gear Guardian (mock). Watch the edge light."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug: slug },
					search: employeeId ? { employee: employeeId } : {},
					className: "mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg",
					children: "Book a test appointment"
				})
			]
		})
	});
}
function CustomerHome() {
	const data = Route$10.useLoaderData();
	const search = Route$7.useSearch();
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("customer");
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		getShopAccess({ data: data.shop.slug }).then((a) => setMode(a.mode === "none" ? "customer" : a.mode)).catch(() => setMode("customer"));
	}, [
		data.shop.slug,
		isPending,
		user
	]);
	const invited = data.employees[data.employees.length - 1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CinematicHero, {
				imageUrl: data.shop.heroImageUrl,
				videoUrl: data.shop.heroVideoUrl,
				blendPercent: data.shop.heroBlendPercent,
				ringColor: data.shop.ringColor,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopNav, {
					shop: data.shop,
					mode,
					highlightAdmin: search.tour
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-auto px-5 pb-28 pt-24 sm:px-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.22em] text-muted",
							children: data.shop.address
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 max-w-3xl font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.92]",
							children: data.shop.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-lg text-base text-fg/80 sm:text-lg",
							children: data.shop.tagline
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/$shopSlug/book",
							params: { shopSlug: data.shop.slug },
							className: "mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-5 text-sm font-medium text-bg",
							children: ["Book now", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "px-5 py-16 sm:px-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-5xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-muted",
							children: "The bench"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-3xl sm:text-4xl",
							children: "Who you'll sit with."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid gap-4 sm:grid-cols-2",
							children: data.employees.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/$shopSlug/staff/$employeeId",
								params: {
									shopSlug: data.shop.slug,
									employeeId: e.id
								},
								className: "flex gap-4 overflow-hidden rounded-[24px] bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
								children: [e.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: e.avatarUrl,
									alt: "",
									className: "size-28 shrink-0 rounded-[16px] object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-28 shrink-0 place-items-center rounded-[16px] bg-surface-2 font-display text-2xl",
									children: initials(e.displayName)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-2 pr-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-2xl leading-tight",
											children: e.displayName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted",
											children: e.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 line-clamp-3 text-sm text-muted",
											children: e.bio
										})
									]
								})]
							}, e.id))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "border-t border-line px-5 py-16 sm:px-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_0.8fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-muted",
							children: "Menu"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-3xl",
							children: "Services"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-6 divide-y divide-line",
							children: data.services.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-baseline justify-between gap-4 py-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: s.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: s.description
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "tabular shrink-0 text-sm text-muted",
									children: [formatMoney(s.priceCents), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "ml-2 text-faint",
										children: [s.durationMin, "m"]
									})]
								})]
							}, s.id))
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-muted",
							children: "Hours"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2 text-sm",
							children: WEEKDAYS.map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular",
									children: data.shop.hours[k] ?? "closed"
								})]
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-sm text-muted",
							children: data.shop.address
						})
					] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug: data.shop.slug },
					className: "flex h-12 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg",
					children: "Book now"
				})
			}),
			search.tour ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TourOverlay, { slug: data.shop.slug }) : null,
			search.loop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoopOverlay, {
				slug: data.shop.slug,
				employeeId: invited?.id
			}) : null
		]
	});
}
//#endregion
export { CustomerHome as component };
