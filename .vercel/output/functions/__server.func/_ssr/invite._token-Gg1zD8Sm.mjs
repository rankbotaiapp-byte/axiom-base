import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, S as useNavigate, b as Link, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as claimInvite, r as Route$3 } from "./router-Cz9T8z2K.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { o as Wordmark, t as RedirectToSignIn } from "./shop-chrome-JtjEzse-.mjs";
import { t as Button } from "./button-BTEaNPOc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/invite._token-Gg1zD8Sm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InvitePage() {
	const { token } = Route$3.useParams();
	const { preview } = Route$3.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!user || !preview) return;
		if (preview.invite_status === "claimed") navigate({
			to: "/$shopSlug/employee",
			params: { shopSlug: preview.slug }
		});
	}, [
		navigate,
		preview,
		user
	]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-40 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	if (!preview) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 font-display text-3xl",
				children: "This invite is no longer valid."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-4 inline-block text-sm text-muted",
				children: "Home"
			})
		] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, { className: "justify-center" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-8 font-display text-4xl leading-none",
					children: [
						preview.shop_name,
						" invited ",
						preview.display_name,
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Claim this station and you'll land on your schedule — no PIN, no shared login."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-danger",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6 w-full",
					size: "lg",
					disabled: busy,
					onClick: () => {
						setBusy(true);
						claimInvite({ data: token }).then((r) => navigate({
							to: "/$shopSlug/employee",
							params: { shopSlug: r.slug }
						})).catch((e) => {
							setError(e instanceof Error ? e.message : "Could not claim");
							setBusy(false);
						});
					},
					children: "Claim station"
				})
			]
		})
	});
}
//#endregion
export { InvitePage as component };
