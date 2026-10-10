import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, S as useNavigate, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as initials } from "./utils-BkNFIPfO.mjs";
import { f as formatOffer, k as serviceGroups, p as formatPrice, x as nicheCopy } from "./intro-MrMOJI2L.mjs";
import { I as startCardCheckout, S as getShopAccess, _ as createBooking, a as Route$10, g as confirmCardCheckout, k as releaseCardCheckout, u as useShopPageData, w as listBookedStarts } from "./router-Co1j6ZW7.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { a as PoweredBy, s as ShopNav } from "./shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { r as useAxiomRing } from "./axiom-ring-aRRm8Rym.mjs";
import { t as GearGuardianCheckout } from "./gear-guardian-checkout-CDPe_sWt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/book-ubIg-u_B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DAY_KEYS = [
	"sun",
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat"
];
function parseRange(range) {
	if (typeof range !== "string" || !range || range === "closed") return null;
	const [a, b] = range.split("-");
	if (!a || !b) return null;
	const [sh, sm] = a.split(":").map(Number);
	const [eh, em] = b.split(":").map(Number);
	return {
		start: sh * 60 + sm,
		end: eh * 60 + em
	};
}
function buildSlots(opts) {
	const days = opts.days ?? 7;
	const booked = new Set(opts.bookedIsos.map((s) => new Date(s).getTime()));
	const groups = [];
	const now = Date.now() + 18e5;
	for (let d = 0; d < days; d += 1) {
		const day = /* @__PURE__ */ new Date();
		day.setHours(0, 0, 0, 0);
		day.setDate(day.getDate() + d);
		const key = DAY_KEYS[day.getDay()];
		const range = parseRange(opts.hours?.[key] ?? "closed");
		const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
		const dayLabel = day.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric"
		});
		const slots = [];
		if (range) for (let m = range.start; m + opts.durationMin <= range.end; m += 30) {
			const dt = new Date(day);
			dt.setHours(Math.floor(m / 60), m % 60, 0, 0);
			if (dt.getTime() < now) continue;
			if (booked.has(dt.getTime())) continue;
			slots.push({
				iso: dt.toISOString(),
				label: dt.toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit"
				}),
				dayLabel
			});
		}
		groups.push({
			dayLabel,
			dateKey,
			slots
		});
	}
	return groups;
}
function BookPage() {
	const data = useShopPageData();
	const search = Route$10.useSearch();
	const navigate = useNavigate();
	const { setPendingId, announce } = useAxiomRing();
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("customer");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [serviceId, setServiceId] = (0, import_react.useState)(search.service ?? data.shop.primaryServiceId ?? data.services[0]?.id ?? "");
	const [employeeId, setEmployeeId] = (0, import_react.useState)(search.employee ?? "");
	const [slot, setSlot] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [pay, setPay] = (0, import_react.useState)(false);
	const [booked, setBooked] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const service = data.services.find((s) => s.id === serviceId) ?? data.services[0];
	const eligible = data.employees.filter((e) => !service || e.serviceIds.includes(service.id) || e.serviceIds.length === 0);
	const employee = eligible.find((e) => e.id === employeeId) ?? eligible[0] ?? data.employees[0];
	const copy = nicheCopy(data.shop.niche);
	(0, import_react.useEffect)(() => {
		if (employee && employee.id !== employeeId) setEmployeeId(employee.id);
	}, [employee, employeeId]);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		getShopAccess({ data: data.shop.slug }).then((a) => setMode(a.mode === "none" ? "customer" : a.mode)).catch(() => setMode("customer"));
	}, [
		data.shop.slug,
		isPending,
		user
	]);
	(0, import_react.useEffect)(() => {
		if (!employee) return;
		listBookedStarts({ data: {
			slug: data.shop.slug,
			employeeId: employee.id
		} }).then(setBooked);
	}, [data.shop.slug, employee]);
	(0, import_react.useEffect)(() => {
		if (!search.session) return;
		let stop = false;
		setBusy(true);
		confirmCardCheckout({ data: {
			slug: data.shop.slug,
			sessionId: search.session
		} }).then(async (result) => {
			if (stop) return;
			setPendingId(result.appointmentId);
			announce({
				id: `local-${result.appointmentId}`,
				type: "booking_request",
				appointmentId: result.appointmentId,
				payload: null,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}, true);
			await navigate({
				to: "/$shopSlug",
				params: { shopSlug: data.shop.slug }
			});
		}).catch((err) => {
			if (!stop) setError(err instanceof Error ? err.message : "Payment could not be confirmed");
		}).finally(() => {
			if (!stop) setBusy(false);
		});
		return () => {
			stop = true;
		};
	}, [
		announce,
		data.shop.slug,
		navigate,
		search.session,
		setPendingId
	]);
	(0, import_react.useEffect)(() => {
		if (!search.cancelled) return;
		releaseCardCheckout({ data: {
			slug: data.shop.slug,
			appointmentId: search.cancelled
		} }).then(() => setError("Payment cancelled. That time was released."));
	}, [data.shop.slug, search.cancelled]);
	const groups = (0, import_react.useMemo)(() => {
		if (!service) return [];
		return buildSlots({
			hours: data.shop.hours ?? {},
			durationMin: service.durationMin,
			bookedIsos: booked
		});
	}, [
		booked,
		data.shop.hours,
		service
	]);
	const payMode = data.shop.acceptsCard && (service?.priceCents ?? 0) > 0 ? "stripe" : data.shop.isShowcase ? "demo" : "request";
	async function finishBooking(paymentRef) {
		if (!service || !employee || !slot) return;
		const result = await createBooking({ data: {
			slug: data.shop.slug,
			employeeId: employee.id,
			serviceId: service.id,
			customerName: name,
			customerPhone: phone,
			customerEmail: email,
			startsAt: slot,
			paymentMode: payMode === "demo" ? "demo" : "request",
			paymentRef
		} });
		setPendingId(result.id);
		announce({
			id: `local-${result.id}`,
			type: "booking_request",
			appointmentId: result.id,
			payload: null,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, true);
		await navigate({
			to: "/$shopSlug",
			params: { shopSlug: data.shop.slug },
			search: { requested: true }
		});
	}
	async function onPaid(paymentRef) {
		await finishBooking(paymentRef);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopNav, {
				shop: data.shop,
				mode
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-5xl gap-8 px-5 pt-4 sm:px-10 lg:grid-cols-[1fr_22rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: copy.bookLabel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl",
						children: data.shop.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: copy.offerStep,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2",
							children: serviceGroups(data.services).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [group.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "pt-2 text-[11px] uppercase tracking-[0.18em] text-muted",
									children: group.label
								}) : null, group.items.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
									active: s.id === service?.id,
									onClick: () => {
										setServiceId(s.id);
										setSlot(null);
										setPay(false);
									},
									title: s.name,
									meta: formatOffer(s)
								}, s.id))]
							}, group.label || "menu"))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: copy.staffStep,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2 sm:grid-cols-2",
							children: eligible.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffChoice, {
								employee: e,
								active: e.id === employee?.id,
								onClick: () => {
									setEmployeeId(e.id);
									setSlot(null);
									setPay(false);
								}
							}, e.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: copy.timeStep,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-5",
							children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs text-muted",
								children: g.dayLabel
							}), g.slots.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-faint",
								children: "No openings"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: g.slots.map((sl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setSlot(sl.iso);
										setPay(false);
									},
									className: "h-10 rounded-lg px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.1)]",
									style: slot === sl.iso ? {
										background: "var(--color-fg)",
										color: "var(--color-bg)"
									} : void 0,
									children: sl.label
								}, sl.iso))
							})] }, g.dateKey))
						})
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "lg:pt-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									service?.name,
									" with ",
									employee?.displayName
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-3xl",
								children: service ? formatPrice(service) : "—"
							}),
							slot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: new Date(slot).toLocaleString("en-US", {
									weekday: "short",
									month: "short",
									day: "numeric",
									hour: "numeric",
									minute: "2-digit"
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-faint",
								children: copy.timeHint
							}),
							!pay ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-5 grid gap-3",
								onSubmit: (e) => {
									e.preventDefault();
									if (!slot || !name.trim() || !service || !employee) {
										setError("Name and a time are required");
										return;
									}
									setError(null);
									if (payMode === "demo") {
										setPay(true);
										return;
									}
									setBusy(true);
									(payMode === "stripe" ? startCardCheckout({ data: {
										slug: data.shop.slug,
										employeeId: employee.id,
										serviceId: service.id,
										customerName: name,
										customerPhone: phone,
										customerEmail: email,
										startsAt: slot
									} }).then((result) => {
										window.location.href = result.url;
									}) : finishBooking()).catch((err) => {
										setError(err instanceof Error ? err.message : "Could not book");
										setBusy(false);
									});
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "cn",
										children: "Your name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "cn",
										value: name,
										onChange: (e) => setName(e.target.value),
										required: true
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "cp",
										children: "Phone"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "cp",
										value: phone,
										onChange: (e) => setPhone(e.target.value),
										placeholder: "Optional"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "ce",
										children: "Email"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "ce",
										type: "email",
										value: email,
										onChange: (e) => setEmail(e.target.value),
										placeholder: "Optional"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: payMode === "stripe" ? "No account. Stripe opens next and pays this shop directly." : payMode === "demo" ? "Demo checkout. Nothing is charged." : "No account. Request the time and the shop confirms it."
									}),
									error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-danger",
										children: error
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										size: "lg",
										disabled: !slot || busy,
										children: busy ? "Working" : payMode === "stripe" ? `Pay ${service ? formatPrice(service) : ""}` : payMode === "demo" ? "Continue to Gear Guardian" : copy.requestLabel
									})
								]
							}) : service ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearGuardianCheckout, {
									amountCents: service.priceCents,
									shopName: data.shop.name,
									onPaid,
									onCancel: () => setPay(false)
								})
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug",
						params: { shopSlug: data.shop.slug },
						className: "mt-4 inline-block text-sm text-muted hover:text-fg",
						children: "Back to shop"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoweredBy, {})
		]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium text-muted",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children
		})]
	});
}
function Choice({ active, onClick, title, meta }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		style: active ? { boxShadow: "0 0 0 1px var(--ring-color, #2ee6d6)" } : void 0,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted",
			children: meta
		})]
	});
}
function StaffChoice({ employee, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex items-center gap-3 rounded-xl bg-surface p-2.5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		style: active ? { boxShadow: "0 0 0 1px var(--ring-color, #2ee6d6)" } : void 0,
		children: [employee.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: employee.avatarUrl,
			alt: "",
			className: "size-12 rounded-lg object-cover"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-12 place-items-center rounded-lg bg-surface-2 text-sm",
			children: initials(employee.displayName)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: employee.displayName
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-muted",
			children: employee.title
		})] })]
	});
}
//#endregion
export { BookPage as component };
