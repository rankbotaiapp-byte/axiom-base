import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { C as useRouter, Q as require_react, X as isNotFound, Z as notFound, _ as lazyRouteComponent, f as Scripts, g as Outlet, h as createRouter, p as HeadContent, v as createFileRoute, w as require_jsx_runtime, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as createServerFn, t as isClientAbort } from "./ssr.mjs";
import { i as shopIdFromHeroPath } from "./hero-video-CVTInEqw.mjs";
import { t as authMiddleware } from "./middleware-CYl_VtBx.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Cbx5Q3_U.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-BPvWya0h.mjs";
import { v as parseFunnelSearch } from "./funnel-CYpq-UDZ.mjs";
import { i as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-CbzaHbd6.js
var getPublicShop = createServerFn({ method: "GET" }).validator((slug) => slug).handler(createSsrRpc("30642a916957732ce0ede2e076fdb02b275425ecbb5a809f21665bb30ca990d6"));
var listShowcaseShops = createServerFn({ method: "GET" }).handler(createSsrRpc("f72216c02755fa90557b16a345b8c00ab8c6d61d8c3c98b86380c8bee6b80dca"));
var listBookedStarts = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("f829bacc015ea9c584d6ae5c326a97820f705785a12b391b88c3b47ee8419cba"));
var getPortfolio = createServerFn({ method: "GET" }).validator((employeeId) => employeeId).handler(createSsrRpc("8c4f196bd44621e17aae1a5067f96ed468e28b603c84cc4704041cbe5288e416"));
var listShopEvents = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("e6dfeb63056e67b41ebe7f194100e4e43214edcb391e3ee824cd5b7b1a130387"));
createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("ccae9bd556feaad5df260bf196d003143fa1bc3bd089df43dd943122bf3d3b6c"));
var createBooking = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2c61f6c5d07f7ac5f6cfbdc53f8c7038bf8884f7c4a21cf7c5f5e5ab30064b8f"));
var getShopAccess = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("67aca4a0b4d0b1ed0ad5278149217973b9db21407da6f799cbe369b72cd9a1c2"));
var listMyShops = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6521a92301daa18d33236f64eda487904d6acc18113b45e5197ee75e7633eb9a"));
var createShopFromNiche = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("fff0111b81048d2fdb01754712776e41b57112d20c9b14bd18695a7be91f7c9a"));
var updateShopBrand = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("cc0942e921337ab38993c3c7b8c59f7e7f30bcf338e245618f83bafbfa582592"));
var setEmployeeAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("e256b950a0766221a6e2c6f17a7bc459515e17eb59663f2e8a6ce3cd8a45e918"));
var setShopRingColor = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("268101d8c1ff513f0bcf57bf86d08af52b0d4d53a698bc5f5e00ef0cc44640ab"));
var setShopIntro = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("4a3d741f4ea25dc993998a4eaae63439307536b1d6b5945c33e0dde709b8cd62"));
var inviteEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("aa87097a34d8e3d2d957a7db6a1efd5ca2c14c54ff6a39c644c6fccb7b690014"));
var claimInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((token) => token).handler(createSsrRpc("aada2037010cdf5753557f0d845ad8897b308055acf6464586ddf2bcfd422abf"));
var getInvitePreview = createServerFn({ method: "GET" }).validator((token) => token).handler(createSsrRpc("1efc849d468da8194dc28868fabb50e7a182b529ec1132c7635d2174be23f0e9"));
var setShopDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("de6828cc4319ed4f6704b049aa0e20f40cd340676ea3e080db1c59099bd4af49"));
var setEmployeeDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("4e6f49cb426b4aae6a99f63971060cf97c4a7031a2842d4c268b37a9829f7d6c"));
var getOperatorData = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => {
	if (typeof input === "string") return {
		slug: input,
		desk: void 0
	};
	if (!input || typeof input.slug !== "string") throw new Error("Shop not found");
	return {
		slug: input.slug,
		desk: input.desk === "master" ? "master" : void 0
	};
}).handler(createSsrRpc("0448307bae57c4cb90c9e675e96ee95efc433358871a5d8a5cd71bfc73a3b4e7"));
var acceptBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("9cc41ac852ee56a58d91c2414049c5468c0283109c3db342d38325ad9c449097"));
var addPortfolioItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("9219cba4f202ba8cb97885c839c76493c7bbf25617b3f09ca632e6d252cfc222"));
var updateShopProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("0b0ee8cfd8f4ea623a5e7ebb96d688e898edecb4c65d55d2b0e4568d8819b378"));
var updateNotifyChannels = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8c43e1a86657d19af0c2319a4cc90728dd9868b54e4c8c0350021f0ab388edc5"));
var saveShopServices = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("039e07f58fcc1f71947e1f7d7923d1a02cda45d6dd20042d44444e87aa7cc682"));
var submitInquiry = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("a7ed0250a3e7c17f65127961361366f0fc7b21c0005a7f8bff38600dda622a86"));
var startCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6449c06456f79fb0f1658616115ef3c36d3f2f343eab94f5239f1f30a47086e7"));
var confirmCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("ee82a46cc2dddb66254bc92fe650406073296006db745cf220a3a27df3361c82"));
var releaseCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("18b5405c2a5624b6f4806f1b17ae09b0de2e7b9783a2dff0d3846f1f91a0cfa8"));
var beginStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("798f47840901265d21ab12eae37aac780a541e71459ea1c6857c7262b671edad"));
var refreshStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("d9481c168a629af6d4109b308f80e786ed81cc90af91fc0c9359d4ab98f9ff22"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Co1j6ZW7.js
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
var styles_default = "/assets/styles-DoREdsKy.css";
var APP_NAME = "New Era Apps";
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("2c4985e96c199268f7f639534cb5e8e31d6b19d43286bf77416413db60ffde26"));
var Route$17 = createRootRoute({
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
				type: "image/svg+xml",
				href: "/favicon.svg"
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
				href: "/__grok/icon-180.png"
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "top-center"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$10 = () => import("./routes-BE5QJy0L.mjs");
var Route$16 = createFileRoute("/")({
	validateSearch: (search) => parseFunnelSearch(search),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitNotFoundComponentImporter = () => import("./route-BeL8IZrk.mjs");
var $$splitComponentImporter$9 = () => import("./route-9XqTjwM0.mjs");
var LiveShopContext = (0, import_react.createContext)(null);
function useShopPageData() {
	const live = (0, import_react.useContext)(LiveShopContext);
	const loader = Route$15.useLoaderData();
	return live ?? loader;
}
var Route$15 = createFileRoute("/$shopSlug")({
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
	component: lazyRouteComponent($$splitComponentImporter$9, "component"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$8 = () => import("./login-D1aPDbEg.mjs");
var Route$14 = createFileRoute("/login")({
	validateSearch: (s) => ({ next: typeof s.next === "string" ? s.next : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./onboard-D0kiwHtn.mjs");
var Route$13 = createFileRoute("/onboard")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("../_shopSlug-B0iws6VY.mjs");
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
var $$splitComponentImporter$5 = () => import("./admin-zh6jf6P6.mjs");
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
var $$splitComponentImporter$4 = () => import("./book-ubIg-u_B.mjs");
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
var $$splitComponentImporter$3 = () => import("./employee-W26-i0GM.mjs");
var Route$9 = createFileRoute("/$shopSlug/employee")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var Route$8 = createFileRoute("/api/get-avatar-token")({ server: { handlers: { POST: async ({ request }) => {
	const { issueAvatarSession } = await import("./avatar.server-DyJT8EKS.mjs");
	return issueAvatarSession(request);
} } } });
var $$splitComponentImporter$2 = () => import("./invite._token-Qk35p9xE.mjs");
var Route$7 = createFileRoute("/invite/$token")({
	loader: async ({ params }) => {
		return { preview: await getInvitePreview({ data: params.token }) };
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./master-admin-CkRTeOYM.mjs");
var Route$6 = createFileRoute("/master-admin/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./staff._employeeId-BKw_tWR2.mjs");
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
		const { readHeroVideo, heroVideoResponse } = await import("./hero-video.server-DIq8h9O9.mjs");
		const bytes = await readHeroVideo(shopId);
		if (!bytes) return new Response("Not found", { status: 404 });
		return heroVideoResponse(bytes, request);
	},
	POST: async ({ request }) => {
		const shopId = await shopIdOf(request);
		if (!shopId) return Response.json({ error: "Shop not found" }, { status: 404 });
		if (Number(request.headers.get("content-length") ?? 0) > 12582912) return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
		try {
			const { storeHeroVideo, userIdFromUpload } = await import("./hero-video.server-DIq8h9O9.mjs");
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
	const { handleOutreachCron } = await import("./outreach-cron.server-DvRnhE3z.mjs");
	return handleOutreachCron(request);
} } } });
var Route = createFileRoute("/api/stripe/webhook")({ server: { handlers: { POST: async ({ request }) => {
	const { handleStripeWebhook } = await import("./payments.server-FNgWcc17.mjs");
	try {
		return await handleStripeWebhook(request);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Webhook failed";
		return Response.json({ error: message }, { status: 500 });
	}
} } } });
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var ShopSlugRouteRoute = Route$15.update({
	id: "/$shopSlug",
	path: "/$shopSlug",
	getParentRoute: () => Route$17
});
var LoginRoute = Route$14.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$17
});
var OnboardRoute = Route$13.update({
	id: "/onboard",
	path: "/onboard",
	getParentRoute: () => Route$17
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
	getParentRoute: () => Route$17
});
var InviteTokenRoute = Route$7.update({
	id: "/invite/$token",
	path: "/invite/$token",
	getParentRoute: () => Route$17
});
var MasterAdminIndexRoute = Route$6.update({
	id: "/master-admin/",
	path: "/master-admin/",
	getParentRoute: () => Route$17
});
var ShopSlugStaffEmployeeIdRoute = Route$5.update({
	id: "/staff/$employeeId",
	path: "/staff/$employeeId",
	getParentRoute: () => ShopSlugRouteRoute
});
var ApiAuthSplatRoute = Route$4.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$17
});
var ApiGearGuardianCheckoutRoute = Route$3.update({
	id: "/api/gear-guardian/checkout",
	path: "/api/gear-guardian/checkout",
	getParentRoute: () => Route$17
});
var ApiHeroVideoShopIdRoute = Route$2.update({
	id: "/api/hero-video/$shopId",
	path: "/api/hero-video/$shopId",
	getParentRoute: () => Route$17
});
var ApiOutreachCronRoute = Route$1.update({
	id: "/api/outreach/cron",
	path: "/api/outreach/cron",
	getParentRoute: () => Route$17
});
var ApiStripeWebhookRoute = Route.update({
	id: "/api/stripe/webhook",
	path: "/api/stripe/webhook",
	getParentRoute: () => Route$17
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
	ApiGetAvatarTokenRoute,
	InviteTokenRoute,
	MasterAdminIndexRoute,
	ApiAuthSplatRoute,
	ApiGearGuardianCheckoutRoute,
	ApiHeroVideoShopIdRoute,
	ApiOutreachCronRoute,
	ApiStripeWebhookRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { saveShopServices as A, updateShopProfile as B, inviteEmployee as C, listShowcaseShops as D, listShopEvents as E, setShopRingColor as F, startCardCheckout as I, submitInquiry as L, setEmployeeDashboard as M, setShopDashboard as N, refreshStripeConnect as O, setShopIntro as P, updateNotifyChannels as R, getShopAccess as S, listMyShops as T, createBooking as _, Route$10 as a, getPortfolio as b, Route$14 as c, Route$16 as d, acceptBooking as f, confirmCardCheckout as g, claimInvite as h, Route$9 as i, setEmployeeAvailability as j, releaseCardCheckout as k, Route$15 as l, beginStripeConnect as m, Route$5 as n, Route$11 as o, addPortfolioItem as p, Route$7 as r, Route$12 as s, router_exports as t, useShopPageData as u, createShopFromNiche as v, listBookedStarts as w, getPublicShop as x, getOperatorData as y, updateShopBrand as z };
