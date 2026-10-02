import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-Dzshj1Ep.mjs";
import { C as updateShopBrand, h as getOperatorData, o as Route$6, u as acceptBooking, v as inviteEmployee } from "./router-Cz9T8z2K.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { o as Wordmark, t as RedirectToSignIn } from "./shop-chrome-JtjEzse-.mjs";
import { t as CinematicHero } from "./cinematic-hero-udUXGdfY.mjs";
import { r as useAxiomRing } from "./axiom-ring-BmnHFBJX.mjs";
import { t as Button } from "./button-BTEaNPOc.mjs";
import { n as Label, t as Input } from "./input-DmlJju-z.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as XAxis, r as Area, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-DF3P1KaY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	const { shopSlug } = Route$6.useParams();
	const { user, isPending } = useCurrentUserState();
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		getOperatorData({ data: shopSlug }).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Forbidden"));
	}, [
		isPending,
		shopSlug,
		user
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
			getOperatorData({ data: shopSlug }).then(setData);
		}
	});
}
function AdminShell({ data, readonly, onReload }) {
	const [tab, setTab] = (0, import_react.useState)("overview");
	const setup = data.shop.onboarding;
	const needsSetup = !readonly && (!setup.hero || !setup.service || !setup.employee);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [data.shop.name, readonly ? " · live demo preview" : ""]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug",
						params: { shopSlug: data.shop.slug },
						className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg",
						children: "Customer site"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug/employee",
						params: { shopSlug: data.shop.slug },
						className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg",
						children: "Station"
					})]
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
					"brand",
					"team",
					"billing"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(t),
					className: "h-11 rounded-xl px-3 text-sm capitalize",
					style: tab === t ? {
						background: "var(--color-surface)",
						color: "var(--color-fg)"
					} : { color: "var(--color-muted)" },
					children: t
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
					tab === "billing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillingPanel, {
						billing: data.billing,
						appointments: data.appointments
					}) : null
				]
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
						children: flags.employee ? "Staff invited" : "3 · Invite one employee"
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Captured",
					value: formatMoney(revenue)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Bookings",
					value: String(data.appointments.length)
				})]
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
					!readonly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						size: "sm",
						onClick: () => {
							(async () => {
								await acceptBooking({ data: {
									slug: data.shop.slug,
									appointmentId: a.id
								} });
								ring.announce({
									id: `acc-${a.id}`,
									type: "booking_confirmed",
									appointmentId: a.id,
									createdAt: (/* @__PURE__ */ new Date()).toISOString()
								}, true);
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
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-3xl tabular",
			children: value
		})]
	});
}
function BrandPanel({ shop, services, readonly, onReload }) {
	const [blend, setBlend] = (0, import_react.useState)(shop.heroBlendPercent);
	const [color, setColor] = (0, import_react.useState)(shop.ringColor);
	const [primary, setPrimary] = (0, import_react.useState)(shop.primaryServiceId ?? services[0]?.id ?? "");
	const [saving, setSaving] = (0, import_react.useState)(false);
	async function save(extra) {
		if (readonly) return;
		setSaving(true);
		try {
			await updateShopBrand({ data: {
				slug: shop.slug,
				heroBlendPercent: blend,
				ringColor: color,
				heroImageUrl: extra?.heroImageUrl,
				primaryServiceId: primary || void 0,
				markHero: true,
				markService: extra?.markService ?? Boolean(primary)
			} });
			onReload();
		} finally {
			setSaving(false);
		}
	}
	async function onFile(file) {
		if (!file) return;
		await save({ heroImageUrl: await fileToDataUrl(file, 900) });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-[28px]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CinematicHero, {
				imageUrl: shop.heroImageUrl,
				videoUrl: shop.heroVideoUrl,
				blendPercent: blend,
				ringColor: color,
				className: "min-h-[420px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-auto p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl",
						children: shop.name
					})
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
				children: "Masks the media into the page so the bottom of the hero dissolves into the dark field."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "ring",
					children: "Ring color"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "ring",
					type: "color",
					value: color,
					disabled: readonly,
					onChange: (e) => setColor(e.target.value),
					onBlur: () => void save(),
					className: "mt-2 h-11 w-24 cursor-pointer rounded-xl bg-surface-2"
				})]
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
				disabled: readonly || saving,
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
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
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
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
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
		})]
	});
}
function BillingPanel({ billing, appointments }) {
	const volume = appointments.reduce((s, a) => s + a.paymentCents, 0);
	const fee = billing ? Math.round(volume * billing.gearGuardianBps / 1e4) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-lg rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
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
					children: "Gear Guardian fee"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "tabular",
					children: billing ? `${(billing.gearGuardianBps / 100).toFixed(2)}%` : "—"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: "Fees this week"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "tabular",
					children: formatMoney(fee)
				})] })]
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
