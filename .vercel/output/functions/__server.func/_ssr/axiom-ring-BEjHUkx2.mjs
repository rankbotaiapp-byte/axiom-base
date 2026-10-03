import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as setShopRingColor, u as acceptBooking, x as listShopEvents } from "./router-MEFXtEX6.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/axiom-ring-BEjHUkx2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RingContext = (0, import_react.createContext)(null);
var CHANNEL_PREFIX = "axiom-ring:";
function channelName(shopId) {
	return CHANNEL_PREFIX + shopId;
}
function broadcast(shopId, event) {
	try {
		const ch = new BroadcastChannel(channelName(shopId));
		ch.postMessage(event);
		ch.close();
	} catch {}
}
function useAxiomRing() {
	const ctx = (0, import_react.useContext)(RingContext);
	if (!ctx) throw new Error("AxiomRingProvider missing");
	return ctx;
}
function AxiomRingProvider({ shopId, slug, ringColor: initialColor, mode, children }) {
	const [state, setState] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)(null);
	const [color, setColor] = (0, import_react.useState)(initialColor);
	const [pendingId, setPendingIdState] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return null;
		return sessionStorage.getItem(`axiom:pending:${shopId}`);
	});
	const afterRef = (0, import_react.useRef)(void 0);
	const flashTimer = (0, import_react.useRef)(void 0);
	const isStaff = mode === "owner" || mode === "employee";
	(0, import_react.useEffect)(() => {
		setColor(initialColor);
	}, [initialColor]);
	const setPendingId = (0, import_react.useCallback)((id) => {
		setPendingIdState(id);
		if (typeof window === "undefined") return;
		if (id) sessionStorage.setItem(`axiom:pending:${shopId}`, id);
		else sessionStorage.removeItem(`axiom:pending:${shopId}`);
	}, [shopId]);
	const setRingColor = (0, import_react.useCallback)((next) => {
		setColor(next);
	}, []);
	const announce = (0, import_react.useCallback)((event, local) => {
		if (event.type === "ring_color" && event.payload) setColor(event.payload);
		if (event.type === "booking_request") {
			if (local || event.appointmentId === pendingId) {
				setState("pulse");
				setMessage("Waiting for confirmation");
			} else if (isStaff) {
				setState("flash");
				window.clearTimeout(flashTimer.current);
				flashTimer.current = window.setTimeout(() => setState("awaiting"), 1200);
				setMessage("New booking request");
			}
		}
		if (event.type === "booking_confirmed") {
			if (!isStaff && (local || event.appointmentId === pendingId)) {
				setState("lock");
				window.clearTimeout(flashTimer.current);
				flashTimer.current = window.setTimeout(() => setState("solid"), 1400);
				setMessage("You're booked — locked in");
			} else if (isStaff) {
				setState("flash");
				window.clearTimeout(flashTimer.current);
				flashTimer.current = window.setTimeout(() => setState("solid"), 1100);
				setMessage("Confirmation sent");
			}
		}
		if (typeof window !== "undefined" && local) broadcast(shopId, event);
	}, [
		isStaff,
		pendingId,
		shopId
	]);
	const persistRingColor = (0, import_react.useCallback)(async (next) => {
		setColor(next);
		broadcast(shopId, {
			id: `ring-${Date.now()}`,
			type: "ring_color",
			appointmentId: null,
			payload: next,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		try {
			await setShopRingColor({ data: {
				slug,
				ringColor: next
			} });
		} catch {}
	}, [shopId, slug]);
	(0, import_react.useEffect)(() => {
		let ch = null;
		try {
			ch = new BroadcastChannel(channelName(shopId));
			ch.onmessage = (ev) => {
				if (!ev.data?.type) return;
				announce(ev.data, false);
			};
		} catch {
			ch = null;
		}
		return () => ch?.close();
	}, [announce, shopId]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const tick = async () => {
			try {
				const events = await listShopEvents({ data: {
					slug,
					after: afterRef.current
				} });
				if (cancelled || events.length === 0) return;
				const ordered = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
				afterRef.current = ordered[ordered.length - 1]?.createdAt;
				for (const e of ordered) announce(e, false);
			} catch {}
		};
		const id = window.setInterval(tick, 1400);
		tick();
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [announce, slug]);
	const accept = (0, import_react.useCallback)(async () => {
		const confirm = (appointmentId, eventId) => {
			announce({
				id: eventId,
				type: "booking_confirmed",
				appointmentId,
				payload: null,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}, true);
		};
		if (!pendingId) {
			const latest = (await listShopEvents({ data: { slug } })).find((e) => e.type === "booking_request");
			if (!latest?.appointmentId) return;
			await acceptBooking({ data: {
				slug,
				appointmentId: latest.appointmentId
			} });
			confirm(latest.appointmentId, latest.id);
			return;
		}
		await acceptBooking({ data: {
			slug,
			appointmentId: pendingId
		} });
		confirm(pendingId, `local-${Date.now()}`);
	}, [
		announce,
		pendingId,
		slug
	]);
	const value = (0, import_react.useMemo)(() => ({
		state,
		message,
		pendingId,
		ringColor: color,
		setPendingId,
		setRingColor,
		persistRingColor,
		announce,
		accept
	}), [
		state,
		message,
		pendingId,
		color,
		setPendingId,
		setRingColor,
		persistRingColor,
		announce,
		accept
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RingContext.Provider, {
		value,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: { ["--ring-color"]: color },
			children
		})
	});
}
function AxiomRing() {
	const { state, message } = useAxiomRing();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "axiom-ring",
		"data-state": state,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "axiom-ring-frame",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "axiom-ring-mask axiom-ring-bloom",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "axiom-ring-spin" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "axiom-ring-mask axiom-ring-core",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "axiom-ring-spin" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "axiom-ring-edge" })
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: -12,
			filter: "blur(4px)"
		},
		animate: {
			opacity: 1,
			y: 0,
			filter: "blur(0px)"
		},
		exit: {
			opacity: 0,
			y: -12,
			filter: "blur(4px)"
		},
		transition: {
			duration: .35,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "pointer-events-none fixed inset-x-0 top-0 z-[10000] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-full bg-surface/90 px-4 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.1)]",
			children: message
		})
	}) : null })] });
}
//#endregion
export { AxiomRingProvider as n, useAxiomRing as r, AxiomRing as t };
