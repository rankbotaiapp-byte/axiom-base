import { w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-Dzshj1Ep.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-DmlJju-z.js
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm text-fg placeholder:text-faint shadow-[0_0_0_1px_rgba(243,241,235,0.08)] outline-none transition-[box-shadow] duration-150 focus:shadow-[0_0_0_2px_var(--color-accent)]", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("mb-1.5 block text-xs font-medium tracking-wide text-muted", className),
		...props
	});
}
//#endregion
export { Label as n, Input as t };
