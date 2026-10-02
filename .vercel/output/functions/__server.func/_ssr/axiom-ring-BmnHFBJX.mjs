import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as acceptBooking, x as listShopEvents } from "./router-Cz9T8z2K.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/axiom-ring-BmnHFBJX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RingContext = (0, import_react.createContext)(null);
var CHANNEL_PREFIX = "axiom-ring:";
function channelName(shopId) {
	return CHANNEL_PREFIX + shopId;
}
function useAxiomRing() {
	const ctx = (0, import_react.useContext)(RingContext);
	if (!ctx) throw new Error("AxiomRingProvider missing");
	return ctx;
}
function AxiomRingProvider({ shopId, slug, ringColor, mode, children }) {
	const [state, setState] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)(null);
	const [pendingId, setPendingIdState] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return null;
		return sessionStorage.getItem(`axiom:pending:${shopId}`);
	});
	const afterRef = (0, import_react.useRef)(void 0);
	const flashTimer = (0, import_react.useRef)(void 0);
	const isStaff = mode === "owner" || mode === "employee";
	const setPendingId = (0, import_react.useCallback)((id) => {
		setPendingIdState(id);
		if (typeof window === "undefined") return;
		if (id) sessionStorage.setItem(`axiom:pending:${shopId}`, id);
		else sessionStorage.removeItem(`axiom:pending:${shopId}`);
	}, [shopId]);
	const announce = (0, import_react.useCallback)((event, local) => {
		if (event.type === "booking_request") {
			if (local || event.appointmentId === pendingId) {
				setState("pulse");
				setMessage("Waiting for confirmation");
			} else if (isStaff) {
				setState("flash");
				window.clearTimeout(flashTimer.current);
				flashTimer.current = window.setTimeout(() => setState("awaiting"), 1100);
				setMessage("New booking request");
			}
		}
		if (event.type === "booking_confirmed") {
			if (!isStaff && (local || event.appointmentId === pendingId)) {
				setState("flash");
				window.clearTimeout(flashTimer.current);
				flashTimer.current = window.setTimeout(() => setState("solid"), 1100);
				setMessage("You're booked");
			} else if (isStaff) {
				setState("solid");
				setMessage("Booking confirmed");
			}
		}
		if (typeof window !== "undefined" && local) try {
			const ch = new BroadcastChannel(channelName(shopId));
			ch.postMessage(event);
			ch.close();
		} catch {}
	}, [
		isStaff,
		pendingId,
		shopId
	]);
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
		if (!pendingId) {
			const latest = (await listShopEvents({ data: { slug } })).find((e) => e.type === "booking_request");
			if (!latest?.appointmentId) return;
			await acceptBooking({ data: {
				slug,
				appointmentId: latest.appointmentId
			} });
			announce({
				id: latest.id,
				type: "booking_confirmed",
				appointmentId: latest.appointmentId,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}, true);
			return;
		}
		await acceptBooking({ data: {
			slug,
			appointmentId: pendingId
		} });
		announce({
			id: `local-${Date.now()}`,
			type: "booking_confirmed",
			appointmentId: pendingId,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, true);
	}, [
		announce,
		pendingId,
		slug
	]);
	const value = (0, import_react.useMemo)(() => ({
		state,
		message,
		pendingId,
		setPendingId,
		announce,
		accept
	}), [
		state,
		message,
		pendingId,
		setPendingId,
		announce,
		accept
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RingContext.Provider, {
		value,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: { ["--ring-color"]: ringColor },
			children
		})
	});
}
function AxiomRing() {
	const { state, message } = useAxiomRing();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "axiom-ring",
		"data-state": state,
		"aria-hidden": "true"
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
