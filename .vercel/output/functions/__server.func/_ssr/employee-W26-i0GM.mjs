import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as WEEKDAYS } from "./intro-MrMOJI2L.mjs";
import { b as getPortfolio, f as acceptBooking, i as Route$9, j as setEmployeeAvailability, p as addPortfolioItem, u as useShopPageData, y as getOperatorData } from "./router-Co1j6ZW7.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { d as Wordmark, o as RedirectToSignIn } from "./shop-chrome-C8WE8XQ6.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { i as effectiveDashboard } from "./dashboard-BdvHoEL2.mjs";
import { t as EmployeeDashboardEditor } from "./dashboard-controls-CtsLKan-.mjs";
import { r as useAxiomRing } from "./axiom-ring-aRRm8Rym.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/employee-W26-i0GM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EmployeePage() {
	const { shopSlug } = Route$9.useParams();
	const live = useShopPageData();
	const { user, isPending } = useCurrentUserState();
	const ring = useAxiomRing();
	const [error, setError] = (0, import_react.useState)(null);
	const [shop, setShop] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("none");
	const [employee, setEmployee] = (0, import_react.useState)(null);
	const [appointments, setAppointments] = (0, import_react.useState)([]);
	const [notices, setNotices] = (0, import_react.useState)([]);
	const [gallery, setGallery] = (0, import_react.useState)([]);
	const [localConfig, setLocalConfig] = (0, import_react.useState)(null);
	const userId = user?.id;
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		let cancelled = false;
		getOperatorData({ data: shopSlug }).then(async (d) => {
			if (cancelled) return;
			setError(null);
			setShop(d.shop);
			setMode(d.mode);
			setAppointments(d.appointments);
			setNotices(d.notices);
			const emp = d.employees.find((e) => e.id === d.employeeId) ?? d.employees[0] ?? null;
			setEmployee(emp);
			if (emp) setGallery(await getPortfolio({ data: emp.id }));
		}).catch((e) => {
			if (!cancelled) setError(e instanceof Error ? e.message : "Forbidden");
		});
		return () => {
			cancelled = true;
		};
	}, [
		isPending,
		shopSlug,
		userId
	]);
	if (isPending || user && !shop && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-40 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	if (error || !shop) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-3xl",
			children: "No station on this shop."
		})
	});
	const stationShop = live.shop.slug === shop.slug ? live.shop : shop;
	const stationEmployee = (employee && live.employees.find((item) => item.id === employee.id)) ?? employee;
	const personalConfig = localConfig ?? stationEmployee?.dashboardConfig ?? null;
	const layout = stationEmployee && personalConfig ? effectiveDashboard(stationShop.dashboardOverride, stationShop.dashboardConfig, personalConfig) : null;
	const stationNotices = notices.filter((notice) => notice.channel === "inbox" && employee && notice.employeeId === employee.id);
	const editorEmployee = stationEmployee && personalConfig ? {
		...stationEmployee,
		dashboardConfig: personalConfig
	} : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg px-5 py-6 sm:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						employee?.displayName ?? "Station",
						" · ",
						shop.name
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [mode === "owner" || mode === "preview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug/admin",
						params: { shopSlug: shop.slug },
						className: "inline-flex h-11 items-center text-sm text-muted hover:text-fg",
						children: "Admin"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/$shopSlug",
						params: { shopSlug: shop.slug },
						className: "inline-flex h-11 items-center text-sm text-muted hover:text-fg",
						children: "Site"
					})]
				})]
			}),
			editorEmployee ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmployeeDashboardEditor, {
				shop: stationShop,
				employee: editorEmployee,
				disabled: mode !== "preview" && mode !== "owner" && mode !== "employee",
				onSaved: setLocalConfig
			}) : null,
			layout && layout.sections.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-sm text-faint",
				children: "This station is clear."
			}) : null,
			employee ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StationProfile, {
				shopSlug: shop.slug,
				employee,
				appointments: appointments.filter((item) => item.employeeId === employee.id),
				locked: mode === "preview",
				onAvailability: (availability) => setEmployee({
					...employee,
					availability
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: "Station"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-3xl",
						children: "Client notes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 grid gap-2",
						children: stationNotices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-faint",
							children: "No notices for this station yet."
						}) : stationNotices.map((notice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-wider text-faint",
									children: notice.kind.split("_").join(" ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-medium",
									children: notice.subject
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: notice.body
								})
							]
						}, notice.id))
					})
				]
			}),
			layout?.sections.includes("schedule") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-muted",
						children: "My book"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl",
						children: "Schedule"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-6 divide-y divide-line",
						children: appointments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "py-6 text-sm text-faint",
							children: "No appointments yet."
						}) : appointments.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: a.serviceName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									a.customerName,
									" ·",
									" ",
									new Date(a.startsAt).toLocaleString("en-US", {
										weekday: "short",
										month: "short",
										day: "numeric",
										hour: "numeric",
										minute: "2-digit"
									})
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-2",
								children: a.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
												slug: shop.slug,
												appointmentId: a.id
											} });
											const next = await getOperatorData({ data: shop.slug });
											setAppointments(next.appointments);
											setNotices(next.notices);
										})();
									},
									children: "Accept"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs uppercase tracking-wider text-faint",
									children: a.status
								})
							})]
						}, a.id))
					})
				]
			}) : null,
			layout?.sections.includes("portfolio") && employee ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioManager, {
				slug: shop.slug,
				employeeId: employee.id,
				gallery,
				onChange: setGallery,
				readonly: mode === "preview"
			}) : null,
			layout?.sections.includes("hours") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHours, { hours: stationShop.hours }) : null
		]
	});
}
function StationProfile({ shopSlug, employee, appointments, locked, onAvailability }) {
	const confirmed = appointments.filter((item) => item.status === "confirmed").length;
	const pending = appointments.filter((item) => item.status === "pending").length;
	const completed = appointments.filter((item) => item.status === "completed").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Profile"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: employee.displayName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: employee.title
			}),
			employee.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-lg text-sm leading-relaxed text-muted",
				children: employee.bio
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Waiting",
						value: pending
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Confirmed",
						value: confirmed
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Finished",
						value: completed
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Days on the book"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: WEEKDAYS.map(([key, label]) => {
					const on = employee.availability[key];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": on,
						disabled: locked,
						onClick: () => {
							setEmployeeAvailability({ data: {
								slug: shopSlug,
								employeeId: employee.id,
								day: key,
								on: !on
							} }).then((result) => onAvailability(result.availability));
						},
						className: `glass-btn h-11 rounded-full px-4 text-sm ${on ? "text-fg" : "text-faint"}`,
						children: label
					}, key);
				})
			})
		]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[11px] uppercase tracking-[0.16em] text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-2 font-display text-3xl tabular",
			children: value
		})]
	});
}
function ShopHours({ hours }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-12 max-w-sm pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Open"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: "Shop hours"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-2 text-sm",
				children: WEEKDAYS.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular",
						children: hours[key] ?? "closed"
					})]
				}, key))
			})
		]
	});
}
function PortfolioManager({ slug, employeeId, gallery, onChange, readonly }) {
	const [caption, setCaption] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onFile(file) {
		if (!file || readonly) return;
		setBusy(true);
		try {
			const imageUrl = await compress(file);
			await addPortfolioItem({ data: {
				slug,
				imageUrl,
				caption
			} });
			setCaption("");
			onChange(await getPortfolio({ data: employeeId }));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-12 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Proof of work"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: "Portfolio"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3",
				children: gallery.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-2xl bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.imageUrl,
						alt: "",
						className: "aspect-[4/3] w-full object-cover"
					}), p.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "px-3 py-2 text-xs text-muted",
						children: p.caption
					}) : null]
				}, p.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 max-w-sm",
				onSubmit: (e) => e.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "cap",
						children: "Caption"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "cap",
						value: caption,
						onChange: (e) => setCaption(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 flex h-11 cursor-pointer items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg",
						children: [busy ? "Uploading…" : "Upload image", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "image/*",
							className: "hidden",
							disabled: readonly || busy,
							onChange: (e) => void onFile(e.target.files?.[0])
						})]
					}),
					readonly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-faint",
						children: "Preview only on the demo shop."
					}) : null
				]
			})
		]
	});
}
async function compress(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas");
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", .8);
}
//#endregion
export { EmployeePage as component };
