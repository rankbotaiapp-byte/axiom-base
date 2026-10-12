import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product-shelf-SInYHZkV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductShelf({ items }) {
	const [stock, setStock] = (0, import_react.useState)(() => Object.fromEntries(items.map((item) => [item.id, item.stock])));
	const [cart, setCart] = (0, import_react.useState)([]);
	const [order, setOrder] = (0, import_react.useState)("");
	const [active, setActive] = (0, import_react.useState)(items[0]?.id ?? "");
	const focus = items.find((item) => item.id === active) ?? items[0];
	const count = cart.reduce((sum, line) => sum + line.qty, 0);
	const total = (0, import_react.useMemo)(() => cart.reduce((sum, line) => {
		return sum + (items.find((entry) => entry.id === line.id)?.priceCents ?? 0) * line.qty;
	}, 0), [cart, items]);
	function add(item, take) {
		const left = stock[item.id] ?? 0;
		const have = cart.find((line) => line.id === item.id)?.qty ?? 0;
		const next = Math.min(take, Math.max(0, left - have));
		if (next <= 0) return;
		setCart((lines) => {
			if (!lines.find((line) => line.id === item.id)) return [...lines, {
				id: item.id,
				qty: next
			}];
			return lines.map((line) => line.id === item.id ? {
				...line,
				qty: line.qty + next
			} : line);
		});
		setOrder("");
	}
	function buyNow() {
		if (count === 0 || !focus) return;
		setStock((current) => {
			const next = { ...current };
			for (const line of cart) next[line.id] = Math.max(0, (next[line.id] ?? 0) - line.qty);
			return next;
		});
		setCart([]);
		setOrder(`Order held for this visit · ${formatMoney(total)}. Nothing was charged.`);
	}
	if (!focus) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "grid min-w-0 gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lift-card min-w-0 overflow-hidden rounded-[28px] bg-surface/80 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: focus.imageUrl,
					alt: "",
					className: "aspect-[4/3] w-full object-cover sm:aspect-[16/9]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5 sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-muted",
							children: focus.attribute
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 break-words font-display text-3xl",
							children: focus.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-lg text-sm text-muted",
							children: focus.description
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2",
				children: items.map((item) => {
					const left = stock[item.id] ?? 0;
					const inCart = cart.find((line) => line.id === item.id)?.qty ?? 0;
					const claim = left - inCart === 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "lift-card min-w-0 rounded-[24px] bg-surface/80 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setActive(item.id),
							className: "block w-full text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.imageUrl,
									alt: "",
									className: "aspect-[4/3] w-full rounded-2xl object-cover"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 break-words font-medium",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: item.attribute
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: left === 0 ? "Sold out" : `${left} in stock`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 tabular text-sm",
									children: formatMoney(item.priceCents)
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: left - inCart <= 0,
							onClick: () => add(item, 1),
							className: "glass-btn mt-3 h-11 w-full rounded-xl px-4 text-sm font-medium disabled:opacity-40",
							children: left - inCart <= 0 ? "Sold out" : claim ? "Claim item" : "Add to cart"
						})]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: count === 0 ? "Cart is empty." : `${count} in the cart · ${formatMoney(total)}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: count === 0,
					onClick: buyNow,
					className: "glass-btn h-12 rounded-xl px-5 text-sm font-medium disabled:opacity-40",
					children: "Buy now"
				})]
			}),
			order ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: order
			}) : null
		]
	});
}
//#endregion
export { ProductShelf as t };
