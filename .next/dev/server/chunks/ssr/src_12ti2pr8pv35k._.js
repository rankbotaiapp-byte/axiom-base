(()=>{"use strict";module.exports = [
"[project]/src/app/hero-studio/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeroStudioPreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$motion$2d$studio$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/hero-motion-studio.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const shop = {
    id: "shop_preview",
    slug: "north-frame",
    name: "North Frame",
    niche: "field",
    heroVideoUrl: null,
    introPreset: "kenburns",
    glowEnabled: false,
    tradeProfile: {
        studio: {
            header: "",
            tagline: "",
            theme: "",
            presentation: "",
            motion: {
                pan: false,
                ripple: false,
                neon: false,
                particle: false
            }
        }
    }
};
function HeroStudioPreview() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-dvh bg-bg px-5 py-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$motion$2d$studio$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HeroMotionStudio"], {
            shop: shop,
            readonly: true,
            onSetLive: async ()=>({
                    path: ""
                })
        }, void 0, false, {
            fileName: "[project]/src/app/hero-studio/page.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/hero-studio/page.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/hero-motion-studio.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeroMotionStudio",
    ()=>HeroMotionStudio
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$motion$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-motion.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-video.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/niches.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/particle-brand.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
const COLS = 72;
const ROWS = 40;
const BRUSH = 5.5;
const LEAD = [
    "field",
    "landscaper",
    "contractor"
];
function leadRank(niche) {
    const index = LEAD.indexOf(niche);
    return index === -1 ? LEAD.length : index;
}
function HeroMotionStudio({ shop, readonly, onSetLive }) {
    const reduce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const presets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PUBLIC_NICHE_ORDER"].flatMap((niche)=>{
            const film = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][niche];
            if (!film || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(film.heroVideoUrl)) return [];
            return [
                {
                    niche,
                    label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$motion$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroPresetLabel"])(niche, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHES"][niche].label),
                    url: film.heroVideoUrl,
                    image: film.heroImageUrl
                }
            ];
        }).sort((a, b)=>leadRank(a.niche) - leadRank(b.niche) || a.label.localeCompare(b.label));
    }, []);
    const initialNiche = presets.some((item)=>item.niche === shop.niche) ? shop.niche : presets[0]?.niche ?? shop.niche;
    const stored = shop.tradeProfile.studio.motion;
    const [picked, setPicked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialNiche);
    const [motionOn, setMotionOn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        pan: stored.pan || shop.introPreset === "cinematic-pan",
        ripple: stored.ripple,
        neon: stored.neon || shop.glowEnabled,
        particle: stored.particle
    });
    const [upload, setUpload] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [painted, setPainted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [hidden, setHidden] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const particleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const rippleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const preset = presets.find((item)=>item.niche === picked) ?? presets[0];
    const fallback = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHES"][picked]?.defaultName || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHES"][shop.niche].defaultName;
    const preview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$motion$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroMotionPreview"])(shop.name, fallback, upload?.kind === "video" ? "" : preset?.url ?? "", upload?.kind === "image" ? "" : preset?.image ?? "");
    const mediaUrl = upload?.url || preview.mediaUrl;
    const mediaKind = upload?.kind ?? preview.kind;
    const livePath = shop.heroVideoUrl || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][shop.niche]?.heroVideoUrl || "Niche default";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!motionOn.ripple || reduce) return;
        const canvas = rippleRef.current;
        if (!canvas) return;
        let dead = false;
        let frame = 0;
        const draw = (time)=>{
            if (dead) return;
            const rect = canvas.getBoundingClientRect();
            if (rect.width >= 8 && rect.height >= 8) {
                const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
                const width = Math.floor(rect.width * dpr);
                const height = Math.floor(rect.height * dpr);
                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                }
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    const ink = getComputedStyle(canvas).color || "rgb(46, 230, 214)";
                    ctx.clearRect(0, 0, width, height);
                    ctx.strokeStyle = ink;
                    ctx.fillStyle = ink;
                    for(let i = 0; i < 5; i += 1){
                        const phase = (time / 900 + i * 0.72) % (Math.PI * 2);
                        const radius = (0.16 + (Math.sin(phase) + 1) / 2 * 0.42) * Math.min(width, height);
                        ctx.globalAlpha = 0.16 + 0.14 * ((Math.sin(phase) + 1) / 2);
                        ctx.lineWidth = 2 * dpr;
                        ctx.beginPath();
                        ctx.ellipse(width * 0.5, height * 0.62, radius, radius * 0.26, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 0.1;
                    ctx.fillRect(0, height * 0.58, width, height * 0.42);
                    ctx.globalAlpha = 1;
                }
            }
            frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        return ()=>{
            dead = true;
            cancelAnimationFrame(frame);
        };
    }, [
        motionOn.ripple,
        reduce
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!motionOn.particle) return;
        const canvas = particleRef.current;
        if (!canvas) return;
        let dead = false;
        let frame = 0;
        let pointerId = -1;
        let down = false;
        const cover = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createCover"])(COLS, ROWS);
        const paint = ()=>{
            const rect = canvas.getBoundingClientRect();
            if (rect.width < 8 || rect.height < 8) return false;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
            const width = Math.max(2, Math.floor(rect.width * dpr));
            const height = Math.max(2, Math.floor(rect.height * dpr));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            const ctx = canvas.getContext("2d");
            if (!ctx) return false;
            const ink = getComputedStyle(canvas).color || "rgb(8, 8, 10)";
            const cellW = canvas.width / COLS;
            const cellH = canvas.height / ROWS;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = ink;
            for(let y = 0; y < ROWS; y += 1){
                for(let x = 0; x < COLS; x += 1){
                    if ((cover[y * COLS + x] ?? 0) < 0.5) continue;
                    ctx.globalAlpha = (x + y) % 5 === 0 ? 0.96 : 0.86;
                    ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
                }
            }
            ctx.globalAlpha = 1;
            return true;
        };
        const cellAt = (clientX, clientY)=>{
            const rect = canvas.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) return null;
            return {
                x: (clientX - rect.left) / rect.width * COLS,
                y: (clientY - rect.top) / rect.height * ROWS
            };
        };
        const onDown = (event)=>{
            down = true;
            pointerId = event.pointerId;
            canvas.setPointerCapture(event.pointerId);
            const hit = cellAt(event.clientX, event.clientY);
            if (hit) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["revealStroke"])(cover, COLS, ROWS, hit.x, hit.y, BRUSH);
        };
        const onMove = (event)=>{
            if (!down || event.pointerId !== pointerId) return;
            const hit = cellAt(event.clientX, event.clientY);
            if (hit) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["revealStroke"])(cover, COLS, ROWS, hit.x, hit.y, BRUSH);
        };
        const onUp = (event)=>{
            if (event.pointerId !== pointerId) return;
            down = false;
            setHidden((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["coveredShare"])(cover));
        };
        let didPaint = false;
        const loop = ()=>{
            if (dead) return;
            if (paint() && !didPaint) {
                didPaint = true;
                setPainted(true);
            }
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onUp);
        return ()=>{
            dead = true;
            cancelAnimationFrame(frame);
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onUp);
            setPainted(false);
            setHidden(1);
        };
    }, [
        motionOn.particle
    ]);
    function toggle(id) {
        setMotionOn((current)=>({
                ...current,
                [id]: !current[id]
            }));
        setNotice(null);
    }
    function chooseFile(file) {
        if (!file) return;
        const video = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
        const image = file.type.startsWith("image/");
        if (!video && !image) {
            setError("Upload a photo or an .mp4 video");
            return;
        }
        if (video && file.size > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HERO_VIDEO_MAX_BYTES"]) {
            setError("Video must be 12 MB or smaller");
            return;
        }
        const url = URL.createObjectURL(file);
        setUpload((current)=>{
            if (current) URL.revokeObjectURL(current.url);
            return {
                file,
                url,
                kind: video ? "video" : "image"
            };
        });
        setError(null);
        setNotice(null);
    }
    async function publish() {
        if (readonly || busy) return;
        const plan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$motion$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["planLiveHero"])({
            upload: upload?.kind ?? null,
            catalogVideo: upload ? "" : preset?.url ?? "",
            catalogImage: upload ? "" : preset?.image ?? ""
        }, motionOn);
        if (!plan.mediaPath) {
            setError("Choose a niche film or upload a photo or video.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await onSetLive({
                plan,
                file: upload?.file ?? null
            });
            setNotice(result.path);
            if (result.warning) setError(result.warning);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not set the live hero");
        } finally{
            setBusy(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Hero Motion and Generation Studio",
        className: "pointer-events-auto glass-panel rounded-[28px] p-5 sm:p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs uppercase tracking-widest text-muted",
                children: "Storefront"
            }, void 0, false, {
                fileName: "[project]/src/components/hero-motion-studio.tsx",
                lineNumber: 284,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mt-1 font-display text-4xl",
                children: "Hero Motion & Generation Studio"
            }, void 0, false, {
                fileName: "[project]/src/components/hero-motion-studio.tsx",
                lineNumber: 285,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-2 max-w-2xl text-sm text-muted",
                children: "Upload a photo or video, or start from a niche film. The loop plays with your business name and two-word mark. Set as Live Hero writes that asset onto this shop."
            }, void 0, false, {
                fileName: "[project]/src/components/hero-motion-studio.tsx",
                lineNumber: 286,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative aspect-video overflow-hidden rounded-[24px] bg-bg",
                        style: {
                            perspective: "900px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                                className: "pointer-events-none absolute inset-[-8%]",
                                animate: motionOn.pan && !reduce ? {
                                    x: [
                                        "-3%",
                                        "3%",
                                        "-3%"
                                    ],
                                    y: [
                                        "1.2%",
                                        "-1.2%",
                                        "1.2%"
                                    ],
                                    rotateY: [
                                        -8,
                                        8,
                                        -8
                                    ]
                                } : {
                                    x: "0%",
                                    y: "0%",
                                    rotateY: 0
                                },
                                transition: motionOn.pan && !reduce ? {
                                    duration: 16,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                } : {
                                    duration: reduce ? 0 : 0.35
                                },
                                style: {
                                    transformStyle: "preserve-3d"
                                },
                                children: [
                                    mediaUrl && mediaKind === "video" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                        className: "pointer-events-none h-full w-full object-cover",
                                        src: mediaUrl,
                                        autoPlay: true,
                                        muted: true,
                                        loop: true,
                                        playsInline: true
                                    }, mediaUrl, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, this) : null,
                                    mediaUrl && mediaKind === "image" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: mediaUrl,
                                        alt: "",
                                        className: "pointer-events-none h-full w-full object-cover"
                                    }, mediaUrl, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 318,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 292,
                                columnNumber: 11
                            }, this),
                            motionOn.ripple ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                ref: rippleRef,
                                "aria-hidden": true,
                                className: "pointer-events-none absolute inset-0 h-full w-full text-accent"
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this) : null,
                            motionOn.particle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                ref: particleRef,
                                "aria-label": "Swipe to reveal the hero loop",
                                className: "pointer-events-auto absolute inset-0 h-full w-full touch-none text-bg"
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 326,
                                columnNumber: 13
                            }, this) : null,
                            motionOn.particle && !painted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pointer-events-none absolute inset-0 bg-bg"
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 332,
                                columnNumber: 44
                            }, this) : null,
                            motionOn.neon ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                "aria-hidden": true,
                                className: "pointer-events-none absolute inset-0",
                                style: {
                                    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--neon, var(--color-accent)) 75%, transparent), inset 0 0 56px color-mix(in srgb, var(--neon, var(--color-accent)) 32%, transparent)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5",
                                style: {
                                    background: "linear-gradient(to top, color-mix(in srgb, var(--color-bg) 84%, transparent), transparent)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs uppercase tracking-widest text-accent",
                                        children: preview.line
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 347,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-display text-4xl text-fg",
                                        children: shop.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 348,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-muted",
                                        children: motionOn.particle ? hidden < 0.08 ? "Film open" : "Swipe the cover" : "Live micro-loop"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 349,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 343,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                        lineNumber: 291,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-auto flex flex-col gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "pointer-events-auto inline-flex h-11 cursor-pointer items-center rounded-full bg-surface-2 px-4 text-sm text-fg",
                                        children: [
                                            "Upload photo or video",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                accept: "image/*,video/mp4,.mp4",
                                                className: "sr-only",
                                                disabled: readonly || busy,
                                                onChange: (event)=>{
                                                    const file = event.target.files?.[0];
                                                    event.target.value = "";
                                                    chooseFile(file);
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                                lineNumber: 359,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 357,
                                        columnNumber: 13
                                    }, this),
                                    upload ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg",
                                        onClick: ()=>{
                                            setUpload((current)=>{
                                                if (current) URL.revokeObjectURL(current.url);
                                                return null;
                                            });
                                            setNotice(null);
                                        },
                                        children: "Use the niche film"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 372,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 356,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted",
                                children: upload ? `Previewing your ${upload.kind}. It replaces the niche film when you set it live.` : "Niche films play from the hero library."
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 387,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                role: "listbox",
                                "aria-label": "Niche presets",
                                children: presets.map((item)=>{
                                    const on = !upload && item.niche === picked;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        role: "option",
                                        "aria-selected": on,
                                        disabled: busy,
                                        className: `pointer-events-auto inline-flex h-11 items-center rounded-full px-4 text-sm ${on ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`,
                                        onClick: ()=>{
                                            setPicked(item.niche);
                                            setUpload((current)=>{
                                                if (current) URL.revokeObjectURL(current.url);
                                                return null;
                                            });
                                            setNotice(null);
                                        },
                                        children: item.label
                                    }, item.niche, false, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 395,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 391,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-2",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$motion$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HERO_MOTIONS"].map((item)=>{
                                    const on = motionOn[item.id];
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        role: "switch",
                                        "aria-checked": on,
                                        disabled: busy,
                                        onClick: ()=>toggle(item.id),
                                        className: "pointer-events-auto flex h-11 items-center justify-between rounded-xl bg-surface-2 px-3 text-sm text-fg disabled:opacity-50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                                lineNumber: 430,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: on ? "text-accent" : "text-faint",
                                                children: on ? "On" : "Off"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                                lineNumber: 431,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, item.id, true, {
                                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                                        lineNumber: 421,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 417,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted",
                                children: [
                                    "Live path · ",
                                    notice || livePath
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 437,
                                columnNumber: 11
                            }, this),
                            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-danger",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 438,
                                columnNumber: 20
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "accent",
                                size: "lg",
                                className: "pointer-events-auto w-full",
                                disabled: readonly || busy || !mediaUrl,
                                onClick: ()=>void publish(),
                                children: busy ? "Setting live hero…" : "Set as Live Hero"
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 439,
                                columnNumber: 11
                            }, this),
                            readonly ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted",
                                children: "This preview keeps the niche film. A shop you own can set it live."
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero-motion-studio.tsx",
                                lineNumber: 448,
                                columnNumber: 23
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/hero-motion-studio.tsx",
                        lineNumber: 355,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/hero-motion-studio.tsx",
                lineNumber: 290,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/hero-motion-studio.tsx",
        lineNumber: 283,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/magnetic.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Magnetic",
    ()=>Magnetic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-ssr] (ecmascript)");
