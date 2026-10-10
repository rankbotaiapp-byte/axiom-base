import { o as __toESM } from "./_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { i as initials, r as formatPhone } from "./_ssr/utils-BkNFIPfO.mjs";
import { D as resolveHeroMedia, a as NICHE_MEDIA, f as formatOffer, k as serviceGroups, l as WEEKDAYS, x as nicheCopy } from "./_ssr/intro-MrMOJI2L.mjs";
import { M as ArrowUpRight, N as ArrowRight } from "./_libs/lucide-react.mjs";
import { L as submitInquiry, S as getShopAccess, s as Route$12, u as useShopPageData } from "./_ssr/router-Co1j6ZW7.mjs";
import { n as useCurrentUserState } from "./_ssr/use-current-user-Bh_x61Ff.mjs";
import { r as motion } from "./_libs/framer-motion+[...].mjs";
import { a as PoweredBy, n as InsetFilm, r as IntroFxToggle, s as ShopNav, t as CinematicHero } from "./_ssr/shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./_ssr/button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./_ssr/input-X7WHkqCl.mjs";
import { n as SnapEstimate, t as NeonField } from "./_ssr/snap-estimate-70hpQ9yG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_shopSlug-B0iws6VY.js
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
	const data = useShopPageData();
	const search = Route$12.useSearch();
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
	const employees = data.employees ?? [];
	const services = data.services ?? [];
	const hours = data.shop.hours ?? {};
	const invited = employees[employees.length - 1];
	const copy = nicheCopy(data.shop.niche);
	const contact = employees.find((e) => e.phone)?.phone;
	const hero = resolveHeroMedia(data.shop);
	const nicheFilm = NICHE_MEDIA[data.shop.niche];
	const neon = data.shop.neonAccent || data.shop.ringColor;
	const blocks = {
		staff: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "px-5 py-16 sm:px-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-5xl",
				children: [
					search.requested ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-10 max-w-lg text-sm text-muted",
						children: "Request received. This shop has it. If you left a phone or email, a confirmation follows when the time is accepted."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: copy.bench
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-3xl sm:text-4xl",
						children: copy.heading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 grid gap-4 sm:grid-cols-2",
						children: employees.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/$shopSlug/staff/$employeeId",
							params: {
								shopSlug: data.shop.slug,
								employeeId: e.id
							},
							className: "lift-card flex gap-4 overflow-hidden rounded-[24px] bg-surface/80 p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md",
							children: [e.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: e.avatarUrl,
								alt: "",
								className: "size-28 shrink-0 rounded-[16px] object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-28 shrink-0 place-items-center rounded-[16px] bg-surface-2 font-display text-2xl",
								children: initials(e.displayName || "Staff")
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
									e.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm tabular text-muted",
										children: formatPhone(e.phone)
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 line-clamp-3 text-sm text-muted",
										children: e.bio
									})
								]
							})]
						}, e.id))
					}),
					nicheFilm.insetImageUrl || nicheFilm.insetLoopUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 max-w-xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsetFilm, {
							imageUrl: nicheFilm.insetImageUrl,
							videoUrl: nicheFilm.insetLoopUrl
						})
					}) : null
				]
			})
		}),
		estimate: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "px-5 pb-4 sm:px-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-5xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnapEstimate, {
					lines: services.map((service) => ({
						name: service.name,
						description: service.description,
						priceCents: service.priceCents
					})),
					bookTo: `/${data.shop.slug}/book`
				})
			})
		}),
		menu: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "border-t border-line px-5 py-16 sm:px-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_0.8fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: copy.menuKicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-3xl",
						children: copy.menuHeading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: serviceGroups(services).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 first:mt-0",
							children: [group.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.18em] text-muted",
								children: group.label
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y divide-line",
								children: group.items.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-baseline justify-between gap-4 py-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: s.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: s.description
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "tabular shrink-0 text-sm text-muted",
										children: formatOffer(s)
									})]
								}, s.id))
							})]
						}, group.label || "menu"))
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
								children: hours[k] ?? "closed"
							})]
						}, k))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-sm text-muted",
						children: data.shop.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: data.shop.address
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InquiryForm, {
						slug: data.shop.slug,
						label: copy.inquiry
					}),
					contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `tel:${contact}`,
						className: "mt-2 block text-sm tabular text-muted hover:text-fg",
						children: formatPhone(String(contact))
					}) : null
				] })]
			})
		})
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-bg",
		"data-neon": data.shop.glowEnabled ? "on" : "off",
		style: { ["--neon"]: neon },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeonField, { active: data.shop.glowEnabled }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CinematicHero, {
				imageUrl: hero.imageUrl,
				videoUrl: hero.videoUrl,
				blendPercent: data.shop.heroBlendPercent,
				introPreset: data.shop.introPreset,
				introSpeed: data.shop.introSpeed,
				introIntensity: data.shop.introIntensity,
				tone: hero.tone,
				fallbackImageUrl: nicheFilm.heroImageUrl,
				fallbackVideoUrl: nicheFilm.heroVideoUrl,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hero-scrim pointer-events-none absolute inset-x-0 top-0 z-0 h-40",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopNav, {
							shop: data.shop,
							mode,
							highlightAdmin: search.tour
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto px-5 pb-28 pt-24 sm:px-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.22em] text-muted",
								children: data.shop.address
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-3 max-w-3xl break-words font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.92]",
								children: data.shop.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-lg text-base text-fg/80 sm:text-lg",
								children: data.shop.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/$shopSlug/book",
								params: { shopSlug: data.shop.slug },
								className: "glass-btn mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium",
								children: [copy.bookLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						]
					})
				]
			}),
			data.shop.layout.map((block) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: blocks[block] }, block)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoweredBy, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroFxToggle, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug: data.shop.slug },
					className: "glass-btn flex h-12 items-center justify-center rounded-xl text-sm font-medium",
					children: copy.bookLabel
				})]
			}),
			search.tour ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TourOverlay, { slug: data.shop.slug }) : null,
			search.loop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoopOverlay, {
				slug: data.shop.slug,
				employeeId: invited?.id
			}) : null
		]
	});
}
function InquiryForm({ slug, label }) {
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [message, setMessage] = (0, import_react.useState)("");
	const [sent, setSent] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-8 grid gap-3",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			setError(null);
			submitInquiry({ data: {
				slug,
				name,
				phone,
				message
			} }).then(() => {
				setSent(true);
				setMessage("");
			}).catch((err) => setError(err instanceof Error ? err.message : "Could not send")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: label
			}),
			sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-ok",
				children: "Sent. They have it on the console."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "inq-name",
				children: "Name"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: "inq-name",
				value: name,
				onChange: (e) => setName(e.target.value),
				required: true
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "inq-phone",
				children: "Phone"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: "inq-phone",
				value: phone,
				onChange: (e) => setPhone(e.target.value),
				placeholder: "Optional"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "inq-msg",
				children: "Message"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				id: "inq-msg",
				value: message,
				onChange: (e) => setMessage(e.target.value),
				required: true,
				minLength: 8,
				rows: 3,
				className: "mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
			})] }),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				disabled: busy,
				children: busy ? "Sending" : "Send inquiry"
			})
		]
	});
}
//#endregion
export { CustomerHome as component };
