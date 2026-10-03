import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-GayV2T4E.mjs";
import { c as Route$9 } from "./router-MEFXtEX6.mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
import { n as useCurrentUserState } from "./use-current-user-BYyFvsCd.mjs";
import { s as Wordmark } from "./shop-chrome-B-tJ9Hij.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-18uMLSyL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	const next = Route$9.useSearch().next ?? "/onboard";
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("in");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-40 animate-pulse rounded-full bg-fg/8" })
	});
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: next.startsWith("/") ? next : "/onboard" });
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name || email.split("@")[0] || "Owner"
				});
				if (err) throw new Error(err.message);
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message);
			}
			window.location.href = next;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not sign in");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-8 font-display text-4xl leading-none",
					children: "Step in."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Google, X, or email. Your shop is a minute away."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 flex flex-col gap-2",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "lg",
						onClick: () => void signIn(p.providerId, { callbackURL: next }),
						children: ["Continue with ", p.label]
					}, p.providerId))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-faint",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" }),
						"or email",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (e) => void submit(e),
					className: "grid gap-3",
					children: [
						mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "name",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "name",
							value: name,
							onChange: (e) => setName(e.target.value)
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "email",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "email",
							type: "email",
							autoComplete: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							required: true
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "password",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "password",
							type: "password",
							autoComplete: mode === "up" ? "new-password" : "current-password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							required: true,
							minLength: 8
						})] }),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "lg",
							disabled: busy,
							children: mode === "up" ? "Create account" : "Sign in"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-4 text-sm text-muted hover:text-fg",
					onClick: () => setMode(mode === "up" ? "in" : "up"),
					children: mode === "up" ? "Already have an account" : "Need an account"
				})
			]
		})
	});
}
//#endregion
export { Login as component };
