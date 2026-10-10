import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, b as Link, w as require_jsx_runtime, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-BkNFIPfO.mjs";
import { A as writeIntroFx, S as parallaxTravel, T as readIntroFx, g as introDurationSec, m as heroPlaybackRate, n as INTRO_FX_EVENT, u as cameraMotion, x as nicheCopy } from "./intro-MrMOJI2L.mjs";
import { a as hasGateSessionMarker } from "./server-BPvWya0h.mjs";
import { a as signOut } from "./client-Hb_FAdbz.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./use-current-user-Bh_x61Ff.mjs";
import { n as useScroll, r as motion, t as useMotionValue } from "../_libs/framer-motion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-chrome-C8WE8XQ6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
function CinematicHero({ imageUrl, videoUrl, blendPercent, introPreset = "kenburns", introSpeed = 40, introIntensity = 45, replayKey, previewMode = false, tone = null, fallbackImageUrl = "", fallbackVideoUrl = "", className, children }) {
	const [reduced, setReduced] = (0, import_react.useState)(false);
	const [fxOn, setFxOn] = (0, import_react.useState)(true);
	const [videoOk, setVideoOk] = (0, import_react.useState)(true);
	const [imageSrc, setImageSrc] = (0, import_react.useState)(imageUrl);
	const [videoSrc, setVideoSrc] = (0, import_react.useState)(videoUrl ?? "");
	const videoRef = (0, import_react.useRef)(null);
	const sectionRef = (0, import_react.useRef)(null);
	/**
	* Progress is 0 while the hero's top is at the top of the viewport and 1
	* when its bottom reaches that edge. Touch scrolling updates the same value.
	* The vh unit keeps this on the scroll listener. A named offset can be
	* promoted to a view timeline that stops reporting once it has been measured.
	*/
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start 0vh", "end 0vh"]
	});
	const backgroundY = useMotionValue(0);
	const washY = useMotionValue(0);
	const lightY = useMotionValue(0);
	const foregroundY = useMotionValue(0);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(mq.matches);
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);
	(0, import_react.useEffect)(() => {
		if (previewMode) return;
		const sync = () => setFxOn(readIntroFx());
		sync();
		window.addEventListener(INTRO_FX_EVENT, sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener(INTRO_FX_EVENT, sync);
			window.removeEventListener("storage", sync);
		};
	}, [previewMode]);
	(0, import_react.useEffect)(() => {
		setImageSrc(imageUrl);
		setVideoSrc(videoUrl ?? "");
		setVideoOk(Boolean(videoUrl));
	}, [imageUrl, videoUrl]);
	(0, import_react.useEffect)(() => {
		const el = videoRef.current;
		if (!el || !videoSrc) return;
		el.muted = true;
		const play = () => {
			el.play().catch(() => void 0);
		};
		play();
		el.addEventListener("canplay", play);
		return () => el.removeEventListener("canplay", play);
	}, [videoSrc, videoOk]);
	const skip = reduced || !previewMode && !fxOn;
	const preset = skip ? "none" : introPreset;
	const intensity = Number.isFinite(introIntensity) ? introIntensity : 45;
	const speed = Number.isFinite(introSpeed) ? introSpeed : 40;
	const blend = Number.isFinite(blendPercent) ? blendPercent : 60;
	const motionProps = cameraMotion(preset, intensity);
	const duration = introDurationSec(speed);
	const animate = preset !== "none";
	const depthOn = !skip && intensity > 0;
	(0, import_react.useEffect)(() => {
		const apply = (progress) => {
			const travel = parallaxTravel(depthOn ? intensity : 0, speed);
			backgroundY.set(progress * travel.background);
			washY.set(progress * travel.wash);
			lightY.set(progress * travel.light);
			foregroundY.set(progress * travel.foreground);
			const el = videoRef.current;
			if (!el) return;
			const next = depthOn ? heroPlaybackRate(progress, intensity) : 1;
			if (el.playbackRate !== next) el.playbackRate = next;
		};
		apply(scrollYProgress.get());
		const stop = scrollYProgress.on("change", apply);
		return () => {
			stop();
			backgroundY.set(0);
			washY.set(0);
			lightY.set(0);
			foregroundY.set(0);
			if (videoRef.current) videoRef.current.playbackRate = 1;
		};
	}, [
		scrollYProgress,
		depthOn,
		intensity,
		speed,
		backgroundY,
		washY,
		lightY,
		foregroundY
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref: sectionRef,
		className: cn("relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg", className),
		style: { ["--hero-blend"]: `${blend}%` },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hero-blend absolute inset-0 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: cn("absolute inset-0 origin-center", depthOn && "will-change-transform"),
						style: {
							y: backgroundY,
							scale: depthOn ? 1.12 : 1
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							className: "absolute inset-0 origin-center",
							initial: animate ? motionProps.initial : {
								scale: 1,
								x: "0%",
								y: "0%",
								opacity: 1
							},
							animate: motionProps.animate,
							transition: animate ? {
								duration,
								ease: [
									.22,
									.08,
									.2,
									1
								]
							} : { duration: 0 },
							children: [imageSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: imageSrc,
								alt: "",
								className: cn("absolute inset-0 h-full w-full object-cover outline-none", !videoSrc && "media-drift"),
								onError: () => {
									if (fallbackImageUrl && imageSrc !== fallbackImageUrl) {
										setImageSrc(fallbackImageUrl);
										return;
									}
									setImageSrc("");
								}
							}) : null, videoSrc && videoOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								ref: videoRef,
								className: "absolute inset-0 z-[1] h-full w-full object-cover",
								src: videoSrc,
								autoPlay: true,
								loop: true,
								muted: true,
								playsInline: true,
								poster: imageSrc || void 0,
								onError: () => {
									if (fallbackVideoUrl && videoSrc !== fallbackVideoUrl) {
										setVideoSrc(fallbackVideoUrl);
										setVideoOk(true);
										return;
									}
									setVideoOk(false);
								}
							}) : null]
						}, `${imageSrc}-${videoSrc}-${preset}-${replayKey ?? "0"}`)
					}),
					tone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						"aria-hidden": true,
						className: cn("pointer-events-none absolute inset-0 z-[2]", depthOn && "will-change-transform", tone === "stage" && "hero-stage", tone === "site" && "hero-site"),
						style: { y: washY }
					}) : null,
					depthOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						"aria-hidden": true,
						className: "hero-atmosphere pointer-events-none absolute inset-0 z-[3] will-change-transform",
						style: { y: lightY }
					}) : null,
					animate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-0 z-[4] bg-bg",
						initial: { opacity: .94 },
						animate: { opacity: 0 },
						transition: {
							duration: 1.45,
							ease: [
								.22,
								.08,
								.2,
								1
							]
						}
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hero-dissolve pointer-events-none absolute inset-x-0 -bottom-px z-10 h-[68%]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				className: cn("relative z-20 flex min-h-0 flex-1 flex-col", depthOn && "will-change-transform"),
				style: { y: foregroundY },
				children
			})
		]
	});
}
function InsetFilm({ imageUrl, videoUrl }) {
	if (!videoUrl && !imageUrl) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
		className: "overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-[16/10] overflow-hidden bg-surface-2",
			children: videoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoopVideo, {
				src: videoUrl,
				className: "absolute inset-0"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: imageUrl,
				alt: "",
				className: "h-full w-full object-cover outline-none"
			})
		})
	});
}
function LoopVideo({ src, className }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || !src) return;
		el.muted = true;
		const play = () => {
			el.play().catch(() => void 0);
		};
		play();
		el.addEventListener("canplay", play);
		return () => el.removeEventListener("canplay", play);
	}, [src]);
	if (!src) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		ref,
		className: cn("h-full w-full object-cover", className),
		src,
		autoPlay: true,
		loop: true,
		muted: true,
		playsInline: true,
		preload: "auto"
	});
}
function IntroFxToggle({ className }) {
	const [on, setOn] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setOn(readIntroFx());
		const sync = () => setOn(readIntroFx());
		window.addEventListener(INTRO_FX_EVENT, sync);
		return () => window.removeEventListener(INTRO_FX_EVENT, sync);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-pressed": on,
		onClick: () => {
			const next = !on;
			setOn(next);
			writeIntroFx(next);
		},
		className: cn("inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted transition-[color,background-color] duration-150 hover:text-fg", className),
		children: ["Intro FX · ", on ? "On" : "Off"]
	});
}
function ShopNav({ shop, mode, highlightAdmin }) {
	const { user } = useCurrentUserState();
	const copy = nicheCopy(shop.niche);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex items-center justify-between gap-3 px-4 py-4 sm:px-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/$shopSlug",
			params: { shopSlug: shop.slug },
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[11px] uppercase tracking-[0.22em] text-muted",
				children: "New Era Apps · Powered by Axiom"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate font-display text-xl leading-tight text-fg",
				children: shop.name
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "flex items-center gap-1 sm:gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroFxToggle, { className: "hidden sm:inline-flex" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/book",
					params: { shopSlug: shop.slug },
					className: "hidden h-11 items-center rounded-xl px-3 text-sm text-muted transition-[color] duration-150 hover:text-fg sm:inline-flex",
					children: copy.bookLabel
				}),
				mode === "owner" || mode === "preview" || highlightAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					id: "tour-admin",
					to: "/$shopSlug/admin",
					params: { shopSlug: shop.slug },
					className: cn("inline-flex h-11 items-center rounded-xl px-3 text-sm transition-[color,box-shadow] duration-150", highlightAdmin ? "text-fg shadow-[0_0_0_1px_var(--ring-color),0_0_24px_color-mix(in_srgb,var(--ring-color)_45%,transparent)]" : "text-muted hover:text-fg"),
					children: "Admin"
				}) : null,
				mode === "employee" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/$shopSlug/employee",
					params: { shopSlug: shop.slug },
					className: "inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg",
					children: "Station"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden sm:block",
					children: user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "inline-flex h-11 items-center px-3 text-sm text-muted hover:text-fg",
						children: "Sign in"
					})
				})
			]
		})]
	});
}
function Wordmark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: cn("inline-flex items-center gap-2", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-7 place-items-center rounded-full shadow-[0_0_0_1px_rgba(243,241,235,0.16)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-lg tracking-tight",
			children: "Axiom"
		})]
	});
}
function PoweredBy({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("px-5 py-10 text-center text-[11px] uppercase tracking-[0.22em] text-faint", className),
		children: "New Era Apps · Powered by Axiom"
	});
}
//#endregion
export { PoweredBy as a, SignedIn as c, Wordmark as d, LoopVideo as i, SignedOut as l, InsetFilm as n, RedirectToSignIn as o, IntroFxToggle as r, ShopNav as s, CinematicHero as t, UserButton as u };
