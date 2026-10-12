import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as listMyShops } from "./server-CiF75qCF.mjs";
import { c as Route$13 } from "./router-B-39myu6.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { d as Wordmark, o as RedirectToSignIn } from "./shop-chrome-Dr8FTvy_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/welcome-BixcZyZ6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Welcome() {
	const { shop } = Route$13.useSearch();
	const { user, isPending } = useCurrentUserState();
	const [slug, setSlug] = (0, import_react.useState)(shop ?? "");
	(0, import_react.useEffect)(() => {
		if (shop || !user) return;
		listMyShops().then((shops) => {
			const owned = shops.find((row) => row.ownerUserId === user.id) ?? shops[0];
			if (owned) setSlug(owned.slug);
		}).catch(() => void 0);
	}, [shop, user]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-48 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg px-5 py-6 sm:px-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-10 max-w-3xl pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-muted",
					children: "New Era Apps"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-4xl leading-none sm:text-5xl",
					children: "You're on the book."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-lg text-muted",
					children: "A short introduction, then the desk."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						className: "aspect-video w-full",
						src: "/media/heroes/intro-welcome.mp4",
						autoPlay: true,
						playsInline: true,
						controls: true
					})
				}),
				slug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/admin",
					params: { shopSlug: slug },
					className: "mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg sm:w-auto sm:px-6",
					children: "Continue to Dashboard"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/onboard",
					className: "mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg sm:w-auto sm:px-6",
					children: "Continue to Dashboard"
				})
			]
		})]
	});
}
//#endregion
export { Welcome as component };
