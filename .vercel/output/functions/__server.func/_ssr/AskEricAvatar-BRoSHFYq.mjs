import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Video, x as Mic, y as PhoneOff } from "../_libs/lucide-react.mjs";
import { o as ericGreeting, s as ownerWelcome } from "./avatar-D6Yygk0d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AskEricAvatar-BRoSHFYq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GREET_DELAY_MS = 1500;
var SEEN_PREFIX = "axiom:owner-greet:";
function greetingSeen(shopSlug) {
	try {
		return localStorage.getItem(SEEN_PREFIX + shopSlug) === "1";
	} catch {
		return false;
	}
}
function markGreetingSeen(shopSlug) {
	try {
		localStorage.setItem(SEEN_PREFIX + shopSlug, "1");
	} catch {}
}
async function speakLine(room, text) {
	const payload = {
		event_id: crypto.randomUUID(),
		event_type: "avatar.speak_text",
		text
	};
	await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), {
		reliable: true,
		topic: "agent-control"
	});
}
function AskEricAvatar({ businessName, trade, city, startOpen = false, welcome }) {
	const context = {
		businessName,
		trade,
		city
	};
	const greeting = ericGreeting(context);
	const welcomeLine = ownerWelcome(context);
	const [open, setOpen] = (0, import_react.useState)(startOpen);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [detail, setDetail] = (0, import_react.useState)(greeting);
	const [soundBlocked, setSoundBlocked] = (0, import_react.useState)(false);
	const videoRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const roomRef = (0, import_react.useRef)(null);
	const runRef = (0, import_react.useRef)(0);
	const launchRef = (0, import_react.useRef)(() => void 0);
	(0, import_react.useEffect)(() => {
		return () => {
			runRef.current += 1;
			roomRef.current?.disconnect();
			roomRef.current = null;
		};
	}, []);
	async function hangUp() {
		roomRef.current?.disconnect();
		roomRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
		if (audioRef.current) audioRef.current.replaceChildren();
		setSoundBlocked(false);
		setPhase("idle");
		setDetail(welcome ? welcomeLine : greeting);
	}
	async function start(options) {
		if (phase === "connecting" || phase === "live") return;
		const script = options?.script;
		const microphone = options?.microphone !== false;
		const run = ++runRef.current;
		setPhase("connecting");
		setSoundBlocked(false);
		setDetail(script || "Opening the line…");
		try {
			const response = await fetch("/api/get-avatar-token", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(context)
			});
			const payload = await response.json().catch(() => null);
			if (run !== runRef.current) return;
			if (!payload?.configured) {
				setPhase("offline");
				setDetail(script || payload?.greeting || greeting);
				return;
			}
			if (!response.ok || !payload.livekitUrl || !payload.livekitClientToken) {
				setPhase("error");
				setDetail(payload?.error || "The live line did not open.");
				return;
			}
			const { Room, RoomEvent, Track } = await import("../_libs/livekit-client.mjs").then((n) => n.t);
			if (run !== runRef.current) return;
			const room = new Room({
				adaptiveStream: true,
				dynacast: true
			});
			roomRef.current = room;
			let spoken = false;
			const say = () => {
				if (spoken || !script) return;
				spoken = true;
				speakLine(room, script).catch(() => void 0);
			};
			room.on(RoomEvent.TrackSubscribed, (track) => {
				if (run !== runRef.current) return;
				if (track.kind === Track.Kind.Video && videoRef.current) {
					track.attach(videoRef.current);
					videoRef.current.play().catch(() => setSoundBlocked(true));
					say();
				}
				if (track.kind === Track.Kind.Audio && audioRef.current) {
					const element = track.attach();
					element.autoplay = true;
					audioRef.current.append(element);
					element.play().catch(() => setSoundBlocked(true));
				}
			});
			await room.connect(payload.livekitUrl, payload.livekitClientToken);
			if (run !== runRef.current) {
				room.disconnect();
				return;
			}
			room.startAudio().catch(() => setSoundBlocked(true));
			if (microphone) await room.localParticipant.setMicrophoneEnabled(true);
			window.setTimeout(say, 1200);
			setPhase("live");
			setDetail(script || greeting);
		} catch (err) {
			if (run !== runRef.current) return;
			roomRef.current?.disconnect();
			roomRef.current = null;
			setPhase("error");
			setDetail(err instanceof Error ? err.message : "The live line did not open.");
		}
	}
	launchRef.current = () => {
		setOpen(true);
		start({
			script: welcomeLine,
			microphone: false
		});
	};
	(0, import_react.useEffect)(() => {
		if (!welcome || greetingSeen(welcome)) return;
		const timer = window.setTimeout(() => {
			markGreetingSeen(welcome);
			launchRef.current();
		}, GREET_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [welcome]);
	function dismiss() {
		runRef.current += 1;
		hangUp();
		setOpen(false);
	}
	function toggle() {
		if (open) {
			dismiss();
			return;
		}
		setOpen(true);
		if (welcome) start({
			script: welcomeLine,
			microphone: false
		});
	}
	async function resumeSound() {
		setSoundBlocked(false);
		try {
			await roomRef.current?.startAudio();
			await videoRef.current?.play();
			audioRef.current?.querySelectorAll("audio").forEach((node) => void node.play());
		} catch {
			setSoundBlocked(true);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed right-4 bottom-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-end gap-3",
		children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "glass-btn w-full overflow-hidden rounded-[24px] bg-surface/90",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative aspect-[4/5] bg-bg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: videoRef,
							className: "h-full w-full object-cover",
							autoPlay: true,
							playsInline: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: audioRef,
							className: "hidden"
						}),
						phase !== "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-0 flex flex-col justify-end bg-bg/80 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.16em] text-muted",
								children: "Eric"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-fg",
								children: detail
							})]
						}) : null
					]
				}),
				phase === "live" && welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-3 text-sm leading-relaxed text-muted",
					children: welcomeLine
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 p-3",
					children: [
						welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: dismiss,
							className: "inline-flex h-11 items-center justify-center rounded-xl bg-fg px-3 text-sm font-medium text-bg",
							children: "Close / Skip to Setup"
						}) : null,
						soundBlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void resumeSound(),
							className: "inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm text-fg",
							children: "Play greeting"
						}) : null,
						phase === "live" && !welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void hangUp(),
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-sm font-medium text-bg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, {
								className: "size-4",
								"aria-hidden": true
							}), "End"]
						}) : null,
						phase !== "live" && !welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void start(),
							disabled: phase === "connecting",
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-sm font-medium text-bg disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
								className: "size-4",
								"aria-hidden": true
							}), phase === "connecting" ? "Connecting" : "Talk with Eric"]
						}) : null
					]
				})
			]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-expanded": open,
			"aria-label": open ? "Close Eric" : "Ask Eric",
			onClick: toggle,
			className: "inline-flex h-12 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
				className: "size-4",
				"aria-hidden": true
			}), "Ask Eric"]
		})]
	});
}
//#endregion
export { AskEricAvatar as t };
