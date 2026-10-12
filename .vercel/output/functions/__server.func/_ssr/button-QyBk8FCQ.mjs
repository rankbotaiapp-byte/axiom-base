import { T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-BkNFIPfO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-QyBk8FCQ.js
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium select-none transition-[scale,background-color,color,box-shadow,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", {
	variants: {
		variant: {
			primary: "bg-fg text-bg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] hover:bg-fg/90",
			secondary: "bg-surface-2 text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] hover:bg-surface",
			ghost: "bg-transparent text-fg hover:bg-fg/6",
			accent: "bg-accent text-bg hover:bg-accent/90"
		},
		size: {
			sm: "h-9 rounded-[10px] px-3 text-sm",
			md: "h-11 rounded-xl px-4 text-sm",
			lg: "h-12 rounded-[14px] px-5 text-[15px]"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { Button as t };
