import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as addPortfolioItem, g as getPortfolio, h as getOperatorData, i as Route$4 } from "./router-Cz9T8z2K.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { o as Wordmark, t as RedirectToSignIn } from "./shop-chrome-JtjEzse-.mjs";
import { n as Label, t as Input } from "./input-DmlJju-z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/employee-BDNNwvV8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EmployeePage() {
	const { shopSlug } = Route$4.useParams();
	const { user, isPending } = useCurrentUserState();
	const [error, setError] = (0, import_react.useState)(null);
	const [shop, setShop] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("none");
	const [employee, setEmployee] = (0, import_react.useState)(null);
	const [appointments, setAppointments] = (0, import_react.useState)([]);
	const [gallery, setGallery] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		getOperatorData({ data: shopSlug }).then(async (d) => {
			setShop(d.shop);
			setMode(d.mode);
			setAppointments(d.appointments);
			const emp = d.employees.find((e) => e.id === d.employeeId) ?? d.employees[0] ?? null;
			setEmployee(emp);
			if (emp) setGallery(await getPortfolio({ data: emp.id }));
		}).catch((e) => setError(e instanceof Error ? e.message : "Forbidden"));
	}, [
		isPending,
		shopSlug,
		user
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
					children: [mode === "owner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
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
							className: "flex justify-between gap-3 py-3",
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
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs uppercase tracking-wider text-faint",
								children: a.status
							})]
						}, a.id))
					})
				]
			}),
			employee ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioManager, {
				slug: shop.slug,
				employeeId: employee.id,
				gallery,
				onChange: setGallery,
				readonly: mode === "preview"
			}) : null
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
