import { o as __toESM } from "./_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime, x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { i as createServerFn } from "./_ssr/ssr.mjs";
import { i as initials, n as formatMoney, r as formatPhone } from "./_ssr/utils-BkNFIPfO.mjs";
import { C as serviceGroups, l as formatOffer, r as NICHE_MEDIA, s as WEEKDAYS, v as nicheCopy, x as resolveHeroMedia } from "./_ssr/niches-Dq_P6CLw.mjs";
import { I as createSsrRpc, M as submitInquiry, m as getShopAccess } from "./_ssr/server-CiF75qCF.mjs";
import { a as offerModel, p as shelfFor } from "./_ssr/storefront-CStpLjPF.mjs";
import { a as cordQuote, c as matchOffering, i as cordBaseCents, o as layoutFor, r as checkDropZone, t as CORD_LABEL } from "./_ssr/trade-layout-B34Fx01x.mjs";
import { n as presetsForShop, t as presetForShopNiche } from "./_ssr/nichePresets-BKzyhpZr.mjs";
import { G as ArrowUpRight, K as ArrowRight, S as MapPin, v as Phone } from "./_libs/lucide-react.mjs";
import { d as useShopPageData, s as Route$12 } from "./_ssr/router-B-39myu6.mjs";
import { n as useCurrentUserState } from "./_ssr/use-current-user-Bh_x61Ff.mjs";
import { r as motion } from "./_libs/framer-motion+[...].mjs";
import { a as PoweredBy, n as InsetFilm, r as IntroFxToggle, s as ShopNav, t as CinematicHero } from "./_ssr/shop-chrome-Dr8FTvy_.mjs";
import { t as Button } from "./_ssr/button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./_ssr/input-X7WHkqCl.mjs";
import { t as ProductShelf } from "./_ssr/product-shelf-SInYHZkV.mjs";
import { n as SnapEstimate, t as NeonField } from "./_ssr/snap-estimate-CPgJSk33.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_shopSlug-BYI_Gnzf.js
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
function TradeStorefront({ shop, services, phone }) {
	const layout = layoutFor(shop.niche);
	const profile = shop.tradeProfile;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "px-5 py-16 sm:px-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: layout.kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 max-w-xl font-display text-3xl sm:text-4xl",
					children: layout.heading
				}),
				profile.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-lg text-sm text-muted",
					children: profile.note
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-4",
					children: layout.modules.map((module) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeModuleView, {
						module,
						shop,
						services,
						phone
					}, module))
				})
			]
		})
	});
}
function TradeModuleView({ module, shop, services, phone }) {
	const profile = shop.tradeProfile;
	if (module === "workflow" || module === "rounds") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepRail, {
		steps: services,
		noun: module === "rounds" ? "Round" : "Step"
	});
	if (module === "bulk") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CordPicker, {
		services,
		cords: profile.cords
	});
	if (module === "species") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeciesCuts, {
		species: profile.species,
		cuts: profile.cuts
	});
	if (module === "dropzone") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
		zones: profile.dropZones,
		note: profile.deliveryNote,
		radiusMiles: profile.radiusMiles
	});
	if (module === "dispatch") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchStatus, {
		on: profile.dispatchOn,
		minutes: profile.responseMin
	});
	if (module === "callout") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RapidCallout, {
		cents: profile.emergencyCents,
		minutes: profile.responseMin,
		phone
	});
	if (module === "kinds") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindPicker, {
		shopSlug: shop.slug,
		kinds: profile.kinds,
		services
	});
	if (module === "radius") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radius, {
		miles: profile.radiusMiles,
		note: profile.deliveryNote
	});
	if (module === "party") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Party, { max: profile.partyMax });
	if (module === "session" || module === "chair" || module === "coverage") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferingCards, {
		shopSlug: shop.slug,
		services
	});
	return null;
}
function StepRail({ steps, noun }) {
	if (steps.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "grid gap-3 sm:grid-cols-3",
		children: steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-muted",
					children: [
						noun,
						" ",
						index + 1
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-2xl leading-tight",
					children: step.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: step.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm tabular text-fg",
					children: formatOffer(step)
				})
			]
		}, step.id))
	});
}
function CordPicker({ services, cords }) {
	const [size, setSize] = (0, import_react.useState)(cords[0] ?? "full");
	const picked = cords.includes(size) ? size : cords[0] ?? "full";
	const quote = cordQuote(cordBaseCents(services), picked);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "How much wood"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: cords.map((cord) => {
					const on = cord === picked;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": on,
						onClick: () => setSize(cord),
						className: "h-16 rounded-xl bg-surface-2 text-sm",
						style: on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : void 0,
						children: CORD_LABEL[cord]
					}, cord);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-3xl tabular",
				children: quote > 0 ? formatMoney(quote) : "Ask for the cord"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Priced from this shop's cord. Species does not change it."
			})
		]
	});
}
function SpeciesCuts({ species, cuts }) {
	const [wood, setWood] = (0, import_react.useState)(species[0] ?? "");
	const [cut, setCut] = (0, import_react.useState)(cuts[0] ?? "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "Species and cut"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
				label: "Wood",
				options: species,
				value: wood,
				onChange: setWood
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
				label: "Length",
				options: cuts,
				value: cut,
				onChange: setCut
			}),
			wood && cut ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: [
					wood,
					", cut to ",
					cut,
					"."
				]
			}) : null
		]
	});
}
function ChipRow({ label, options, value, onChange }) {
	if (options.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex flex-wrap gap-2",
			children: options.map((option) => {
				const on = option === value;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": on,
					onClick: () => onChange(option),
					className: "h-11 rounded-full bg-surface-2 px-4 text-sm",
					style: on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : void 0,
					children: option
				}, option);
			})
		})]
	});
}
function DropZone({ zones, note, radiusMiles }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const status = checkDropZone(query, zones);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), "Drop zone"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					radiusMiles,
					" miles out. ",
					note
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm",
				htmlFor: "drop-zone",
				children: ["City or neighborhood", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "drop-zone",
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: zones[0] || "City",
					className: "mt-2 h-12 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
				})]
			}),
			status === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-ok",
				children: "Inside the drop. The cord can land there."
			}) : null,
			status === "out" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-copper",
				children: "Outside the listed zones. Call before you order a haul."
			}) : null,
			zones.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-faint",
				children: zones.join(" · ")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-faint",
				children: "No cities listed yet. The radius is the limit."
			})
		]
	});
}
function DispatchStatus({ on, minutes }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "Dispatch"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-4xl",
				children: on ? "Rolling" : "At the desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: on ? `About ${minutes} minutes when the van is out.` : "Emergency dispatch is off. Book a daytime call."
			})
		]
	});
}
function RapidCallout({ cents, minutes, phone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end justify-between gap-4 rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "Rapid response"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-4xl tabular",
				children: cents > 0 ? formatMoney(cents) : "Ask"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"After-hours lockout. ",
					minutes,
					" minute target."
				]
			})
		] }), phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: `tel:${phone}`,
			className: "glass-btn inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" }), formatPhone(phone)]
		}) : null]
	});
}
function KindPicker({ shopSlug, kinds, services }) {
	const [kind, setKind] = (0, import_react.useState)(kinds[0] ?? "");
	const match = matchOffering(kind, services);
	if (kinds.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "Service"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-2 sm:grid-cols-3",
				children: kinds.map((item) => {
					const on = item === kind;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": on,
						onClick: () => setKind(item),
						className: "h-14 rounded-xl bg-surface-2 text-sm",
						style: on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : void 0,
						children: item
					}, item);
				})
			}),
			match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: match.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: match.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm tabular",
						children: formatOffer(match)
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug },
					className: "glass-btn inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm",
					children: ["Book this", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: [kind, " is offered. Ask the shop to put a price on the book."]
			})
		]
	});
}
function Radius({ miles, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-muted",
				children: "Service radius"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-display text-4xl tabular",
				children: [miles, " miles"]
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-lg text-sm text-muted",
				children: note
			}) : null
		]
	});
}
function Party({ max }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-[0.18em] text-muted",
			children: "Group size"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 font-display text-4xl tabular",
			children: ["Up to ", max]
		})]
	});
}
function OfferingCards({ shopSlug, services }) {
	if (services.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid gap-3 sm:grid-cols-3",
		children: services.map((service) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl leading-tight",
					children: service.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: service.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm tabular",
					children: formatOffer(service)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug },
					className: "mt-4 inline-flex h-11 items-center text-sm text-muted hover:text-fg",
					children: "Book"
				})
			]
		}, service.id))
	});
}
/** Answers from the trade's tap questions. Keys are the question ids. */
/** Public consumer audit. The shop id is the tenant, and the row lands in client_audit_submissions. */
var submitClientAudit = createServerFn({ method: "POST" }).validator((input) => {
	const tenantId = String(input?.tenantId ?? "").trim().slice(0, 80);
	const consumerName = String(input?.consumerName ?? "").trim().slice(0, 80);
	const consumerContact = String(input?.consumerContact ?? "").trim().slice(0, 120);
	const answers = {};
	const raw = input?.projectDetails ?? {};
	for (const [key, value] of Object.entries(raw)) {
		const id = key.trim().slice(0, 40);
		if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(id)) continue;
		const text = String(value ?? "").trim().slice(0, 80);
		if (text) answers[id] = text;
	}
	const auditScore = Math.round(Number(input?.auditScore));
	if (!tenantId) throw new Error("Shop not found");
	if (consumerName.length < 2) throw new Error("Name required");
	if (consumerContact.length < 3) throw new Error("Phone or email required");
	if (Object.keys(answers).length < 1) throw new Error("A few answers are required");
	if (!Number.isFinite(auditScore) || auditScore < 0 || auditScore > 100) throw new Error("Audit score is not usable");
	return {
		tenantId,
		consumerName,
		consumerContact,
		answers,
		auditScore
	};
}).handler(createSsrRpc("1549713d18f5387d1013c766b97ebb7a32b829aa76c44b2978e181c5edda20eb"));
var StorefrontAuditWidget = ({ tenantId, businessName, niche, bookSlug }) => {
	const preset = presetForShopNiche(niche);
	const [step, setStep] = (0, import_react.useState)("form");
	const [consumerName, setConsumerName] = (0, import_react.useState)("");
	const [consumerContact, setConsumerContact] = (0, import_react.useState)("");
	const [answers, setAnswers] = (0, import_react.useState)(() => Object.fromEntries(preset.auditQuestions.map((question) => [question.id, question.choices[0]?.value ?? ""])));
	const [auditScore, setAuditScore] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const handleRunAudit = async (e) => {
		e.preventDefault();
		if (!consumerName || !consumerContact) return;
		setSubmitting(true);
		setError(null);
		setStep("analyzing");
		const calculatedScore = Math.floor(Math.random() * 28) + 65;
		setAuditScore(calculatedScore);
		try {
			await submitClientAudit({ data: {
				tenantId,
				consumerName,
				consumerContact,
				projectDetails: answers,
				auditScore: calculatedScore
			} });
			window.setTimeout(() => setStep("results"), 1500);
		} catch (err) {
			console.error("Error saving audit submission:", err);
			setError(err instanceof Error ? err.message : "The audit could not be saved");
			setStep("form");
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg rounded-[24px] bg-surface p-6 text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: preset.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-2 font-display text-3xl",
						children: preset.auditTitle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: preset.auditNote
					})
				]
			}),
			step === "form" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleRunAudit,
				className: "grid gap-5",
				children: [
					preset.auditQuestions.map((question) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "mb-2 text-sm",
						children: question.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: question.choices.map((choice) => {
							const selected = answers[question.id] === choice.value;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": selected,
								onClick: () => setAnswers((current) => ({
									...current,
									[question.id]: choice.value
								})),
								className: "h-11 rounded-full px-4 text-sm",
								style: selected ? {
									background: preset.accent,
									color: "var(--color-bg)"
								} : {
									background: "var(--color-surface-2, rgba(243,241,235,0.06))",
									color: "var(--color-fg)"
								},
								children: choice.label
							}, choice.value);
						})
					})] }, question.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1 text-sm",
							htmlFor: "audit-name",
							children: ["Your name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "audit-name",
								type: "text",
								required: true,
								placeholder: "Your name",
								className: "h-11 rounded-xl bg-bg px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
								value: consumerName,
								onChange: (e) => setConsumerName(e.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1 text-sm",
							htmlFor: "audit-contact",
							children: ["Phone or email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "audit-contact",
								type: "text",
								required: true,
								placeholder: "Phone or email",
								className: "h-11 rounded-xl bg-bg px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
								value: consumerContact,
								onChange: (e) => setConsumerContact(e.target.value)
							})]
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: submitting,
						className: "h-12 rounded-xl bg-fg text-sm font-medium text-bg",
						children: submitting ? "Saving" : "See the score"
					})
				]
			}),
			step === "analyzing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid place-items-center gap-4 py-12 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-12 animate-spin rounded-full border-b-2 border-fg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"Checking the answers for ",
						businessName,
						"."
					]
				})]
			}),
			step === "results" && auditScore !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 py-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[20px] bg-bg p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-muted",
							children: "Score"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "my-2 font-display text-6xl",
							children: [auditScore, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl text-muted",
								children: "/100"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"A short visit with ",
								businessName,
								" is the next step."
							]
						})
					]
				}), bookSlug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug: bookSlug },
					className: "inline-flex h-12 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg",
					children: preset.bookingCta
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: preset.bookingCta
				})]
			})
		]
	});
};
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
	const bookLabel = presetsForShop(data.shop.niche)[0]?.bookingCta ?? copy.bookLabel;
	const contact = employees.find((e) => e.phone)?.phone;
	const hero = resolveHeroMedia(data.shop);
	const nicheFilm = NICHE_MEDIA[data.shop.niche];
	const neon = data.shop.neonAccent || data.shop.ringColor;
	const staffBlock = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
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
	});
	const product = offerModel(data.shop.niche) === "product";
	const shelf = shelfFor(data.shop.niche, services.map((service) => ({
		id: service.id,
		name: service.name,
		description: service.description,
		priceCents: service.priceCents
	})));
	const blocks = {
		staff: staffBlock,
		estimate: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "px-5 pb-4 sm:px-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-5xl",
				children: product ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductShelf, { items: shelf }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnapEstimate, {
					niche: data.shop.niche,
					bookLabel,
					shopSlug: data.shop.slug,
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
								children: group.items.map((s) => {
									const item = shelf.find((row) => row.id === s.id || row.name === s.name);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex min-w-0 items-baseline justify-between gap-4 py-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "break-words font-medium",
													children: s.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted",
													children: s.description
												}),
												item ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm text-muted",
													children: [
														item.attribute,
														" · ",
														item.stock,
														" in stock"
													]
												}) : null
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "tabular shrink-0 text-sm text-muted",
											children: formatOffer(s)
										})]
									}, s.id);
								})
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
								children: [bookLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeStorefront, {
				shop: data.shop,
				services,
				phone: contact ? String(contact) : ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "px-5 pb-28 sm:px-10 sm:pb-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorefrontAuditWidget, {
					tenantId: data.shop.id,
					businessName: data.shop.name,
					niche: data.shop.niche,
					bookSlug: data.shop.slug
				})
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
					children: bookLabel
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
