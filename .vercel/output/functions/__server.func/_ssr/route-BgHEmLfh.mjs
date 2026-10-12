import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as Route$16 } from "./router-B-39myu6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-BgHEmLfh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LiveShopContext = (0, import_react.createContext)(null);
function useShopPageData() {
	const live = (0, import_react.useContext)(LiveShopContext);
	const loader = Route$16.useLoaderData();
	return live ?? loader;
}
var SplitNotFoundComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
	className: "grid min-h-dvh place-items-center px-6 text-center",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-display text-3xl",
		children: "No shop at this address."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		className: "mt-4 inline-block text-sm text-muted hover:text-fg",
		children: "Back to Axiom"
	})] })
});
//#endregion
export { SplitNotFoundComponent as notFoundComponent, useShopPageData };
