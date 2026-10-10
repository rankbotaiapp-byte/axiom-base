import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { n as isShopNiche } from "./types-TYGEZdcs.mjs";
import { _ as leadHeroFor, a as NICHE_MEDIA, i as NICHES, o as NICHE_ORDER, x as nicheCopy } from "./intro-MrMOJI2L.mjs";
import { t as LEAD_STORAGE_KEY } from "./funnel-CYpq-UDZ.mjs";
import { M as ArrowUpRight, _ as LoaderCircle } from "../_libs/lucide-react.mjs";
import { D as listShowcaseShops, T as listMyShops, d as Route$16 } from "./router-Co1j6ZW7.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { c as SignedIn, d as Wordmark, i as LoopVideo, l as SignedOut, n as InsetFilm, t as CinematicHero, u as UserButton } from "./shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as SnapEstimate, t as NeonField } from "./snap-estimate-70hpQ9yG.mjs";
import { t as AskEricAvatar } from "./AskEricAvatar-_XX8JGyL.mjs";
import { t as GearGuardianCheckout } from "./gear-guardian-checkout-CDPe_sWt.mjs";
import { t as TERRITORY_PLANS } from "./pricing-BxirjfBG.mjs";
import { a as finishTerritoryCheckout, i as ensureFunnelSession, n as beginTerritoryCheckout, p as recordFunnelHit, r as confirmTerritorySession, s as getLeadPreview, u as masterGate } from "./master-DHJzzcl2.mjs";
import { t as nicheIcon } from "./niche-icon-DpVGJd95.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BE5QJy0L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LeadTerritory({ leadSlug, layout, sessionId, greet = false, businessName = "", trade = "", city = "" }) {
	const [lead, setLead] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [planId, setPlanId] = (0, import_react.useState)(null);
	const [checkoutId, setCheckoutId] = (0, import_react.useState)("");
	const [processor, setProcessor] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [held, setHeld] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		getLeadPreview({ data: leadSlug }).then((next) => {
			if (!cancelled) setLead(next);
		}).catch((err) => {
			if (!cancelled) setError(err instanceof Error ? err.message : "This page is not available");
		});
		return () => {
			cancelled = true;
		};
	}, [leadSlug]);
	(0, import_react.useEffect)(() => {
		if (!sessionId) return;
		let cancelled = false;
		confirmTerritorySession({ data: sessionId }).then(() => getLeadPreview({ data: leadSlug })).then((next) => {
			if (!cancelled) {
				setLead(next);
				setCheckoutId("");
				setProcessor("");
			}
		}).catch((err) => {
			if (!cancelled) setError(err instanceof Error ? err.message : "Payment did not finish");
		});
		return () => {
			cancelled = true;
		};
	}, [leadSlug, sessionId]);
	async function choose(nextPlan) {
		setBusy(true);
		setError(null);
		setPlanId(nextPlan);
		try {
			await ensureFunnelSession();
			const started = await beginTerritoryCheckout({ data: {
				leadSlug,
				planId: nextPlan
			} });
			if (started.processor === "stripe" && started.url) {
				window.location.assign(started.url);
				return;
			}
			setCheckoutId(started.checkoutId);
			setProcessor(started.processor);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Checkout did not start");
			setProcessor("");
		} finally {
			setBusy(false);
		}
	}
	async function finish(paymentRef) {
		setBusy(true);
		setError(null);
		try {
			await finishTerritoryCheckout({ data: {
				checkoutId,
				paymentRef
			} });
			setLead(await getLeadPreview({ data: leadSlug }));
			setCheckoutId("");
			setProcessor("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Checkout did not finish");
		} finally {
			setBusy(false);
		}
	}
	const avatar = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AskEricAvatar, {
		businessName: lead?.businessName || businessName,
		trade: lead?.tradeLabel || (lead && isShopNiche(lead.tradeType) ? NICHES[lead.tradeType].label : "") || trade,
		city: lead?.city || city,
		startOpen: greet
	});
	if (!lead && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-[40vh] place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-40 animate-pulse rounded-full bg-fg/10" })
	}), avatar] });
	if (!lead) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-5 py-16 text-sm text-muted",
		children: error
	}), avatar] });
	const hero = leadHeroFor(lead.tradeType, lead.businessName, lead.tradeLabel);
	const known = isShopNiche(lead.tradeType);
	const niche = isShopNiche(lead.tradeType) ? NICHES[lead.tradeType] : NICHES.trade;
	const tradeName = known ? niche.label : lead.tradeLabel || lead.tradeType.replace(/-/g, " ");
	const services = niche.services.slice(0, 3);
	const copy = nicheCopy(niche.niche);
	const live = lead.mode === "live";
	const offer = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-[0.22em] text-muted",
			children: "Territory"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-2 font-display text-3xl leading-none sm:text-4xl",
			children: live ? "This territory is live." : "Choose how it goes live."
		}),
		live && lead.activation ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-md text-sm leading-relaxed text-muted",
			children: renewalCopy(lead.activation)
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-md text-sm leading-relaxed text-muted",
			children: "Simulation until checkout. The account switches to live production the moment a plan is confirmed."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 grid gap-3",
			children: TERRITORY_PLANS.map((plan) => {
				const on = planId === plan.id || lead.activation?.planId === plan.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: live || busy,
					onClick: () => void choose(plan.id),
					className: "rounded-2xl bg-surface px-4 py-4 text-left disabled:opacity-80",
					style: { boxShadow: on ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: plan.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 tabular text-sm text-muted",
							children: priceLabel(plan.id, plan.amountCents)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-sm text-muted",
						children: plan.summary
					})]
				}, plan.id);
			})
		}),
		processor === "trial" && checkoutId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "$0 today. On day 31 the plan becomes $497 a month."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				className: "mt-4",
				size: "lg",
				disabled: busy,
				onClick: () => void finish(""),
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Start the 30-day trial"]
			})]
		}) : null,
		processor === "desk" && checkoutId && planId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearGuardianCheckout, {
				amountCents: TERRITORY_PLANS.find((plan) => plan.id === planId)?.amountCents ?? 0,
				shopName: lead.businessName,
				onPaid: finish,
				onCancel: () => {
					setProcessor("");
					setCheckoutId("");
				}
			})
		}) : null,
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-danger",
			children: error
		}) : null
	] });
	const film = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CinematicHero, {
		imageUrl: hero.heroImageUrl,
		videoUrl: hero.heroVideoUrl || null,
		blendPercent: hero.heroBlendPercent,
		introPreset: hero.introPreset,
		introSpeed: hero.introSpeed,
		introIntensity: hero.introIntensity,
		tone: hero.tone ?? null,
		children: [layout === "pitch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between px-5 py-5 sm:px-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.22em] text-muted",
				children: "Customer view"
			})]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-auto px-5 pb-28 pt-24 sm:px-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.22em] text-muted",
				children: [
					lead.city,
					tradeName,
					lead.county
				].filter(Boolean).join(" · ")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 max-w-3xl font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.92]",
				children: lead.businessName
			})]
		})]
	});
	if (layout === "page") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		film,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "territory",
			className: "px-5 py-16 sm:px-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-xl",
				children: [hero.insetImageUrl || hero.insetLoopUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsetFilm, {
						imageUrl: hero.insetImageUrl,
						videoUrl: hero.insetLoopUrl
					})
				}) : null, offer]
			})
		}),
		avatar
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg",
		style: { ["--neon"]: niche.ringColor },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeonField, { active: true }),
			film,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:px-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 max-w-xl text-base text-muted sm:text-lg",
						children: [
							lead.contactName ? `Built for ${lead.contactName}. ` : "",
							known ? niche.tagline : `${tradeName} bookings, on one page.`,
							lead.reviewScore != null ? ` ${lead.reviewScore} from ${lead.reviewCount ?? 0} reviews.` : ""
						]
					}),
					hero.insetImageUrl || hero.insetLoopUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 max-w-xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsetFilm, {
							imageUrl: hero.insetImageUrl,
							videoUrl: hero.insetLoopUrl
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-[11px] uppercase tracking-[0.22em] text-muted",
						children: live ? "Live production" : "Simulation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.2em] text-muted",
								children: copy.menuKicker
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 divide-y divide-line",
								children: services.map((service) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-baseline justify-between gap-4 py-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: service.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: service.description
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "shrink-0 text-sm text-muted",
										children: formatMoney(service.priceCents)
									})]
								}, service.name))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									className: "glass-btn",
									onClick: () => setHeld(services[0]?.name ?? "the next opening"),
									children: copy.bookLabel
								}), held ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Held for the demo. Nothing was booked."
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnapEstimate, { lines: niche.services.map((service) => ({
									name: service.name,
									description: service.description,
									priceCents: service.priceCents
								})) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-8 max-w-md text-sm text-faint",
						children: "This screen is the customer view. Leave the desk on the other device."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "lg:pt-16",
					children: offer
				})]
			}),
			avatar
		]
	});
}
function priceLabel(id, amountCents) {
	if (id === "trial") return "$0 today";
	if (id === "growth") return `${formatMoney(amountCents)}/mo`;
	return formatMoney(amountCents);
}
function renewalCopy(activation) {
	if (!activation.renewsAt) return `${activation.planName}. Paid once. This territory stays live.`;
	const when = new Date(activation.renewsAt).toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
	if (activation.amountCents === 0) return `${activation.planName}. $0 today. $497 a month begins ${when}.`;
	return `${activation.planName}. Next charge ${formatMoney(activation.renewalCents ?? 0)} on ${when}.`;
}
function Home() {
	const search = Route$16.useSearch();
	const { user, isPending } = useCurrentUserState();
	const [mine, setMine] = (0, import_react.useState)(null);
	const [showcases, setShowcases] = (0, import_react.useState)([]);
	const [masterOpen, setMasterOpen] = (0, import_react.useState)(false);
	const [leadName, setLeadName] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		listShowcaseShops().then(setShowcases).catch(() => setShowcases([]));
	}, []);
	(0, import_react.useEffect)(() => {
		const leadSlug = search.b || search.lead_slug || "";
		const utmSource = search.utm_source || "";
		const county = search.county || "";
		const stopToken = search.t || "";
		if (search.pitch) return;
		if (!leadSlug && !utmSource && !county) return;
		const seen = `axiom.hit:${leadSlug}|${utmSource}|${county}|${stopToken}`;
		if (sessionStorage.getItem(seen) === "1") return;
		sessionStorage.setItem(seen, "1");
		if (leadSlug) sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify({
			leadSlug,
			utmSource,
			county
		}));
		ensureFunnelSession().then(() => recordFunnelHit({ data: {
			leadSlug,
			utmSource,
			county,
			stopToken
		} })).then((hit) => {
			if (!hit.businessName) return;
			setLeadName(hit.businessName);
			sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify({
				leadSlug: leadSlug || void 0,
				tradeType: hit.tradeType,
				county: hit.county,
				utmSource
			}));
		}).catch(() => void 0);
	}, [
		search.b,
		search.county,
		search.lead_slug,
		search.pitch,
		search.t,
		search.utm_source
	]);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setMine(null);
			setMasterOpen(false);
			return;
		}
		listMyShops().then(setMine).catch(() => setMine([]));
		masterGate().then((gate) => setMasterOpen(gate.open)).catch(() => setMasterOpen(false));
	}, [user]);
	const owned = mine?.filter((s) => s.ownerUserId === user?.id) ?? [];
	const leadSlug = search.b || search.lead_slug || "";
	if (search.pitch && leadSlug) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadTerritory, {
		leadSlug,
		layout: "pitch",
		sessionId: search.session_id,
		greet: search.greet,
		businessName: search.biz,
		trade: search.trade,
		city: search.city
	});
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
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SignedIn, { children: [masterOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/master-admin",
						className: "text-sm text-muted hover:text-fg",
						children: "Master"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})] })] })
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
					leadName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-6 text-sm text-copper",
						children: [
							"This link is saved for ",
							leadName,
							"."
						]
					}) : null,
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-14 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3",
						children: NICHE_ORDER.map((key) => {
							const n = NICHES[key];
							const Icon = nicheIcon(key);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NicheCard, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
								title: n.label,
								copy: n.blurb,
								videoUrl: NICHE_MEDIA[key].heroVideoUrl,
								imageUrl: NICHE_MEDIA[key].heroImageUrl
							}, key);
						})
					})
				]
			}),
			leadSlug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadTerritory, {
				leadSlug,
				layout: "page",
				sessionId: search.session_id,
				greet: search.greet,
				businessName: search.biz,
				trade: search.trade,
				city: search.city
			}) : null,
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
							children: "Already on the books."
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
function NicheCard({ icon, title, copy, videoUrl, imageUrl }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-[16/10] overflow-hidden bg-surface-2",
			children: videoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoopVideo, {
				src: videoUrl,
				className: "absolute inset-0"
			}) : imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: imageUrl,
				alt: "",
				className: "media-drift absolute inset-0 h-full w-full object-cover outline-none"
			}) : null
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-5",
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
		})]
	});
}
//#endregion
export { Home as component };
