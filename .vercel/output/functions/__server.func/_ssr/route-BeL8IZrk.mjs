import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as Route$15 } from "./router-Co1j6ZW7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-BeL8IZrk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LiveShopContext = (0, import_react.createContext)(null);
function useShopPageData() {
	const live = (0, import_react.useContext)(LiveShopContext);
	const loader = Route$15.useLoaderData();
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