;
;
;
function Magnetic({ children, className }) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [live, setLive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const springX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSpring"])(x, {
        stiffness: 220,
        damping: 18,
        mass: 0.35
    });
    const springY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSpring"])(y, {
        stiffness: 220,
        damping: 18,
        mass: 0.35
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
        const fine = window.matchMedia("(pointer: fine)");
        const sync = ()=>setLive(fine.matches && !reduce.matches);
        sync();
        reduce.addEventListener("change", sync);
        fine.addEventListener("change", sync);
        return ()=>{
            reduce.removeEventListener("change", sync);
            fine.removeEventListener("change", sync);
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
        ref: ref,
        className: className,
        style: {
            x: springX,
            y: springY
        },
        onPointerMove: (event)=>{
            if (!live || !ref.current) return;
            const box = ref.current.getBoundingClientRect();
            const dx = event.clientX - (box.left + box.width / 2);
            const dy = event.clientY - (box.top + box.height / 2);
            const reach = Math.min(box.width, box.height, 140);
            const pull = Math.min(1, Math.hypot(dx, dy) / reach);
            x.set(dx * 0.22 * (1.15 - pull));
            y.set(dy * 0.22 * (1.15 - pull));
        },
        onPointerLeave: ()=>{
            x.set(0);
            y.set(0);
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/magnetic.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/magnetic.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 font-medium select-none transition-[scale,background-color,color,box-shadow,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", {
    variants: {
        variant: {
            primary: "bg-fg text-bg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] hover:bg-fg/90",
            secondary: "glass-panel text-fg hover:text-fg",
            ghost: "glass-panel text-fg hover:text-fg",
            accent: "bg-accent text-bg hover:bg-accent/90"
        },
        size: {
            sm: "h-9 rounded-[10px] px-3 text-sm",
            md: "h-11 rounded-xl px-4 text-sm",
            lg: "h-12 rounded-[14px] px-5 text-[15px]"
        }
    },
    defaultVariants: {
        variant: "primary",
        size: "md"
    }
});
function Button({ className, variant, size, type = "button", ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Magnetic"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex max-w-full", className?.includes("w-full") && "w-full"),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: type,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
                variant,
                size
            }), className),
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/ui/button.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/axiom/directory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "classifyFiling",
    ()=>classifyFiling,
    "classifyTrade",
    ()=>classifyTrade,
    "isTradeKey",
    ()=>isTradeKey,
    "nicheForLead",
    ()=>nicheForLead,
    "nicheLabel",
    ()=>nicheLabel,
    "sortLeads",
    ()=>sortLeads
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-ssr] (ecmascript)");
;
;
/** Display names for the built-in niches. Directory labels match these first. */ const NICHE_LABELS = {
    guide: "Guide services",
    fitness: "Fitness coaching / Personal training",
    combat: "Combat sports",
    wellness: "Massage and bodywork",
    lessons: "Lessons and tutoring",
    salon: "Hair salon",
    beauty: "Nails, lashes, makeup",
    tattoo: "Tattoo shop",
    photo: "Photography",
    pets: "Pet grooming",
    music: "Music artist / Rapper",
    creator: "Cinematic Video and Content Creator",
    prompt: "AI prompt engineering and creation",
    entertainer: "Entertainer",
    events: "Events",
    landscaper: "Landscaper",
    foodtruck: "Mobile food truck",
    dogwalk: "Dog walking",
    detailer: "Mobile detailer",
    hunting: "Rugged Backcountry Services",
    therapy: "Physical therapy",
    bowtech: "Custom bow technician",
    contractor: "General contractor / Home services",
    clean: "Home cleaning",
    field: "Field service",
    locksmith: "Mobile locksmith",
    firewood: "Firewood cutting",
    security: "Private security",
    practice: "Clinic",
    counsel: "Advisor",
    location: "Barber",
    studio: "App studio",
    retail: "Retail / Merchandise",
    trade: "Your trade"
};
/** Directory phrases that mean one of the built-in niches. */ const ALIASES = {
    clinic: "practice",
    practice: "practice",
    "field service": "field",
    "auto repair": "field",
    "auto-repair": "field",
    "mobile mechanic": "field",
    "mobile mechanics": "field",
    events: "events",
    "app studio": "studio",
    barber: "location",
    barbershop: "location",
    "hair salon": "salon",
    salon: "salon",
    advisor: "counsel",
    counsel: "counsel",
    consulting: "counsel",
    "private security": "security",
    security: "security",
    "mobile locksmith": "locksmith",
    "mobile locksmiths": "locksmith",
    "combat sports": "combat",
    mma: "combat",
    firewood: "firewood",
    "firewood cutting": "firewood",
    cordwood: "firewood",
    landscaper: "landscaper",
    landscaping: "landscaper",
    "lawn care": "landscaper",
    "food truck": "foodtruck",
    foodtruck: "foodtruck",
    "mobile food truck": "foodtruck",
    "dog walking": "dogwalk",
    dogwalking: "dogwalk",
    "dog walker": "dogwalk",
    "mobile detailer": "detailer",
    "auto detailing": "detailer",
    "car detailing": "detailer",
    detailer: "detailer",
    "private hunting guide": "hunting",
    "hunting guide": "hunting",
    "hunting-guide": "hunting",
    "outdoor expeditions": "hunting",
    "outdoor-expeditions": "hunting",
    hunting: "hunting",
    "rugged backcountry services": "hunting",
    backcountry: "hunting",
    "physical therapy": "therapy",
    "physical therapist": "therapy",
    physiotherapy: "therapy",
    "custom bow technician": "bowtech",
    "bow technician": "bowtech",
    "bow tech": "bowtech",
    bowtech: "bowtech",
    "content creator": "creator",
    "content creation": "creator",
    "video editor": "creator",
    "content creator / video editor": "creator",
    "cinematic video and content creator": "creator",
    "ai prompt engineering and creation": "prompt",
    "prompt engineering": "prompt",
    "ai prompt": "prompt",
    entertainer: "entertainer",
    performer: "entertainer",
    "entertainer / performer": "entertainer",
    retail: "retail",
    merchandise: "retail",
    gear: "retail",
    ecommerce: "retail",
    "e-commerce": "retail"
};
const TRADE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
 * Filing titles and registry phrases. First match wins, so a specific craft
 * beats a trailing "Services". Exact niche labels and aliases are checked first.
 */ const KEYWORD_RULES = [
    {
        test: /\b(firewood|cordwood|fire wood)\b/i,
        niche: "firewood"
    },
    {
        test: /\b(landscap\w*|lawn(?:\s*care)?)\b/i,
        niche: "landscaper"
    },
    {
        test: /\b(food trucks?|foodtrucks?|mobile food|mobile kitchen)\b/i,
        niche: "foodtruck"
    },
    {
        test: /\b(dog walk\w*|dogwalk\w*|dog walkers?)\b/i,
        niche: "dogwalk"
    },
    {
        test: /\b((?:auto|mobile|car|vehicle)\s+detail\w*|detailers?)\b/i,
        niche: "detailer"
    },
    {
        test: /\b(locksmiths?|rekey|lockouts?|locks?)\b/i,
        niche: "locksmith"
    },
    {
        test: /\b(hvac|furnace|heat pumps?|air condition\w*|plumb\w*|electric\w*|wiring|roof\w*|drywall|fram(?:er|ing)|concrete|flooring|paint(?:er|ing|s)?|solar|septic|irrigat\w*|gutters?|shingles?|construction|home services|remodel\w*|carpent(?:er|ry)|contractors?)\b/i,
        niche: "contractor"
    },
    {
        test: /\b(handymen|handyman|handy man|mobile mechanics?|mobile services?|appliance|garage doors?|towing|pressure wash\w*|window clean\w*|junk removal|tree service|pest control|pool service|chimney|hauling|movers?|moving company)\b/i,
        niche: "field"
    },
    {
        test: /\b(pet groom\w*|pet sitt?\w*|dog train\w*)\b/i,
        niche: "pets"
    },
    {
        test: /\b(cater(?:ing|er)|event planners?)\b/i,
        niche: "events"
    },
    {
        test: /\b(massages?|bodywork)\b/i,
        niche: "wellness"
    },
    {
        test: /\b(tutors?|tutoring)\b/i,
        niche: "lessons"
    },
    {
        test: /\b(mma|martial arts|jiu-?jitsu|kickboxing|boxing)\b/i,
        niche: "combat"
    },
    {
        test: /\b(photographers?|photography|photo booth)\b/i,
        niche: "photo"
    },
    {
        test: /\btattoos?\b/i,
        niche: "tattoo"
    },
    {
        test: /\b(rappers?|recording artists?|music artists?)\b/i,
        niche: "music"
    },
    {
        test: /\b(prompt engineers?|prompt engineering|ai prompts?)\b/i,
        niche: "prompt"
    },
    {
        test: /\b(content creators?|video editors?|videographers?|video editing)\b/i,
        niche: "creator"
    },
    {
        test: /\b(entertainers?|performers?|magicians?|comedians?)\b/i,
        niche: "entertainer"
    },
    {
        test: /\b(house clean\w*|housekeeping|maid service|home cleaning|cleaners?)\b/i,
        niche: "clean"
    },
    {
        test: /\b(private security|security guards?|armed guards?)\b/i,
        niche: "security"
    },
    {
        test: /\b(custom bows?|bow techs?|bow technicians?|bowtech)\b/i,
        niche: "bowtech"
    },
    {
        test: /\b(backcountry|hunting)\b/i,
        niche: "hunting"
    },
    {
        test: /\b(physical therap\w*|physiotherap\w*|physio)\b/i,
        niche: "therapy"
    },
    {
        test: /\b(outfitters?|fishing guides?|guides?)\b/i,
        niche: "guide"
    },
    {
        test: /\b(bookkeep\w*|notary|advisors?|consult\w*)\b/i,
        niche: "counsel"
    },
    {
        test: /\b(lashes|lash tech|makeup|esthetician)\b/i,
        niche: "beauty"
    },
    {
        test: /\b(personal train\w*|fitness)\b/i,
        niche: "fitness"
    },
    {
        test: /\b(hair salons?|hairstylists?|hair stylists?)\b/i,
        niche: "salon"
    },
    {
        test: /\b(barbers?|barbershop)\b/i,
        niche: "location"
    },
    {
        test: /\b(boutiques?|merchandise|retail)\b/i,
        niche: "retail"
    },
    {
        test: /\bstudios?\b/i,
        niche: "studio"
    },
    {
        test: /\b(clinics?|medical practices?)\b/i,
        niche: "practice"
    },
    {
        test: /\bfield services?\b/i,
        niche: "field"
    },
    {
        test: /\bevents?\b/i,
        niche: "events"
    },
    {
        test: /\b(self[-\s]?employed|sole prop\w*|proprietors?)\b/i,
        niche: "trade"
    },
    {
        test: /\bservices?\b/i,
        niche: "field"
    }
];
function keywordNiche(label) {
    for (const rule of KEYWORD_RULES){
        if (rule.test.test(label)) return rule.niche;
    }
    return null;
}
/** A legal status or a bare "services" line, so the business title can still name the craft. */ function isGenericFiling(value) {
    return /^(services?|sole proprietors?|self[-\s]?employed|independent contractors?|general services|business services)$/i.test(value);
}
function nicheLabel(id) {
    if (id === "all") return "All trades";
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(id)) return NICHE_LABELS[id];
    return id.replace(/-/g, " ");
}
function classifyTrade(raw) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (label.length < 2) throw new Error("Trade is required");
    const key = label.toLowerCase();
    if (key === "all" || key === "all trades") throw new Error("Name the trade");
    const byId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(key) ? key : null;
    const byLabel = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOP_NICHES"].find((id)=>NICHE_LABELS[id].toLowerCase() === key) ?? null;
    const alias = ALIASES[key] ?? null;
    const niche = byId ?? byLabel ?? alias;
    if (niche) return {
        tradeType: niche,
        tradeLabel: NICHE_LABELS[niche],
        known: true
    };
    const fromKeyword = keywordNiche(label);
    if (fromKeyword) return {
        tradeType: fromKeyword,
        tradeLabel: label,
        known: true
    };
    const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["slugify"])(label);
    if (!TRADE_KEY.test(slug) || slug === "shop") throw new Error("Trade is required");
    return {
        tradeType: slug,
        tradeLabel: label,
        known: false
    };
}
function classifyFiling(name, trade) {
    const tradeText = trade.trim().replace(/\s+/g, " ").slice(0, 80);
    const nameText = name.trim().replace(/\s+/g, " ").slice(0, 80);
    if (tradeText && !isGenericFiling(tradeText)) {
        const hit = classifyTrade(tradeText);
        if (hit.known) return hit;
    }
    if (nameText && !isGenericFiling(nameText)) {
        try {
            const hit = classifyTrade(nameText);
            if (hit.known) return hit;
        } catch  {
        // The title was too short to be a trade. The filing line still counts.
        }
    }
    if (tradeText) return classifyTrade(tradeText);
    if (nameText) return classifyTrade(nameText);
    throw new Error("Trade is required");
}
function isTradeKey(value) {
    return value === "all" || TRADE_KEY.test(value) && value.length <= 48;
}
function nicheForLead(tradeType, tradeLabel = "") {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return tradeType;
    const label = tradeLabel.trim() || tradeType.replace(/-/g, " ");
    try {
        const classified = classifyTrade(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
    } catch  {
    // An empty or unnamed trade still gets a bookable shop.
    }
    return "trade";
}
function sortLeads(leads, sort) {
    const key = sort === "city" ? "city" : sort === "trade" ? "tradeLabel" : "businessName";
    return [
        ...leads
    ].sort((a, b)=>a[key].localeCompare(b[key], undefined, {
            sensitivity: "base"
        }));
}
}),
"[project]/src/lib/axiom/hero-films.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BROWSER_LOG_ORDER",
    ()=>BROWSER_LOG_ORDER,
    "HERO_MP4_FILES",
    ()=>HERO_MP4_FILES,
    "MASTER_TELEMETRY_KEY",
    ()=>MASTER_TELEMETRY_KEY,
    "NICHE_FILM_KEY",
    ()=>NICHE_FILM_KEY,
    "UNIVERSAL_FALLBACK",
    ()=>UNIVERSAL_FALLBACK,
    "applyBrowserFilmOverride",
    ()=>applyBrowserFilmOverride,
    "catalogChoices",
    ()=>catalogChoices,
    "filmMatchingText",
    ()=>filmMatchingText,
    "heroStem",
    ()=>heroStem,
    "heroTelemetryOrder",
    ()=>heroTelemetryOrder,
    "heroVideoList",
    ()=>heroVideoList,
    "isCatalogHeroUrl",
    ()=>isCatalogHeroUrl,
    "nextReelIndex",
    ()=>nextReelIndex,
    "readMasterTelemetry",
    ()=>readMasterTelemetry,
    "readNicheFilmOverride",
    ()=>readNicheFilmOverride,
    "readNicheOverrides",
    ()=>readNicheOverrides,
    "resolveNicheFilm",
    ()=>resolveNicheFilm,
    "scoreHeroFile",
    ()=>scoreHeroFile,
    "writeMasterTelemetry",
    ()=>writeMasterTelemetry,
    "writeNicheFilmOverride",
    ()=>writeNicheFilmOverride
]);
const HERO_MP4_FILES = [
    "admin-welcome.mp4",
    "aesthetic-master.mp4",
    "auto-repair.mp4",
    "clean.mp4",
    "contractors-hero.mp4",
    "custom-bow-tech-hero.mp4.mp4",
    "dogwalking.mp4",
    "employee-welcome.mp4",
    "entertainer.mp4",
    "events.mp4",
    "guide.mp4",
    "gunsmith-hero.mp4",
    "hunting-guide.mp4",
    "hvac-hero.mp4",
    "intro-welcome.mp4",
    "landscaper.mp4",
    "leopard.mp4",
    "lessons.mp4",
    "mobile-detailer.mp4",
    "mobile-foodtruck.mp4",
    "mobile-locksmith.mp4",
    "music-hero.mp4",
    "nails-lashes.mp4",
    "outdoor-master.mp4",
    "outreach-welcome.mp4",
    "petgroom.mp4",
    "photographer.mp4",
    "plumbers-hero.mp4.mp4",
    "private-security.mp4",
    "pro-drone-surveyer.mp4 (2).mp4",
    "salon.mp4",
    "snow-sports-lessons.mp4",
    "social-media-content-creator.mp4",
    "tattoo-hero.mp4",
    "tiger-deer.mp4",
    "trades-hero.mp4",
    "universal-fallback.mp4.mp4",
    "universals-fallback.mp4.mp4",
    "welding-trade.mp4",
    "wellness.mp4",
    "white-water-rafting.mp4",
    "wildlife-photographer.mp4"
];
const UNIVERSAL_FALLBACK = "/media/heroes/universal-fallback.mp4.mp4";
const MASTER_TELEMETRY_KEY = "axiom-master-telemetry";
const NICHE_FILM_KEY = "axiom-hero-niche-map";
const BROWSER_LOG_ORDER = [
    "GPU",
    "FRAME",
    "LINK",
    "AI engine"
];
const NICHE_PHRASES = {
    guide: [
        "guide",
        "white water rafting",
        "rafting"
    ],
    fitness: [
        "fitness",
        "tiger deer",
        "training"
    ],
    combat: [
        "combat"
    ],
    wellness: [
        "wellness",
        "massage"
    ],
    lessons: [
        "lessons",
        "snow sports lessons"
    ],
    salon: [
        "salon",
        "hair salon"
    ],
    beauty: [
        "nails lashes",
        "aesthetic",
        "lashes",
        "beauty"
    ],
    tattoo: [
        "tattoo hero",
        "tattoo",
        "tattooshop"
    ],
    photo: [
        "photo",
        "wildlife photographer",
        "photography"
    ],
    pets: [
        "petgroom",
        "pet groom",
        "grooming"
    ],
    music: [
        "music artist",
        "music"
    ],
    creator: [
        "content creator",
        "social media content creator",
        "creator"
    ],
    prompt: [
        "prompt"
    ],
    entertainer: [
        "entertainer"
    ],
    events: [
        "events",
        "event planner"
    ],
    landscaper: [
        "landscaper",
        "landscape"
    ],
    foodtruck: [
        "mobile foodtruck",
        "foodtruck",
        "food truck"
    ],
    dogwalk: [
        "dogwalking",
        "dog walking"
    ],
    detailer: [
        "mobile detailer",
        "detailer"
    ],
    hunting: [
        "hunting guide",
        "hunting",
        "outdoor master"
    ],
    therapy: [
        "physical therapist",
        "physicaltherapist",
        "therapy"
    ],
    bowtech: [
        "custom bow tech",
        "bow tech",
        "bowtech"
    ],
    contractor: [
        "contractors hero",
        "contractors",
        "contractor"
    ],
    clean: [
        "clean"
    ],
    field: [
        "auto repair",
        "auto hero",
        "mobile mechanic",
        "field"
    ],
    locksmith: [
        "mobile locksmith",
        "locksmith"
    ],
    firewood: [
        "firewood",
        "wood"
    ],
    security: [
        "private security",
        "security"
    ],
    practice: [
        "practice"
    ],
    counsel: [
        "counsel",
        "advisor"
    ],
    location: [
        "barbers hero",
        "barber hero",
        "barbers",
        "barber"
    ],
    studio: [
        "studio"
    ],
    retail: [
        "retail"
    ],
    trade: [
        "welding trade",
        "welding",
        "trade"
    ]
};
const SKIP = /\b(welcome|outreach|coastal|charging)\b/;
const FILLER = new Set([
    "hero",
    "master",
    "mobile",
    "custom",
    "loop"
]);
/** Named films win their niche even when another file scores as high. */ const NICHE_PRIORITY = {
    contractor: "contractors-hero.mp4",
    field: "auto-repair.mp4",
    photo: "photographer.mp4"
};
/** A business title uses these before the fuzzy score. Plumbing stays off the contractor reel. */ const TEXT_PRIORITY = [
    {
        pattern: /\bplumb(?:ing|ers|er)?\b/i,
        file: "plumbers-hero.mp4.mp4"
    },
    {
        pattern: /\bauto[\s-]*repair\b|\bmechanics?\b/i,
        file: "auto-repair.mp4"
    },
    {
        pattern: /\bbarbers?\b/i,
        file: "barbers-hero.mp4.mp4"
    },
    {
        pattern: /\b(?:hvac|roof(?:ing|ers|er)?|electric(?:al|ian|ians)?|air conditioning|contractors?)\b/i,
        file: "contractors-hero.mp4"
    }
];
function onDisk(file) {
    return HERO_MP4_FILES.includes(file);
}
function doubledMp4(file) {
    return /\.mp4\.mp4$/i.test(file);
}
function heroPath(file) {
    return `/media/heroes/${file}`;
}
function heroStem(file) {
    return file.toLowerCase().replace(/(\.mp4)+$/i, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function sharedPrefix(a, b) {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while(i < n && a.charCodeAt(i) === b.charCodeAt(i))i += 1;
    return i;
}
function scoreHeroFile(file, niche) {
    const stem = heroStem(file);
    if (!stem || SKIP.test(stem)) return 0;
    if (NICHE_PRIORITY[niche] === file) return 220;
    if (niche !== "trade" && /\b(fallback|universals?)\b/.test(stem)) return 0;
    let best = 0;
    for (const phrase of NICHE_PHRASES[niche]){
        const p = phrase.toLowerCase();
        if (stem === p) best = Math.max(best, 180);
        else if (stem.includes(p)) best = Math.max(best, 100 + p.length);
        else {
            for (const word of stem.split(" ")){
                if (FILLER.has(word)) continue;
                for (const pw of p.split(" ")){
                    if (FILLER.has(pw) || pw.length < 4 || word.length < 4) continue;
                    if (word === pw) best = Math.max(best, 150);
                    else if (sharedPrefix(word, pw) >= 6) best = Math.max(best, 80 + sharedPrefix(word, pw));
                }
            }
        }
    }
    if (best > 0 && best < 180 && /\b(hero|master)\b/.test(stem)) best += 4;
    return best;
}
/**
 * Niche film from the folder. A curated file stays when it already names the
 * niche. A new file replaces it only when the name is a clearer match.
 */ function preferFile(candidate, incumbent, score, bestScore) {
    if (score > bestScore) return true;
    if (score === 0 || score !== bestScore || !incumbent) return false;
    const sameStem = heroStem(candidate) === heroStem(incumbent);
    if (sameStem && doubledMp4(incumbent) && !doubledMp4(candidate)) return true;
    if (sameStem && doubledMp4(candidate) && !doubledMp4(incumbent)) return false;
    return candidate.length < incumbent.length;
}
function resolveNicheFilm(niche, curatedVideo = "") {
    const priority = NICHE_PRIORITY[niche];
    if (priority && onDisk(priority)) return heroPath(priority);
    let best = "";
    let bestScore = 0;
    for (const file of HERO_MP4_FILES){
        const score = scoreHeroFile(file, niche);
        if (preferFile(file, best, score, bestScore)) {
            bestScore = score;
            best = file;
        }
    }
    const curatedFile = curatedVideo.split("/").filter(Boolean).pop() ?? "";
    const curatedReady = curatedFile ? onDisk(curatedFile) : false;
    const curatedScore = curatedReady ? scoreHeroFile(curatedFile, niche) : 0;
    if (curatedReady && curatedScore >= 90 && curatedScore + 6 >= bestScore) {
        return curatedVideo.startsWith("/") ? curatedVideo : heroPath(curatedFile);
    }
    if (best && bestScore >= 100) return heroPath(best);
    if (curatedFile && !curatedReady) return UNIVERSAL_FALLBACK;
    return curatedVideo;
}
function wordRoot(word) {
    return word.replace(/(ing|ers|er|es|ed|s)$/i, "");
}
function wordsAgree(word, token) {
    if (word === token) return word.length >= 3;
    if (word.length < 4 || token.length < 4) return false;
    const a = wordRoot(word);
    const b = wordRoot(token);
    return a.length >= 4 && a === b;
}
function tokensJoin(tokens, word) {
    for(let i = 0; i < tokens.length; i += 1){
        let joined = "";
        for(let j = i; j < tokens.length && joined.length < word.length; j += 1){
            joined += tokens[j];
            if (joined === word) return true;
        }
    }
    return false;
}
function scoreText(hay, file) {
    const stem = heroStem(file);
    if (!stem || SKIP.test(stem) || /\b(fallback|universals?)\b/.test(stem)) return 0;
    const tokens = hay.split(/[^a-z0-9]+/).filter(Boolean);
    let score = 0;
    for (const word of stem.split(" ")){
        if (FILLER.has(word) || word.length < 3) continue;
        if (tokens.some((token)=>wordsAgree(word, token))) score += 80 + word.length;
        else if (word.length >= 5 && tokensJoin(tokens, word)) score += 110;
    }
    if (score > 0 && /\b(hero|master)\b/.test(stem)) score += 16;
    return score;
}
function filmMatchingText(text, current = "") {
    const hay = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (hay.length < 3) return null;
    for (const rule of TEXT_PRIORITY){
        if (!rule.pattern.test(hay) || !onDisk(rule.file)) continue;
        const url = heroPath(rule.file);
        return url === current ? null : url;
    }
    let best = "";
    let bestScore = 0;
    for (const file of HERO_MP4_FILES){
        const score = scoreText(hay, file);
        const heroBias = score + 12 >= bestScore && score >= 90 && /\b(hero|master)\b/.test(heroStem(file)) && best && !/\b(hero|master)\b/.test(heroStem(best));
        if (preferFile(file, best, score, bestScore) || heroBias) {
            bestScore = Math.max(bestScore, score);
            best = file;
        }
    }
    if (!best || bestScore < 90) return null;
    const currentFile = current.split("/").filter(Boolean).pop() ?? "";
    const currentScore = currentFile ? scoreText(hay, currentFile) : 0;
    if (bestScore < currentScore + 18) return null;
    return `/media/heroes/${best}`;
}
function heroVideoList(value) {
    const source = typeof value === "string" ? [
        value
    ] : value;
    if (!source) return [];
    const seen = new Set();
    const out = [];
    for (const item of source){
        if (typeof item !== "string") continue;
        const url = item.trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push(url);
    }
    return out;
}
function nextReelIndex(index, count) {
    if (count <= 1) return 0;
    const current = Number.isFinite(index) ? Math.trunc(index) : 0;
    return (current + count + 1) % count;
}
function isCatalogHeroUrl(url) {
    if (!url || !url.startsWith("/media/heroes/")) return false;
    const file = url.slice("/media/heroes/".length);
    return HERO_MP4_FILES.includes(file);
}
function catalogChoices(niche) {
    const ranked = HERO_MP4_FILES.map((file)=>({
            url: `/media/heroes/${file}`,
            label: heroStem(file),
            score: scoreHeroFile(file, niche)
        })).filter((row)=>row.score >= 70).sort((a, b)=>b.score - a.score || a.label.localeCompare(b.label));
    if (niche === "contractor") {
        const plumber = filmMatchingText("plumbing", ranked[0]?.url ?? "");
        if (plumber && !ranked.some((row)=>row.url === plumber)) {
            ranked.push({
                url: plumber,
                label: heroStem(plumber.split("/").pop() ?? plumber),
                score: 60
            });
        }
    }
    if (!ranked.some((row)=>row.url === UNIVERSAL_FALLBACK)) {
        ranked.push({
            url: UNIVERSAL_FALLBACK,
            label: "universal fallback",
            score: 0
        });
    }
    return ranked.slice(0, 8);
}
function readMasterTelemetry() {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = JSON.parse(localStorage.getItem(MASTER_TELEMETRY_KEY) || "[]");
        if (!Array.isArray(raw)) return [];
        return raw.filter((line)=>typeof line === "string").map((line)=>line.trim().slice(0, 80)).filter(Boolean).slice(0, 3);
    } catch  {
        return [];
    }
}
function writeMasterTelemetry(lines) {
    if (typeof localStorage === "undefined") return;
    const clean = lines.filter((line)=>typeof line === "string").map((line)=>line.trim().slice(0, 80)).filter(Boolean).slice(0, 3);
    localStorage.setItem(MASTER_TELEMETRY_KEY, JSON.stringify(clean));
}
function readNicheOverrides() {
    if (typeof localStorage === "undefined") return {};
    try {
        const raw = JSON.parse(localStorage.getItem(NICHE_FILM_KEY) || "{}");
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
        const out = {};
        for (const [niche, url] of Object.entries(raw)){
            if (typeof url === "string" && isCatalogHeroUrl(url)) out[niche] = url;
        }
        return out;
    } catch  {
        return {};
    }
}
function readNicheFilmOverride(niche) {
    return readNicheOverrides()[niche] ?? "";
}
function applyBrowserFilmOverride(heroVideoUrl, nicheFilm, override) {
    const list = heroVideoList(heroVideoUrl);
    const primary = list[0] ?? null;
    if (override && primary && primary === nicheFilm) return override;
    if (list.length > 1) return list;
    return primary;
}
function heroTelemetryOrder(masterLines) {
    const saved = masterLines.map((line)=>line.trim().slice(0, 80)).filter(Boolean).slice(0, 3);
    return [
        ...saved,
        ...BROWSER_LOG_ORDER
    ];
}
function writeNicheFilmOverride(niche, url) {
    if (typeof localStorage === "undefined") return;
    const current = readNicheOverrides();
    if (!url || url === "default") delete current[niche];
    else if (isCatalogHeroUrl(url)) current[niche] = url;
    localStorage.setItem(NICHE_FILM_KEY, JSON.stringify(current));
}
}),
"[project]/src/lib/axiom/hero-motion.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EMPTY_HERO_MOTION",
    ()=>EMPTY_HERO_MOTION,
    "HERO_MOTIONS",
    ()=>HERO_MOTIONS,
    "heroMotionPreview",
    ()=>heroMotionPreview,
    "heroPresetLabel",
    ()=>heroPresetLabel,
    "parseHeroMotion",
    ()=>parseHeroMotion,
    "planLiveHero",
    ()=>planLiveHero
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/particle-brand.ts [app-ssr] (ecmascript)");
;
;
const HERO_MOTIONS = [
    {
        id: "pan",
        label: "3D Cinematic Pan"
    },
    {
        id: "ripple",
        label: "Water Ripple Lake Glass"
    },
    {
        id: "neon",
        label: "Neon Edge Glow"
    },
    {
        id: "particle",
        label: "Particle Swipe Reveal"
    }
];
const EMPTY_HERO_MOTION = {
    pan: false,
    ripple: false,
    neon: false,
    particle: false
};
const PRESET_LABELS = {
    field: "Auto Repair",
    landscaper: "Landscaping",
    contractor: "Trades",
    fitness: "Fitness",
    wellness: "Wellness",
    lessons: "Lessons",
    salon: "Salon",
    beauty: "Beauty",
    tattoo: "Tattoo",
    photo: "Photo",
    pets: "Pets",
    dogwalk: "Dog walking",
    detailer: "Auto detail",
    therapy: "Therapy",
    clean: "Cleaning",
    locksmith: "Locksmith",
    firewood: "Firewood",
    security: "Security",
    practice: "Practice",
    counsel: "Counsel",
    events: "Events",
    location: "Barber",
    hunting: "Hunting",
    creator: "Cinema"
};
function heroPresetLabel(niche, fallback) {
    const label = PRESET_LABELS[niche];
    return label || fallback.trim() || niche;
}
function parseHeroMotion(raw) {
    const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
        pan: record.pan === true,
        ripple: record.ripple === true,
        neon: record.neon === true,
        particle: record.particle === true
    };
}
function heroMotionPreview(business, fallback, video, image) {
    const brand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twoWordBrand"])(business, fallback);
    const film = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(video) ? video : "";
    const still = image.startsWith("/media/heroes/") && !image.includes("..") ? image : "";
    return {
        ...brand,
        mediaUrl: film || still,
        kind: film ? "video" : "image"
    };
}
function planLiveHero(draft, motion) {
    const clean = parseHeroMotion(motion);
    const plan = {
        uploadVideo: draft.upload === "video",
        glowEnabled: clean.neon,
        motion: clean,
        mediaPath: ""
    };
    if (clean.pan) plan.introPreset = "cinematic-pan";
    if (draft.upload === "video") {
        plan.mediaPath = "upload";
        return plan;
    }
    if (draft.upload === "image") {
        plan.heroImageUrl = "upload";
        plan.mediaPath = "upload";
        return plan;
    }
    const video = draft.catalogVideo.trim();
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(video)) {
        plan.catalogFilm = video;
        plan.mediaPath = video;
        return plan;
    }
    const image = draft.catalogImage.trim();
    if (image.startsWith("/media/heroes/") && !image.includes("..")) {
        plan.heroImageUrl = image;
        plan.mediaPath = image;
    }
    return plan;
}
}),
"[project]/src/lib/axiom/hero-video.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HERO_VIDEO_MAX_BYTES",
    ()=>HERO_VIDEO_MAX_BYTES,
    "heroVideoPath",
    ()=>heroVideoPath,
    "isCustomHeroVideo",
    ()=>isCustomHeroVideo,
    "isMp4",
    ()=>isMp4,
    "shopHeroVideoPath",
    ()=>shopHeroVideoPath,
    "shopIdFromHeroPath",
    ()=>shopIdFromHeroPath
]);
const HERO_VIDEO_MAX_BYTES = 12 * 1024 * 1024;
function isMp4(bytes) {
    if (bytes.byteLength < 12 || bytes.byteLength > HERO_VIDEO_MAX_BYTES) return false;
    return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
}
function isCustomHeroVideo(url) {
    return typeof url === "string" && url.startsWith("/api/hero-video/");
}
function heroVideoPath(shopId, version) {
    return `/api/hero-video/${shopId}?v=${version}`;
}
function shopHeroVideoPath(shopId, version) {
    const path = heroVideoPath(shopId, version);
    if (!path.startsWith(`/api/hero-video/${shopId}`) || path.includes("/media/")) {
        throw new Error("Shop films stay on this shop");
    }
    return path;
}
function shopIdFromHeroPath(pathname) {
    const id = pathname.split("/").filter(Boolean).pop() ?? "";
    return /^shop_[a-zA-Z0-9]+$/.test(id) ? id : null;
}
}),
"[project]/src/lib/axiom/media.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NICHE_MEDIA",
    ()=>NICHE_MEDIA,
    "PHOTO_REELS",
    ()=>PHOTO_REELS,
    "SHARED_STAFF",
    ()=>SHARED_STAFF,
    "cleanCustomNiche",
    ()=>cleanCustomNiche,
    "heroForCustomNiche",
    ()=>heroForCustomNiche,
    "isOutdoorGuideNiche",
    ()=>isOutdoorGuideNiche,
    "leadHeroFor",
    ()=>leadHeroFor,
    "nicheFilmCatalog",
    ()=>nicheFilmCatalog,
    "resolveHeroMedia",
    ()=>resolveHeroMedia
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/directory.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-video.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-ssr] (ecmascript)");
;
;
;
;
const SHARED_STAFF = [
    "/media/alex-morgan.jpg",
    "/media/willa-grant.jpg"
];
const PHOTO_REELS = [
    "/media/heroes/wildlife-photographer.mp4",
    "/media/heroes/photographer.mp4",
    "/media/heroes/outdoor-master.mp4"
];
/** One asset per curated niche. Video when a film is the strongest file on disk. */ const CURATED_HERO = {
    fitness: {
        video: "/media/heroes/tiger-deer.mp4",
        label: "Training loop · tiger-deer.mp4",
        preset: "zoomin",
        speed: 36,
        intensity: 48,
        blend: 60
    },
    wellness: {
        video: "/media/heroes/wellness.mp4",
        label: "Wellness loop · wellness.mp4",
        preset: "fade",
        speed: 24,
        intensity: 36,
        blend: 70
    },
    lessons: {
        video: "/media/heroes/lessons.mp4",
        label: "Lessons loop · lessons.mp4",
        preset: "pantd",
        speed: 28,
        intensity: 34,
        blend: 60
    },
    salon: {
        video: "/media/heroes/salon.mp4",
        label: "Salon loop · salon.mp4",
        preset: "panlr",
        speed: 32,
        intensity: 40,
        blend: 58
    },
    beauty: {
        video: "/media/heroes/nails-lashes.mp4",
        label: "Beauty loop · nails-lashes.mp4",
        preset: "kenburns",
        speed: 36,
        intensity: 42,
        blend: 62
    },
    tattoo: {
        video: "/media/heroes/tattoo-hero.mp4",
        label: "Tattoo loop · tattoo-hero.mp4",
        preset: "panlr",
        speed: 28,
        intensity: 50,
        blend: 58
    },
    photo: {
        video: PHOTO_REELS,
        label: "Photo reel · wildlife, photographer, outdoor",
        preset: "zoomin",
        speed: 34,
        intensity: 48,
        blend: 64
    },
    pets: {
        video: "/media/heroes/petgroom.mp4",
        label: "Groom loop · petgroom.mp4",
        preset: "panlr",
        speed: 30,
        intensity: 38,
        blend: 58
    },
    landscaper: {
        video: "/media/heroes/landscaper.mp4",
        label: "Yard loop · landscaper.mp4",
        preset: "pantd",
        speed: 26,
        intensity: 40,
        blend: 56,
        tone: "site"
    },
    dogwalk: {
        video: "/media/heroes/dogwalking.mp4",
        label: "Walk loop · dogwalking.mp4",
        preset: "panlr",
        speed: 28,
        intensity: 40,
        blend: 58,
        tone: "site"
    },
    detailer: {
        video: "/media/heroes/mobile-detailer.mp4",
        label: "Detail loop · mobile-detailer.mp4",
        preset: "panlr",
        speed: 28,
        intensity: 42,
        blend: 58,
        tone: "site"
    },
    therapy: {
        video: "/media/heroes/physicaltherapist.mp4",
        label: "Session loop · physicaltherapist.mp4",
        preset: "kenburns",
        speed: 30,
        intensity: 40,
        blend: 66
    },
    contractor: {
        video: "/media/heroes/trades-hero.mp4",
        label: "Site loop · trades-hero.mp4",
        preset: "zoomin",
        speed: 30,
        intensity: 38,
        blend: 56,
        tone: "site"
    },
    clean: {
        video: "/media/heroes/clean.mp4",
        label: "Clean loop · clean.mp4",
        preset: "zoomout",
        speed: 26,
        intensity: 36,
        blend: 56
    },
    field: {
        video: "/media/heroes/auto-hero.mp4",
        label: "Field loop · auto-hero.mp4",
        preset: "panlr",
        speed: 30,
        intensity: 44,
        blend: 64,
        tone: "site"
    },
    locksmith: {
        video: "/media/heroes/mobile-locksmith.mp4",
        label: "Van loop · mobile-locksmith.mp4",
        preset: "panlr",
        speed: 28,
        intensity: 42,
        blend: 58,
        tone: "site"
    },
    firewood: {
        video: "/media/heroes/wood.mp4",
        label: "Wood loop · wood.mp4",
        preset: "kenburns",
        speed: 30,
        intensity: 40,
        blend: 58,
        tone: "site"
    },
    security: {
        video: "/media/heroes/private-security.mp4",
        label: "Post loop · private-security.mp4",
        preset: "kenburns",
        speed: 30,
        intensity: 42,
        blend: 60
    },
    practice: {
        image: "/media/heroes/practice.jpg",
        label: "Practice still",
        preset: "kenburns",
        speed: 30,
        intensity: 40,
        blend: 66
    },
    counsel: {
        video: "/media/heroes/counsel.mp4",
        label: "Counsel loop · counsel.mp4",
        preset: "fade",
        speed: 22,
        intensity: 32,
        blend: 72
    },
    location: {
        video: "/media/heroes/barber-hero.mp4",
        label: "Barber loop · barber-hero.mp4",
        preset: "kenburns",
        speed: 34,
        intensity: 46,
        blend: 58
    },
    events: {
        image: "/media/heroes/events.jpg",
        label: "Events still · events.jpg",
        preset: "kenburns",
        speed: 28,
        intensity: 42,
        blend: 62
    },
    hunting: {
        video: "/media/heroes/hunting-guide.mp4",
        label: "Verified · hunting-guide.mp4",
        preset: "zoomin",
        speed: 28,
        intensity: 42,
        blend: 64,
        tone: "backcountry"
    },
    creator: {
        video: "/media/heroes/leopard.mp4",
        label: "Cinema loop · leopard.mp4",
        preset: "kenburns",
        speed: 34,
        intensity: 46,
        blend: 62,
        tone: "cinema"
    }
};
const TRADE_HERO = {
    video: "/media/heroes/welding-trade.mp4",
    label: "Trade loop · welding-trade.mp4",
    preset: "zoomin",
    speed: 32,
    intensity: 40,
    blend: 58,
    tone: "site"
};
function filmFrom(spec) {
    const videos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(spec.video);
    return {
        heroImageUrl: spec.image ?? "",
        heroVideoUrl: videos[0] ?? "",
        heroVideos: videos,
        loopLabel: spec.label,
        introPreset: spec.preset,
        introSpeed: spec.speed,
        introIntensity: spec.intensity,
        heroBlendPercent: spec.blend,
        tone: spec.tone,
        staff: SHARED_STAFF
    };
}
function filmFor(niche) {
    const spec = niche === "trade" ? TRADE_HERO : CURATED_HERO[niche];
    const base = spec ?? TRADE_HERO;
    const listed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(spec?.video);
    if (listed.length > 1) {
        const ready = listed.filter((url)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(url));
        const videos = ready.length > 0 ? ready : [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNIVERSAL_FALLBACK"]
        ];
        return filmFrom({
            ...base,
            image: spec?.image,
            video: videos,
            label: spec && ready.length === listed.length ? spec.label : base.label
        });
    }
    const resolved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveNicheFilm"])(niche, listed[0] ?? "");
    const video = resolved || (spec ? listed[0] ?? "" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(TRADE_HERO.video)[0] ?? "");
    const file = video.split("/").pop() ?? "";
    const label = spec && (spec.video ?? "") === video ? spec.label : file ? `${file.replace(/(\.mp4)+$/i, "").replace(/-/g, " ")} film` : base.label;
    return filmFrom({
        ...base,
        image: spec?.image,
        video,
        label
    });
}
const NICHE_MEDIA = {
    guide: filmFor("guide"),
    fitness: filmFor("fitness"),
    combat: filmFor("combat"),
    wellness: filmFor("wellness"),
    lessons: filmFor("lessons"),
    salon: filmFor("salon"),
    beauty: filmFor("beauty"),
    tattoo: filmFor("tattoo"),
    photo: filmFor("photo"),
    pets: filmFor("pets"),
    music: filmFor("music"),
    creator: filmFor("creator"),
    prompt: filmFor("prompt"),
    entertainer: filmFor("entertainer"),
    events: filmFor("events"),
    landscaper: filmFor("landscaper"),
    foodtruck: filmFor("foodtruck"),
    dogwalk: filmFor("dogwalk"),
    detailer: filmFor("detailer"),
    hunting: filmFor("hunting"),
    therapy: filmFor("therapy"),
    bowtech: filmFor("bowtech"),
    contractor: filmFor("contractor"),
    clean: filmFor("clean"),
    field: filmFor("field"),
    locksmith: filmFor("locksmith"),
    firewood: filmFor("firewood"),
    security: filmFor("security"),
    practice: filmFor("practice"),
    counsel: filmFor("counsel"),
    location: filmFor("location"),
    studio: filmFor("studio"),
    retail: filmFor("retail"),
    trade: filmFor("trade")
};
function nicheFilmCatalog() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOP_NICHES"].map((niche)=>{
        const film = NICHE_MEDIA[niche];
        return {
            niche,
            videoUrl: film.heroVideoUrl,
            file: film.heroVideoUrl.split("/").pop() || "still",
            label: film.loopLabel
        };
    });
}
function cleanCustomNiche(value) {
    return value.replace(/[\u0000-\u001f]/g, "").trim().replace(/\s+/g, " ").slice(0, 80);
}
function withSpecificFilm(film, text) {
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filmMatchingText"])(text, film.heroVideoUrl);
    if (!match || film.heroVideos.includes(match)) return film;
    const file = match.split("/").pop() ?? "film";
    return {
        ...film,
        heroVideoUrl: match,
        heroVideos: [
            match
        ],
        loopLabel: `${file.replace(/(\.mp4)+$/i, "").replace(/-/g, " ")} film`
    };
}
function heroForCustomNiche(title) {
    const label = cleanCustomNiche(title);
    if (label.length < 2) return NICHE_MEDIA.trade;
    try {
        const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["classifyTrade"])(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) {
            return withSpecificFilm(NICHE_MEDIA[classified.tradeType], label);
        }
    } catch  {
    // A short or unnamed title keeps the stock film.
    }
    return withSpecificFilm(NICHE_MEDIA.trade, label);
}
const OUTDOOR_GUIDE_KEYS = new Set([
    "hunting",
    "hunting-guide",
    "outdoor-expeditions"
]);
function isOutdoorGuideNiche(value) {
    const key = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
    if (OUTDOOR_GUIDE_KEYS.has(key)) return true;
    return /\b(hunting[-\s]?guides?|outdoor[-\s]?expeditions?)\b/i.test(value);
}
function leadHeroFor(tradeType, businessName, category = "") {
    const named = [
        businessName,
        category
    ].filter((part)=>part && part.trim()).join(" ");
    const text = named || tradeType.replace(/-/g, " ");
    if (isOutdoorGuideNiche(tradeType) || isOutdoorGuideNiche(category)) return NICHE_MEDIA.hunting;
    const fromName = classifyQuiet(businessName);
    if (fromName && fromName !== "trade") return withSpecificFilm(NICHE_MEDIA[fromName], text);
    const fromCategory = classifyQuiet(category) ?? classifyQuiet(tradeType.replace(/-/g, " "));
    if (fromCategory) return withSpecificFilm(NICHE_MEDIA[fromCategory], text);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return withSpecificFilm(NICHE_MEDIA[tradeType], text);
    return withSpecificFilm(NICHE_MEDIA.trade, text);
}
function classifyQuiet(label) {
    const clean = cleanCustomNiche(label);
    if (clean.length < 2) return null;
    try {
        const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["classifyTrade"])(clean);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
    } catch  {
        return null;
    }
    return null;
}
function isPinnedCatalog(url, niche) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(url) || !url) return false;
    const media = NICHE_MEDIA[niche];
    if (media?.heroVideos.includes(url) || url === NICHE_MEDIA.trade.heroVideoUrl) return false;
    const spec = niche === "trade" ? TRADE_HERO : CURATED_HERO[niche];
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(spec?.video).includes(url)) return false;
    return true;
}
function resolveHeroMedia(shop) {
    const customTitle = cleanCustomNiche(shop.customNiche ?? "");
    const media = customTitle ? heroForCustomNiche(customTitle) : NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.trade;
    const stillUrl = shop.heroImageUrl ?? "";
    const customStill = stillUrl.startsWith("data:");
    const customVideo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCustomHeroVideo"])(shop.heroVideoUrl);
    if (customVideo) {
        return {
            imageUrl: customStill ? stillUrl : media.heroImageUrl,
            videoUrl: shop.heroVideoUrl,
            videos: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(shop.heroVideoUrl),
            tone: media.tone ?? null,
            loopLabel: "Custom loop · this shop"
        };
    }
    if (customStill) {
        return {
            imageUrl: stillUrl,
            videoUrl: null,
            videos: [],
            tone: media.tone ?? null,
            loopLabel: "Custom still · niche loop hidden"
        };
    }
    if (isPinnedCatalog(shop.heroVideoUrl, shop.niche)) {
        const file = String(shop.heroVideoUrl).split("/").pop() ?? "film";
        return {
            imageUrl: media.heroImageUrl,
            videoUrl: shop.heroVideoUrl,
            videos: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["heroVideoList"])(shop.heroVideoUrl),
            tone: media.tone ?? null,
            loopLabel: `Catalog film · ${file}`
        };
    }
    return {
        imageUrl: media.heroImageUrl,
        videoUrl: media.heroVideoUrl || null,
        videos: media.heroVideos,
        tone: media.tone ?? null,
        loopLabel: media.loopLabel
    };
}
}),
"[project]/src/lib/axiom/menu.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultUnit",
    ()=>defaultUnit,
    "insertRow",
    ()=>insertRow,
    "moveRow",
    ()=>moveRow,
    "moveSection",
    ()=>moveSection,
    "nextSectionName",
    ()=>nextSectionName,
    "renameSection",
    ()=>renameSection,
    "sectionsOf",
    ()=>sectionsOf,
    "unitsForTemplate",
    ()=>unitsForTemplate
]);
function unitsForTemplate(declared) {
    if (declared?.length) return [
        ...declared
    ];
    return [
        "flat"
    ];
}
function defaultUnit(units) {
    return units.find((unit)=>unit !== "flat") ?? units[0] ?? "flat";
}
function sectionsOf(rows) {
    const sections = [];
    rows.forEach((row, index)=>{
        const last = sections[sections.length - 1];
        if (last && last.label === row.group) last.count += 1;
        else sections.push({
            label: row.group,
            start: index,
            count: 1
        });
    });
    return sections;
}
function renameSection(rows, start, count, name) {
    const end = start + count;
    return rows.map((row, index)=>index >= start && index < end ? {
            ...row,
            group: name
        } : row);
}
function moveRow(rows, index, direction) {
    const next = index + direction;
    if (index < 0 || next < 0 || next >= rows.length) return rows;
    const moving = rows[index];
    const neighbor = rows[next];
    const relocated = moving.group === neighbor.group ? moving : {
        ...moving,
        group: neighbor.group
    };
    const copy = rows.slice();
    copy[index] = neighbor;
    copy[next] = relocated;
    return copy;
}
function moveSection(rows, sectionIndex, direction) {
    const sections = sectionsOf(rows);
    const current = sections[sectionIndex];
    const otherIndex = sectionIndex + direction;
    const other = sections[otherIndex];
    if (!current || !other) return rows;
    const currentRows = rows.slice(current.start, current.start + current.count);
    const otherRows = rows.slice(other.start, other.start + other.count);
    const [first, second] = direction < 0 ? [
        currentRows,
        otherRows
    ] : [
        otherRows,
        currentRows
    ];
    const start = Math.min(current.start, other.start);
    const end = Math.max(current.start + current.count, other.start + other.count);
    return [
        ...rows.slice(0, start),
        ...first,
        ...second,
        ...rows.slice(end)
    ];
}
function insertRow(rows, index, row) {
    const at = Math.max(0, Math.min(index, rows.length));
    return [
        ...rows.slice(0, at),
        row,
        ...rows.slice(at)
    ];
}
function nextSectionName(labels) {
    const base = "New section";
    if (!labels.includes(base)) return base;
    let n = 2;
    while(labels.includes(`${base} ${n}`))n += 1;
    return `${base} ${n}`;
}
}),
"[project]/src/lib/axiom/niches.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_HOURS",
    ()=>DEFAULT_HOURS,
    "NICHES",
    ()=>NICHES,
    "NICHE_ORDER",
    ()=>NICHE_ORDER,
    "PRICE_UNIT_LABEL",
    ()=>PRICE_UNIT_LABEL,
    "PUBLIC_NICHE_ORDER",
    ()=>PUBLIC_NICHE_ORDER,
    "RING_PRESETS",
    ()=>RING_PRESETS,
    "WEEKDAYS",
    ()=>WEEKDAYS,
    "defaultPriceUnit",
    ()=>defaultPriceUnit,
    "formatDuration",
    ()=>formatDuration,
    "formatOffer",
    ()=>formatOffer,
    "formatPrice",
    ()=>formatPrice,
    "isPublicNiche",
    ()=>isPublicNiche,
    "nicheCopy",
    ()=>nicheCopy,
    "priceUnitsFor",
    ()=>priceUnitsFor,
    "serviceGroups",
    ()=>serviceGroups,
    "shopTradeLabel",
    ()=>shopTradeLabel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/menu.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const RING_PRESETS = [
    {
        name: "Teal",
        value: "#2EE6D6"
    },
    {
        name: "Copper",
        value: "#E7B48A"
    },
    {
        name: "Steel",
        value: "#7EC8E3"
    },
    {
        name: "Ember",
        value: "#E07A73"
    },
    {
        name: "Gold",
        value: "#C9A227"
    },
    {
        name: "Violet",
        value: "#B388FF"
    }
];
const NICHE_ORDER = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOP_NICHES"]
];
const PUBLIC_NICHE_ORDER = [
    "fitness",
    "wellness",
    "lessons",
    "salon",
    "beauty",
    "tattoo",
    "photo",
    "pets",
    "landscaper",
    "dogwalk",
    "detailer",
    "therapy",
    "contractor",
    "clean",
    "field",
    "locksmith",
    "firewood",
    "security",
    "practice",
    "counsel",
    "events",
    "location",
    "hunting",
    "creator"
];
function isPublicNiche(value) {
    return PUBLIC_NICHE_ORDER.includes(value);
}
const NICHES = {
    guide: {
        niche: "guide",
        label: "Guide services",
        kicker: "They book the boat",
        blurb: "A shared seat or a private boat — the put-in on a calendar.",
        defaultName: "Glass Eddy",
        tagline: "The boat leaves when you do.",
        description: "Shared seats and private boats on the same stretch. The price covers the guide, the gear, and the shuttle back.",
        address: "New Era · put-in at the bridge",
        ringColor: "#7EC8E3",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introIntensity,
        primaryServiceIndex: 0,
        priceUnits: [
            "flat",
            "person",
            "boat"
        ],
        hours: {
            mon: "closed",
            tue: "07:00-16:00",
            wed: "07:00-16:00",
            thu: "07:00-16:00",
            fri: "07:00-16:00",
            sat: "07:00-16:00",
            sun: "07:00-15:00"
        },
        services: [
            {
                group: "Shared",
                name: "Morning half-day",
                description: "Class II. Paddle, vest, and the shuttle back. Six seats on the boat.",
                durationMin: 240,
                priceCents: 9500,
                priceUnit: "person"
            },
            {
                group: "Shared",
                name: "Full-day canyon",
                description: "The long line. Lunch on the gravel. Gear included.",
                durationMin: 480,
                priceCents: 16500,
                priceUnit: "person"
            },
            {
                group: "Private",
                name: "Private half-day",
                description: "Your group only. Up to six. Same water, no other boat.",
                durationMin: 240,
                priceCents: 52000,
                priceUnit: "boat"
            },
            {
                group: "Private",
                name: "Private full-day",
                description: "The canyon for one group. Lunch, gear, and the shuttle.",
                durationMin: 480,
                priceCents: 88000,
                priceUnit: "boat"
            }
        ],
        employees: [
            {
                displayName: "Willa Grant",
                title: "Lead guide",
                bio: "Reads the line before the boat does. Shared mornings and the private days.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2,
                    3
                ]
            },
            {
                displayName: "Theo Marsh",
                title: "Guide",
                bio: "The early put-in. He runs the half-day and the boats that want a quiet canyon.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ],
        portfolio: []
    },
    fitness: {
        niche: "fitness",
        label: "Fitness coaching / Personal training",
        kicker: "They book the session",
        blurb: "An assessment, a one-to-one hour, or a small group — the floor on a calendar.",
        defaultName: "Form Room",
        tagline: "Show up. We count the rest.",
        description: "Personal training and small groups in New Era. Book the hour, not a guess.",
        address: "New Era · the floor opens at six",
        ringColor: "#E07A73",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introIntensity,
        primaryServiceIndex: 1,
        hours: {
            mon: "06:00-19:00",
            tue: "06:00-19:00",
            wed: "06:00-19:00",
            thu: "06:00-19:00",
            fri: "06:00-19:00",
            sat: "07:00-13:00",
            sun: "closed"
        },
        services: [
            {
                group: "Assess",
                name: "Intro assessment",
                description: "How you move, what hurts, and the first block of work.",
                durationMin: 45,
                priceCents: 8000
            },
            {
                group: "Train",
                name: "Personal training",
                description: "One coach, one hour, the program you are actually on.",
                durationMin: 60,
                priceCents: 12000
            },
            {
                group: "Train",
                name: "Small group",
                description: "Four people. The same hour, a shared floor.",
                durationMin: 50,
                priceCents: 4000
            }
        ],
        employees: [
            {
                displayName: "Nina Voss",
                title: "Head coach",
                bio: "Strength first. She writes the block and stays for the ugly reps.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            },
            {
                displayName: "Calvin Brooks",
                title: "Coach",
                bio: "Small groups and the people who would rather not train alone.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ],
        portfolio: []
    },
    music: {
        niche: "music",
        label: "Music artist / Rapper",
        kicker: "They book the night",
        blurb: "A release, a session, or the show itself — the booth and the room on one calendar.",
        defaultName: "Lowlight",
        tagline: "The record, then the room.",
        description: "Studio time and live sets out of New Era. Book the booth, the mix, or the night.",
        address: "New Era · books after two",
        ringColor: "#B388FF",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introIntensity,
        primaryServiceIndex: 2,
        hours: {
            mon: "closed",
            tue: "14:00-22:00",
            wed: "14:00-22:00",
            thu: "14:00-22:00",
            fri: "14:00-22:00",
            sat: "12:00-20:00",
            sun: "closed"
        },
        services: [
            {
                group: "Release",
                name: "Single rollout",
                description: "Artwork, the date, and the posts that go with the drop.",
                durationMin: 60,
                priceCents: 35000
            },
            {
                group: "Release",
                name: "Mix + master",
                description: "One song. Notes back in the same sitting.",
                durationMin: 90,
                priceCents: 28000
            },
            {
                group: "Booth",
                name: "Studio session",
                description: "Booth time with an engineer. Two songs, or one until it sits right.",
                durationMin: 120,
                priceCents: 40000
            },
            {
                group: "Booth",
                name: "Feature verse",
                description: "Write and record a verse on your record.",
                durationMin: 75,
                priceCents: 50000
            },
            {
                group: "Stage",
                name: "Live set",
                description: "Book the show. A room, a set length, and the night.",
                durationMin: 45,
                priceCents: 80000
            }
        ],
        employees: [
            {
                displayName: "Mara Quinn",
                title: "Artist",
                bio: "Writes in the booth and holds the room when the lights drop.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2,
                    3,
                    4
                ]
            },
            {
                displayName: "Ellis Ward",
                title: "Engineer",
                bio: "Runs the desk. The mix comes back before you leave the block.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ],
        portfolio: []
    },
    contractor: {
        niche: "contractor",
        label: "General contractor / Home services",
        kicker: "They book the job",
        blurb: "A consult, a measure, or the start day — home work with a scope you can read.",
        defaultName: "Hearth Line",
        tagline: "Walk the house. Then we build.",
        description: "Kitchens, repairs, and the rooms that need a real start day. New Era, and about twenty miles out.",
        address: "New Era · jobs within 20 miles",
        ringColor: "#C9A227",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introIntensity,
        primaryServiceIndex: 0,
        hours: {
            mon: "07:30-16:30",
            tue: "07:30-16:30",
            wed: "07:30-16:30",
            thu: "07:30-16:30",
            fri: "07:30-16:30",
            sat: "08:00-13:00",
            sun: "closed"
        },
        services: [
            {
                group: "Consult",
                name: "Project consultation",
                description: "Walk the house. Leave with a scope and a number.",
                durationMin: 60,
                priceCents: 15000
            },
            {
                group: "Consult",
                name: "Site measure",
                description: "Rooms, openings, and the list the crew actually builds from.",
                durationMin: 90,
                priceCents: 20000
            },
            {
                group: "Build",
                name: "Repair call",
                description: "One problem. A leak, a door, a stair that moves.",
                durationMin: 120,
                priceCents: 28000
            },
            {
                group: "Build",
                name: "Start day",
                description: "The first day on a room. The rest of the job is quoted from the consult.",
                durationMin: 240,
                priceCents: 65000
            }
        ],
        employees: [
            {
                displayName: "Lena Cho",
                title: "General contractor",
                bio: "Scopes the job in plain language, then stays on it until the punch list is short.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    3
                ]
            },
            {
                displayName: "Owen Briggs",
                title: "Lead carpenter",
                bio: "Cabinets, stairs, and the repairs that should have been done last year.",
                avatarUrl: "",
                serviceIndexes: [
                    2,
                    3
                ]
            }
        ],
        portfolio: []
    },
    tattoo: {
        niche: "tattoo",
        label: "Tattoo shop",
        kicker: "They book the chair",
        blurb: "A consult, a small piece, or a session — the book instead of a walk-in.",
        defaultName: "Iron Ledger",
        tagline: "Draw it. Then sit for it.",
        description: "A two-artist shop. Book the consult, then the session. Flash and custom, on the calendar.",
        address: "New Era · walk in only if the book is open",
        ringColor: "#E07A73",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introIntensity,
        services: [
            {
                group: "Consult",
                name: "Consult",
                description: "Placement, size, and a date for the work.",
                durationMin: 30,
                priceCents: 4000
            },
            {
                group: "Chair",
                name: "Small piece",
                description: "One sitting. Flash or a simple custom.",
                durationMin: 90,
                priceCents: 18000
            },
            {
                group: "Chair",
                name: "Session",
                description: "A longer sitting on a piece already drawn.",
                durationMin: 180,
                priceCents: 45000
            }
        ],
        employees: [
            {
                displayName: "Rio Hale",
                title: "Lead artist",
                bio: "Linework and the pieces that take more than one afternoon.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Sam Ortega",
                title: "Artist",
                bio: "Small work, flash, and the consult that turns into a drawing.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ],
        portfolio: []
    },
    location: {
        niche: "location",
        label: "Barber",
        kicker: "They come to you",
        blurb: "A chair, a fade, a line out the door.",
        defaultName: "Atlas Cuts",
        tagline: "Precision cuts. No waiting around.",
        description: "A quiet two-chair shop. Book a chair, skip the walk-in list, leave looking finished.",
        address: "12 Main Street, New Era",
        ringColor: "#E7B48A",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introIntensity,
        services: [
            {
                group: "Cut",
                name: "Signature cut",
                description: "Consultation, cut, finish.",
                durationMin: 45,
                priceCents: 4800
            },
            {
                group: "Cut",
                name: "Skin fade",
                description: "Tight blend, razor line.",
                durationMin: 50,
                priceCents: 5400
            },
            {
                group: "Beard",
                name: "Beard sculpt",
                description: "Shape, line-up, oil.",
                durationMin: 25,
                priceCents: 2800
            }
        ],
        employees: [
            {
                displayName: "Jordan Hale",
                title: "Lead barber",
                bio: "Fades and classic tapers. Calm chair, sharp lines.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Reese Quinn",
                title: "Barber",
                bio: "Texture and finishes. The haircut you forget you have — in a good way.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ],
        portfolio: []
    },
    field: {
        niche: "field",
        label: "Field service",
        kicker: "You go to them",
        blurb: "A driveway diagnostic, a no-start, or the bay. The van comes to the curb.",
        defaultName: "Northline Repair",
        tagline: "The van rolls when the call is booked.",
        description: "Mobile auto service. Scan it in the driveway, or put it on the hoist when the job needs a bay.",
        address: "New Era · 15-mile service radius",
        ringColor: "#7EC8E3",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introIntensity,
        services: [
            {
                group: "At the curb",
                name: "Driveway diagnostic",
                description: "Scan and a plain-language report.",
                durationMin: 60,
                priceCents: 12900
            },
            {
                group: "At the curb",
                name: "Mobile rescue",
                description: "Battery, jump, no-start triage.",
                durationMin: 50,
                priceCents: 14900
            },
            {
                group: "In the bay",
                name: "Oil + filter",
                description: "On the hoist. Includes the inspection.",
                durationMin: 45,
                priceCents: 8900
            }
        ],
        employees: [
            {
                displayName: "Chris Dalton",
                title: "Lead technician",
                bio: "Drivability and brakes. Listens to the engine — and to you.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            },
            {
                displayName: "Avery Knox",
                title: "Mobile tech",
                bio: "The van is a rolling bay. Fast on the jobs that should not need a tow.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ],
        portfolio: []
    },
    studio: {
        niche: "studio",
        label: "App studio",
        kicker: "They book the scope",
        blurb: "A scope call, a site launch, and the desk the staff actually uses.",
        defaultName: "Forge Studio",
        tagline: "Scope it, then launch the book.",
        description: "We stand up the booking site, the operator console, and the staff station — then light the edge of the phone when the first appointment lands.",
        address: "New Era",
        ringColor: "#2EE6D6",
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introIntensity,
        services: [
            {
                group: "Start",
                name: "Discovery call",
                description: "What you run. What the ring should say.",
                durationMin: 45,
                priceCents: 15000
            },
            {
                group: "Build",
                name: "Site launch session",
                description: "Live booking page, services, and staff.",
                durationMin: 90,
                priceCents: 48000
            },
            {
                group: "Build",
                name: "Console + station",
                description: "Admin, employee board, incoming book.",
                durationMin: 60,
                priceCents: 32000
            },
            {
                group: "Build",
                name: "Custom ring + brand",
                description: "Perimeter glow, color, confirmation language.",
                durationMin: 50,
                priceCents: 22000
            }
        ],
        employees: [
            {
                displayName: "Eric",
                title: "Founder",
                bio: "Builds the shop you can book. New Era Apps, powered by Axiom.",
                avatarUrl: "",
                phone: "5418908126",
                serviceIndexes: [
                    0,
                    1,
                    2,
                    3
                ]
            }
        ],
        portfolio: []
    },
    salon: bookable({
        niche: "salon",
        label: "Hair salon",
        kicker: "They book the style",
        blurb: "A cut, a color, or a gloss. The stylist holds the block.",
        defaultName: "Halo Room",
        tagline: "Color and the cut that holds it.",
        description: "Color and cuts by appointment. The chair is yours for the block you booked.",
        address: "New Era · chairs by appointment",
        ringColor: "#E7B48A",
        soloTitle: "Stylist",
        services: [
            {
                group: "Cut",
                name: "Cut + style",
                description: "Consultation, cut, and the finish.",
                durationMin: 60,
                priceCents: 8500
            },
            {
                group: "Color",
                name: "Color consult",
                description: "The formula, the time, and a date for the work.",
                durationMin: 30,
                priceCents: 4000
            },
            {
                group: "Color",
                name: "Gloss + style",
                description: "Tone and a blowout. One sitting.",
                durationMin: 90,
                priceCents: 16000
            }
        ],
        employees: [
            {
                displayName: "Noor Ellis",
                title: "Lead stylist",
                bio: "Color first, then the cut that holds it.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Jules Park",
                title: "Stylist",
                bio: "Cuts and the gloss that should not take all afternoon.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    beauty: bookable({
        niche: "beauty",
        label: "Nails, lashes, makeup",
        kicker: "They book the set",
        blurb: "A set, a fill, a face — booked, not a walk-in.",
        defaultName: "Set Apart",
        tagline: "The set, then you leave.",
        description: "Nails, lashes, and makeup on a clock. You book the set. We hold the chair.",
        address: "New Era · sets by appointment",
        ringColor: "#E07A73",
        soloTitle: "Artist",
        services: [
            {
                group: "Nails",
                name: "Gel set",
                description: "Shape, color, and a finish that lasts.",
                durationMin: 75,
                priceCents: 6500
            },
            {
                group: "Lashes",
                name: "Lash fill",
                description: "A fill on a set you already wear.",
                durationMin: 60,
                priceCents: 8500
            },
            {
                group: "Face",
                name: "Makeup",
                description: "The face for the event. You leave ready.",
                durationMin: 50,
                priceCents: 9500
            }
        ],
        employees: [
            {
                displayName: "Imani Cole",
                title: "Lead artist",
                bio: "Sets and the face that has to last all night.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Remy Sol",
                title: "Artist",
                bio: "Nails and the fills that stay on schedule.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ]
    }),
    wellness: bookable({
        niche: "wellness",
        label: "Massage and bodywork",
        kicker: "They book the hour",
        blurb: "A table, a pressure, a block of quiet.",
        defaultName: "Still Water",
        tagline: "The hour is yours.",
        description: "Bodywork by appointment. Tell us the pressure. We keep the room.",
        address: "New Era · tables on the hour",
        ringColor: "#7EC8E3",
        soloTitle: "Practitioner",
        services: [
            {
                group: "Table",
                name: "Relaxation",
                description: "Sixty minutes. Even pressure. You set the quiet.",
                durationMin: 60,
                priceCents: 11000
            },
            {
                group: "Table",
                name: "Deep work",
                description: "Ninety minutes on the places that actually hurt.",
                durationMin: 90,
                priceCents: 15000
            },
            {
                group: "Start",
                name: "First session",
                description: "What hurts, what helps, and the first hour.",
                durationMin: 75,
                priceCents: 13000
            }
        ],
        employees: [
            {
                displayName: "Sasha Nguyen",
                title: "Lead practitioner",
                bio: "Listens first. The pressure follows what you actually said.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Eden Walsh",
                title: "Practitioner",
                bio: "The longer sessions and the first visits.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    lessons: bookable({
        niche: "lessons",
        label: "Lessons and tutoring",
        kicker: "They book the lesson",
        blurb: "One student, or a small group, on a repeating hour.",
        defaultName: "Second Chair",
        tagline: "Show up. We work the hour.",
        description: "Lessons and tutoring by the block. The same hour, every week, if you want it.",
        address: "New Era · lessons after school",
        ringColor: "#C9A227",
        soloTitle: "Teacher",
        services: [
            {
                group: "One to one",
                name: "Private lesson",
                description: "One student. The work you are actually on.",
                durationMin: 50,
                priceCents: 7000
            },
            {
                group: "One to one",
                name: "Placement",
                description: "Where you are, and the plan for the next month.",
                durationMin: 40,
                priceCents: 5000
            },
            {
                group: "Group",
                name: "Small group",
                description: "Up to four. The same lesson, shared.",
                durationMin: 60,
                priceCents: 3500
            }
        ],
        employees: [
            {
                displayName: "Priya Shah",
                title: "Lead teacher",
                bio: "Writes the plan and stays for the hard problem.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            },
            {
                displayName: "Jonah Reed",
                title: "Teacher",
                bio: "Small groups and the students who would rather not study alone.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    photo: bookable({
        niche: "photo",
        label: "Photography",
        kicker: "They book the session",
        blurb: "A portrait, a mini, or the plan for the event.",
        defaultName: "North Light",
        tagline: "We shoot the hour you booked.",
        description: "Sessions by appointment. You get the time, the place, and the edit that follows.",
        address: "New Era · studio and on location",
        ringColor: "#B388FF",
        soloTitle: "Photographer",
        services: [
            {
                group: "Session",
                name: "Portrait hour",
                description: "One hour. One person or a pair. The edit included.",
                durationMin: 60,
                priceCents: 25000
            },
            {
                group: "Session",
                name: "Mini",
                description: "Twenty directed frames. A short block.",
                durationMin: 30,
                priceCents: 15000
            },
            {
                group: "Plan",
                name: "Event consult",
                description: "The timeline, the light, and the date.",
                durationMin: 45,
                priceCents: 10000
            }
        ],
        employees: [
            {
                displayName: "Ada Morales",
                title: "Photographer",
                bio: "Portraits and the events that need a timeline.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Kit Romero",
                title: "Photographer",
                bio: "Minis and the second camera.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    pets: bookable({
        niche: "pets",
        label: "Pet grooming",
        kicker: "They book the groom",
        blurb: "A bath, a full groom, or just the nails.",
        defaultName: "Good Coat",
        tagline: "In clean. Out finished.",
        description: "Grooms by appointment so the dog is not waiting in a crate all afternoon.",
        address: "New Era · grooms by appointment",
        ringColor: "#E7B48A",
        soloTitle: "Groomer",
        services: [
            {
                group: "Groom",
                name: "Full groom",
                description: "Bath, cut, ears, and nails. Breed cut or your notes.",
                durationMin: 90,
                priceCents: 8500
            },
            {
                group: "Groom",
                name: "Bath + brush",
                description: "A clean coat. No haircut.",
                durationMin: 45,
                priceCents: 4500
            },
            {
                group: "Quick",
                name: "Nail trim",
                description: "Nails only. In and out.",
                durationMin: 20,
                priceCents: 1800
            }
        ],
        employees: [
            {
                displayName: "Harper Lin",
                title: "Lead groomer",
                bio: "Full grooms and the dogs that need a calm room.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            },
            {
                displayName: "Casey Dunn",
                title: "Groomer",
                bio: "Baths, nails, and the short appointments.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    clean: bookable({
        niche: "clean",
        label: "Home cleaning",
        kicker: "They book the visit",
        blurb: "A standard clean, a deep clean, or the move-out.",
        defaultName: "Clear House",
        tagline: "We arrive when the book says.",
        description: "Home cleans on a clock. You book the visit. We bring the kit.",
        address: "New Era · visits within 15 miles",
        ringColor: "#2EE6D6",
        soloTitle: "Cleaner",
        services: [
            {
                group: "Visit",
                name: "Standard clean",
                description: "Kitchen, baths, floors. A home that is already lived in.",
                durationMin: 120,
                priceCents: 16000
            },
            {
                group: "Visit",
                name: "Deep clean",
                description: "The corners the weekly clean skips.",
                durationMin: 240,
                priceCents: 28000
            },
            {
                group: "Move",
                name: "Move-out",
                description: "Empty rooms. The handoff clean.",
                durationMin: 240,
                priceCents: 32000
            }
        ],
        employees: [
            {
                displayName: "Rosa Alvarez",
                title: "Lead",
                bio: "Walks the house first, then the crew follows her list.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Ben Cho",
                title: "Cleaner",
                bio: "Standard visits and the deep cleans.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ]
    }),
    practice: bookable({
        niche: "practice",
        label: "Clinic",
        kicker: "They book the chart",
        blurb: "A new-patient visit, a follow-up, or a consult. The room is charted before you arrive.",
        defaultName: "Lane Practice",
        tagline: "New patients and follow-ups, on the book.",
        description: "A clinic book. New-patient visits, follow-ups, and consults. Not a therapy plan of care.",
        address: "New Era · visits by appointment",
        ringColor: "#7EC8E3",
        soloTitle: "Practitioner",
        services: [
            {
                group: "Visit",
                name: "New patient",
                description: "History, exam, and the chart. The first time in the room.",
                durationMin: 60,
                priceCents: 18000
            },
            {
                group: "Visit",
                name: "Follow-up",
                description: "A return on a chart that already exists.",
                durationMin: 30,
                priceCents: 9000
            },
            {
                group: "Visit",
                name: "Consult",
                description: "A question and a recommendation. No procedure that day.",
                durationMin: 30,
                priceCents: 7500
            }
        ],
        employees: [
            {
                displayName: "Dr. Leah Okonkwo",
                title: "Practitioner",
                bio: "New visits and the plan that follows.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Micah Berg",
                title: "Practitioner",
                bio: "Follow-ups and consults.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    counsel: bookable({
        niche: "counsel",
        label: "Advisor",
        kicker: "They book the consult",
        blurb: "An intro call, a working hour on the books, or a review of what is already filed.",
        defaultName: "Plain Counsel",
        tagline: "The hour has an agenda and notes you keep.",
        description: "Advisory work by the hour. Intro, a working session, or a review of the file.",
        address: "New Era · calls and the office",
        ringColor: "#C9A227",
        soloTitle: "Advisor",
        services: [
            {
                group: "Consult",
                name: "Intro consult",
                description: "What you need, and whether we are the right hour.",
                durationMin: 30,
                priceCents: 0
            },
            {
                group: "Consult",
                name: "Working session",
                description: "One file, one hour, notes you can act on after.",
                durationMin: 60,
                priceCents: 20000
            },
            {
                group: "Review",
                name: "File review",
                description: "A read of the work already done, and what to do next.",
                durationMin: 45,
                priceCents: 15000
            }
        ],
        employees: [
            {
                displayName: "Helen Park",
                title: "Advisor",
                bio: "Starts with the question, ends with a next step.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Omar Aziz",
                title: "Advisor",
                bio: "Working sessions and reviews.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    events: bookable({
        niche: "events",
        label: "Events",
        kicker: "They book the date",
        blurb: "A walkthrough, the day-of lead, or the reception block.",
        defaultName: "Hold the Date",
        tagline: "The date is held when the timeline is booked.",
        description: "Event planning by the block. Walk the venue, then run the day.",
        address: "New Era · and the venue",
        ringColor: "#B388FF",
        soloTitle: "Lead",
        services: [
            {
                group: "Plan",
                name: "Venue walkthrough",
                description: "The room, the load-in, and whether the date is open.",
                durationMin: 45,
                priceCents: 0
            },
            {
                group: "Day",
                name: "Day-of lead",
                description: "The timeline in the room. You have the lead for that block.",
                durationMin: 90,
                priceCents: 80000
            },
            {
                group: "Day",
                name: "Reception block",
                description: "The longer hold. Room, vendors, and the close.",
                durationMin: 240,
                priceCents: 150000
            }
        ],
        employees: [
            {
                displayName: "Vera Lang",
                title: "Lead",
                bio: "Holds the timeline and the room.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Chris Adeyemi",
                title: "Operator",
                bio: "The set and the second half of the night.",
                avatarUrl: "",
                serviceIndexes: [
                    2
                ]
            }
        ]
    }),
    security: bookable({
        niche: "security",
        label: "Private security",
        kicker: "They book the post",
        blurb: "A consult, a standing post, or the night of an event.",
        defaultName: "Night Watch",
        tagline: "The door is covered when you book it.",
        description: "Private posts and event details. Book the shift, not a maybe.",
        address: "New Era · and the site",
        ringColor: "#7EC8E3",
        soloTitle: "Lead",
        services: [
            {
                group: "Start",
                name: "Site consult",
                description: "Walk the door, the lot, and what the post actually needs.",
                durationMin: 45,
                priceCents: 0
            },
            {
                group: "Post",
                name: "Standing post",
                description: "One officer, one shift, the site you named.",
                durationMin: 240,
                priceCents: 32000
            },
            {
                group: "Post",
                name: "Event detail",
                description: "The night of the event. Door, floor, and the close.",
                durationMin: 300,
                priceCents: 48000
            }
        ],
        employees: [
            {
                displayName: "Reed Calder",
                title: "Lead",
                bio: "Walks the site first. The post follows his list.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Imani Brooks",
                title: "Officer",
                bio: "Event nights and the shifts that run late.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    retail: bookable({
        niche: "retail",
        label: "Retail / Merchandise",
        kicker: "They order the item",
        blurb: "A cap, a print, or the bundle. Counted stock, no calendar.",
        defaultName: "Counter Goods",
        tagline: "The item is yours when you order it.",
        description: "Merchandise with a price, an attribute, and a count on the shelf.",
        address: "New Era · the counter",
        ringColor: "#E7B48A",
        soloTitle: "Counter",
        services: [
            {
                group: "Apparel",
                name: "House cap",
                description: "Embroidered mark. One size.",
                durationMin: 0,
                priceCents: 3200
            },
            {
                group: "Print",
                name: "Shop print",
                description: "18×24 poster of the mark.",
                durationMin: 0,
                priceCents: 2400
            },
            {
                group: "Bundle",
                name: "Counter bundle",
                description: "The cap and the print together.",
                durationMin: 0,
                priceCents: 4800
            }
        ],
        employees: [
            {
                displayName: "June Hale",
                title: "Counter",
                bio: "Packs the order and keeps the count honest.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            }
        ]
    }),
    combat: bookable({
        niche: "combat",
        label: "Combat sports",
        kicker: "They book the round",
        blurb: "A first class, a private hour, or the camp before a fight.",
        defaultName: "Iron Round",
        tagline: "The round starts when you book it.",
        description: "Striking and grappling. Book the intro, the private, or the camp block.",
        address: "New Era · the gym",
        ringColor: "#E25B3A",
        soloTitle: "Coach",
        services: [
            {
                group: "Start",
                name: "Intro class",
                description: "One class. Gloves on, the basics, no sparring.",
                durationMin: 60,
                priceCents: 4000
            },
            {
                group: "Train",
                name: "Private hour",
                description: "One coach, one pad round, the thing you came to fix.",
                durationMin: 60,
                priceCents: 12000
            },
            {
                group: "Camp",
                name: "Camp block",
                description: "Four sessions in the weeks before a fight.",
                durationMin: 75,
                priceCents: 36000
            }
        ],
        employees: [
            {
                displayName: "Dani Ruiz",
                title: "Head coach",
                bio: "Holds the pads and calls the round.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Jordan Hale",
                title: "Coach",
                bio: "Intro classes and the people still learning the stance.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ]
    }),
    locksmith: bookable({
        niche: "locksmith",
        label: "Mobile locksmith",
        kicker: "They book the van",
        blurb: "A lockout, a rekey, or a new lock. The van comes to the door.",
        defaultName: "Night Key",
        tagline: "The van is already on the way.",
        description: "Mobile lock work. Book the lockout, the rekey, or the install.",
        address: "New Era · we come to you",
        ringColor: "#C6A15B",
        soloTitle: "Locksmith",
        services: [
            {
                group: "Now",
                name: "Lockout",
                description: "Emergency open. House, car, or the shop door.",
                durationMin: 45,
                priceCents: 12500
            },
            {
                group: "Door",
                name: "Rekey",
                description: "Same lock, new keys. The old ones stop working.",
                durationMin: 60,
                priceCents: 9500
            },
            {
                group: "Door",
                name: "Lock install",
                description: "A new deadbolt, fitted and tested.",
                durationMin: 75,
                priceCents: 18000
            }
        ],
        employees: [
            {
                displayName: "Sam Ortega",
                title: "Locksmith",
                bio: "Takes the night calls and the rekeys that should have happened yesterday.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Riley Chen",
                title: "Tech",
                bio: "Installs and the jobs that need a second set of hands.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    landscaper: bookable({
        niche: "landscaper",
        label: "Landscaper",
        kicker: "They book the yard",
        blurb: "A mow, a cleanup, or the planting. The crew comes to the house.",
        defaultName: "Green Line",
        tagline: "The yard is booked before the truck leaves.",
        description: "Lawn and landscape work. Book the mow, the cleanup, or the planting.",
        address: "New Era · we come to the yard",
        ringColor: "#6FA86A",
        soloTitle: "Landscaper",
        services: [
            {
                group: "Yard",
                name: "Mow and edge",
                description: "The lawn, the edges, and the blow-off.",
                durationMin: 60,
                priceCents: 8500
            },
            {
                group: "Yard",
                name: "Cleanup",
                description: "Beds, leaves, and the haul-away.",
                durationMin: 120,
                priceCents: 18000
            },
            {
                group: "Plant",
                name: "Planting visit",
                description: "A bed or a row, planted and watered in.",
                durationMin: 150,
                priceCents: 24000
            }
        ],
        employees: [
            {
                displayName: "Chris Adeyemi",
                title: "Landscaper",
                bio: "Runs the mow and the beds that need a real edge.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Pat Nguyen",
                title: "Crew",
                bio: "The cleanup days and the planting.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    dogwalk: bookable({
        niche: "dogwalk",
        label: "Dog walking",
        kicker: "They book the walk",
        blurb: "A solo walk, a pack walk, or a midday check. The leash comes to the door.",
        defaultName: "Leash Line",
        tagline: "The walk is booked before the leash is clipped.",
        description: "Dog walking. Book the solo walk, the pack walk, or the midday visit.",
        address: "New Era · we come to the dog",
        ringColor: "#C4A15A",
        soloTitle: "Walker",
        services: [
            {
                group: "Walk",
                name: "Solo walk",
                description: "One dog, one loop, back at the door.",
                durationMin: 30,
                priceCents: 2500
            },
            {
                group: "Walk",
                name: "Pack walk",
                description: "Two or three dogs from the same house.",
                durationMin: 45,
                priceCents: 4000
            },
            {
                group: "Visit",
                name: "Midday visit",
                description: "A short walk and a water check while you're out.",
                durationMin: 20,
                priceCents: 2000
            }
        ],
        employees: [
            {
                displayName: "Nora Ellis",
                title: "Walker",
                bio: "Takes the morning loop and the dogs that pull.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Sam Ortega",
                title: "Walker",
                bio: "The midday visits and the pack walks.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    detailer: bookable({
        niche: "detailer",
        label: "Mobile detailer",
        kicker: "They book the van",
        blurb: "An exterior wash, a full detail, or the interior. The van comes to the driveway.",
        defaultName: "Curb Shine",
        tagline: "The van is booked before it leaves the curb.",
        description: "Mobile auto detailing. Book the wash, the interior, or the full detail.",
        address: "New Era · we come to the car",
        ringColor: "#7EC8E3",
        soloTitle: "Detailer",
        services: [
            {
                group: "Wash",
                name: "Exterior wash",
                description: "Rinse, wash, and dry in the driveway.",
                durationMin: 60,
                priceCents: 8000
            },
            {
                group: "Inside",
                name: "Interior reset",
                description: "Vacuum, wipe-down, and the windows.",
                durationMin: 90,
                priceCents: 14000
            },
            {
                group: "Full",
                name: "Full detail",
                description: "Outside and inside, including the wheels.",
                durationMin: 180,
                priceCents: 25000
            }
        ],
        employees: [
            {
                displayName: "Luis Ortega",
                title: "Detailer",
                bio: "Runs the driveway jobs and the full details.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Riley Chen",
                title: "Tech",
                bio: "Interiors and the cars that need a second pass.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    hunting: bookable({
        niche: "hunting",
        label: "Rugged Backcountry Services",
        kicker: "They book the hunt",
        blurb: "A private day, a half day, or a scouting walk. The gate opens when you book it.",
        defaultName: "Ridge Line",
        tagline: "The hunt is booked before the gate opens.",
        description: "Private hunting trips. Book the half day, the full day, or the scout.",
        address: "New Era · private ground",
        ringColor: "#8B7355",
        soloTitle: "Guide",
        services: [
            {
                group: "Day",
                name: "Half day",
                description: "A morning or an evening on private ground.",
                durationMin: 240,
                priceCents: 35000
            },
            {
                group: "Day",
                name: "Full day",
                description: "Dawn to dark. The guide, the ground, and the plan.",
                durationMin: 600,
                priceCents: 65000
            },
            {
                group: "Scout",
                name: "Scouting walk",
                description: "A look at the ground before the hunt day.",
                durationMin: 120,
                priceCents: 18000
            }
        ],
        employees: [
            {
                displayName: "Cole Brennan",
                title: "Guide",
                bio: "Runs the private days and the scouting walks.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Jonah Hale",
                title: "Guide",
                bio: "The half days and the evening sits.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    therapy: bookable({
        niche: "therapy",
        label: "Physical therapy",
        kicker: "They book the session",
        blurb: "An evaluation, a follow-up, or a return visit. The room is ready when you arrive.",
        defaultName: "Motion Room",
        tagline: "The session starts on time.",
        description: "Physical therapy. Book the evaluation, the follow-up, or the return visit.",
        address: "New Era · visits by appointment",
        ringColor: "#6FA8C9",
        soloTitle: "Therapist",
        services: [
            {
                group: "Visit",
                name: "Evaluation",
                description: "Initial eval. Range, strength, and the plan of care.",
                durationMin: 60,
                priceCents: 15000
            },
            {
                group: "Visit",
                name: "Follow-up",
                description: "A treatment visit on the plan of care you already have.",
                durationMin: 45,
                priceCents: 9500
            },
            {
                group: "Visit",
                name: "Return visit",
                description: "A longer treatment block when the plan calls for it.",
                durationMin: 60,
                priceCents: 12000
            }
        ],
        employees: [
            {
                displayName: "Leah Okonkwo",
                title: "Therapist",
                bio: "Evaluations and the plan that follows.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Micah Berg",
                title: "Therapist",
                bio: "Follow-ups and the return visits.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    bowtech: bookable({
        niche: "bowtech",
        label: "Custom bow technician",
        kicker: "They book the bench",
        blurb: "A tune, a setup, or a repair. The bow is ready when you pick it up.",
        defaultName: "String Bench",
        tagline: "The bow is booked before it hits the bench.",
        description: "Custom bow work. Book the tune, the setup, or the repair.",
        address: "New Era · the bench",
        ringColor: "#C4A15A",
        soloTitle: "Technician",
        services: [
            {
                group: "Bench",
                name: "Tune",
                description: "Paper tune and a walk-back. You leave with it sighted.",
                durationMin: 60,
                priceCents: 7500
            },
            {
                group: "Bench",
                name: "Setup",
                description: "A new bow, built and set to you.",
                durationMin: 90,
                priceCents: 15000
            },
            {
                group: "Bench",
                name: "Repair",
                description: "Strings, cams, or the thing that let go.",
                durationMin: 45,
                priceCents: 6000
            }
        ],
        employees: [
            {
                displayName: "Cole Brennan",
                title: "Technician",
                bio: "Tunes and the full setups.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Jonah Hale",
                title: "Technician",
                bio: "Repairs and the quick tunes.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    foodtruck: bookable({
        niche: "foodtruck",
        label: "Mobile food truck",
        kicker: "They book the window",
        blurb: "A lunch stop, a private event, or a tray from the truck.",
        defaultName: "Window Line",
        tagline: "The truck is booked before the window opens.",
        description: "A mobile food truck. Book the stop, the private event, or the tray.",
        address: "New Era · the truck comes to you",
        ringColor: "#E07A3D",
        soloTitle: "Operator",
        services: [
            {
                group: "Stop",
                name: "Lunch stop",
                description: "The truck on site for a lunch window.",
                durationMin: 120,
                priceCents: 45000
            },
            {
                group: "Event",
                name: "Private event",
                description: "A booked window for a party or a crew.",
                durationMin: 180,
                priceCents: 75000
            },
            {
                group: "Tray",
                name: "Catering tray",
                description: "Food from the truck, dropped without the full stop.",
                durationMin: 45,
                priceCents: 18000
            }
        ],
        employees: [
            {
                displayName: "Rosa Vega",
                title: "Operator",
                bio: "Runs the window and the private bookings.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Eli Brooks",
                title: "Cook",
                bio: "The line and the trays that leave the truck.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    prompt: bookable({
        niche: "prompt",
        label: "AI prompt engineering and creation",
        kicker: "They book the prompt",
        blurb: "A prompt session, a custom pack, or a piece built from the brief.",
        defaultName: "Prompt Desk",
        tagline: "The prompt is written before the piece is made.",
        description: "AI prompt engineering and creation. Book the session, the pack, or the build.",
        address: "New Era · the desk",
        ringColor: "#3D7EFF",
        soloTitle: "Engineer",
        services: [
            {
                group: "Session",
                name: "Prompt session",
                description: "An hour on the brief. You leave with prompts that work.",
                durationMin: 60,
                priceCents: 15000
            },
            {
                group: "Pack",
                name: "Prompt pack",
                description: "A written set for the work you already named.",
                durationMin: 90,
                priceCents: 28000
            },
            {
                group: "Build",
                name: "Creation block",
                description: "The prompts plus the finished piece.",
                durationMin: 180,
                priceCents: 48000
            }
        ],
        employees: [
            {
                displayName: "Ava Lind",
                title: "Engineer",
                bio: "Writes the prompts and builds the piece.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Noah Peck",
                title: "Engineer",
                bio: "Sessions and the packs that follow.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1
                ]
            }
        ]
    }),
    creator: bookable({
        niche: "creator",
        label: "Cinematic Video and Content Creator",
        kicker: "They book the edit",
        blurb: "A shoot, a cut, or a video that is ready to post.",
        defaultName: "Frame Desk",
        tagline: "Shot, cut, and ready when you book it.",
        description: "Content and video editing. Book the shoot, the cut, or the package.",
        address: "New Era · the desk",
        ringColor: "#7C6BF2",
        soloTitle: "Editor",
        services: [
            {
                group: "Shoot",
                name: "Content day",
                description: "A half day on camera. The clips are yours.",
                durationMin: 180,
                priceCents: 45000
            },
            {
                group: "Edit",
                name: "Video edit",
                description: "One finished piece from footage you already have.",
                durationMin: 90,
                priceCents: 18000
            },
            {
                group: "Package",
                name: "Shoot and cut",
                description: "The day plus the edit, delivered ready to post.",
                durationMin: 240,
                priceCents: 72000
            }
        ],
        employees: [
            {
                displayName: "Mina Cho",
                title: "Editor",
                bio: "Cuts the piece and sends it back ready to post.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Owen Blake",
                title: "Shooter",
                bio: "Runs the camera on content days.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    2
                ]
            }
        ]
    }),
    entertainer: bookable({
        niche: "entertainer",
        label: "Entertainer",
        kicker: "They book the set",
        blurb: "A short set, a private show, or the night.",
        defaultName: "House Act",
        tagline: "The set starts when you book it.",
        description: "Live entertainment. Book the short set, the private show, or the night.",
        address: "New Era · the room",
        ringColor: "#E23D8C",
        soloTitle: "Performer",
        services: [
            {
                group: "Set",
                name: "Short set",
                description: "Twenty minutes. One room, one act.",
                durationMin: 20,
                priceCents: 15000
            },
            {
                group: "Show",
                name: "Private show",
                description: "A booked hour for a party or a room.",
                durationMin: 60,
                priceCents: 40000
            },
            {
                group: "Night",
                name: "Full night",
                description: "The evening. Sets, breaks, and the close.",
                durationMin: 180,
                priceCents: 90000
            }
        ],
        employees: [
            {
                displayName: "Jules Marin",
                title: "Performer",
                bio: "Takes the short sets and the private rooms.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Casey Quinn",
                title: "Host",
                bio: "Holds the night and the longer bookings.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    firewood: bookable({
        niche: "firewood",
        label: "Firewood cutting",
        kicker: "They book the cord",
        blurb: "A cut, a split, or a cord dropped at the house.",
        defaultName: "Cord Line",
        tagline: "Cut, split, and stacked when you book it.",
        description: "Firewood cutting and delivery. Book the cord, the split, or the stack.",
        address: "New Era · we come to the pile",
        ringColor: "#C4783A",
        soloTitle: "Cutter",
        services: [
            {
                group: "Cut",
                name: "Cut and split",
                description: "One cord, cut and split on site.",
                durationMin: 180,
                priceCents: 28000
            },
            {
                group: "Deliver",
                name: "Cord delivery",
                description: "A cord dropped where you want the pile.",
                durationMin: 60,
                priceCents: 32000
            },
            {
                group: "Stack",
                name: "Stack the cord",
                description: "The delivered wood, stacked and covered.",
                durationMin: 90,
                priceCents: 8000
            }
        ],
        employees: [
            {
                displayName: "Hank Briggs",
                title: "Cutter",
                bio: "Runs the saw and keeps the lengths even.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            },
            {
                displayName: "Luis Ortega",
                title: "Driver",
                bio: "The truck, the drop, and the stack at the house.",
                avatarUrl: "",
                serviceIndexes: [
                    1,
                    2
                ]
            }
        ]
    }),
    trade: bookable({
        niche: "trade",
        label: "Your trade",
        kicker: "They book a time",
        blurb: "The open book for a trade the list does not name.",
        defaultName: "Open Book",
        tagline: "A time on the book, with a price you can read.",
        description: "A booking page for a trade that is not on the list. The lines start general. You can rename them after.",
        address: "New Era",
        ringColor: "#2EE6D6",
        soloTitle: "Owner",
        services: [
            {
                group: "Start",
                name: "First look",
                description: "A short first meeting so the job is named before the work starts.",
                durationMin: 30,
                priceCents: 0
            },
            {
                group: "Book",
                name: "Standard visit",
                description: "The usual block of work, with a price and a length.",
                durationMin: 60,
                priceCents: 10000
            },
            {
                group: "Book",
                name: "Extended visit",
                description: "A longer block when the job will not fit in an hour.",
                durationMin: 120,
                priceCents: 18000
            }
        ],
        employees: [
            {
                displayName: "Alex Morgan",
                title: "Owner",
                bio: "Takes the book until you rename this to yourself.",
                avatarUrl: "",
                serviceIndexes: [
                    0,
                    1,
                    2
                ]
            }
        ]
    })
};
function bookable(input) {
    return {
        ...input,
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introIntensity,
        employees: withSharedStaff(input.employees),
        portfolio: []
    };
}
function withSharedStaff(employees) {
    const next = employees.slice(0, 2).map((person, index)=>({
            ...person,
            avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHARED_STAFF"][index] ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHARED_STAFF"][0]
        }));
    while(next.length < 2){
        const index = next.length;
        next.push({
            displayName: index === 0 ? "Alex Morgan" : "Willa Grant",
            title: index === 0 ? "Lead" : "Crew",
            bio: "On the book for this shop.",
            avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHARED_STAFF"][index] ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHARED_STAFF"][0],
            serviceIndexes: employees[0]?.serviceIndexes ?? [
                0
            ]
        });
    }
    return next;
}
for (const key of NICHE_ORDER){
    NICHES[key].employees = withSharedStaff(NICHES[key].employees);
    NICHES[key].portfolio = [];
}
const DEFAULT_HOURS = {
    mon: "09:00-18:00",
    tue: "09:00-18:00",
    wed: "09:00-18:00",
    thu: "09:00-18:00",
    fri: "09:00-18:00",
    sat: "09:00-16:00",
    sun: "closed"
};
const WEEKDAYS = [
    [
        "mon",
        "Mon"
    ],
    [
        "tue",
        "Tue"
    ],
    [
        "wed",
        "Wed"
    ],
    [
        "thu",
        "Thu"
    ],
    [
        "fri",
        "Fri"
    ],
    [
        "sat",
        "Sat"
    ],
    [
        "sun",
        "Sun"
    ]
];
const VOICE = {
    guide: {
        bench: "The crew",
        heading: "Who rows with you.",
        menuKicker: "Departures",
        menuHeading: "Trips",
        bookLabel: "Book a trip",
        inquiry: "Ask the outfit",
        offerStep: "Trip",
        staffStep: "Guide",
        timeStep: "Launch",
        timeHint: "Pick a launch",
        requestLabel: "Request this launch",
        gallery: "On the water"
    },
    fitness: {
        bench: "The floor",
        heading: "Who coaches the hour.",
        menuKicker: "The book",
        menuHeading: "Training",
        bookLabel: "Book a training",
        inquiry: "Ask the gym",
        offerStep: "Session",
        staffStep: "Coach",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The floor"
    },
    combat: {
        bench: "The gym",
        heading: "Who calls the round.",
        menuKicker: "The book",
        menuHeading: "Sessions",
        bookLabel: "Book a round",
        inquiry: "Ask the gym",
        offerStep: "Session",
        staffStep: "Coach",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this round",
        gallery: "The gym"
    },
    tattoo: {
        bench: "The chair",
        heading: "Who holds the machine.",
        menuKicker: "The book",
        menuHeading: "Work",
        bookLabel: "Book the chair",
        inquiry: "Ask the shop",
        offerStep: "Piece",
        staffStep: "Artist",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this sitting",
        gallery: "The work"
    },
    landscaper: {
        bench: "The crew",
        heading: "Who works the yard.",
        menuKicker: "The book",
        menuHeading: "Visits",
        bookLabel: "Book the yard",
        inquiry: "Ask the crew",
        offerStep: "Visit",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this visit",
        gallery: "The yards"
    },
    dogwalk: {
        bench: "The leash",
        heading: "Who takes the walk.",
        menuKicker: "The book",
        menuHeading: "Walks",
        bookLabel: "Book the walk",
        inquiry: "Ask the walker",
        offerStep: "Walk",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this walk",
        gallery: "The walks"
    },
    hunting: {
        bench: "The field",
        heading: "Who guides the day.",
        menuKicker: "The book",
        menuHeading: "Days",
        bookLabel: "Book the hunt",
        inquiry: "Ask the guide",
        offerStep: "Day",
        staffStep: "Guide",
        timeStep: "Start",
        timeHint: "Pick a start",
        requestLabel: "Request this day",
        gallery: "The ground"
    },
    bowtech: {
        bench: "The bench",
        heading: "Who works the bow.",
        menuKicker: "The book",
        menuHeading: "Jobs",
        bookLabel: "Book the bench",
        inquiry: "Ask the bench",
        offerStep: "Job",
        staffStep: "Technician",
        timeStep: "Drop-off",
        timeHint: "Pick a drop-off",
        requestLabel: "Request this job",
        gallery: "The bench"
    },
    therapy: {
        bench: "The room",
        heading: "Who runs the session.",
        menuKicker: "The book",
        menuHeading: "Visits",
        bookLabel: "Book a treatment",
        inquiry: "Ask the therapist",
        offerStep: "Visit",
        staffStep: "Therapist",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this visit",
        gallery: "The room"
    },
    detailer: {
        bench: "The van",
        heading: "Who details the car.",
        menuKicker: "The book",
        menuHeading: "Visits",
        bookLabel: "Book the detail",
        inquiry: "Ask the van",
        offerStep: "Visit",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this visit",
        gallery: "The driveway"
    },
    foodtruck: {
        bench: "The truck",
        heading: "Who runs the window.",
        menuKicker: "The book",
        menuHeading: "Stops",
        bookLabel: "Book the truck",
        inquiry: "Ask the truck",
        offerStep: "Stop",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this stop",
        gallery: "The window"
    },
    prompt: {
        bench: "The desk",
        heading: "Who writes the prompt.",
        menuKicker: "The book",
        menuHeading: "Sessions",
        bookLabel: "Book a session",
        inquiry: "Ask the desk",
        offerStep: "Session",
        staffStep: "Engineer",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The work"
    },
    creator: {
        bench: "The desk",
        heading: "Who cuts the piece.",
        menuKicker: "The book",
        menuHeading: "Edits",
        bookLabel: "Book the edit",
        inquiry: "Ask the desk",
        offerStep: "Session",
        staffStep: "Editor",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The work"
    },
    entertainer: {
        bench: "The room",
        heading: "Who takes the stage.",
        menuKicker: "The book",
        menuHeading: "Sets",
        bookLabel: "Book a set",
        inquiry: "Ask the act",
        offerStep: "Set",
        staffStep: "Performer",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this set",
        gallery: "The stage"
    },
    music: {
        bench: "The room",
        heading: "Who's on the record.",
        menuKicker: "The book",
        menuHeading: "Sessions",
        bookLabel: "Book the room",
        inquiry: "Ask the studio",
        offerStep: "Session",
        staffStep: "Artist",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The room"
    },
    contractor: {
        bench: "The crew",
        heading: "Who walks the job.",
        menuKicker: "The book",
        menuHeading: "Work",
        bookLabel: "Book a site visit",
        inquiry: "Ask the crew",
        offerStep: "Estimate",
        staffStep: "Who walks it",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this site visit",
        gallery: "The jobs"
    },
    location: {
        bench: "The chairs",
        heading: "Who you'll sit with.",
        menuKicker: "The book",
        menuHeading: "Cuts",
        bookLabel: "Book a chair",
        inquiry: "Ask the shop",
        offerStep: "Cut",
        staffStep: "Barber",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this chair",
        gallery: "The chair"
    },
    field: {
        bench: "The crew",
        heading: "Who rolls up.",
        menuKicker: "The book",
        menuHeading: "Calls",
        bookLabel: "Book a service call",
        inquiry: "Ask the shop",
        offerStep: "Call",
        staffStep: "Tech",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this call",
        gallery: "The jobs"
    },
    firewood: {
        bench: "The crew",
        heading: "Who runs the saw.",
        menuKicker: "The book",
        menuHeading: "Cords",
        bookLabel: "Book a cord",
        inquiry: "Ask the crew",
        offerStep: "Job",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this cord",
        gallery: "The pile"
    },
    locksmith: {
        bench: "The van",
        heading: "Who comes to the door.",
        menuKicker: "The book",
        menuHeading: "Calls",
        bookLabel: "Book a locksmith",
        inquiry: "Ask the locksmith",
        offerStep: "Call",
        staffStep: "Locksmith",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this call",
        gallery: "The jobs"
    },
    studio: {
        bench: "The studio",
        heading: "Who you'll work with.",
        menuKicker: "The book",
        menuHeading: "Engagements",
        bookLabel: "Book a scope",
        inquiry: "Ask the studio",
        offerStep: "Engagement",
        staffStep: "Who builds it",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this call",
        gallery: "The work"
    },
    salon: {
        bench: "The chairs",
        heading: "Who styles you.",
        menuKicker: "The book",
        menuHeading: "Styles",
        bookLabel: "Book a style",
        inquiry: "Ask the salon",
        offerStep: "Style",
        staffStep: "Stylist",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this chair",
        gallery: "The work"
    },
    beauty: {
        bench: "The artists",
        heading: "Who does the set.",
        menuKicker: "The book",
        menuHeading: "Sets",
        bookLabel: "Book a set",
        inquiry: "Ask the studio",
        offerStep: "Set",
        staffStep: "Artist",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this set",
        gallery: "The work"
    },
    wellness: {
        bench: "The room",
        heading: "Who holds the hour.",
        menuKicker: "The book",
        menuHeading: "Hours",
        bookLabel: "Book the table",
        inquiry: "Ask the studio",
        offerStep: "Session",
        staffStep: "Practitioner",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The room"
    },
    lessons: {
        bench: "The teachers",
        heading: "Who teaches the hour.",
        menuKicker: "The book",
        menuHeading: "Lessons",
        bookLabel: "Book a lesson",
        inquiry: "Ask the teacher",
        offerStep: "Lesson",
        staffStep: "Teacher",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this lesson",
        gallery: "The work"
    },
    photo: {
        bench: "The photographers",
        heading: "Who shoots the hour.",
        menuKicker: "The book",
        menuHeading: "Shoots",
        bookLabel: "Book a shoot",
        inquiry: "Ask the studio",
        offerStep: "Shoot",
        staffStep: "Photographer",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this session",
        gallery: "The work"
    },
    pets: {
        bench: "The groomers",
        heading: "Who finishes the coat.",
        menuKicker: "The book",
        menuHeading: "Grooms",
        bookLabel: "Book a groom",
        inquiry: "Ask the shop",
        offerStep: "Groom",
        staffStep: "Groomer",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this groom",
        gallery: "The work"
    },
    clean: {
        bench: "The crew",
        heading: "Who comes to the house.",
        menuKicker: "The book",
        menuHeading: "Cleans",
        bookLabel: "Book a clean",
        inquiry: "Ask the crew",
        offerStep: "Clean",
        staffStep: "Who comes",
        timeStep: "Arrival",
        timeHint: "Pick an arrival",
        requestLabel: "Request this clean",
        gallery: "The jobs"
    },
    practice: {
        bench: "The clinic",
        heading: "Who takes the chart.",
        menuKicker: "The book",
        menuHeading: "Visits",
        bookLabel: "Book a visit",
        inquiry: "Ask the clinic",
        offerStep: "Visit",
        staffStep: "Practitioner",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this visit",
        gallery: "The practice"
    },
    counsel: {
        bench: "The advisors",
        heading: "Who takes the hour.",
        menuKicker: "The book",
        menuHeading: "Consults",
        bookLabel: "Book a consult",
        inquiry: "Ask the office",
        offerStep: "Consult",
        staffStep: "Advisor",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this consult",
        gallery: "The work"
    },
    events: {
        bench: "The crew",
        heading: "Who holds the date.",
        menuKicker: "The book",
        menuHeading: "Dates",
        bookLabel: "Book the date",
        inquiry: "Ask the lead",
        offerStep: "Date",
        staffStep: "Who works it",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this date",
        gallery: "The dates"
    },
    security: {
        bench: "The post",
        heading: "Who covers the door.",
        menuKicker: "The book",
        menuHeading: "Posts",
        bookLabel: "Book a post",
        inquiry: "Ask the lead",
        offerStep: "Post",
        staffStep: "Officer",
        timeStep: "Shift",
        timeHint: "Pick a start",
        requestLabel: "Request this post",
        gallery: "The sites"
    },
    retail: {
        bench: "The counter",
        heading: "What is on the shelf.",
        menuKicker: "The shelf",
        menuHeading: "Items",
        bookLabel: "Order product",
        inquiry: "Ask the counter",
        offerStep: "Item",
        staffStep: "Counter",
        timeStep: "Pickup",
        timeHint: "When you want it",
        requestLabel: "Order product",
        gallery: "The goods"
    },
    trade: {
        bench: "The book",
        heading: "Who takes the time.",
        menuKicker: "The book",
        menuHeading: "Offerings",
        bookLabel: "Book a time",
        inquiry: "Ask",
        offerStep: "Booking",
        staffStep: "Who",
        timeStep: "Time",
        timeHint: "Pick a time",
        requestLabel: "Request this time",
        gallery: "The work"
    }
};
function nicheCopy(niche) {
    return VOICE[niche] ?? VOICE.location;
}
function shopTradeLabel(shop) {
    const custom = shop.customNiche?.trim();
    if (custom) return custom;
    return NICHES[shop.niche].label;
}
const PRICE_UNIT_LABEL = {
    flat: "Flat fee",
    person: "Per person",
    boat: "Per boat"
};
function priceUnitsFor(niche) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unitsForTemplate"])(NICHES[niche]?.priceUnits);
}
function defaultPriceUnit(niche) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultUnit"])(priceUnitsFor(niche));
}
function formatDuration(minutes) {
    const min = Math.max(0, Math.round(minutes));
    if (min < 60) return `${min} min`;
    const hours = Math.floor(min / 60);
    const rest = min % 60;
    const hourLabel = hours === 1 ? "1 hr" : `${hours} hr`;
    return rest === 0 ? hourLabel : `${hourLabel} ${rest} min`;
}
function formatPrice(service) {
    const money = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(service.priceCents);
    if (service.priceUnit === "person") return `${money} / person`;
    if (service.priceUnit === "boat") return `${money} / boat`;
    return money;
}
function formatOffer(service) {
    if (service.durationMin <= 0) return formatPrice(service);
    return `${formatPrice(service)} · ${formatDuration(service.durationMin)}`;
}
function serviceGroups(services) {
    const groups = [];
    for (const service of services ?? []){
        const label = typeof service.group === "string" ? service.group : "";
        const last = groups[groups.length - 1];
        if (last && last.label === label) last.items.push(service);
        else groups.push({
            label,
            items: [
                service
            ]
        });
    }
    return groups;
}
}),
"[project]/src/lib/axiom/particle-brand.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "coveredShare",
    ()=>coveredShare,
    "createCover",
    ()=>createCover,
    "particleStudioModel",
    ()=>particleStudioModel,
    "revealStroke",
    ()=>revealStroke,
    "twoWordBrand",
    ()=>twoWordBrand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-ssr] (ecmascript)");
;
const SKIP = new Set([
    "the",
    "a",
    "an",
    "and",
    "of",
    "for",
    "at",
    "to"
]);
function meaningful(value) {
    return value.replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).filter((word)=>word.length > 0 && !SKIP.has(word.toLowerCase()));
}
function titleWord(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
}
function twoWordBrand(source, fallback) {
    const words = meaningful(source);
    const spare = meaningful(fallback);
    const first = titleWord(words[0] || spare[0] || "Axiom");
    let second = titleWord(words[1] || spare[1] || spare[0] || "Studio");
    if (second.toLowerCase() === first.toLowerCase()) {
        second = titleWord(spare.find((word)=>word.toLowerCase() !== first.toLowerCase()) || "Studio");
    }
    return {
        first,
        second,
        line: `${first} ${second}`
    };
}
function heroesUrl(url) {
    return url.startsWith("/media/heroes/") ? url : "";
}
function particleStudioModel(input) {
    const brand = twoWordBrand(input.business?.trim() || input.defaultName, input.defaultName);
    const video = heroesUrl(input.heroVideoUrl);
    const image = heroesUrl(input.heroImageUrl);
    return {
        ...brand,
        heroUrl: video || image || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNIVERSAL_FALLBACK"],
        heroKind: video ? "video" : "image",
        staffFront: input.staffFront,
        staffBack: input.staffBack,
        filmLabel: input.filmLabel
    };
}
function createCover(cols, rows) {
    return new Float32Array(cols * rows).fill(1);
}
function revealStroke(cover, cols, rows, x, y, radius) {
    const reach = Math.max(0.6, radius);
    const reachSq = reach * reach;
    const x0 = Math.max(0, Math.floor(x - reach));
    const x1 = Math.min(cols - 1, Math.ceil(x + reach));
    const y0 = Math.max(0, Math.floor(y - reach));
    const y1 = Math.min(rows - 1, Math.ceil(y + reach));
    for(let yy = y0; yy <= y1; yy += 1){
        for(let xx = x0; xx <= x1; xx += 1){
            const dx = xx - x;
            const dy = yy - y;
            if (dx * dx + dy * dy > reachSq) continue;
            cover[yy * cols + xx] = 0;
        }
    }
}
function coveredShare(cover) {
    if (cover.length === 0) return 1;
    let hidden = 0;
    for(let i = 0; i < cover.length; i += 1){
        if ((cover[i] ?? 0) > 0.5) hidden += 1;
    }
    return hidden / cover.length;
}
}),
"[project]/src/lib/axiom/types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SHOP_NICHES",
    ()=>SHOP_NICHES,
    "isShopNiche",
    ()=>isShopNiche
]);
const SHOP_NICHES = [
    "guide",
    "fitness",
    "combat",
    "wellness",
    "lessons",
    "salon",
    "beauty",
    "tattoo",
    "photo",
    "pets",
    "music",
    "creator",
    "prompt",
    "entertainer",
    "events",
    "landscaper",
    "foodtruck",
    "dogwalk",
    "detailer",
    "hunting",
    "therapy",
    "bowtech",
    "contractor",
    "clean",
    "field",
    "locksmith",
    "firewood",
    "security",
    "practice",
    "counsel",
    "location",
    "studio",
    "retail",
    "trade"
];
function isShopNiche(value) {
    return SHOP_NICHES.includes(value);
}
}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatMoney",
    ()=>formatMoney,
    "formatPhone",
    ()=>formatPhone,
    "initials",
    ()=>initials,
    "newId",
    ()=>newId,
    "slugify",
    ()=>slugify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(cents / 100);
}
function slugify(input) {
    const s = input.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
    return s || "shop";
}
function newId(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function initials(name) {
    return name.split(/\s+/).slice(0, 2).map((p)=>p[0] ?? "").join("").toUpperCase();
}
function formatPhone(raw) {
    const d = raw.replace(/\D/g, "");
    if (d.length === 10) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length === 11 && d[0] === "1") {
        return `${d.slice(1, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
    }
    return raw;
}
}),
];})()

//# sourceMappingURL=src_12ti2pr8pv35k._.js.map