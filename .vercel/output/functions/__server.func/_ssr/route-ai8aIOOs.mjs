import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime, _ as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as getShopAccess, p as getPublicShop } from "./server-CiF75qCF.mjs";
import { u as Route$16 } from "./router-B-39myu6.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as AxiomRingProvider, r as useAxiomRing, t as AxiomRing } from "./axiom-ring-BTY0yR_T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-ai8aIOOs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LiveShopContext = (0, import_react.createContext)(null);
function useShopPageData() {
	const live = (0, import_react.useContext)(LiveShopContext);
	const loader = Route$16.useLoaderData();
	return live ?? loader;
}
function shopSnapshot(data) {
	return JSON.stringify({
		shop: data.shop,
		services: data.services,
		employees: data.employees
	});
}
function useLiveShop(initial) {
	const [data, setData] = (0, import_react.useState)(initial);
	const slug = initial.shop.slug;
	const initialRef = (0, import_react.useRef)(initial);
	initialRef.current = initial;
	(0, import_react.useEffect)(() => {
		setData(initialRef.current);
	}, [slug]);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const id = window.setInterval(() => {
			getPublicShop({ data: slug }).then((next) => {
				if (!next || stop) return;
				setData((prev) => shopSnapshot(prev) === shopSnapshot(next) ? prev : next);
			}).catch(() => void 0);
		}, 8e3);
		return () => {
			stop = true;
			window.clearInterval(id);
		};
	}, [slug]);
	return data;
}
function ShopLayout() {
	const data = useLiveShop(Route$16.useLoaderData());
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("customer");
	const [employeeId, setEmployeeId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setMode("customer");
			setEmployeeId(null);
			return;
		}
		getShopAccess({ data: data.shop.slug }).then((a) => {
			setMode(a.mode === "none" ? "customer" : a.mode);
			setEmployeeId(a.employeeId);
		}).catch(() => {
			setMode("customer");
			setEmployeeId(null);
		});
	}, [
		data.shop.slug,
		isPending,
		user
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveShopContext.Provider, {
		value: data,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AxiomRingProvider, {
			shopId: data.shop.id,
			slug: data.shop.slug,
			ringColor: data.shop.ringColor,
			mode,
			watchEmployeeId: employeeId,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxiomRing, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcceptBar, { mode }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			]
		})
	});
}
function AcceptBar({ mode }) {
	const { accept, incoming } = useAxiomRing();
	if (!(mode === "owner" || mode === "employee" || mode === "preview") || !incoming) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(46,230,214,0.45)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: incoming === "estimate" ? "Incoming estimate" : "Incoming booking"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Confirm to lock the ring and notify the guest."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => {
					accept().catch(() => void 0);
				},
				children: "Confirm"
			})]
		})
	});
}
//#endregion
export { ShopLayout as component, useShopPageData };
