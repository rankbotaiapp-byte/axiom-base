import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { $ as require_react, Q as notFound, T as require_jsx_runtime, Z as isNotFound, _ as Outlet, b as createRootRoute, f as Scripts, g as createRouter, m as useRouterState, p as HeadContent, v as lazyRouteComponent, w as useRouter, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as createServerFn, t as isClientAbort } from "./ssr.mjs";
import { w as shopIdFromHeroPath } from "./niches-Dq_P6CLw.mjs";
import { I as createSsrRpc, f as getPortfolio, p as getPublicShop, u as getInvitePreview } from "./server-CiF75qCF.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-D7136PXr.mjs";
import { y as parseFunnelSearch } from "./funnel-DCLKTLeU.mjs";
import { o as TriangleAlert, t as X } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B-39myu6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var AVATAR_PERSONA = "Eric";
/**
* Spoken-style guidance for each screen.
* Nothing here is generated. Tapping Help only looks up the screen the owner is already on.
*/
var AVATAR_HELP = {
	niche_selection: {
		screen: "niche_selection",
		title: "Pick the trade",
		persona: AVATAR_PERSONA,
		body: "You don't write the page from a blank box. Tap Just me or A team, then tap the trade that matches the work. The name, the services, and the booking button are already filled in. You can change the name before you continue.",
		steps: [
			"Tap Just me if clients book you, or A team if each person has their own book.",
			"Tap a trade. The ready name drops into the name box.",
			"Continue. The public page is built from that trade."
		]
	},
	lead_dashboard: {
		screen: "lead_dashboard",
		title: "Today's book",
		persona: AVATAR_PERSONA,
		body: "This is the desk. New bookings land here. You don't hunt through settings to see who is coming. Open a booking when you are ready to confirm it.",
		steps: [
			"Read the list. Each row is a person and a time.",
			"Confirm the ones you can take.",
			"Use the tabs when you want the public page, the services, or the team."
		]
	},
	storefront_editor: {
		screen: "storefront_editor",
		title: "The public page",
		persona: AVATAR_PERSONA,
		body: "The page already has a title, a line under the name, a color, and services. Tap a ready page if you want a different starting set, like roofing instead of a general contractor. Then save. You never have to invent the first draft.",
		steps: [
			"Tap a ready page. The name and the line fill themselves.",
			"Tap a search word if you want it in that line.",
			"Save. The customer site uses what you saved."
		]
	},
	audit_widget: {
		screen: "audit_widget",
		title: "The questions on your page",
		persona: AVATAR_PERSONA,
		body: "Visitors answer a few taps, then see a score and a way to book. The questions come from the trade you picked. You don't write them, and nothing is sent to an outside assistant.",
		steps: [
			"A visitor taps the choices that match the job.",
			"They leave a name and a phone or email.",
			"The answer is saved on your shop so you can call them back."
		]
	},
	booking: {
		screen: "booking",
		title: "How a customer books",
		persona: AVATAR_PERSONA,
		body: "This is the page your customer uses. They pick a service, a person, and a time. The button label is already written for the trade, such as Book a chair or Book a plumber.",
		steps: [
			"They pick the service.",
			"They pick who they want, if you have a team.",
			"They pick a time and send the request."
		]
	},
	welcome: {
		screen: "welcome",
		title: "You're on the book",
		persona: AVATAR_PERSONA,
		body: "The introduction plays once. When it finishes, continue to the desk. From there you confirm bookings and change the public page by tapping, not by starting over.",
		steps: [
			"Let the introduction play.",
			"Continue to the desk.",
			"Open the public page if you want to see what customers see."
		]
	}
};
function avatarHelpFor(screen) {
	return AVATAR_HELP[screen];
}
/** Which prepared note matches this address, before a desk tab overrides it. */
function screenFromPath(pathname) {
	const path = pathname.replace(/\/+$/, "") || "/";
	if (path === "/" || path === "/onboard") return "niche_selection";
	if (path === "/welcome") return "welcome";
	if (path === "/master-admin" || path.endsWith("/admin")) return "lead_dashboard";
	if (path.endsWith("/book")) return "booking";
	return "audit_widget";
}
var override = null;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	for (const listener of listeners) listener();
}
/** The desk can name the tab the owner is on. Leaving the page clears it. */
function setAvatarScreen(screen) {
	override = screen;
	emit();
}
function subscribe(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function readOverride() {
	return override;
}
/**
* Help for the screen in front of the owner.
* The words are already written. Tapping the button does not call an assistant.
*/
function AvatarHelpButton() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const entry = avatarHelpFor((0, import_react.useSyncExternalStore)(subscribe, readOverride, () => null) ?? screenFromPath(pathname));
	const open = (0, import_react.useSyncExternalStore)(subscribeOpen, readOpen, () => false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function onKey(event) {
			if (event.key === "Escape") setOpen(false);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed bottom-36 left-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-start gap-3 sm:bottom-4",
		children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			role: "dialog",
			"aria-labelledby": "avatar-help-title",
			className: "w-full rounded-[24px] bg-surface p-5 text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 shrink-0 place-items-center rounded-full bg-fg font-display text-xl text-bg",
							"aria-hidden": true,
							children: "E"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.2em] text-muted",
								children: entry.persona
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "avatar-help-title",
								className: "font-display text-2xl leading-none",
								children: entry.title
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setOpen(false),
							className: "grid size-11 place-items-center rounded-full text-muted hover:text-fg",
							"aria-label": "Close help",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-relaxed text-muted",
					children: entry.body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 grid gap-2 text-sm",
					children: entry.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg leading-none text-fg",
							children: index + 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step })]
					}, step))
				})
			]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen(!open),
			className: "inline-flex h-12 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]",
			"aria-expanded": open,
			"aria-controls": "avatar-help-title",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-7 place-items-center rounded-full bg-fg font-display text-bg",
				"aria-hidden": true,
				children: "E"
			}), "Help"]
		})]
	});
}
var openState = false;
function emitOpen() {
	for (const listener of openListeners) listener();
}
var openListeners = /* @__PURE__ */ new Set();
function subscribeOpen(listener) {
	openListeners.add(listener);
	return () => openListeners.delete(listener);
}
function readOpen() {
	return openState;
}
function setOpen(next) {
	openState = next;
	emitOpen();
}
var styles_default = "/assets/styles-CRl766Uq.css";
var APP_NAME = "New Era Apps";
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("2c4985e96c199268f7f639534cb5e8e31d6b19d43286bf77416413db60ffde26"));
var Route$18 = createRootRoute({
	beforeLoad: async () => {
		try {
			return { sessionUser: await fetchSessionUser() };
		} catch (error) {
			if (isClientAbort(error)) return { sessionUser: null };
			throw error;
		}
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Instant booking sites for local service businesses. Powered by Axiom."
			},
			{
				name: "theme-color",
				content: "#08080A"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/png",
				sizes: "180x180",
				href: "/icon-180-png.png"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/icon-180-png.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600;700&display=swap"
			}
		]
	}),
	notFoundComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-3xl",
			children: "Page not found."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: "/",
			className: "mt-4 inline-block text-sm text-muted",
			children: "Back to Axiom"
		})] })
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg font-sans text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarHelpButton, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "top-center"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$11 = () => import("./routes-CS2uh7Ys.mjs");
var Route$17 = createFileRoute("/")({
	validateSearch: (search) => parseFunnelSearch(search),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitNotFoundComponentImporter = () => import("./route-BgHEmLfh.mjs");
var $$splitComponentImporter$10 = () => import("./route-ai8aIOOs.mjs");
var LiveShopContext = (0, import_react.createContext)(null);
function useShopPageData() {
	const live = (0, import_react.useContext)(LiveShopContext);
	const loader = Route$16.useLoaderData();
	return live ?? loader;
}
var Route$16 = createFileRoute("/$shopSlug")({
	loader: async ({ params, abortController }) => {
		try {
			const data = await getPublicShop({ data: params.shopSlug });
			if (abortController.signal.aborted || !data) throw notFound();
			return {
				...data,
				services: data.services ?? [],
				employees: data.employees ?? [],
				shop: {
					...data.shop,
					hours: data.shop.hours && typeof data.shop.hours === "object" ? data.shop.hours : {},
					heroImageUrl: data.shop.heroImageUrl || "",
					heroBlendPercent: Number.isFinite(data.shop.heroBlendPercent) ? data.shop.heroBlendPercent : 60,
					introSpeed: Number.isFinite(data.shop.introSpeed) ? data.shop.introSpeed : 40,
					introIntensity: Number.isFinite(data.shop.introIntensity) ? data.shop.introIntensity : 45
				}
			};
		} catch (error) {
			if (isNotFound(error)) throw error;
			if (abortController.signal.aborted || isClientAbort(error)) throw notFound();
			console.error(`[shop] failed to load /${params.shopSlug}`, error);
			throw error;
		}
	},
	component: lazyRouteComponent($$splitComponentImporter$10, "component"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$9 = () => import("./login-CMT2wtyN.mjs");
var Route$15 = createFileRoute("/login")({
	validateSearch: (s) => ({ next: typeof s.next === "string" ? s.next : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./onboard-DmZccEfq.mjs");
var Route$14 = createFileRoute("/onboard")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./welcome-BixcZyZ6.mjs");
var Route$13 = createFileRoute("/welcome")({
	validateSearch: (search) => ({ shop: typeof search.shop === "string" && search.shop.trim() ? search.shop.trim() : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("../_shopSlug-BYI_Gnzf.mjs");
var Route$12 = createFileRoute("/$shopSlug/")({
	validateSearch: (s) => {
		const out = {};
		if (s.tour === true || s.tour === "1" || s.tour === "true") out.tour = true;
		if (s.loop === true || s.loop === "1" || s.loop === "true") out.loop = true;
		if (s.requested === true || s.requested === "1" || s.requested === "true") out.requested = true;
		return out;
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./admin-DJnso29a.mjs");
var Route$11 = createFileRoute("/$shopSlug/admin")({
	validateSearch: (s) => {
		const stripe = s.stripe === "return" || s.stripe === "refresh" ? s.stripe : void 0;
		const desk = s.desk === "master" ? "master" : void 0;
		return {
			...stripe ? { stripe } : {},
			...desk ? { desk } : {}
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./book-C6Y7f8l1.mjs");
var Route$10 = createFileRoute("/$shopSlug/book")({
	validateSearch: (s) => {
		const out = {};
		if (typeof s.employee === "string") out.employee = s.employee;
		if (typeof s.service === "string") out.service = s.service;
		if (typeof s.session === "string" && s.session.startsWith("cs_")) out.session = s.session;
		if (typeof s.cancelled === "string" && s.cancelled.startsWith("apt_")) out.cancelled = s.cancelled;
		return out;
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./employee-BESVeJ94.mjs");
var Route$9 = createFileRoute("/$shopSlug/employee")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var Route$8 = createFileRoute("/api/get-avatar-token")({ server: { handlers: { POST: async ({ request }) => {
	const { issueAvatarSession } = await import("./avatar.server-CCJ_HQjo.mjs");
	return issueAvatarSession(request);
} } } });
var $$splitComponentImporter$2 = () => import("./invite._token-Ckpl1zt6.mjs");
var Route$7 = createFileRoute("/invite/$token")({
	loader: async ({ params }) => {
		return { preview: await getInvitePreview({ data: params.token }) };
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./master-admin-BvQVGBdT.mjs");
var Route$6 = createFileRoute("/master-admin/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./staff._employeeId-DEdoQ9Lq.mjs");
var Route$5 = createFileRoute("/$shopSlug/staff/$employeeId")({
	loader: async ({ params }) => {
		return { items: await getPortfolio({ data: params.employeeId }) };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route$4 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var Route$3 = createFileRoute("/api/gear-guardian/checkout")({ server: { handlers: { POST: async ({ request }) => {
	let amountCents = 0;
	try {
		const body = await request.json();
		amountCents = Number(body.amountCents) || 0;
	} catch {
		amountCents = 0;
	}
	await new Promise((r) => setTimeout(r, 2e3));
	const paymentId = `gg_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
	return Response.json({
		status: "success",
		paymentId,
		amountCents,
		processor: "gear_guardian_mock"
	});
} } } });
async function shopIdOf(request) {
	return shopIdFromHeroPath(new URL(request.url).pathname);
}
var Route$2 = createFileRoute("/api/hero-video/$shopId")({ server: { handlers: {
	GET: async ({ request }) => {
		const shopId = await shopIdOf(request);
		if (!shopId) return new Response("Not found", { status: 404 });
		const { readHeroVideo, heroVideoResponse } = await import("./hero-video.server-CjJIxqA1.mjs");
		const bytes = await readHeroVideo(shopId);
		if (!bytes) return new Response("Not found", { status: 404 });
		return heroVideoResponse(bytes, request);
	},
	POST: async ({ request }) => {
		const shopId = await shopIdOf(request);
		if (!shopId) return Response.json({ error: "Shop not found" }, { status: 404 });
		if (Number(request.headers.get("content-length") ?? 0) > 12582912) return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
		try {
			const { storeHeroVideo, userIdFromUpload } = await import("./hero-video.server-CjJIxqA1.mjs");
			const userId = await userIdFromUpload(request);
			const bytes = new Uint8Array(await request.arrayBuffer());
			if (bytes.byteLength > 12582912) return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
			const heroVideoUrl = await storeHeroVideo(userId, shopId, bytes);
			return Response.json({ heroVideoUrl });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Upload failed";
			const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
			return Response.json({ error: message }, { status: message === "Forbidden" ? 403 : status });
		}
	}
} } });
var Route$1 = createFileRoute("/api/outreach/cron")({ server: { handlers: { POST: async ({ request }) => {
	const { handleOutreachCron } = await import("./outreach-cron.server-F3TRbNXX.mjs");
	return handleOutreachCron(request);
} } } });
var Route = createFileRoute("/api/stripe/webhook")({ server: { handlers: { POST: async ({ request }) => {
	const { handleStripeWebhook } = await import("./payments.server-DqmmvqjP.mjs");
	try {
		return await handleStripeWebhook(request);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Webhook failed";
		return Response.json({ error: message }, { status: 500 });
	}
} } } });
var IndexRoute = Route$17.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$18
});
var ShopSlugRouteRoute = Route$16.update({
	id: "/$shopSlug",
	path: "/$shopSlug",
	getParentRoute: () => Route$18
});
var LoginRoute = Route$15.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$18
});
var OnboardRoute = Route$14.update({
	id: "/onboard",
	path: "/onboard",
	getParentRoute: () => Route$18
});
var WelcomeRoute = Route$13.update({
	id: "/welcome",
	path: "/welcome",
	getParentRoute: () => Route$18
});
var ShopSlugIndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => ShopSlugRouteRoute
});
var ShopSlugAdminRoute = Route$11.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => ShopSlugRouteRoute
});
var ShopSlugBookRoute = Route$10.update({
	id: "/book",
	path: "/book",
	getParentRoute: () => ShopSlugRouteRoute
});
var ShopSlugEmployeeRoute = Route$9.update({
	id: "/employee",
	path: "/employee",
	getParentRoute: () => ShopSlugRouteRoute
});
var ApiGetAvatarTokenRoute = Route$8.update({
	id: "/api/get-avatar-token",
	path: "/api/get-avatar-token",
	getParentRoute: () => Route$18
});
var InviteTokenRoute = Route$7.update({
	id: "/invite/$token",
	path: "/invite/$token",
	getParentRoute: () => Route$18
});
var MasterAdminIndexRoute = Route$6.update({
	id: "/master-admin/",
	path: "/master-admin/",
	getParentRoute: () => Route$18
});
var ShopSlugStaffEmployeeIdRoute = Route$5.update({
	id: "/staff/$employeeId",
	path: "/staff/$employeeId",
	getParentRoute: () => ShopSlugRouteRoute
});
var ApiAuthSplatRoute = Route$4.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$18
});
var ApiGearGuardianCheckoutRoute = Route$3.update({
	id: "/api/gear-guardian/checkout",
	path: "/api/gear-guardian/checkout",
	getParentRoute: () => Route$18
});
var ApiHeroVideoShopIdRoute = Route$2.update({
	id: "/api/hero-video/$shopId",
	path: "/api/hero-video/$shopId",
	getParentRoute: () => Route$18
});
var ApiOutreachCronRoute = Route$1.update({
	id: "/api/outreach/cron",
	path: "/api/outreach/cron",
	getParentRoute: () => Route$18
});
var ApiStripeWebhookRoute = Route.update({
	id: "/api/stripe/webhook",
	path: "/api/stripe/webhook",
	getParentRoute: () => Route$18
});
var ShopSlugRouteRouteChildren = {
	ShopSlugAdminRoute,
	ShopSlugBookRoute,
	ShopSlugEmployeeRoute,
	ShopSlugIndexRoute,
	ShopSlugStaffEmployeeIdRoute
};
var rootRouteChildren = {
	IndexRoute,
	ShopSlugRouteRoute: ShopSlugRouteRoute._addFileChildren(ShopSlugRouteRouteChildren),
	LoginRoute,
	OnboardRoute,
	WelcomeRoute,
	ApiGetAvatarTokenRoute,
	InviteTokenRoute,
	MasterAdminIndexRoute,
	ApiAuthSplatRoute,
	ApiGearGuardianCheckoutRoute,
	ApiHeroVideoShopIdRoute,
	ApiOutreachCronRoute,
	ApiStripeWebhookRoute
};
var routeTree = Route$18._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$10 as a, Route$13 as c, useShopPageData as d, Route$17 as f, Route$9 as i, Route$15 as l, Route$5 as n, Route$11 as o, setAvatarScreen as p, Route$7 as r, Route$12 as s, router_exports as t, Route$16 as u };
