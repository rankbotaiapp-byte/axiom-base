import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { D as resolveHeroMedia, E as renameSection, O as sectionsOf, b as nextSectionName, c as RING_PRESETS, d as defaultPriceUnit, h as insertRow, i as NICHES, r as INTRO_PRESETS, s as PRICE_UNIT_LABEL, v as moveRow, w as priceUnitsFor, x as nicheCopy, y as moveSection } from "./intro-MrMOJI2L.mjs";
import { D as ChevronDown, E as ChevronUp } from "../_libs/lucide-react.mjs";
import { A as saveShopServices, B as updateShopProfile, C as inviteEmployee, O as refreshStripeConnect, P as setShopIntro, R as updateNotifyChannels, f as acceptBooking, m as beginStripeConnect, o as Route$11, y as getOperatorData, z as updateShopBrand } from "./router-Co1j6ZW7.mjs";
import { r as getBearerToken } from "./client-Hb_FAdbz.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { d as Wordmark, o as RedirectToSignIn, t as CinematicHero } from "./shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { n as LAYOUT_BLOCKS, r as NEON_PRESETS } from "./storefront-6qzZj7oY.mjs";
import { i as cityFromAddress } from "./avatar-Cg-oRnFU.mjs";
import { n as ShopDashboardPanel } from "./dashboard-controls-CtsLKan-.mjs";
import { t as AskEricAvatar } from "./AskEricAvatar-_XX8JGyL.mjs";
import { r as useAxiomRing } from "./axiom-ring-aRRm8Rym.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as XAxis, r as Area, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-zh6jf6P6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPanel({ shop, readonly, onReload }) {
	const [name, setName] = (0, import_react.useState)(shop.name);
	const [tagline, setTagline] = (0, import_react.useState)(shop.tagline);
	const [description, setDescription] = (0, import_react.useState)(shop.description);
	const [address, setAddress] = (0, import_react.useState)(shop.address);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setName(shop.name);
		setTagline(shop.tagline);
		setDescription(shop.description);
		setAddress(shop.address);
	}, [
		shop.address,
		shop.description,
		shop.name,
		shop.tagline
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "max-w-xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		onSubmit: (event) => {
			event.preventDefault();
			if (readonly) return;
			setBusy(true);
			setError(null);
			updateShopProfile({ data: {
				slug: shop.slug,
				name,
				tagline,
				description,
				address
			} }).then(() => onReload()).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Public page"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-3xl",
				children: "Business"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Name",
				id: "biz-name",
				value: name,
				onChange: setName,
				disabled: readonly
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Tagline",
				id: "biz-tag",
				value: tagline,
				onChange: setTagline,
				disabled: readonly
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "biz-desc",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: "biz-desc",
					value: description,
					disabled: readonly,
					onChange: (e) => setDescription(e.target.value),
					rows: 4,
					className: "mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Address",
				id: "biz-addr",
				value: address,
				onChange: setAddress,
				disabled: readonly
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "mt-5",
				disabled: readonly || busy,
				children: busy ? "Saving" : "Save business"
			})
		]
	});
}
function Field({ label, id, value, onChange, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			value,
			disabled,
			onChange: (e) => onChange(e.target.value)
		})]
	});
}
function toDraft(service, units) {
	return {
		key: service.id,
		id: service.id,
		name: service.name,
		description: service.description,
		durationMin: String(service.durationMin),
		price: (service.priceCents / 100).toFixed(2),
		group: service.group,
		priceUnit: units.includes(service.priceUnit) ? service.priceUnit : "flat"
	};
}
function blankLine(group, priceUnit) {
	return {
		key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		name: "",
		description: "",
		durationMin: "45",
		price: "48.00",
		group,
		priceUnit
	};
}
function ServicesPanel({ shop, services, readonly, onReload }) {
	const [rows, setRows] = (0, import_react.useState)(() => {
		const allowed = priceUnitsFor(shop.niche);
		return services.map((service) => toDraft(service, allowed));
	});
	const [removed, setRemoved] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const serverMenu = services.map((service) => [
		service.id,
		service.name,
		service.description,
		service.durationMin,
		service.priceCents,
		service.group,
		service.priceUnit
	].join("")).join("");
	(0, import_react.useEffect)(() => {
		const allowed = priceUnitsFor(shop.niche);
		setRows(services.map((service) => toDraft(service, allowed)));
		setRemoved([]);
	}, [serverMenu, shop.niche]);
	const copy = nicheCopy(shop.niche);
	const units = priceUnitsFor(shop.niche);
	const sections = sectionsOf(rows);
	const showUnits = units.length > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid max-w-3xl gap-4",
		onSubmit: (event) => {
			event.preventDefault();
			if (readonly) return;
			setBusy(true);
			setError(null);
			saveShopServices({ data: {
				slug: shop.slug,
				removeIds: removed,
				services: rows.map((row) => ({
					id: row.id,
					name: row.name,
					description: row.description,
					durationMin: Number(row.durationMin),
					priceCents: Math.round(Number(row.price) * 100),
					group: row.group,
					priceUnit: row.priceUnit
				}))
			} }).then(() => onReload()).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: copy.menuKicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-display text-3xl",
					children: copy.menuHeading
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Rename a section, reorder the lines, and set the price, the length, and how that price is charged. Lines that share a section name sit together on the customer page."
				})
			] }),
			sections.map((section, sectionIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[24px] bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `section-${section.start}`,
									children: "Section"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `section-${section.start}`,
									value: section.label,
									maxLength: 40,
									placeholder: "No heading",
									disabled: readonly,
									onChange: (event) => setRows((current) => renameSection(current, section.start, section.count, event.target.value))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								size: "md",
								className: "w-11 px-0",
								"aria-label": "Move section up",
								disabled: readonly || sectionIndex === 0,
								onClick: () => setRows((current) => moveSection(current, sectionIndex, -1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								size: "md",
								className: "w-11 px-0",
								"aria-label": "Move section down",
								disabled: readonly || sectionIndex === sections.length - 1,
								onClick: () => setRows((current) => moveSection(current, sectionIndex, 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid gap-3",
						children: rows.slice(section.start, section.start + section.count).map((row, offset) => {
							const index = section.start + offset;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-surface-2 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-[1fr_7rem_7rem]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: `svc-name-${row.key}`,
												children: "Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: `svc-name-${row.key}`,
												value: row.name,
												disabled: readonly,
												onChange: (e) => updateRow(setRows, index, { name: e.target.value })
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: `svc-price-${row.key}`,
												children: row.priceUnit === "person" ? "USD / person" : row.priceUnit === "boat" ? "USD / boat" : "Price USD"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: `svc-price-${row.key}`,
												inputMode: "decimal",
												value: row.price,
												disabled: readonly,
												onChange: (e) => updateRow(setRows, index, { price: e.target.value })
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: `svc-min-${row.key}`,
												children: "Minutes"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: `svc-min-${row.key}`,
												inputMode: "numeric",
												value: row.durationMin,
												disabled: readonly,
												onChange: (e) => updateRow(setRows, index, { durationMin: e.target.value })
											})] })
										]
									}),
									showUnits ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
										className: "mt-3",
										disabled: readonly,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
											className: "text-sm text-muted",
											children: "Charge"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 flex flex-wrap gap-2",
											role: "group",
											"aria-label": "Charge",
											children: units.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "md",
												variant: row.priceUnit === unit ? "primary" : "secondary",
												"aria-pressed": row.priceUnit === unit,
												onClick: () => updateRow(setRows, index, { priceUnit: unit }),
												children: PRICE_UNIT_LABEL[unit]
											}, unit))
										})]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: `svc-desc-${row.key}`,
											children: "Description"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: `svc-desc-${row.key}`,
											value: row.description,
											disabled: readonly,
											onChange: (e) => updateRow(setRows, index, { description: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												variant: "ghost",
												size: "sm",
												"aria-label": "Move line up",
												disabled: readonly || index === 0,
												onClick: () => setRows((current) => moveRow(current, index, -1)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" }), "Up"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												variant: "ghost",
												size: "sm",
												"aria-label": "Move line down",
												disabled: readonly || index === rows.length - 1,
												onClick: () => setRows((current) => moveRow(current, index, 1)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" }), "Down"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "ml-auto text-sm text-muted hover:text-fg",
												disabled: readonly || rows.length < 2,
												onClick: () => {
													if (row.id) setRemoved((ids) => [...ids, row.id]);
													setRows((current) => current.filter((_, i) => i !== index));
												},
												children: "Remove"
											})
										]
									})
								]
							}, row.key);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "sm",
						className: "mt-3",
						disabled: readonly,
						onClick: () => setRows((current) => insertRow(current, section.start + section.count, blankLine(section.label, defaultPriceUnit(shop.niche)))),
						children: "Add line"
					})
				]
			}, `section-${section.start}`)),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					disabled: readonly || rows.length >= 24,
					onClick: () => setRows((current) => {
						const name = nextSectionName(sectionsOf(current).map((section) => section.label));
						return [...current, blankLine(name, defaultPriceUnit(shop.niche))];
					}),
					children: "Add section"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: readonly || busy,
					children: busy ? "Saving" : "Save menu"
				})]
			})
		]
	});
}
function updateRow(setRows, index, patch) {
	setRows((current) => current.map((row, i) => i === index ? {
		...row,
		...patch
	} : row));
}
function AlertsPanel({ shop, notifyEmail, notifyPhone, notices, readonly, onReload }) {
	const [email, setEmail] = (0, import_react.useState)(notifyEmail);
	const [phone, setPhone] = (0, import_react.useState)(notifyPhone);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setEmail(notifyEmail);
		setPhone(notifyPhone);
	}, [notifyEmail, notifyPhone]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-[22rem_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			onSubmit: (event) => {
				event.preventDefault();
				if (readonly) return;
				setBusy(true);
				setError(null);
				updateNotifyChannels({ data: {
					slug: shop.slug,
					notifyEmail: email,
					notifyPhone: phone
				} }).then(() => onReload()).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: "Hooks"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-display text-3xl",
					children: "Alerts"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Every booking and inquiry lands in this console. Email and SMS go out when this workspace has a provider connected."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Email",
					id: "alert-email",
					value: email,
					onChange: setEmail,
					disabled: readonly
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Mobile",
					id: "alert-phone",
					value: phone,
					onChange: setPhone,
					disabled: readonly
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-danger",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "mt-5",
					disabled: readonly || busy,
					children: busy ? "Saving" : "Save alerts"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-2",
			children: notices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "text-sm text-faint",
				children: "No alerts yet."
			}) : notices.map((notice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs uppercase tracking-wider text-faint",
						children: [
							notice.channel,
							" · ",
							notice.status
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-medium",
						children: notice.subject
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: notice.body
					}),
					notice.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-danger",
						children: notice.detail
					}) : null
				]
			}, notice.id))
		})]
	});
}
function PaymentsPanel({ shop, billing, payments, appointments, readonly, onReload }) {
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const volume = appointments.reduce((sum, appointment) => sum + appointment.paymentCents, 0);
	const fee = billing ? Math.round(volume * billing.gearGuardianBps / 1e4) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid max-w-3xl gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: "SaaS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-3xl",
					children: "Axiom Pro"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: billing ? `${formatMoney(billing.priceCents)} / month · ${billing.status}` : "No plan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-2 gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: "Platform fee"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tabular",
						children: billing ? `${(billing.gearGuardianBps / 100).toFixed(2)}%` : "—"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: "Fees on paid bookings"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tabular",
						children: formatMoney(fee)
					})] })]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-muted",
					children: "Stripe Connect"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-3xl",
					children: payments.chargesEnabled ? "Cards are live" : payments.connected ? "Finish Stripe setup" : "Connect payouts"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: readonly ? "Demo shops keep the mock checkout so the tour can run. Your own shop connects a Stripe account and guests pay that account." : "Guests pay on Stripe Checkout. Funds settle to the connected account, with the platform fee taken on each charge."
				}),
				!payments.processorReady && !readonly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Card payments are not configured for this workspace yet. Guests can still request a time."
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-danger",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "mt-5",
					disabled: readonly || busy || !payments.processorReady,
					onClick: () => {
						setBusy(true);
						setError(null);
						beginStripeConnect({ data: shop.slug }).then((result) => {
							window.location.href = result.url;
						}).catch((err) => {
							setError(err instanceof Error ? err.message : "Could not open Stripe");
							setBusy(false);
						});
					},
					children: busy ? "Opening Stripe" : payments.connected ? "Update Stripe account" : "Connect Stripe"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-3 block text-sm text-muted hover:text-fg",
					onClick: onReload,
					children: "Refresh status"
				})
			]
		})]
	});
}
function operatorQuery(slug, desk) {
	return desk === "master" ? {
		slug,
		desk
	} : slug;
}
function AdminPage() {
	const { shopSlug } = Route$11.useParams();
	const { stripe, desk } = Route$11.useSearch();
	const { user, isPending } = useCurrentUserState();
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const userId = user?.id;
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		let cancelled = false;
		getOperatorData({ data: operatorQuery(shopSlug, desk) }).then((next) => {
			if (!cancelled) {
				setError(null);
				setData(next);
			}
		}).catch((e) => {
			if (!cancelled) setError(e instanceof Error ? e.message : "Forbidden");
		});
		return () => {
			cancelled = true;
		};
	}, [
		desk,
		isPending,
		shopSlug,
		userId
	]);
	(0, import_react.useEffect)(() => {
		if (!user || !stripe) return;
		refreshStripeConnect({ data: shopSlug }).then(() => getOperatorData({ data: operatorQuery(shopSlug, desk) })).then(setData).catch(() => void 0);
	}, [
		desk,
		shopSlug,
		stripe,
		user
	]);
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		const id = window.setInterval(() => {
			getOperatorData({ data: operatorQuery(shopSlug, desk) }).then(setData).catch(() => void 0);
		}, 12e3);
		return () => window.clearInterval(id);
	}, [
		desk,
		isPending,
		shopSlug,
		userId
	]);
	if (isPending || user && !data && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-48 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	if (error || !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl",
				children: "This console is locked."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Create your own shop to get the operator view."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/onboard",
				className: "mt-4 inline-block text-sm underline-offset-4 hover:underline",
				children: "Start onboarding"
			})
		] })
	});
	if (data.mode === "employee") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/$shopSlug/employee",
		params: { shopSlug }
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, {
		data,
		readonly: data.mode === "preview",
		onReload: () => {
			getOperatorData({ data: operatorQuery(shopSlug, desk) }).then(setData);
		}
	});
}
function AdminShell({ data, readonly, onReload }) {
	const [tab, setTab] = (0, import_react.useState)("overview");
	const copy = nicheCopy(data.shop.niche);
	const tabLabel = {
		overview: "Overview",
		settings: "Settings",
		services: copy.menuHeading,
		brand: "Look",
		team: copy.staffStep,
		alerts: "Alerts",
		billing: "Billing"
	};
	const setup = data.shop.onboarding;
	const needsSetup = !readonly && (!setup.hero || !setup.service || !setup.employee);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
					data.platformDesk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-copper",
						children: "Platform desk. Changes write onto this shop's book."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [data.shop.name, readonly ? " · live demo preview" : ""]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						data.platformDesk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/master-admin",
							className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-copper hover:text-fg",
							children: "Master desk"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/$shopSlug",
							params: { shopSlug: data.shop.slug },
							className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg",
							children: "Customer site"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/$shopSlug/employee",
							params: { shopSlug: data.shop.slug },
							className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg",
							children: "Station"
						})
					]
				})]
			}),
			needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupStrip, {
				shop: data.shop,
				services: data.services,
				readonly,
				onDone: onReload
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex gap-1 overflow-x-auto px-5 sm:px-8",
				children: [
					"overview",
					"settings",
					"services",
					"brand",
					"team",
					"alerts",
					"billing"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(t),
					className: "h-11 shrink-0 rounded-xl px-3 text-sm",
					style: tab === t ? {
						background: "var(--color-surface)",
						color: "var(--color-fg)"
					} : { color: "var(--color-muted)" },
					children: tabLabel[t]
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 py-8 sm:px-8",
				children: [
					tab === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {
						data,
						readonly,
						onReload
					}) : null,
					tab === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {
							shop: data.shop,
							readonly,
							onReload
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopDashboardPanel, {
							shop: data.shop,
							employees: data.employees,
							disabled: readonly && !data.shop.isShowcase,
							onReload
						})]
					}) : null,
					tab === "services" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServicesPanel, {
						shop: data.shop,
						services: data.services,
						readonly,
						onReload
					}) : null,
					tab === "brand" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandPanel, {
						shop: data.shop,
						services: data.services,
						readonly,
						onReload
					}) : null,
					tab === "team" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamPanel, {
						shop: data.shop,
						employees: data.employees,
						readonly,
						onReload
					}) : null,
					tab === "alerts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertsPanel, {
						shop: data.shop,
						notifyEmail: data.notifyEmail,
						notifyPhone: data.notifyPhone,
						notices: data.notices,
						readonly,
						onReload
					}) : null,
					tab === "billing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentsPanel, {
						shop: data.shop,
						billing: data.billing,
						payments: data.payments,
						appointments: data.appointments,
						readonly,
						onReload
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AskEricAvatar, {
				businessName: data.shop.name,
				trade: NICHES[data.shop.niche].label,
				city: cityFromAddress(data.shop.address),
				welcome: data.mode === "owner" && !data.platformDesk ? data.shop.slug : void 0
			})
		]
	});
}
function SetupStrip({ shop, services, readonly, onDone }) {
	const flags = shop.onboarding;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-5 mb-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:mx-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Guided loop · admin setup"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-2xl",
				children: "Three moves, then book yourself."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-3 grid gap-2 text-sm sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: flags.hero ? "text-ok" : "text-muted",
						children: flags.hero ? "Hero set" : "1 · Hero + blend"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: flags.service ? "text-ok" : "text-muted",
						children: flags.service ? "Primary service" : "2 · Primary service"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: flags.employee ? "text-ok" : "text-muted",
						children: shop.worksAlone ? flags.employee ? "You're on the book" : "3 · Put your name on the book" : flags.employee ? "Staff invited" : "3 · Invite one employee"
					})
				]
			}),
			!readonly && flags.hero && flags.service && flags.employee ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/$shopSlug",
				params: { shopSlug: shop.slug },
				search: { loop: true },
				className: "mt-4 inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm font-medium text-bg",
				children: "Book a test appointment"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden",
				children: services.length
			})
		]
	});
}
function Overview({ data, readonly, onReload }) {
	const ring = useAxiomRing();
	const pending = data.appointments.filter((a) => a.status === "pending");
	const paid = data.appointments.filter((a) => a.paymentStatus === "paid");
	const revenue = paid.reduce((s, a) => s + a.paymentCents, 0);
	const cancelled = data.appointments.filter((a) => a.status === "cancelled");
	const leaked = cancelled.reduce((sum, item) => sum + item.paymentCents, 0);
	const chart = (0, import_react.useMemo)(() => {
		const days = [];
		for (let i = 6; i >= 0; i -= 1) {
			const d = /* @__PURE__ */ new Date();
			d.setHours(0, 0, 0, 0);
			d.setDate(d.getDate() - i);
			const key = d.toDateString();
			const cents = paid.filter((a) => new Date(a.startsAt).toDateString() === key).reduce((s, a) => s + a.paymentCents, 0);
			days.push({
				day: d.toLocaleDateString("en-US", { weekday: "short" }),
				cents
			});
		}
		return days;
	}, [paid]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-[1.2fr_0.8fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Captured",
						value: formatMoney(revenue)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Bookings",
						value: String(data.appointments.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Left on the table",
						value: formatMoney(leaked),
						hint: `${cancelled.length} cancelled`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-48 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
						data: chart,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
								id: "rev",
								x1: "0",
								y1: "0",
								x2: "0",
								y2: "1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
									offset: "0%",
									stopColor: "var(--ring-color, #2ee6d6)",
									stopOpacity: .45
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
									offset: "100%",
									stopColor: "var(--ring-color, #2ee6d6)",
									stopOpacity: 0
								})]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "day",
								stroke: "#6d6d76",
								fontSize: 11,
								axisLine: false,
								tickLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: {
									background: "#121216",
									border: "1px solid rgba(243,241,235,0.1)"
								},
								formatter: (v) => formatMoney(v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "monotone",
								dataKey: "cents",
								stroke: "var(--ring-color, #2ee6d6)",
								fill: "url(#rev)"
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-8 text-sm font-medium text-muted",
				children: "Schedule"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line",
				children: data.appointments.slice(0, 12).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							a.serviceName,
							" · ",
							a.employeeName
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							a.customerName,
							" ·",
							" ",
							new Date(a.startsAt).toLocaleString("en-US", {
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit"
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs uppercase tracking-wider text-faint",
						children: a.status
					})]
				}, a.id))
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm font-medium text-muted",
			children: "Incoming"
		}), pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-faint",
			children: "Quiet board. New requests light the ring."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 grid gap-2",
			children: pending.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: a.customerName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							a.serviceName,
							" with ",
							a.employeeName
						]
					}),
					!readonly || data.shop.isShowcase ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						size: "sm",
						onClick: () => {
							(async () => {
								ring.announce({
									id: `acc-${a.id}`,
									type: "booking_confirmed",
									appointmentId: a.id,
									payload: null,
									createdAt: (/* @__PURE__ */ new Date()).toISOString()
								}, true);
								await acceptBooking({ data: {
									slug: data.shop.slug,
									appointmentId: a.id
								} });
								onReload();
							})();
						},
						children: "Accept"
					}) : null
				]
			}, a.id))
		})] })]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lift-card rounded-2xl bg-surface/80 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-3xl tabular",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
