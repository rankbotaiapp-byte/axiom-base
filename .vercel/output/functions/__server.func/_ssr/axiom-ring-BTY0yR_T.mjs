import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { k as setShopRingColor, o as confirmLatestAudit, t as acceptBooking, v as listShopEvents } from "./server-CiF75qCF.mjs";
import { i as AnimatePresence, r as motion } from "../_libs/framer-motion+[...].mjs";
import { n as readFeedback, t as pulseHaptic } from "./feedback-CaqQu69G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/axiom-ring-BTY0yR_T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CYCLE_MS = 1650;
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
function AxiomRingProvider({ shopId, slug, ringColor: initialColor, mode, watchEmployeeId = null, children }) {
	const [state, setState] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)(null);
	const [cycle, setCycle] = (0, import_react.useState)(0);
	const [color, setColor] = (0, import_react.useState)(initialColor);
	const [incoming, setIncoming] = (0, import_react.useState)(null);
	const [locked, setLocked] = (0, import_react.useState)(null);
	const prefsRef = (0, import_react.useRef)(readFeedback("shop"));
	const [pendingId, setPendingIdState] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return null;
		return sessionStorage.getItem(`axiom:pending:${shopId}`);
	});
	const afterRef = (0, import_react.useRef)(void 0);
	const flashTimer = (0, import_react.useRef)(void 0);
	const seenRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const recentColor = (0, import_react.useRef)(null);
	const mountedAt = (0, import_react.useRef)(Date.now());
	const isStaff = mode === "owner" || mode === "employee" || mode === "preview";
	const staffRef = (0, import_react.useRef)(isStaff);
	staffRef.current = isStaff;
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
	(0, import_react.useEffect)(() => {
		const sync = () => {
			prefsRef.current = readFeedback("shop");
		};
		window.addEventListener("axiom-feedback", sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener("axiom-feedback", sync);
			window.removeEventListener("storage", sync);
		};
	}, []);
	const play = (0, import_react.useCallback)((start, settle, msg) => {
		const flash = !staffRef.current || prefsRef.current.neon;
		window.clearTimeout(flashTimer.current);
		if (!flash) {
			setMessage(msg);
			flashTimer.current = window.setTimeout(() => setMessage(null), CYCLE_MS);
			return;
		}
		setCycle((n) => n + 1);
		setState(start);
		setMessage(msg);
		flashTimer.current = window.setTimeout(() => {
			setState(settle);
			setMessage(null);
		}, CYCLE_MS);
	}, []);
	const announce = (0, import_react.useCallback)((event, local) => {
		if (event.type === "ring_color" && event.payload) {
			const now = Date.now();
			const recent = recentColor.current;
			if (recent && recent.payload === event.payload && now - recent.at < 2150) return;
			recentColor.current = {
				payload: event.payload,
				at: now
			};
		}
		const dedupeKey = event.type === "audit_confirmed" ? `audit_confirmed:${event.payload?.split("|")[0] ?? event.id}` : `${event.type}:${event.appointmentId ?? event.id}`;
		if (seenRef.current.has(dedupeKey)) return;
		if (mode === "employee" && event.employeeId && event.employeeId !== watchEmployeeId) {
			seenRef.current.add(dedupeKey);
			return;
		}
		seenRef.current.add(dedupeKey);
		if (event.type === "ring_color" && event.payload) {
			setColor(event.payload);
			if (!staffRef.current || prefsRef.current.neon) play("cycle", "idle", null);
		}
		if (event.type === "booking_request") {
			if (staffRef.current && !local) {
				setIncoming("booking");
				play("awaiting", "awaiting", "New booking request");
				if (prefsRef.current.haptics) pulseHaptic("incoming");
			} else play("pulse", "pulse", "Waiting for confirmation");
		}
		if (event.type === "payment_received") {
			if (staffRef.current) {
				play("alert", "idle", "Payment received");
				if (!local && prefsRef.current.haptics) pulseHaptic("incoming");
			} else play("pulse", "idle", "Payment received");
		}
		if (event.type === "audit_request") {
			if (staffRef.current) {
				setIncoming("estimate");
				play("alert", "idle", "New estimate");
				if (!local && prefsRef.current.haptics) pulseHaptic("incoming");
			} else play("pulse", "idle", "Estimate sent");
		}
		if (event.type === "booking_confirmed" || event.type === "audit_confirmed") {
			const detail = event.type === "audit_confirmed" ? event.payload?.split("|").slice(1).join("|") || "Estimate locked in" : event.payload || "You're booked — locked in";
			if (staffRef.current) {
				setIncoming(null);
				play("lock", "idle", "Confirmation sent");
				if (prefsRef.current.haptics) pulseHaptic("confirm");
			} else {
				setLocked(detail);
				play("lock", "solid", event.type === "audit_confirmed" ? "Estimate locked in" : "You're booked — locked in");
				pulseHaptic("confirm");
			}
		}
		if (typeof window !== "undefined" && local) broadcast(shopId, event);
	}, [
		mode,
		play,
		shopId,
		watchEmployeeId
	]);
	const persistRingColor = (0, import_react.useCallback)(async (next) => {
		const event = {
			id: `ring-${Date.now()}`,
			type: "ring_color",
			appointmentId: null,
			payload: next,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		announce(event, true);
		try {
			await setShopRingColor({ data: {
				slug,
				ringColor: next
			} });
		} catch {}
	}, [announce, slug]);
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
				const freshAfter = mountedAt.current - 1500;
				for (const e of ordered) {
					const at = new Date(e.createdAt).getTime();
					if (Number.isFinite(at) && at < freshAfter) continue;
					announce(e, false);
				}
			} catch {}
		};
		const id = window.setInterval(tick, 400);
		tick();
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [announce, slug]);
	const accept = (0, import_react.useCallback)(async () => {
		if (incoming === "estimate") {
			const result = await confirmLatestAudit({ data: slug });
			announce({
				id: `audit-${result.id}`,
				type: "audit_confirmed",
				appointmentId: null,
				payload: `${result.id}|${result.detail}`,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}, true);
			setIncoming(null);
			return;
		}
		let appointmentId = pendingId;
		if (!appointmentId) {
			const latest = (await listShopEvents({ data: { slug } })).find((e) => e.type === "booking_request" && e.appointmentId);
			if (!latest?.appointmentId) return;
			appointmentId = latest.appointmentId;
		}
		const result = await acceptBooking({ data: {
			slug,
			appointmentId
		} });
		announce({
			id: `acc-${appointmentId}`,
			type: "booking_confirmed",
			appointmentId,
			payload: result.detail,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, true);
		setIncoming(null);
	}, [
		announce,
		incoming,
		pendingId,
		slug
	]);
	const value = (0, import_react.useMemo)(() => ({
		state,
		message,
		cycle,
		pendingId,
		incoming,
		locked,
		clearLocked: () => setLocked(null),
		ringColor: color,
		setPendingId,
		setRingColor,
		persistRingColor,
		announce,
		accept
	}), [
		state,
		message,
		cycle,
		pendingId,
		incoming,
		locked,
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
	const { state, message, cycle, locked, clearLocked } = useAxiomRing();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "axiom-ring",
			"data-state": state,
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "axiom-ring-bloom" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "axiom-ring-edge" })]
		}, cycle),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
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
				y: -8,
				filter: "blur(6px)"
			},
			transition: {
				duration: .45,
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
		}, cycle) : null }),
		locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(46,230,214,0.45)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-accent",
						children: "Locked in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: locked
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-3 text-sm text-muted",
						onClick: clearLocked,
						children: "Dismiss"
					})
				]
			})
		}) : null
	] });
}
//#endregion
export { AxiomRingProvider as n, useAxiomRing as r, AxiomRing as t };
