import { Z as notFound, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney, r as initials } from "./utils-Dzshj1Ep.mjs";
import { l as Route$10, n as Route$2 } from "./router-Cz9T8z2K.mjs";
import { n as ShopNav } from "./shop-chrome-JtjEzse-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff._employeeId-TLq9GOFf.js
var import_jsx_runtime = require_jsx_runtime();
function StaffPage() {
	const { employeeId } = Route$2.useParams();
	const { items } = Route$2.useLoaderData();
	const data = Route$10.useLoaderData();
	const employee = data.employees.find((e) => e.id === employeeId);
	if (!employee) throw notFound();
	const offered = data.services.filter((s) => employee.serviceIds.includes(s.id) || employee.serviceIds.length === 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg pb-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopNav, {
			shop: data.shop,
			mode: "customer"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-4xl px-5 sm:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-6 sm:flex-row",
					children: [employee.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: employee.avatarUrl,
						alt: "",
						className: "h-72 w-full rounded-[28px] object-cover sm:h-80 sm:w-64"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-72 w-full place-items-center rounded-[28px] bg-surface font-display text-5xl sm:h-80 sm:w-64",
						children: initials(employee.displayName)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 pt-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.2em] text-muted",
								children: employee.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 font-display text-5xl leading-none",
								children: employee.displayName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-md text-muted",
								children: employee.bio
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/$shopSlug/book",
								params: { shopSlug: data.shop.slug },
								search: { employee: employee.id },
								className: "mt-6 inline-flex h-12 items-center rounded-xl bg-fg px-5 text-sm font-medium text-bg",
								children: ["Book with ", employee.displayName.split(" ")[0]]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Services"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-line",
						children: offered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between py-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-muted",
								children: formatMoney(s.priceCents)
							})]
						}, s.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Work"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-3",
						children: items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
							className: "overflow-hidden rounded-2xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: p.imageUrl,
								alt: "",
								className: "aspect-[4/3] w-full object-cover"
							}), p.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
								className: "py-2 text-xs text-muted",
								children: p.caption
							}) : null]
						}, p.id))
					})]
				})
			]
		})]
	});
}
//#endregion
export { StaffPage as component };