function BrandPanel({ shop, services, readonly, onReload }) {
	const ring = useAxiomRing();
	const [blend, setBlend] = (0, import_react.useState)(shop.heroBlendPercent);
	const [color, setColor] = (0, import_react.useState)(shop.ringColor);
	const [primary, setPrimary] = (0, import_react.useState)(shop.primaryServiceId ?? services[0]?.id ?? "");
	const [preset, setPreset] = (0, import_react.useState)(shop.introPreset);
	const [speed, setSpeed] = (0, import_react.useState)(shop.introSpeed);
	const [intensity, setIntensity] = (0, import_react.useState)(shop.introIntensity);
	const [glow, setGlow] = (0, import_react.useState)(shop.glowEnabled);
	const [neon, setNeon] = (0, import_react.useState)(shop.neonAccent || shop.ringColor);
	const [layout, setLayout] = (0, import_react.useState)(shop.layout);
	const [dragIndex, setDragIndex] = (0, import_react.useState)(null);
	const [replay, setReplay] = (0, import_react.useState)(0);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [videoError, setVideoError] = (0, import_react.useState)(null);
	const [localVideo, setLocalVideo] = (0, import_react.useState)(null);
	const canIntro = !readonly || shop.isShowcase;
	const hero = resolveHeroMedia(shop);
	const previewVideo = localVideo ?? hero.videoUrl;
	(0, import_react.useEffect)(() => {
		setLocalVideo((current) => {
			if (current) URL.revokeObjectURL(current);
			return null;
		});
	}, [shop.heroVideoUrl]);
	async function save(extra) {
		setSaving(true);
		try {
			if (canIntro) await setShopIntro({ data: {
				slug: shop.slug,
				introPreset: preset,
				introSpeed: speed,
				introIntensity: intensity
			} });
			if (!readonly) await updateShopBrand({ data: {
				slug: shop.slug,
				heroBlendPercent: blend,
				ringColor: color,
				introPreset: preset,
				introSpeed: speed,
				introIntensity: intensity,
				heroImageUrl: extra?.heroImageUrl,
				primaryServiceId: primary || void 0,
				markHero: true,
				markService: extra?.markService ?? Boolean(primary),
				neonAccent: neon,
				glowEnabled: glow,
				layout
			} });
			onReload();
		} finally {
			setSaving(false);
		}
	}
	async function persistColor(next) {
		setColor(next);
		ring.setRingColor(next);
		await ring.persistRingColor(next);
	}
	async function persistIntro(next) {
		const p = next?.introPreset ?? preset;
		const s = next?.introSpeed ?? speed;
		const n = next?.introIntensity ?? intensity;
		setPreset(p);
		setSpeed(s);
		setIntensity(n);
		setReplay((v) => v + 1);
		if (!canIntro) return;
		try {
			await setShopIntro({ data: {
				slug: shop.slug,
				introPreset: p,
				introSpeed: s,
				introIntensity: n
			} });
		} catch {}
	}
	async function onFile(file) {
		if (!file) return;
		await save({ heroImageUrl: await fileToDataUrl(file, 900) });
	}
	async function onVideo(file) {
		if (!file || readonly) return;
		if (!(file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4"))) {
			setVideoError("Upload an .mp4 file");
			return;
		}
		if (file.size > 12582912) {
			setVideoError("Video must be 12 MB or smaller");
			return;
		}
		setVideoError(null);
		const preview = URL.createObjectURL(file);
		setLocalVideo((current) => {
			if (current) URL.revokeObjectURL(current);
			return preview;
		});
		setReplay((n) => n + 1);
		setUploading(true);
		try {
			const token = getBearerToken();
			const res = await fetch(`/api/hero-video/${shop.id}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"content-type": "video/mp4",
					...token ? { authorization: `Bearer ${token}` } : {}
				},
				body: file
			});
			const json = await res.json();
			if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "Upload failed");
			onReload();
		} catch (err) {
			setLocalVideo((current) => {
				if (current) URL.revokeObjectURL(current);
				return null;
			});
			setVideoError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-[28px]",
			style: {
				["--neon"]: neon,
				["--glow"]: glow ? "0.7" : "0"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CinematicHero, {
				imageUrl: hero.imageUrl,
				videoUrl: previewVideo,
				blendPercent: blend,
				introPreset: preset,
				introSpeed: speed,
				introIntensity: intensity,
				tone: hero.tone,
				replayKey: replay,
				previewMode: true,
				className: "min-h-[420px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-auto p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: "Live preview"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl",
						children: shop.name
					})]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
				htmlFor: "blend",
				children: [
					"Hero blend ",
					blend,
					"%"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "blend",
				type: "range",
				min: 35,
				max: 90,
				value: blend,
				disabled: readonly,
				onChange: (e) => setBlend(Number(e.target.value)),
				onPointerUp: () => void save(),
				className: "mt-2 w-full accent-accent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: "Masks the still into the page so the bottom of the hero dissolves into the dark field."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: localVideo ? "Custom loop · unsaved preview" : hero.loopLabel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-[24px] bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: "Axiom Hero Studio Editor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl",
						children: "Camera entrance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "An uploaded film replaces this shop's default loop. The entrance plays first. Scroll this page and the film, wash, and title move apart."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "hero-video",
								children: "Background video"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "hero-video",
								type: "file",
								accept: "video/mp4,.mp4",
								disabled: readonly || uploading,
								onChange: (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									onVideo(file);
								},
								className: "mt-2 block w-full text-sm text-muted"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: readonly ? "This preview keeps the niche film. A shop you own can replace it." : uploading ? "Saving the film…" : ".mp4, up to 12 MB. Stored for this shop only."
							}),
							videoError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-danger",
								children: videoError
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "intro-preset",
							children: "Preset"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "intro-preset",
							value: preset,
							disabled: !canIntro,
							onChange: (e) => void persistIntro({ introPreset: e.target.value }),
							className: "mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
							children: INTRO_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.label
							}, p.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "intro-speed",
							children: ["Speed ", speed]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "intro-speed",
							type: "range",
							min: 1,
							max: 100,
							value: speed,
							disabled: !canIntro,
							onChange: (e) => {
								setSpeed(Number(e.target.value));
								setReplay((n) => n + 1);
							},
							onPointerUp: (e) => void persistIntro({ introSpeed: Number(e.currentTarget.value) }),
							className: "mt-2 w-full accent-accent"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "intro-intensity",
								children: ["Intensity ", intensity]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "intro-intensity",
								type: "range",
								min: 0,
								max: 100,
								value: intensity,
								disabled: !canIntro,
								onChange: (e) => {
									setIntensity(Number(e.target.value));
									setReplay((n) => n + 1);
								},
								onPointerUp: (e) => void persistIntro({ introIntensity: Number(e.currentTarget.value) }),
								className: "mt-2 w-full accent-accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: "Higher intensity widens the scroll split and gives a film a slight rate lift while the hero is on screen."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "mt-4",
						disabled: !canIntro,
						onClick: () => setReplay((n) => n + 1),
						children: "Replay preview"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "ring",
						children: "Ring color · all dashboards"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Perimeter glow shared by customers, staff, and this console. Incoming books pulse it; confirmations lock it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [RING_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": p.name,
							onClick: () => void persistColor(p.value),
							className: "size-10 rounded-full",
							style: {
								background: p.value,
								boxShadow: color.toUpperCase() === p.value.toUpperCase() ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${p.value}` : "0 0 0 1px rgba(243,241,235,0.16)"
							}
						}, p.value)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "ring",
							type: "color",
							value: color,
							onChange: (e) => {
								const next = e.target.value;
								setColor(next);
								ring.setRingColor(next);
							},
							onBlur: () => void persistColor(color),
							className: "h-11 w-16 cursor-pointer rounded-xl bg-surface-2"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "neon-glow",
						children: "Neon accent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Glass edges on the public page. The ring stays the perimeter."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [NEON_PRESETS.map((presetColor) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": presetColor.name,
							disabled: readonly,
							onClick: () => {
								setNeon(presetColor.value);
								updateShopBrand({ data: {
									slug: shop.slug,
									neonAccent: presetColor.value,
									glowEnabled: glow,
									layout
								} }).then(() => onReload());
							},
							className: "size-10 rounded-full",
							style: {
								background: presetColor.value,
								boxShadow: neon.toUpperCase() === presetColor.value ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${presetColor.value}` : "0 0 0 1px rgba(243,241,235,0.16)"
							}
						}, presetColor.value)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							id: "neon-glow",
							type: "button",
							disabled: readonly,
							"aria-pressed": glow,
							onClick: () => {
								const next = !glow;
								setGlow(next);
								updateShopBrand({ data: {
									slug: shop.slug,
									neonAccent: neon,
									glowEnabled: next,
									layout
								} }).then(() => onReload());
							},
							className: "glass-btn h-11 rounded-full px-4 text-sm",
							children: glow ? "Glow on" : "Glow off"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Page order" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 grid gap-2",
						children: layout.map((block, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							draggable: !readonly,
							onDragStart: () => setDragIndex(index),
							onDragOver: (event) => event.preventDefault(),
							onDrop: () => {
								if (dragIndex == null || dragIndex === index) return;
								const next = [...layout];
								const [item] = next.splice(dragIndex, 1);
								if (!item) return;
								next.splice(index, 0, item);
								setDragIndex(null);
								setLayout(next);
								updateShopBrand({ data: {
									slug: shop.slug,
									neonAccent: neon,
									glowEnabled: glow,
									layout: next
								} }).then(() => onReload());
							},
							className: "flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm capitalize",
								children: block
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: readonly || index === 0,
									className: "h-9 rounded-lg px-2 text-xs text-muted disabled:opacity-40",
									onClick: () => {
										const next = [...layout];
										const [item] = next.splice(index, 1);
										if (!item) return;
										next.splice(index - 1, 0, item);
										setLayout(next);
										updateShopBrand({ data: {
											slug: shop.slug,
											neonAccent: neon,
											glowEnabled: glow,
											layout: next
										} }).then(() => onReload());
									},
									children: "Up"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: readonly || index === layout.length - 1,
									className: "h-9 rounded-lg px-2 text-xs text-muted disabled:opacity-40",
									onClick: () => {
										const next = [...layout];
										const [item] = next.splice(index, 1);
										if (!item) return;
										next.splice(index + 1, 0, item);
										setLayout(next);
										updateShopBrand({ data: {
											slug: shop.slug,
											neonAccent: neon,
											glowEnabled: glow,
											layout: next
										} }).then(() => onReload());
									},
									children: "Down"
								})]
							})]
						}, block))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-faint",
						children: [
							"The film stays first. ",
							LAYOUT_BLOCKS.join(", "),
							" follow it."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "primary",
					children: "Primary service"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					id: "primary",
					value: primary,
					disabled: readonly,
					onChange: (e) => {
						const v = e.target.value;
						setPrimary(v);
						(async () => {
							if (readonly) return;
							setSaving(true);
							try {
								await updateShopBrand({ data: {
									slug: shop.slug,
									heroBlendPercent: blend,
									ringColor: color,
									introPreset: preset,
									introSpeed: speed,
									introIntensity: intensity,
									primaryServiceId: v,
									markHero: true,
									markService: true
								} });
								onReload();
							} finally {
								setSaving(false);
							}
						})();
					},
					className: "mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
					children: services.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: s.id,
						children: s.name
					}, s.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "hero-file",
					children: "Replace hero still"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "hero-file",
					type: "file",
					accept: "image/*",
					disabled: readonly,
					onChange: (e) => void onFile(e.target.files?.[0]),
					className: "mt-2 block w-full text-sm text-muted"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6",
				disabled: saving || !canIntro && readonly,
				onClick: () => void save(),
				children: "Save brand"
			})
		] })]
	});
}
function TeamPanel({ shop, employees, readonly, onReload }) {
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [invitePath, setInvitePath] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-[1fr_22rem]",
		children: [
			shop.worksAlone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted lg:col-span-2",
				children: "You started alone. The customer books you. Add a second name here when the book needs one."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3",
				children: employees.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 rounded-2xl bg-surface p-3",
					children: [e.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: e.avatarUrl,
						alt: "",
						className: "size-14 rounded-xl object-cover"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: e.displayName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							e.title,
							" · ",
							e.inviteStatus
						]
					})] })]
				}, e.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "rounded-2xl bg-surface p-4",
				onSubmit: (ev) => {
					ev.preventDefault();
					if (readonly) return;
					setBusy(true);
					inviteEmployee({ data: {
						slug: shop.slug,
						displayName,
						phone
					} }).then((r) => {
						setInvitePath(r.invitePath);
						setDisplayName("");
						setPhone("");
						onReload();
					}).finally(() => setBusy(false));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: "Invite staff"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Enter a name and phone. They sign in and claim the link — no shared PIN."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "en",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "en",
							value: displayName,
							onChange: (e) => setDisplayName(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "ep",
							children: "Phone"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "ep",
							value: phone,
							onChange: (e) => setPhone(e.target.value),
							placeholder: "+1…"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "mt-4 w-full",
						disabled: readonly || busy,
						children: "Create invite"
					}),
					invitePath ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 break-all text-xs text-muted",
						children: [
							"Invite link: ",
							invitePath,
							". The chair is already live on your booking page."
						]
					}) : null,
					shop.onboarding.hero && shop.onboarding.service && (shop.onboarding.employee || invitePath) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug",
						params: { shopSlug: shop.slug },
						search: { loop: true },
						className: "mt-4 flex h-11 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg",
						children: "Book a test appointment"
					}) : null
				]
			})
		]
	});
}
async function fileToDataUrl(file, maxEdge) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const w = Math.round(bitmap.width * scale);
	const h = Math.round(bitmap.height * scale);
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas");
	ctx.drawImage(bitmap, 0, 0, w, h);
	return canvas.toDataURL("image/jpeg", .82);
}
//#endregion
export { AdminPage as component };
