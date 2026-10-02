import { o as __toESM } from "../_runtime.mjs";
import { Q as require_react, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-Dzshj1Ep.mjs";
import { t as motion } from "../_libs/framer-motion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cinematic-hero-udUXGdfY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ParticleField({ color }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let raf = 0;
		const particles = Array.from({ length: 48 }, () => ({
			x: Math.random(),
			y: Math.random(),
			r: Math.random() * 1.6 + .3,
			s: Math.random() * 25e-5 + 8e-5,
			a: Math.random() * .35 + .08
		}));
		const draw = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const { width, height } = canvas.getBoundingClientRect();
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			for (const p of particles) {
				p.y -= p.s * height;
				if (p.y < -.02) p.y = 1.02;
				ctx.beginPath();
				ctx.fillStyle = color;
				ctx.globalAlpha = p.a;
				ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [color]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "absolute inset-0 h-full w-full"
	});
}
function CinematicHero({ imageUrl, videoUrl, blendPercent, ringColor, className, children }) {
	const videoRef = (0, import_react.useRef)(null);
	const [showVideo, setShowVideo] = (0, import_react.useState)(Boolean(videoUrl));
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(mq.matches);
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);
	(0, import_react.useEffect)(() => {
		if (reduced) {
			setShowVideo(false);
			return;
		}
		const t = window.setTimeout(() => setShowVideo(false), 5200);
		return () => window.clearTimeout(t);
	}, [reduced, videoUrl]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("relative isolate min-h-[100dvh] overflow-hidden bg-bg", className),
		style: { ["--hero-blend"]: `${blendPercent}%` },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hero-blend absolute inset-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: imageUrl,
				alt: "",
				className: "absolute inset-0 z-0 h-full w-full object-cover outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "absolute inset-0 z-10 pointer-events-none",
				initial: { opacity: 1 },
				animate: { opacity: showVideo && !reduced ? 1 : 0 },
				transition: {
					duration: 1.1,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				children: [videoUrl && !reduced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					className: "absolute inset-0 h-full w-full object-cover",
					src: videoUrl,
					autoPlay: true,
					muted: true,
					playsInline: true,
					preload: "metadata",
					onEnded: () => setShowVideo(false),
					onError: () => setShowVideo(false)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParticleField, { color: ringColor }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-bg/25" })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative z-20 flex min-h-[100dvh] flex-col",
			children
		})]
	});
}
//#endregion
export { CinematicHero as t };
