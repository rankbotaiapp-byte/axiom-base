import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, g as Outlet, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as getShopAccess, l as Route$10 } from "./router-BOZX5G7k.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { n as AxiomRingProvider, r as useAxiomRing, t as AxiomRing } from "./axiom-ring-Bd86HtQC.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-j3PHWBL4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ShopLayout() {
	const data = Route$10.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("customer");
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setMode("customer");
			return;
		}
		getShopAccess({ data: data.shop.slug }).then((a) => setMode(a.mode === "none" ? "customer" : a.mode)).catch(() => setMode("customer"));
	}, [
		data.shop.slug,
		isPending,
		user
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AxiomRingProvider, {
		shopId: data.shop.id,
		slug: data.shop.slug,
		ringColor: data.shop.ringColor,
		mode,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxiomRing, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcceptBar, {
				slug: data.shop.slug,
				mode
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		]
	});
}
function AcceptBar({ slug, mode }) {
	const { state, accept, message } = useAxiomRing();
	if (!((mode === "owner" || mode === "employee" || mode === "preview") && (state === "pulse" || state === "awaiting" || message === "New booking request"))) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.12)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "Incoming booking"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Accept to lock the ring and notify the guest."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => {
					accept().catch(() => void 0);
				},
				children: "Accept"
			})]
		})
	});
}
//#endregion
export { ShopLayout as component };
