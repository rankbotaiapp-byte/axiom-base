(()=>{"use strict";(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/preview-frame.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PreviewFrame",
    ()=>PreviewFrame
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$tenant$2d$preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/tenant-preview.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function PreviewFrame({ niche, search }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const query = new URLSearchParams();
    if (search.preview) query.set("preview", "true");
    if (search.business) query.set("business", search.business);
    if (search.biz && !search.business) query.set("business", search.biz);
    if (search.city) query.set("city", search.city);
    const suffix = query.toString();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$tenant$2d$preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TenantPreview"], {
        niche: niche,
        search: search,
        onNiche: (next)=>{
            router.push(suffix ? `/demo/${next}?${suffix}` : `/demo/${next}`);
        },
        claim: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            href: `/onboard?niche=${niche}`,
            className: "inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg sm:w-auto",
            children: "Claim This Storefront for Your Business"
        }, void 0, false, {
            fileName: "[project]/src/app/preview-frame.tsx",
            lineNumber: 23,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/preview-frame.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_s(PreviewFrame, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = PreviewFrame;
var _c;
__turbopack_context__.k.register(_c, "PreviewFrame");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/axiom-particle-studio.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AxiomParticleStudio",
    ()=>AxiomParticleStudio
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/particle-brand.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const COLS = 96;
const ROWS = 54;
function AxiomParticleStudio({ niche, business }) {
    _s();
    "use no memo";
    const model = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["particleStudioModel"])(niche, business);
    const reduce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const brushRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(4.5);
    const coverRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [brush, setBrush] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(4.5);
    const [face, setFace] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("front");
    const [hidden, setHidden] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AxiomParticleStudio.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            let dead = false;
            let frame = 0;
            let release = null;
            const cover = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCover"])(COLS, ROWS);
            let pointerId = -1;
            let down = false;
            const paint = {
                "AxiomParticleStudio.useEffect.paint": ()=>{
                    const rect = canvas.getBoundingClientRect();
                    if (rect.width < 8 || rect.height < 8) return;
                    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
                    const width = Math.max(2, Math.floor(rect.width * dpr));
                    const height = Math.max(2, Math.floor(rect.height * dpr));
                    if (canvas.width !== width || canvas.height !== height) {
                        canvas.width = width;
                        canvas.height = height;
                    }
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    if (coverRef.current) {
                        cover.fill(1);
                        coverRef.current = false;
                    }
                    const ink = getComputedStyle(canvas).color || "rgb(8, 8, 10)";
                    const cellW = canvas.width / COLS;
                    const cellH = canvas.height / ROWS;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = ink;
                    for(let y = 0; y < ROWS; y += 1){
                        for(let x = 0; x < COLS; x += 1){
                            if ((cover[y * COLS + x] ?? 0) < 0.5) continue;
                            ctx.globalAlpha = (x + y) % 5 === 0 ? 0.96 : 0.88;
                            ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
                        }
                    }
                    ctx.globalAlpha = 1;
                }
            }["AxiomParticleStudio.useEffect.paint"];
            const cellAt = {
                "AxiomParticleStudio.useEffect.cellAt": (clientX, clientY)=>{
                    const rect = canvas.getBoundingClientRect();
                    if (rect.width < 1 || rect.height < 1) return null;
                    return {
                        x: (clientX - rect.left) / rect.width * COLS,
                        y: (clientY - rect.top) / rect.height * ROWS
                    };
                }
            }["AxiomParticleStudio.useEffect.cellAt"];
            const onDown = {
                "AxiomParticleStudio.useEffect.onDown": (event)=>{
                    down = true;
                    pointerId = event.pointerId;
                    canvas.setPointerCapture(event.pointerId);
                    const hit = cellAt(event.clientX, event.clientY);
                    if (hit) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["revealStroke"])(cover, COLS, ROWS, hit.x, hit.y, brushRef.current);
                }
            }["AxiomParticleStudio.useEffect.onDown"];
            const onMove = {
                "AxiomParticleStudio.useEffect.onMove": (event)=>{
                    if (!down || event.pointerId !== pointerId) return;
                    const hit = cellAt(event.clientX, event.clientY);
                    if (!hit) return;
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["revealStroke"])(cover, COLS, ROWS, hit.x, hit.y, brushRef.current);
                }
            }["AxiomParticleStudio.useEffect.onMove"];
            const onUp = {
                "AxiomParticleStudio.useEffect.onUp": (event)=>{
                    if (event.pointerId !== pointerId) return;
                    down = false;
                    setHidden((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$particle$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["coveredShare"])(cover));
                }
            }["AxiomParticleStudio.useEffect.onUp"];
            const loop = {
                "AxiomParticleStudio.useEffect.loop": ()=>{
                    if (dead) return;
                    paint();
                    frame = requestAnimationFrame(loop);
                }
            }["AxiomParticleStudio.useEffect.loop"];
            paint();
            frame = requestAnimationFrame(loop);
            canvas.addEventListener("pointerdown", onDown);
            canvas.addEventListener("pointermove", onMove);
            canvas.addEventListener("pointerup", onUp);
            canvas.addEventListener("pointercancel", onUp);
            release = ({
                "AxiomParticleStudio.useEffect": ()=>{
                    canvas.removeEventListener("pointerdown", onDown);
                    canvas.removeEventListener("pointermove", onMove);
                    canvas.removeEventListener("pointerup", onUp);
                    canvas.removeEventListener("pointercancel", onUp);
                }
            })["AxiomParticleStudio.useEffect"];
            return ({
                "AxiomParticleStudio.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(frame);
                    release?.();
                }
            })["AxiomParticleStudio.useEffect"];
        }
    }["AxiomParticleStudio.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Axiom particle studio",
        className: "pointer-events-auto relative z-40 mx-auto mb-8 w-full max-w-5xl px-5 pt-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "glass-panel grid gap-0 overflow-hidden rounded-[24px] lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.8fr)]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative min-h-64 bg-bg",
                    children: [
                        model.heroKind === "video" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                            className: "pointer-events-none absolute inset-0 h-full w-full object-cover",
                            src: model.heroUrl,
                            autoPlay: true,
                            muted: true,
                            loop: true,
                            playsInline: true
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 125,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: model.heroUrl,
                            alt: "",
                            className: "pointer-events-none absolute inset-0 h-full w-full object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                            ref: canvasRef,
                            "aria-label": "Swipe to reveal the hero film",
                            className: "pointer-events-auto absolute inset-0 h-full w-full touch-none text-bg"
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "pointer-events-none absolute left-4 top-4 text-sm text-fg",
                            children: model.line
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "pointer-events-none absolute bottom-4 left-4 rounded-full bg-bg/70 px-3 py-1 text-sm text-fg",
                            children: hidden < 0.08 ? "Film open" : "Swipe to reveal"
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                    lineNumber: 123,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "pointer-events-auto flex flex-col gap-4 border-t border-line p-4 lg:border-l lg:border-t-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pointer-events-auto [perspective:900px]",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                className: "relative h-64",
                                animate: {
                                    rotateY: face === "back" ? 180 : 0
                                },
                                transition: {
                                    duration: reduce ? 0 : 0.55,
                                    ease: [
                                        0.22,
                                        1,
                                        0.36,
                                        1
                                    ]
                                },
                                style: {
                                    transformStyle: "preserve-3d"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFace, {
                                        src: model.staffFront,
                                        kicker: "Mark",
                                        title: model.line,
                                        detail: model.filmLabel
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                        lineNumber: 154,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFace, {
                                        src: model.staffBack,
                                        kicker: "AI preview",
                                        title: model.line,
                                        detail: "The other side of the same desk.",
                                        flipped: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                        lineNumber: 160,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 147,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "pointer-events-auto inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm font-medium text-bg",
                                    onClick: ()=>setFace((current)=>current === "front" ? "back" : "front"),
                                    children: face === "front" ? "Show AI preview" : "Show the mark"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                    lineNumber: 170,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg",
                                    onClick: ()=>{
                                        coverRef.current = true;
                                        setHidden(1);
                                    },
                                    children: "Cover the film"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 169,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm text-muted",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Brush"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                    lineNumber: 189,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "range",
                                    min: 1.4,
                                    max: 12,
                                    step: 0.1,
                                    value: brush,
                                    "aria-label": "Brush",
                                    className: "pointer-events-auto h-11 w-full accent-accent",
                                    onChange: (event)=>{
                                        const next = Number(event.target.value);
                                        brushRef.current = next;
                                        setBrush(next);
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                    lineNumber: 190,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "w-10 text-right text-fg",
                                    children: brush.toFixed(1)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                                    lineNumber: 204,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/axiom-particle-studio.tsx",
                            lineNumber: 188,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/axiom-particle-studio.tsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/axiom-particle-studio.tsx",
            lineNumber: 122,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/axiom-particle-studio.tsx",
        lineNumber: 121,
        columnNumber: 5
    }, this);
}
_s(AxiomParticleStudio, "9KAGq/T2MmvZ7BwAKj+9SmLfKxc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"]
    ];
});
_c = AxiomParticleStudio;
function AvatarFace({ src, kicker, title, detail, flipped = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] border border-line bg-surface ${flipped ? "[transform:rotateY(180deg)]" : ""} [backface-visibility:hidden]`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: src,
                alt: "",
                className: "pointer-events-none h-full w-full object-cover"
            }, void 0, false, {
                fileName: "[project]/src/components/axiom-particle-studio.tsx",
                lineNumber: 229,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent"
            }, void 0, false, {
                fileName: "[project]/src/components/axiom-particle-studio.tsx",
                lineNumber: 230,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "pointer-events-none absolute inset-y-0 left-1/3 w-1/4 bg-accent/15"
            }, void 0, false, {
                fileName: "[project]/src/components/axiom-particle-studio.tsx",
                lineNumber: 231,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-x-0 bottom-0 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs uppercase text-accent",
                        children: kicker
                    }, void 0, false, {
                        fileName: "[project]/src/components/axiom-particle-studio.tsx",
                        lineNumber: 233,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-display text-3xl text-fg",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/src/components/axiom-particle-studio.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-muted",
                        children: detail
                    }, void 0, false, {
                        fileName: "[project]/src/components/axiom-particle-studio.tsx",
                        lineNumber: 235,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/axiom-particle-studio.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/axiom-particle-studio.tsx",
        lineNumber: 226,
        columnNumber: 5
    }, this);
}
_c1 = AvatarFace;
var _c, _c1;
__turbopack_context__.k.register(_c, "AxiomParticleStudio");
__turbopack_context__.k.register(_c1, "AvatarFace");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/barber-mirror-studio.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BarberMirrorStudio",
    ()=>BarberMirrorStudio,
    "gazeShift",
    ()=>gazeShift,
    "usesBarberMirror",
    ()=>usesBarberMirror
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-biokinetic-engine.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const ROOM = "/media/heroes/universal-fallback.mp4.mp4";
const FRAME_SHIFT = {
    x: 28,
    y: 16
};
const DECK_SHIFT = {
    x: 48,
    y: 28
};
const DEFAULT_OFFERS = [
    {
        name: "Signature cut",
        description: "Consultation, cut, finish.",
        price: "$48"
    },
    {
        name: "Skin fade",
        description: "Tight blend, razor line.",
        price: "$54"
    },
    {
        name: "Beard sculpt",
        description: "Shape, line-up, oil.",
        price: "$28"
    }
];
const BARBER = /\b(barbers?|barbershops?|haircuts?)\b/i;
function usesBarberMirror(niche, text = "") {
    if (BARBER.test(`${niche} ${text}`)) return true;
    return niche === "location";
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function gazeShift(face) {
    const nose = face[1];
    if (!nose) return {
        x: 0,
        y: 0
    };
    return {
        x: clamp((nose.x - 0.5) * 2.4, -1, 1),
        y: clamp((nose.y - 0.46) * 2.6, -1, 1)
    };
}
function BarberMirrorStudio({ businessName, bookHref, services, children }) {
    _s();
    const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const reduce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const frameX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(0, {
        stiffness: 180,
        damping: 22,
        mass: 0.45
    });
    const frameY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(0, {
        stiffness: 180,
        damping: 22,
        mass: 0.45
    });
    const deckX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(0, {
        stiffness: 160,
        damping: 20,
        mass: 0.5
    });
    const deckY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(0, {
        stiffness: 160,
        damping: 20,
        mass: 0.5
    });
    const gazeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [live, setLive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tracking, setTracking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [cameraError, setCameraError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [attempt, setAttempt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [details, setDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [booking, setBooking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [held, setHeld] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [phone, setPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const biokinetic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBiokineticEngine"])({
        cameraGranted: cameraError === "" && live,
        gazeRef,
        reducedMotion: reduce
    });
    const offer = offers[index] ?? offers[0];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BarberMirrorStudio.useEffect": ()=>{
            const video = videoRef.current;
            if (!video) return;
            let dead = false;
            let raf = 0;
            let lastStamp = -1;
            let marker = null;
            let dwellSec = 0;
            let gazeAt = 0;
            let prevGaze = {
                x: 0,
                y: 0
            };
            const aim = {
                "BarberMirrorStudio.useEffect.aim": (x, y)=>{
                    const fx = x * FRAME_SHIFT.x;
                    const fy = y * FRAME_SHIFT.y;
                    const dx = x * DECK_SHIFT.x;
                    const dy = y * DECK_SHIFT.y;
                    if (reduce) {
                        frameX.jump(fx);
                        frameY.jump(fy);
                        deckX.jump(dx);
                        deckY.jump(dy);
                        return;
                    }
                    frameX.set(fx);
                    frameY.set(fy);
                    deckX.set(dx);
                    deckY.set(dy);
                }
            }["BarberMirrorStudio.useEffect.aim"];
            const tick = {
                "BarberMirrorStudio.useEffect.tick": ()=>{
                    if (dead) return;
                    raf = requestAnimationFrame(tick);
                    if (document.visibilityState !== "visible") return;
                    if (!marker || video.readyState < 2) return;
                    const now = performance.now();
                    if (now <= lastStamp) return;
                    lastStamp = now;
                    const face = marker.detectForVideo(video, now).faceLandmarks[0];
                    if (!face) {
                        aim(0, 0);
                        dwellSec = 0;
                        gazeRef.current = null;
                        return;
                    }
                    const shift = gazeShift(face);
                    const moved = Math.hypot(shift.x - prevGaze.x, shift.y - prevGaze.y);
                    const gazeDt = gazeAt ? Math.max(0, (now - gazeAt) / 1000) : 0;
                    gazeAt = now;
                    prevGaze = shift;
                    dwellSec = moved < 0.12 ? Math.min(3, dwellSec + gazeDt) : 0;
                    gazeRef.current = {
                        dwellSec,
                        stability: clamp(1 - moved / 0.45, 0, 1)
                    };
                    aim(shift.x, shift.y);
                }
            }["BarberMirrorStudio.useEffect.tick"];
            const stopStream = {
                "BarberMirrorStudio.useEffect.stopStream": ()=>{
                    const stream = video.srcObject;
                    if (stream instanceof MediaStream) stream.getTracks().forEach({
                        "BarberMirrorStudio.useEffect.stopStream": (track)=>track.stop()
                    }["BarberMirrorStudio.useEffect.stopStream"]);
                    video.srcObject = null;
                }
            }["BarberMirrorStudio.useEffect.stopStream"];
            const open = {
                "BarberMirrorStudio.useEffect.open": async ()=>{
                    if (!navigator.mediaDevices?.getUserMedia) {
                        setCameraError("This browser has no camera.");
                        return;
                    }
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: 1280,
                                height: 720
                            }
                        });
                        if (dead) {
                            stream.getTracks().forEach({
                                "BarberMirrorStudio.useEffect.open": (track)=>track.stop()
                            }["BarberMirrorStudio.useEffect.open"]);
                            return;
                        }
                        video.srcObject = stream;
                        await video.play();
                        setLive(true);
                        setCameraError("");
                        const { FaceLandmarker: Marker, FilesetResolver } = await __turbopack_context__.A("[project]/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs [app-client] (ecmascript, async loader)");
                        const fileset = await FilesetResolver.forVisionTasks(WASM);
                        const options = {
                            runningMode: "VIDEO",
                            numFaces: 1
                        };
                        try {
                            marker = await Marker.createFromOptions(fileset, {
                                ...options,
                                baseOptions: {
                                    modelAssetPath: MODEL,
                                    delegate: "GPU"
                                }
                            });
                        } catch  {
                            marker = await Marker.createFromOptions(fileset, {
                                ...options,
                                baseOptions: {
                                    modelAssetPath: MODEL,
                                    delegate: "CPU"
                                }
                            });
                        }
                        if (dead) {
                            marker.close();
                            marker = null;
                            return;
                        }
                        setTracking(true);
                    } catch  {
                        if (!dead) setCameraError("The mirror needs the camera.");
                    }
                }
            }["BarberMirrorStudio.useEffect.open"];
            raf = requestAnimationFrame(tick);
            void open();
            return ({
                "BarberMirrorStudio.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(raf);
                    marker?.close();
                    stopStream();
                }
            })["BarberMirrorStudio.useEffect"];
        }
    }["BarberMirrorStudio.useEffect"], [
        attempt,
        deckX,
        deckY,
        frameX,
        frameY,
        reduce
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: booking ? "barber-stage relative z-50 h-screen min-h-[100dvh] w-full overflow-hidden" : "barber-stage relative h-screen min-h-[100dvh] w-full overflow-hidden",
        "aria-label": "Barber mirror studio",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "barber-rig",
                style: {
                    scale: biokinetic.cameraDollyScale
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                        className: "barber-wall",
                        src: ROOM,
                        autoPlay: true,
                        loop: true,
                        muted: true,
                        playsInline: true
                    }, void 0, false, {
                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "barber-mirror",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "barber-glass relative h-full w-full overflow-hidden rounded-2xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                    ref: videoRef,
                                    className: "barber-reflection",
                                    playsInline: true,
                                    muted: true,
                                    autoPlay: true,
                                    width: 1280,
                                    height: 720
                                }, void 0, false, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 209,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "barber-live",
                                    children: tracking ? "Live mirror" : live ? "Finding a face" : "Mirror"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 218,
                                    columnNumber: 11
                                }, this),
                                cameraError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "barber-enable",
                                    onClick: ()=>setAttempt((n)=>n + 1),
                                    children: cameraError
                                }, void 0, false, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 220,
                                    columnNumber: 13
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 208,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "barber-frame-slot",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            className: "barber-frame",
                            style: {
                                x: frameX,
                                y: frameY
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 227,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "barber-vanity",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            style: {
                                x: deckX,
                                y: deckY
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "barber-unit",
                                role: "region",
                                "aria-label": "Head unit",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] uppercase tracking-[0.22em] text-muted",
                                        children: businessName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                        lineNumber: 232,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 font-display text-2xl text-fg",
                                        children: offer.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-accent",
                                        children: offer.price
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                        lineNumber: 234,
                                        columnNumber: 13
                                    }, this),
                                    details ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-muted",
                                        children: offer.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                        lineNumber: 235,
                                        columnNumber: 24
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 flex flex-wrap gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "barber-key",
                                                onClick: ()=>{
                                                    setIndex((n)=>(n + 1) % offers.length);
                                                    setDetails(false);
                                                },
                                                children: "Next"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                                lineNumber: 237,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "barber-key",
                                                onClick: ()=>setDetails((on)=>!on),
                                                children: "View Details"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                                lineNumber: 247,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "barber-key is-primary",
                                                onClick: ()=>{
                                                    setHeld(false);
                                                    setBooking(true);
                                                },
                                                children: "Book chair"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                                lineNumber: 250,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                        lineNumber: 236,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 230,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/barber-mirror-studio.tsx",
                        lineNumber: 229,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-x-0 top-0 z-20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "pointer-events-auto",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                    lineNumber: 266,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                lineNumber: 265,
                columnNumber: 7
            }, this),
            booking ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "barber-book fixed inset-0 z-50",
                role: "dialog",
                "aria-modal": "true",
                "aria-label": "Book a chair",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex h-full w-full max-w-lg flex-col justify-end px-5 py-8 sm:justify-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] uppercase tracking-[0.22em] text-muted",
                            children: "Chair book"
                        }, void 0, false, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 271,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mt-2 font-display text-4xl text-fg",
                            children: held ? "Held on the book." : offer.name
                        }, void 0, false, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 272,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 text-sm text-muted",
                            children: held ? "The chair has the request. Nothing was charged." : `${offer.description} ${offer.price}.`
                        }, void 0, false, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 273,
                            columnNumber: 13
                        }, this),
                        held ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            className: "mt-6 grid gap-3",
                            onSubmit: (event)=>{
                                event.preventDefault();
                                setHeld(true);
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "text-sm text-muted",
                                    children: [
                                        "Name",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: name,
                                            onChange: (event)=>setName(event.target.value),
                                            className: "mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                            lineNumber: 286,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 284,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "text-sm text-muted",
                                    children: [
                                        "Phone",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: phone,
                                            onChange: (event)=>setPhone(event.target.value),
                                            className: "mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                            lineNumber: 295,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 293,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "barber-key is-primary h-12",
                                    children: [
                                        "Confirm ",
                                        offer.price
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 302,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 277,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 flex gap-2",
                            children: [
                                bookHref && !held ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: bookHref,
                                    className: "barber-key inline-flex h-11 items-center",
                                    children: "Open the book"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 309,
                                    columnNumber: 17
                                }, this) : null,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "barber-key",
                                    onClick: ()=>{
                                        setBooking(false);
                                        setHeld(false);
                                    },
                                    children: held ? "Return to the mirror" : "Dismiss"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                                    lineNumber: 313,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/barber-mirror-studio.tsx",
                            lineNumber: 307,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/barber-mirror-studio.tsx",
                    lineNumber: 270,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/barber-mirror-studio.tsx",
                lineNumber: 269,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/barber-mirror-studio.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
_s(BarberMirrorStudio, "Vr+T/sD+FG7F1/lSbDf+kaIsnUU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBiokineticEngine"]
    ];
});
_c = BarberMirrorStudio;
var _c;
__turbopack_context__.k.register(_c, "BarberMirrorStudio");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/brand-studio.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AxiomGenerativeBrandingStudio",
    ()=>AxiomGenerativeBrandingStudio,
    "BrandStudio",
    ()=>BrandStudio
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/brand-studio.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function BrandStudio({ header, tagline, theme, disabled, onHeader, onTagline, onTheme }) {
    _s();
    const active = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rippleTheme"])(theme) ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"][0];
    const mark = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileBrandMark"])(header || "Axiom", tagline, active.accent);
    const surface = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["themeSurface"])(active);
    const [ripples, setRipples] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]",
        style: surface,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs uppercase tracking-[0.18em] text-muted",
                        children: "Branding studio"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: mark.dataUrl,
                        alt: "",
                        className: "mt-3 aspect-square w-full rounded-2xl bg-surface object-contain"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-xs text-muted",
                        children: [
                            mark.initials,
                            " fused with a ",
                            mark.symbol,
                            ". The mark rebuilds as the header changes."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/brand-studio.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                        htmlFor: "brand-header",
                        children: "Header"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                        id: "brand-header",
                        value: header,
                        disabled: disabled,
                        onChange: (event)=>onHeader(event.target.value),
                        placeholder: "Shop name",
                        className: "mt-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                        htmlFor: "brand-tagline",
                        className: "mt-3",
                        children: "Tagline"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                        id: "brand-tagline",
                        value: tagline,
                        disabled: disabled,
                        onChange: (event)=>onTagline(event.target.value),
                        placeholder: "One line under the name",
                        className: "mt-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-xs uppercase tracking-[0.18em] text-muted",
                        children: "Perimeter and touch ripple"
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2 flex flex-wrap gap-2",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"].map((item)=>{
                            const on = item.id === theme;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: disabled,
                                "aria-pressed": on,
                                onClick: ()=>onTheme(item.id),
                                className: "inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm text-fg",
                                style: {
                                    boxShadow: on ? `0 0 0 1px ${item.ring}, 0 0 16px color-mix(in srgb, ${item.accent} 55%, transparent)` : "0 0 0 1px rgba(243,241,235,0.12)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "size-3 rounded-full",
                                        style: {
                                            background: item.accent
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/brand-studio.tsx",
                                        lineNumber: 81,
                                        columnNumber: 17
                                    }, this),
                                    item.label
                                ]
                            }, item.id, true, {
                                fileName: "[project]/src/components/brand-studio.tsx",
                                lineNumber: 68,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "ripple-stage mt-4 h-28 w-full",
                        style: surface,
                        onPointerDown: (event)=>{
                            const bounds = event.currentTarget.getBoundingClientRect();
                            const id = Date.now();
                            setRipples((current)=>[
                                    ...current.slice(-4),
                                    {
                                        id,
                                        x: event.clientX - bounds.left,
                                        y: event.clientY - bounds.top
                                    }
                                ]);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "pointer-events-none text-sm text-fg",
                                children: "Touch the glass"
                            }, void 0, false, {
                                fileName: "[project]/src/components/brand-studio.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            ripples.map((ripple)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "touch-ripple",
                                    style: {
                                        left: ripple.x,
                                        top: ripple.y
                                    }
                                }, ripple.id, false, {
                                    fileName: "[project]/src/components/brand-studio.tsx",
                                    lineNumber: 99,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/brand-studio.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/brand-studio.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/brand-studio.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(BrandStudio, "vA9HsGhk6U8yLsrhZJc0FV4ig98=");
_c = BrandStudio;
const AxiomGenerativeBrandingStudio = BrandStudio;
var _c;
__turbopack_context__.k.register(_c, "BrandStudio");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/cinematic-hero.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CinematicHero",
    ()=>CinematicHero,
    "InsetFilm",
    ()=>InsetFilm,
    "IntroFxToggle",
    ()=>IntroFxToggle,
    "LoopVideo",
    ()=>LoopVideo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$scroll$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-scroll.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/auto-sequence.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$telemetry$2d$log$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/telemetry-log.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
function CinematicHero({ imageUrl, videoUrl, blendPercent, introPreset = "kenburns", introSpeed = 40, introIntensity = 45, replayKey, previewMode = false, tone = null, fallbackImageUrl = "", fallbackVideoUrl = "", brand = null, telemetry = [], className, sequence, dashboard = null, children }) {
    _s();
    const reels = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(videoUrl);
    const reelKey = reels.join("|");
    const primaryReel = reels[0] ?? "";
    const [reduced, setReduced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [fxOn, setFxOn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [videoOk, setVideoOk] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [imageSrc, setImageSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(imageUrl);
    const [videoSrc, setVideoSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(primaryReel);
    const tried = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const [beat, setBeat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("portal");
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sectionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    /**
   * Progress is 0 while the hero's top is at the top of the viewport and 1
   * when its bottom reaches that edge. Touch scrolling updates the same value.
   * The vh unit keeps this on the scroll listener. A named offset can be
   * promoted to a view timeline that stops reporting once it has been measured.
   */ const { scrollYProgress } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$scroll$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useScroll"])({
        target: sectionRef,
        offset: [
            "start 0vh",
            "end 0vh"
        ]
    });
    const plateY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const backgroundY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const particleY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const washY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const lightY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const foregroundY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
            setReduced(mq.matches);
            const onChange = {
                "CinematicHero.useEffect.onChange": ()=>setReduced(mq.matches)
            }["CinematicHero.useEffect.onChange"];
            mq.addEventListener("change", onChange);
            return ({
                "CinematicHero.useEffect": ()=>mq.removeEventListener("change", onChange)
            })["CinematicHero.useEffect"];
        }
    }["CinematicHero.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            if (previewMode) return;
            const sync = {
                "CinematicHero.useEffect.sync": ()=>{
                    const autoFilm = sequence === "auto" || primaryReel === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_SRC"];
                    if (autoFilm && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readIntroFx"])()) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["writeIntroFx"])(true);
                    setFxOn(autoFilm ? true : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readIntroFx"])());
                }
            }["CinematicHero.useEffect.sync"];
            sync();
            window.addEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INTRO_FX_EVENT"], sync);
            window.addEventListener("storage", sync);
            return ({
                "CinematicHero.useEffect": ()=>{
                    window.removeEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INTRO_FX_EVENT"], sync);
                    window.removeEventListener("storage", sync);
                }
            })["CinematicHero.useEffect"];
        }
    }["CinematicHero.useEffect"], [
        previewMode,
        sequence,
        reelKey,
        primaryReel
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            tried.current = new Set();
            setImageSrc(imageUrl);
            setVideoSrc(primaryReel);
            setVideoOk(Boolean(primaryReel));
        }
    }["CinematicHero.useEffect"], [
        imageUrl,
        reelKey,
        primaryReel
    ]);
    const sequenced = sequence === "auto";
    const autoFilm = sequenced || videoSrc === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_SRC"];
    const showAutoPlayer = autoFilm;
    const activeVideo = showAutoPlayer ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_SRC"] : videoSrc;
    const cycling = reels.length > 1 && reels.includes(videoSrc) && !showAutoPlayer;
    const activeReel = Math.max(0, reels.indexOf(videoSrc));
    const advanceReel = ()=>{
        if (!cycling) return;
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextReelIndex"])(reels.indexOf(videoSrc), reels.length);
        setVideoSrc(reels[next] ?? videoSrc);
        setVideoOk(true);
    };
    const missReel = ()=>{
        if (cycling && !tried.current.has(videoSrc)) {
            tried.current.add(videoSrc);
            if (tried.current.size < reels.length) {
                const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextReelIndex"])(reels.indexOf(videoSrc), reels.length);
                setVideoSrc(reels[next] ?? "");
                setVideoOk(true);
                return;
            }
        }
        if (fallbackVideoUrl && videoSrc !== fallbackVideoUrl) {
            setVideoSrc(fallbackVideoUrl);
            setVideoOk(true);
            return;
        }
        setVideoOk(false);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            if (!sequenced) return;
            if (reduced) {
                setBeat("dashboard");
                return;
            }
            setBeat("portal");
            const cut = window.setTimeout({
                "CinematicHero.useEffect.cut": ()=>{
                    setBeat({
                        "CinematicHero.useEffect.cut": (current)=>current === "portal" ? "mechanic" : current
                    }["CinematicHero.useEffect.cut"]);
                }
            }["CinematicHero.useEffect.cut"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_SEQUENCE"].portalMs);
            const desk = window.setTimeout({
                "CinematicHero.useEffect.desk": ()=>{
                    setBeat("dashboard");
                }
            }["CinematicHero.useEffect.desk"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_SEQUENCE"].portalMs + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_SEQUENCE"].dashboardSec * 1000 + 800);
            return ({
                "CinematicHero.useEffect": ()=>{
                    window.clearTimeout(cut);
                    window.clearTimeout(desk);
                }
            })["CinematicHero.useEffect"];
        }
    }["CinematicHero.useEffect"], [
        reduced,
        sequenced,
        replayKey
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            const el = videoRef.current;
            if (!showAutoPlayer || !el) return;
            el.muted = true;
            el.loop = true;
            void el.play().catch({
                "CinematicHero.useEffect": ()=>undefined
            }["CinematicHero.useEffect"]);
        }
    }["CinematicHero.useEffect"], [
        activeVideo,
        showAutoPlayer,
        beat
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            const root = sectionRef.current;
            if (!root || !videoSrc) return;
            const sync = {
                "CinematicHero.useEffect.sync": ()=>{
                    root.querySelectorAll("video").forEach({
                        "CinematicHero.useEffect.sync": (el)=>{
                            el.muted = true;
                            if (document.visibilityState !== "visible") {
                                el.pause();
                                return;
                            }
                            void el.play().catch({
                                "CinematicHero.useEffect.sync": ()=>undefined
                            }["CinematicHero.useEffect.sync"]);
                        }
                    }["CinematicHero.useEffect.sync"]);
                }
            }["CinematicHero.useEffect.sync"];
            sync();
            const el = videoRef.current;
            el?.addEventListener("canplay", sync);
            document.addEventListener("visibilitychange", sync);
            return ({
                "CinematicHero.useEffect": ()=>{
                    el?.removeEventListener("canplay", sync);
                    document.removeEventListener("visibilitychange", sync);
                }
            })["CinematicHero.useEffect"];
        }
    }["CinematicHero.useEffect"], [
        videoSrc,
        videoOk,
        imageSrc,
        sequenced,
        beat
    ]);
    const skip = reduced || !previewMode && !fxOn || sequenced;
    const preset = skip ? "none" : introPreset;
    const intensity = Number.isFinite(introIntensity) ? introIntensity : 45;
    const speed = Number.isFinite(introSpeed) ? introSpeed : 40;
    const blend = Number.isFinite(blendPercent) ? blendPercent : 60;
    const motionProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cameraMotion"])(preset, intensity);
    const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["introDurationSec"])(speed);
    const animate = preset !== "none";
    const depthOn = !skip && intensity > 0;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicHero.useEffect": ()=>{
            if (sequenced) {
                plateY.set(0);
                backgroundY.set(0);
                particleY.set(0);
                washY.set(0);
                lightY.set(0);
                foregroundY.set(0);
                if (videoRef.current) videoRef.current.playbackRate = 1;
                return;
            }
            // One scroll position drives every layer. Speeds come from parallaxTravel:
            // film slowest, wash and light farther, title in the opposite direction.
            const apply = {
                "CinematicHero.useEffect.apply": (progress)=>{
                    const travel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parallaxTravel"])(depthOn ? intensity : 0, speed);
                    plateY.set(progress * travel.plate);
                    backgroundY.set(progress * travel.background);
                    particleY.set(progress * travel.particles);
                    washY.set(progress * travel.wash);
                    lightY.set(progress * travel.light);
                    foregroundY.set(progress * travel.foreground);
                    const el = videoRef.current;
                    if (!el) return;
                    const next = depthOn ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroPlaybackRate"])(progress, intensity) : 1;
                    if (el.playbackRate !== next) el.playbackRate = next;
                }
            }["CinematicHero.useEffect.apply"];
            apply(scrollYProgress.get());
            const stop = scrollYProgress.on("change", apply);
            return ({
                "CinematicHero.useEffect": ()=>{
                    stop();
                    plateY.set(0);
                    backgroundY.set(0);
                    particleY.set(0);
                    washY.set(0);
                    lightY.set(0);
                    foregroundY.set(0);
                    if (videoRef.current) videoRef.current.playbackRate = 1;
                }
            })["CinematicHero.useEffect"];
        }
    }["CinematicHero.useEffect"], [
        scrollYProgress,
        depthOn,
        intensity,
        speed,
        plateY,
        backgroundY,
        particleY,
        washY,
        lightY,
        foregroundY,
        sequenced
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        ref: sectionRef,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative isolate flex w-full flex-col overflow-hidden bg-transparent", previewMode ? "min-h-[28rem]" : "h-screen min-h-[100dvh]", sequenced && (beat === "dashboard" ? "hero-sequence is-dashboard" : "hero-sequence is-reel"), className),
        style: {
            ["--hero-blend"]: `${blend}%`
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hero-blend absolute inset-0 h-full w-full overflow-hidden",
                children: [
                    imageSrc || videoSrc && videoOk ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute -inset-[8%] origin-center", depthOn && "will-change-transform"),
                        style: {
                            y: plateY
                        },
                        initial: animate ? {
                            scale: 1.16
                        } : {
                            scale: 1.06
                        },
                        animate: {
                            scale: 1.06
                        },
                        transition: animate ? {
                            duration: 2.4,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        } : {
                            duration: 0
                        },
                        children: imageSrc ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: imageSrc,
                            alt: "",
                            className: "hero-plate pointer-events-none absolute inset-0 h-full w-full object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/components/cinematic-hero.tsx",
                            lineNumber: 277,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                            className: "hero-plate pointer-events-none absolute inset-0 h-full w-full object-cover",
                            src: videoSrc,
                            autoPlay: true,
                            loop: !cycling,
                            muted: true,
                            playsInline: true,
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/src/components/cinematic-hero.tsx",
                            lineNumber: 279,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("hero-sharp absolute inset-0 origin-center", depthOn && "will-change-transform"),
                        style: {
                            y: backgroundY
                        },
                        initial: {
                            scale: 1
                        },
                        animate: {
                            scale: 1
                        },
                        transition: animate ? {
                            duration: 1.8,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        } : {
                            duration: 0
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            className: "hero-sharp absolute inset-0 origin-center",
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
                                    0.22,
                                    0.08,
                                    0.2,
                                    1
                                ]
                            } : {
                                duration: 0
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hero-subject absolute inset-0",
                                children: [
                                    imageSrc ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: imageSrc,
                                        alt: "",
                                        className: "hero-frame pointer-events-none absolute inset-0 h-full w-full object-cover outline-none",
                                        onError: ()=>{
                                            if (fallbackImageUrl && imageSrc !== fallbackImageUrl) {
                                                setImageSrc(fallbackImageUrl);
                                                return;
                                            }
                                            setImageSrc("");
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/cinematic-hero.tsx",
                                        lineNumber: 312,
                                        columnNumber: 15
                                    }, this) : null,
                                    showAutoPlayer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "hero-player absolute inset-0 z-[6]",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                            ref: videoRef,
                                            "data-film": "auto-hero",
                                            className: "hero-frame pointer-events-none absolute inset-0 h-full w-full object-cover",
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_SRC"],
                                            autoPlay: true,
                                            muted: true,
                                            loop: true,
                                            playsInline: true,
                                            preload: "auto",
                                            poster: imageSrc || undefined,
                                            onError: (event)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["swapMissingAutoHero"])(event.currentTarget),
                                            onTimeUpdate: (event)=>{
                                                if (!sequenced) return;
                                                const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["autoBeatFromFilm"])(event.currentTarget.currentTime);
                                                setBeat((current)=>current === "portal" || current === next ? current : next);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/cinematic-hero.tsx",
                                            lineNumber: 327,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/cinematic-hero.tsx",
                                        lineNumber: 326,
                                        columnNumber: 15
                                    }, this) : videoSrc && videoOk ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                        ref: videoRef,
                                        className: "hero-frame pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover",
                                        src: videoSrc,
                                        autoPlay: true,
                                        loop: !cycling,
                                        muted: true,
                                        playsInline: true,
                                        poster: imageSrc || undefined,
                                        onEnded: advanceReel,
                                        onError: missReel
                                    }, `${videoSrc}-${replayKey ?? "0"}`, false, {
                                        fileName: "[project]/src/components/cinematic-hero.tsx",
                                        lineNumber: 347,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/cinematic-hero.tsx",
                                lineNumber: 310,
                                columnNumber: 13
                            }, this)
                        }, `${imageSrc}-${videoSrc}-${preset}-${replayKey ?? "0"}`, false, {
                            fileName: "[project]/src/components/cinematic-hero.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 292,
                        columnNumber: 9
                    }, this),
                    reduced ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute inset-0 z-[2]",
                        style: {
                            y: particleY
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HeroMotes, {}, void 0, false, {
                            fileName: "[project]/src/components/cinematic-hero.tsx",
                            lineNumber: 370,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 365,
                        columnNumber: 11
                    }, this),
                    tone ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        "aria-hidden": true,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("pointer-events-none absolute inset-0 z-[2]", depthOn && "will-change-transform", tone === "stage" && "hero-stage", tone === "site" && "hero-site", tone === "backcountry" && "hero-grade-backcountry", tone === "cinema" && "hero-grade-cinema"),
                        style: {
                            y: washY
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 374,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        "aria-hidden": true,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("hero-atmosphere pointer-events-none absolute inset-0 z-[3]", depthOn && "will-change-transform"),
                        style: {
                            y: lightY
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 387,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": true,
                        className: "hero-scan pointer-events-none absolute inset-0 z-[4]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 395,
                        columnNumber: 9
                    }, this),
                    animate ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute inset-0 z-[4] bg-[#050507]",
                        initial: {
                            opacity: 0.55
                        },
                        animate: {
                            opacity: 0
                        },
                        transition: {
                            duration: 1.6,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 397,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 267,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hero-dissolve pointer-events-none absolute inset-0 z-10"
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 406,
                columnNumber: 7
            }, this),
            brand?.name ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute bottom-8 left-5 z-30 flex max-w-[min(28rem,70%)] items-center gap-3 sm:left-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "h-10 w-1 shrink-0 rounded-full",
                        style: {
                            background: brand.accent || "var(--color-accent)"
                        },
                        "aria-hidden": true
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 409,
                        columnNumber: 11
                    }, this),
                    brand.logoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: brand.logoUrl,
                        alt: "",
                        className: "h-9 w-9 rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 415,
                        columnNumber: 13
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "truncate text-[11px] uppercase tracking-[0.22em] text-fg",
                                style: {
                                    textShadow: "0 8px 20px rgba(0,0,0,0.7)"
                                },
                                children: brand.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/cinematic-hero.tsx",
                                lineNumber: 418,
                                columnNumber: 13
                            }, this),
                            brand.trade || brand.city ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "truncate text-[10px] uppercase tracking-[0.16em] text-fg/80",
                                style: {
                                    textShadow: "0 8px 20px rgba(0,0,0,0.7)"
                                },
                                children: [
                                    brand.trade,
                                    brand.city
                                ].filter(Boolean).join(" · ")
                            }, void 0, false, {
                                fileName: "[project]/src/components/cinematic-hero.tsx",
                                lineNumber: 425,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 417,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 408,
                columnNumber: 9
            }, this) : null,
            cycling ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-auto absolute bottom-24 right-5 z-30 flex items-center gap-1 rounded-full bg-bg/70 px-2 py-1 sm:right-8",
                role: "group",
                "aria-label": "Hero reels",
                children: reels.map((src, index)=>{
                    const current = index === activeReel;
                    const name = (src.split("/").pop() ?? `Reel ${index + 1}`).replace(/(\.mp4)+$/i, "").replace(/-/g, " ");
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-current": current ? "true" : undefined,
                        "aria-label": `${name}, reel ${index + 1} of ${reels.length}`,
                        onClick: ()=>{
                            tried.current.delete(src);
                            setVideoSrc(src);
                            setVideoOk(true);
                        },
                        className: "inline-flex h-11 w-11 items-center justify-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("block h-1.5 rounded-full", current ? "w-6 bg-accent" : "w-1.5 bg-fg/50")
                        }, void 0, false, {
                            fileName: "[project]/src/components/cinematic-hero.tsx",
                            lineNumber: 457,
                            columnNumber: 17
                        }, this)
                    }, src, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 445,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 436,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "sr-only",
                "aria-live": "polite",
                children: cycling ? `Reel ${activeReel + 1} of ${reels.length}` : sequenced ? beat === "portal" ? "Portal" : beat === "mechanic" ? "Mechanic at the car" : beat === "headunit" ? "Interior head unit" : "Axiom desk" : ""
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$telemetry$2d$log$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TelemetryLog"], {
                dataset: telemetry
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 476,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("hero-foreground relative z-20 flex min-h-0 flex-1 flex-col", depthOn && "will-change-transform"),
                style: {
                    y: foregroundY
                },
                children: [
                    children,
                    sequenced && dashboard ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative z-10 flex min-h-0 flex-1 flex-col",
                        "aria-hidden": beat !== "dashboard",
                        children: dashboard
                    }, void 0, false, {
                        fileName: "[project]/src/components/cinematic-hero.tsx",
                        lineNumber: 486,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 477,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/cinematic-hero.tsx",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
_s(CinematicHero, "BWm1jIZXqUFfRuUir2YQsMAh4m4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$scroll$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useScroll"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"]
    ];
});
_c = CinematicHero;
const MOTES = Array.from({
    length: 26
}, (_, i)=>({
        id: i,
        left: (i * 37 + 11) % 100,
        top: (i * 53 + 7) % 100,
        size: 1.5 + i % 3 * 0.9,
        delay: `${i % 8 * 0.65}s`,
        duration: `${9 + i % 5 * 1.7}s`,
        drift: 10 + i % 4 * 7
    }));
function HeroMotes() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: MOTES.map((mote)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "hero-mote",
                style: {
                    left: `${mote.left}%`,
                    top: `${mote.top}%`,
                    width: mote.size,
                    height: mote.size,
                    ["--mote-delay"]: mote.delay,
                    ["--mote-duration"]: mote.duration,
                    ["--mote-drift"]: String(mote.drift)
                }
            }, mote.id, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 509,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/cinematic-hero.tsx",
        lineNumber: 507,
        columnNumber: 5
    }, this);
}
_c1 = HeroMotes;
function InsetFilm({ imageUrl, videoUrl }) {
    if (!videoUrl && !imageUrl) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("figure", {
        className: "overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative aspect-[16/10] overflow-hidden bg-surface-2",
            children: videoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoopVideo, {
                src: videoUrl,
                className: "absolute inset-0"
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 533,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: imageUrl,
                alt: "",
                className: "h-full w-full object-cover outline-none"
            }, void 0, false, {
                fileName: "[project]/src/components/cinematic-hero.tsx",
                lineNumber: 535,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/cinematic-hero.tsx",
            lineNumber: 531,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/cinematic-hero.tsx",
        lineNumber: 530,
        columnNumber: 5
    }, this);
}
_c2 = InsetFilm;
function LoopVideo({ src, className }) {
    _s1();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoopVideo.useEffect": ()=>{
            const el = ref.current;
            if (!el || !src) return;
            el.muted = true;
            const play = {
                "LoopVideo.useEffect.play": ()=>{
                    void el.play().catch({
                        "LoopVideo.useEffect.play": ()=>undefined
                    }["LoopVideo.useEffect.play"]);
                }
            }["LoopVideo.useEffect.play"];
            play();
            el.addEventListener("canplay", play);
            return ({
                "LoopVideo.useEffect": ()=>el.removeEventListener("canplay", play)
            })["LoopVideo.useEffect"];
        }
    }["LoopVideo.useEffect"], [
        src
    ]);
    if (!src) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("h-full w-full object-cover", className),
        src: src,
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "auto"
    }, void 0, false, {
        fileName: "[project]/src/components/cinematic-hero.tsx",
        lineNumber: 560,
        columnNumber: 5
    }, this);
}
_s1(LoopVideo, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c3 = LoopVideo;
function IntroFxToggle({ className }) {
    _s2();
    const [on, setOn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IntroFxToggle.useEffect": ()=>{
            setOn((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readIntroFx"])());
            const sync = {
                "IntroFxToggle.useEffect.sync": ()=>setOn((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readIntroFx"])())
            }["IntroFxToggle.useEffect.sync"];
            window.addEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INTRO_FX_EVENT"], sync);
            return ({
                "IntroFxToggle.useEffect": ()=>window.removeEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INTRO_FX_EVENT"], sync)
            })["IntroFxToggle.useEffect"];
        }
    }["IntroFxToggle.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        "aria-pressed": on,
        onClick: ()=>{
            const next = !on;
            setOn(next);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["writeIntroFx"])(next);
        },
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted transition-[color,background-color] duration-150 hover:text-fg", className),
        children: [
            "Intro FX · ",
            on ? "On" : "Off"
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/cinematic-hero.tsx",
        lineNumber: 584,
        columnNumber: 5
    }, this);
}
_s2(IntroFxToggle, "w46BMHgN9sqGmFSTfafl0xkHEzw=");
_c4 = IntroFxToggle;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "CinematicHero");
__turbopack_context__.k.register(_c1, "HeroMotes");
__turbopack_context__.k.register(_c2, "InsetFilm");
__turbopack_context__.k.register(_c3, "LoopVideo");
__turbopack_context__.k.register(_c4, "IntroFxToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/glassy-mountain-lake.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlassyMountainLake",
    ()=>GlassyMountainLake
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/lake-physics.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const COLS = 128;
const ROWS = 72;
const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uHeight;
uniform vec2 uRes;
uniform vec2 uGrid;
uniform float uSunY;
uniform float uGlass;
in vec2 vUv;
out vec4 frag;

float peaks(vec2 xz) {
  float far = 1.0 - smoothstep(-1.5, 0.35, xz.y);
  float h = 0.0;
  h += 0.9 * exp(-pow((xz.x + 0.72) * 1.8, 2.0));
  h += 1.35 * exp(-pow(xz.x * 1.2, 2.0));
  h += 0.75 * exp(-pow((xz.x - 0.82) * 1.9, 2.0));
  h += 0.12 * sin(xz.x * 6.0);
  return h * far;
}

vec3 sky(vec3 rd, vec3 sun) {
  float lift = clamp(rd.y, 0.0, 1.0);
  vec3 zenith = vec3(0.08, 0.06, 0.16);
  vec3 horizon = vec3(0.93, 0.34, 0.14);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.72, lift));
  float glow = pow(max(dot(rd, sun), 0.0), 7.0);
  float disk = pow(max(dot(rd, sun), 0.0), 260.0);
  col += vec3(1.0, 0.58, 0.26) * glow * 0.7;
  col += vec3(1.0, 0.86, 0.62) * disk;
  return col;
}

float sunShadow(vec3 p, vec3 sun) {
  vec3 q = p;
  for (int i = 0; i < 10; i++) {
    q += sun * 0.22;
    if (q.y < peaks(q.xz)) return 0.42;
  }
  return 1.0;
}

bool marchMountain(vec3 ro, vec3 rd, float limit, out vec3 pos, out vec3 nor, out float dist) {
  float t = 0.2;
  for (int i = 0; i < 24; i++) {
    if (t >= limit) break;
    vec3 p = ro + rd * t;
    float h = peaks(p.xz);
    if (p.y < h && h > 0.04) {
      float e = 0.05;
      float hx = peaks(p.xz + vec2(e, 0.0));
      float hz = peaks(p.xz + vec2(0.0, e));
      pos = vec3(p.x, h, p.z);
      nor = normalize(vec3(h - hx, e, h - hz));
      dist = t;
      return true;
    }
    t += 0.12;
  }
  return false;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec3 ro = vec3(0.0, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].eyeY.toFixed(2)}, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].eyeZ.toFixed(2)});
  vec3 rd = normalize(vec3((uv.x * 2.0 - 1.0) * aspect, uv.y * 2.0 - 1.0, ${(-__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].focal).toFixed(2)}));
  vec3 sun = normalize(vec3(0.58, clamp(uSunY, 0.05, 0.9), -0.32));
  vec3 col = sky(rd, sun);
  float waterT = rd.y < -0.02 ? -ro.y / rd.y : 30.0;
  vec3 mpos;
  vec3 mnor;
  float mdist;
  if (marchMountain(ro, rd, waterT, mpos, mnor, mdist)) {
    float ndl = clamp(dot(mnor, sun), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(mnor, -rd), 0.0, 1.0), 2.2);
    vec3 rock = mix(vec3(0.08, 0.05, 0.09), vec3(0.72, 0.32, 0.18), ndl);
    rock += vec3(1.0, 0.55, 0.26) * rim * 0.45;
    col = rock * mix(0.4, 1.0, sunShadow(mpos + mnor * 0.08, sun));
  } else if (waterT > 0.0 && waterT < 16.0) {
    vec3 p = ro + rd * waterT;
    vec2 st = p.xz * vec2(${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].scaleX.toFixed(2)}, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].scaleZ.toFixed(2)}) + vec2(${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].biasX.toFixed(2)}, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LAKE_CAMERA"].biasZ.toFixed(2)});
    if (st.x > 0.0 && st.x < 1.0 && st.y > 0.0 && st.y < 1.0) {
      vec2 texel = 1.0 / uGrid;
      float h = (texture(uHeight, st).r - 0.5) * 0.25;
      float hx = (texture(uHeight, st + vec2(texel.x, 0.0)).r - 0.5) * 0.25;
      float hy = (texture(uHeight, st + vec2(0.0, texel.y)).r - 0.5) * 0.25;
      vec3 n = normalize(vec3(h - hx, 0.055, h - hy));
      vec3 refl = reflect(rd, n);
      vec3 reflected = sky(refl, sun);
      vec3 rp;
      vec3 rn;
      float rd2;
      if (marchMountain(p + n * 0.05, refl, 12.0, rp, rn, rd2)) {
        float ndl = clamp(dot(rn, sun), 0.0, 1.0);
        reflected = mix(vec3(0.1, 0.06, 0.08), vec3(0.78, 0.36, 0.2), ndl);
      }
      float fres = mix(0.08, 0.96, pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0));
      fres = mix(0.2, fres, clamp(uGlass, 0.0, 1.0));
      float spec = pow(clamp(dot(refl, sun), 0.0, 1.0), 160.0);
      vec3 water = mix(vec3(0.03, 0.07, 0.1), reflected, fres);
      water += vec3(1.0, 0.8, 0.5) * spec;
      water *= mix(0.5, 1.0, sunShadow(p + vec3(0.0, 0.04, 0.0), sun));
      col = water;
    }
  }
  frag = vec4(col, 1.0);
}
`;
const INITIAL = {
    tension: 0.72,
    damping: 0.986,
    droplet: 2.2,
    swipe: 7.2,
    glass: 0.86,
    sun: 0.24
};
function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function GlassyMountainLake({ title }) {
    _s();
    "use no memo";
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const knobs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        ...INITIAL
    });
    const resetRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const dropRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("droplet");
    const [values, setValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        ...INITIAL
    });
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GlassyMountainLake.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            let dead = false;
            let frame = 0;
            let release = null;
            const start = {
                "GlassyMountainLake.useEffect.start": ()=>{
                    if (dead || release) return;
                    try {
                        var _s = __turbopack_context__.k.signature();
                        const rect = canvas.getBoundingClientRect();
                        if (rect.width < 8 || rect.height < 8) return;
                        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
                        canvas.width = Math.max(2, Math.floor(rect.width * dpr));
                        canvas.height = Math.max(2, Math.floor(rect.height * dpr));
                        const gl = canvas.getContext("webgl2", {
                            alpha: false,
                            antialias: false,
                            depth: false,
                            powerPreference: "high-performance"
                        });
                        if (!gl) {
                            setReady(false);
                            return;
                        }
                        const vs = compile(gl, gl.VERTEX_SHADER, VERT);
                        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
                        const program = gl.createProgram();
                        if (!vs || !fs || !program) {
                            setReady(false);
                            return;
                        }
                        gl.attachShader(program, vs);
                        gl.attachShader(program, fs);
                        gl.bindAttribLocation(program, 0, "aPos");
                        gl.linkProgram(program);
                        gl.deleteShader(vs);
                        gl.deleteShader(fs);
                        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                            console.error(gl.getProgramInfoLog(program));
                            setReady(false);
                            return;
                        }
                        const buffer = gl.createBuffer();
                        const texture = gl.createTexture();
                        if (!buffer || !texture) {
                            setReady(false);
                            return;
                        }
                        gl.useProgram(program);
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                            -1,
                            -1,
                            3,
                            -1,
                            -1,
                            3
                        ]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(0);
                        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                        const uHeight = gl.getUniformLocation(program, "uHeight");
                        const uRes = gl.getUniformLocation(program, "uRes");
                        const uGrid = gl.getUniformLocation(program, "uGrid");
                        const uSunY = gl.getUniformLocation(program, "uSunY");
                        const uGlass = gl.getUniformLocation(program, "uGlass");
                        const sim = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createLake"])(COLS, ROWS);
                        const packed = new Uint8Array(COLS * ROWS * 4);
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["packHeights"])(sim.curr, packed);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, COLS, ROWS, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed);
                        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
                        let activeUntil = 0;
                        let pointerId = -1;
                        let originX = 0;
                        let originY = 0;
                        let lastX = 0;
                        let lastY = 0;
                        let moved = 0;
                        let down = false;
                        let shown = "droplet";
                        const showMode = {
                            "GlassyMountainLake.useEffect.start.showMode": (next)=>{
                                if (shown === next) return;
                                shown = next;
                                setMode(next);
                            }
                        }["GlassyMountainLake.useEffect.start.showMode"];
                        const cellAt = {
                            "GlassyMountainLake.useEffect.start.cellAt": (px, py)=>{
                                const rect = canvas.getBoundingClientRect();
                                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pointerToLake"])(px - rect.left, py - rect.top, rect.width, rect.height, COLS, ROWS);
                            }
                        }["GlassyMountainLake.useEffect.start.cellAt"];
                        const draw = {
                            "GlassyMountainLake.useEffect.start.draw": ()=>{
                                _s();
                                const settings = knobs.current;
                                if (resetRef.current) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stillLake"])(sim);
                                    resetRef.current = false;
                                }
                                if (dropRef.current) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stampLake"])(sim, COLS * 0.5, ROWS * 0.48, settings.droplet, 0.22);
                                    dropRef.current = false;
                                    activeUntil = performance.now() + 2400;
                                }
                                const moving = !reduced.matches || performance.now() < activeUntil;
                                if (moving) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stepLake"])(sim, settings.tension, settings.damping);
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["packHeights"])(sim.curr, packed);
                                gl.activeTexture(gl.TEXTURE0);
                                gl.bindTexture(gl.TEXTURE_2D, texture);
                                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RGBA, gl.UNSIGNED_BYTE, packed);
                                gl.useProgram(program);
                                gl.viewport(0, 0, canvas.width, canvas.height);
                                gl.uniform1i(uHeight, 0);
                                gl.uniform2f(uRes, canvas.width, canvas.height);
                                gl.uniform2f(uGrid, COLS, ROWS);
                                gl.uniform1f(uSunY, settings.sun);
                                gl.uniform1f(uGlass, settings.glass);
                                gl.drawArrays(gl.TRIANGLES, 0, 3);
                            }
                        }["GlassyMountainLake.useEffect.start.draw"];
                        _s(draw, "ZdQBZ3rq7bWAAMQq6hlVCmYF0jM=", false, {
                            "GlassyMountainLake.useEffect.start": function() {
                                return [
                                    gl.useProgram
                                ];
                            }
                        }["GlassyMountainLake.useEffect.start"]);
                        const onDown = {
                            "GlassyMountainLake.useEffect.start.onDown": (event)=>{
                                if (event.button !== 0) return;
                                canvas.setPointerCapture(event.pointerId);
                                pointerId = event.pointerId;
                                originX = event.clientX;
                                originY = event.clientY;
                                lastX = event.clientX;
                                lastY = event.clientY;
                                moved = 0;
                                down = true;
                                showMode("droplet");
                            }
                        }["GlassyMountainLake.useEffect.start.onDown"];
                        const onMove = {
                            "GlassyMountainLake.useEffect.start.onMove": (event)=>{
                                if (!down || event.pointerId !== pointerId) return;
                                const dist = Math.hypot(event.clientX - originX, event.clientY - originY);
                                moved = Math.max(moved, dist);
                                const modeNow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["strokeMode"])(moved);
                                if (modeNow === "swipe") {
                                    showMode("swipe");
                                    const from = cellAt(lastX, lastY);
                                    const to = cellAt(event.clientX, event.clientY);
                                    if (from && to) {
                                        const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 1.4));
                                        const settings = knobs.current;
                                        for(let i = 1; i <= steps; i += 1){
                                            const t = i / steps;
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stampLake"])(sim, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, settings.swipe, 0.035);
                                        }
                                        activeUntil = performance.now() + 2600;
                                    }
                                }
                                lastX = event.clientX;
                                lastY = event.clientY;
                            }
                        }["GlassyMountainLake.useEffect.start.onMove"];
                        const onUp = {
                            "GlassyMountainLake.useEffect.start.onUp": (event)=>{
                                if (!down || event.pointerId !== pointerId) return;
                                down = false;
                                const modeNow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["strokeMode"])(moved);
                                showMode(modeNow);
                                if (modeNow === "droplet") {
                                    const hit = cellAt(event.clientX, event.clientY);
                                    if (hit) {
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$lake$2d$physics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stampLake"])(sim, hit.x, hit.y, knobs.current.droplet, 0.24);
                                        activeUntil = performance.now() + 2600;
                                    }
                                }
                            }
                        }["GlassyMountainLake.useEffect.start.onUp"];
                        const loop = {
                            "GlassyMountainLake.useEffect.start.loop": ()=>{
                                if (dead) return;
                                draw();
                                frame = requestAnimationFrame(loop);
                            }
                        }["GlassyMountainLake.useEffect.start.loop"];
                        draw();
                        frame = requestAnimationFrame(loop);
                        canvas.addEventListener("pointerdown", onDown);
                        canvas.addEventListener("pointermove", onMove);
                        canvas.addEventListener("pointerup", onUp);
                        canvas.addEventListener("pointercancel", onUp);
                        release = ({
                            "GlassyMountainLake.useEffect.start": ()=>{
                                canvas.removeEventListener("pointerdown", onDown);
                                canvas.removeEventListener("pointermove", onMove);
                                canvas.removeEventListener("pointerup", onUp);
                                canvas.removeEventListener("pointercancel", onUp);
                                gl.deleteTexture(texture);
                                gl.deleteBuffer(buffer);
                                gl.deleteProgram(program);
                            }
                        })["GlassyMountainLake.useEffect.start"];
                    } catch (err) {
                        console.error(err);
                        setReady(false);
                    }
                }
            }["GlassyMountainLake.useEffect.start"];
            start();
            const observer = new ResizeObserver({
                "GlassyMountainLake.useEffect": ()=>start()
            }["GlassyMountainLake.useEffect"]);
            observer.observe(canvas);
            return ({
                "GlassyMountainLake.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(frame);
                    observer.disconnect();
                    release?.();
                }
            })["GlassyMountainLake.useEffect"];
        }
    }["GlassyMountainLake.useEffect"], []);
    const setKnob = (key, value)=>{
        knobs.current = {
            ...knobs.current,
            [key]: value
        };
        setValues((current)=>({
                ...current,
                [key]: value
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Glassy mountain lake",
        className: "pointer-events-auto relative z-40 mx-auto mb-8 w-full max-w-5xl px-5 pt-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "glass-panel overflow-hidden rounded-[24px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-[min(42vh,22rem)] min-h-56 bg-bg",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                            ref: canvasRef,
                            "aria-label": "Lake surface",
                            className: "pointer-events-auto absolute inset-0 h-full w-full touch-none"
                        }, void 0, false, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 401,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "pointer-events-none absolute left-4 top-4 text-sm text-fg",
                            children: title || "Mountain lake"
                        }, void 0, false, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 406,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "pointer-events-none absolute bottom-4 left-4 rounded-full bg-bg/70 px-3 py-1 text-sm text-fg",
                            children: mode === "swipe" ? "Wide swipe" : "Tap droplet"
                        }, void 0, false, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 407,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pointer-events-auto absolute right-4 top-4 flex flex-wrap justify-end gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "pointer-events-auto inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm font-medium text-bg",
                                    onClick: ()=>{
                                        dropRef.current = true;
                                        setMode("droplet");
                                    },
                                    children: "Drop"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 411,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg",
                                    onClick: ()=>{
                                        resetRef.current = true;
                                    },
                                    children: "Still the lake"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 421,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 410,
                            columnNumber: 11
                        }, this),
                        ready ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted",
                            children: "This display has no WebGL2 lake."
                        }, void 0, false, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 432,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                    lineNumber: 400,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "pointer-events-auto grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-[1fr_1fr] sm:px-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-display text-2xl text-fg",
                                    children: "Ripple Studio"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 439,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-muted",
                                    children: "Tap the water for a droplet. Drag across it for a smooth wide wake."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 440,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 438,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-3 text-sm text-muted",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Tension",
                                    min: 0.35,
                                    max: 1,
                                    step: 0.01,
                                    value: values.tension,
                                    onChange: (value)=>setKnob("tension", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 443,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Damping",
                                    min: 0.94,
                                    max: 0.996,
                                    step: 0.001,
                                    value: values.damping,
                                    onChange: (value)=>setKnob("damping", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 444,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Droplet",
                                    min: 1,
                                    max: 5,
                                    step: 0.1,
                                    value: values.droplet,
                                    onChange: (value)=>setKnob("droplet", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 445,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Swipe width",
                                    min: 3,
                                    max: 14,
                                    step: 0.1,
                                    value: values.swipe,
                                    onChange: (value)=>setKnob("swipe", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 446,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Glass",
                                    min: 0.2,
                                    max: 1,
                                    step: 0.01,
                                    value: values.glass,
                                    onChange: (value)=>setKnob("glass", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 447,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Knob, {
                                    label: "Sunset",
                                    min: 0.08,
                                    max: 0.62,
                                    step: 0.01,
                                    value: values.sun,
                                    onChange: (value)=>setKnob("sun", value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                                    lineNumber: 448,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                            lineNumber: 442,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                    lineNumber: 437,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/glassy-mountain-lake.tsx",
            lineNumber: 399,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/glassy-mountain-lake.tsx",
        lineNumber: 398,
        columnNumber: 5
    }, this);
}
_s(GlassyMountainLake, "cn+DHXq6w0t8+iQ2odj5RO/Ii2s=");
_c = GlassyMountainLake;
function Knob({ label, min, max, step, value, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "grid grid-cols-[7rem_1fr_auto] items-center gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                lineNumber: 473,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "range",
                min: min,
                max: max,
                step: step,
                value: value,
                "aria-label": label,
                className: "pointer-events-auto h-11 w-full accent-accent",
                onChange: (event)=>onChange(Number(event.target.value))
            }, void 0, false, {
                fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                lineNumber: 474,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "w-10 text-right text-fg",
                children: value.toFixed(2)
            }, void 0, false, {
                fileName: "[project]/src/components/glassy-mountain-lake.tsx",
                lineNumber: 484,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/glassy-mountain-lake.tsx",
        lineNumber: 472,
        columnNumber: 5
    }, this);
}
_c1 = Knob;
var _c, _c1;
__turbopack_context__.k.register(_c, "GlassyMountainLake");
__turbopack_context__.k.register(_c1, "Knob");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/hero-spatial.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeroSpatial",
    ()=>HeroSpatial
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function readNum(root, name, fallback) {
    const n = Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(n) ? n : fallback;
}
function smoothstep(unit) {
    const t = Math.min(1, Math.max(0, unit));
    return t * t * (3 - 2 * t);
}
function HeroSpatial({ rootRef }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeroSpatial.useEffect": ()=>{
            const root = rootRef.current;
            if (!root) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
            if (reduced.matches) return;
            let bodies = [];
            let raf = 0;
            let dead = false;
            let last = performance.now();
            let frame = 0;
            let pointer = null;
            let gazeX = 0.5;
            let gazeY = 0.46;
            let gazeVx = 0;
            let gazeVy = 0;
            const onPointer = {
                "HeroSpatial.useEffect.onPointer": (event)=>{
                    pointer = {
                        x: event.clientX,
                        y: event.clientY
                    };
                }
            }["HeroSpatial.useEffect.onPointer"];
            const onLeave = {
                "HeroSpatial.useEffect.onLeave": ()=>{
                    pointer = null;
                }
            }["HeroSpatial.useEffect.onLeave"];
            const collect = {
                "HeroSpatial.useEffect.collect": ()=>{
                    const next = [
                        ...root.querySelectorAll("[data-spatial]")
                    ].slice(0, 8);
                    bodies = next.map({
                        "HeroSpatial.useEffect.collect": (el)=>bodies.find({
                                "HeroSpatial.useEffect.collect": (body)=>body.el === el
                            }["HeroSpatial.useEffect.collect"]) ?? {
                                el,
                                x: 0,
                                y: 0,
                                vx: 0,
                                vy: 0
                            }
                    }["HeroSpatial.useEffect.collect"]);
                }
            }["HeroSpatial.useEffect.collect"];
            const clearMotion = {
                "HeroSpatial.useEffect.clearMotion": ()=>{
                    root.style.removeProperty("--focal-x");
                    root.style.removeProperty("--focal-y");
                    const subject = root.querySelector(".hero-subject");
                    if (subject) {
                        subject.style.transform = "";
                        subject.style.removeProperty("--approach");
                    }
                    for (const body of bodies)body.el.style.transform = "";
                }
            }["HeroSpatial.useEffect.clearMotion"];
            const heroOnScreen = {
                "HeroSpatial.useEffect.heroOnScreen": ()=>{
                    const hero = root.querySelector("section");
                    const box = (hero ?? root).getBoundingClientRect();
                    return box.bottom > -80 && box.top < window.innerHeight + 80;
                }
            }["HeroSpatial.useEffect.heroOnScreen"];
            const tick = {
                "HeroSpatial.useEffect.tick": (now)=>{
                    if (dead) return;
                    raf = 0;
                    if (document.visibilityState !== "visible" || !heroOnScreen()) return;
                    const dt = Math.min(0.033, (now - last) / 1000);
                    last = now;
                    frame += 1;
                    if (frame % 45 === 1) collect();
                    const t = now * 0.00011;
                    const approach = smoothstep(Math.sin(t * 0.62) * 0.5 + 0.5);
                    const driftX = 0.5 + Math.sin(t) * 0.14 + Math.sin(t * 0.37) * 0.035;
                    const driftY = 0.46 + Math.cos(t * 0.7) * 0.06 - approach * 0.035;
                    const hero = root.querySelector("section");
                    const box = (hero ?? root).getBoundingClientRect();
                    const depth = Math.min(1.5, Math.max(0, readNum(root, "--depth-feather", 0.7)));
                    const radius = Math.min(320, Math.max(40, readNum(root, "--prox", 140)));
                    const force = Math.min(36, Math.max(0, readNum(root, "--displace", 16)));
                    const damp = Math.min(22, Math.max(2, readNum(root, "--spring-damp", 10)));
                    const push = 0.35 + 0.65 * depth;
                    const omega = 5.5 + force * 0.08;
                    const cap = Math.min(22, force);
                    let inside = false;
                    let goalX = driftX;
                    let goalY = driftY;
                    if (pointer && box.width > 0 && box.height > 0) {
                        inside = pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;
                        if (inside) {
                            goalX = Math.min(1, Math.max(0, (pointer.x - box.left) / box.width));
                            goalY = Math.min(1, Math.max(0, (pointer.y - box.top) / box.height));
                        }
                    }
                    if (inside) {
                        gazeX = goalX;
                        gazeY = goalY;
                        gazeVx = 0;
                        gazeVy = 0;
                    } else {
                        const ax = (goalX - gazeX) * omega * omega - gazeVx * damp * 1.35;
                        const ay = (goalY - gazeY) * omega * omega - gazeVy * damp * 1.35;
                        gazeVx += ax * dt;
                        gazeVy += ay * dt;
                        gazeX += gazeVx * dt;
                        gazeY += gazeVy * dt;
                    }
                    const fx = gazeX;
                    const fy = gazeY;
                    const stage = root.getBoundingClientRect();
                    const focalX = box.left + fx * box.width;
                    const focalY = box.top + fy * box.height;
                    root.style.setProperty("--focal-x", `${focalX - stage.left}px`);
                    root.style.setProperty("--focal-y", `${focalY - stage.top}px`);
                    const subject = root.querySelector(".hero-subject");
                    if (subject) {
                        const slide = Math.min(22, force);
                        const sx = (fx - 0.5) * 2 * slide;
                        const sy = (fy - 0.46) * slide;
                        const z = approach * slide * 1.6;
                        const scale = 1 + approach * 0.03 * push;
                        subject.style.setProperty("--approach", approach.toFixed(3));
                        subject.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
                    }
                    const viewLeft = 8;
                    const viewTop = 8;
                    const viewRight = window.innerWidth - 8;
                    const viewBottom = window.innerHeight - 8;
                    for (const body of bodies){
                        const rect = body.el.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2 - body.x;
                        const cy = rect.top + rect.height / 2 - body.y;
                        const dx = cx - focalX;
                        const dy = cy - focalY;
                        const dist = Math.hypot(dx, dy) || 1;
                        const layer = body.el.dataset.spatial;
                        const bias = layer === "headline" ? 1 : layer === "nav" ? 0.55 : 0.28;
                        let tx = (0.5 - fx) * 10 * bias * push;
                        let ty = (0.46 - fy) * 6 * bias * push;
                        if (dist < radius) {
                            const fall = (1 - dist / radius) * force * (0.28 + depth * 0.45) * bias;
                            tx += dx / dist * fall;
                            ty += dy / dist * fall;
                        }
                        const mag = Math.hypot(tx, ty);
                        if (mag > cap && mag > 0) {
                            tx *= cap / mag;
                            ty *= cap / mag;
                        }
                        const baseLeft = rect.left - body.x;
                        const baseTop = rect.top - body.y;
                        const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
                        if (onScreen) {
                            const minTx = viewLeft - baseLeft;
                            const maxTx = viewRight - (baseLeft + rect.width);
                            const minTy = viewTop - baseTop;
                            const maxTy = viewBottom - (baseTop + rect.height);
                            if (minTx <= maxTx) tx = Math.min(maxTx, Math.max(minTx, tx));
                            if (minTy <= maxTy) ty = Math.min(maxTy, Math.max(minTy, ty));
                        }
                        const ax = (tx - body.x) * omega * omega - body.vx * damp * 1.35;
                        const ay = (ty - body.y) * omega * omega - body.vy * damp * 1.35;
                        body.vx += ax * dt;
                        body.vy += ay * dt;
                        const speed = Math.hypot(body.vx, body.vy);
                        if (speed > 160) {
                            body.vx *= 160 / speed;
                            body.vy *= 160 / speed;
                        }
                        body.x += body.vx * dt;
                        body.y += body.vy * dt;
                        body.el.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0)`;
                    }
                    if (heroOnScreen()) raf = requestAnimationFrame(tick);
                }
            }["HeroSpatial.useEffect.tick"];
            const resume = {
                "HeroSpatial.useEffect.resume": ()=>{
                    if (dead || reduced.matches || raf) return;
                    if (document.visibilityState !== "visible" || !heroOnScreen()) return;
                    last = performance.now();
                    raf = requestAnimationFrame(tick);
                }
            }["HeroSpatial.useEffect.resume"];
            const onVisibility = {
                "HeroSpatial.useEffect.onVisibility": ()=>{
                    if (document.visibilityState !== "visible") {
                        cancelAnimationFrame(raf);
                        raf = 0;
                        return;
                    }
                    resume();
                }
            }["HeroSpatial.useEffect.onVisibility"];
            const onPageHide = {
                "HeroSpatial.useEffect.onPageHide": ()=>{
                    cancelAnimationFrame(raf);
                    raf = 0;
                }
            }["HeroSpatial.useEffect.onPageHide"];
            const onReduce = {
                "HeroSpatial.useEffect.onReduce": ()=>{
                    if (!reduced.matches) return;
                    dead = true;
                    cancelAnimationFrame(raf);
                    raf = 0;
                    clearMotion();
                }
            }["HeroSpatial.useEffect.onReduce"];
            collect();
            root.addEventListener("pointermove", onPointer);
            root.addEventListener("pointerleave", onLeave);
            root.addEventListener("mouseleave", onLeave);
            document.addEventListener("visibilitychange", onVisibility);
            window.addEventListener("pagehide", onPageHide);
            window.addEventListener("pageshow", resume);
            window.addEventListener("scroll", resume, {
                passive: true
            });
            reduced.addEventListener("change", onReduce);
            raf = requestAnimationFrame(tick);
            return ({
                "HeroSpatial.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(raf);
                    root.removeEventListener("pointermove", onPointer);
                    root.removeEventListener("pointerleave", onLeave);
                    root.removeEventListener("mouseleave", onLeave);
                    document.removeEventListener("visibilitychange", onVisibility);
                    window.removeEventListener("pagehide", onPageHide);
                    window.removeEventListener("pageshow", resume);
                    window.removeEventListener("scroll", resume);
                    reduced.removeEventListener("change", onReduce);
                    clearMotion();
                }
            })["HeroSpatial.useEffect"];
        }
    }["HeroSpatial.useEffect"], [
        rootRef
    ]);
    return null;
}
_s(HeroSpatial, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = HeroSpatial;
var _c;
__turbopack_context__.k.register(_c, "HeroSpatial");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/hero-text-canvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeroTextCanvas",
    ()=>HeroTextCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
;
;
;
const ORDER = [
    "headline",
    "subheadline",
    "cta_button"
];
function clampPercent(value) {
    return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}
function paintStyle(layer) {
    const shimmer = layer.effect === "shimmer" && layer.colorMode === "solid" ? `linear-gradient(105deg, ${layer.solidColor} 0%, #ffffff 46%, ${layer.solidColor} 78%)` : "";
    const gradient = layer.colorMode === "gradient" ? layer.gradientCss : shimmer;
    const ink = {
        ["--hero-ink"]: layer.solidColor,
        fontFamily: `"${layer.fontFamily}", sans-serif`
    };
    if (!gradient) return {
        ...ink,
        color: layer.solidColor
    };
    return {
        ...ink,
        backgroundImage: gradient,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent"
    };
}
function HeroTextCanvas({ layers, fallbacks, editable = false, activeLayer = "headline", onActiveLayer, onLayerChange, bookHref }) {
    _s();
    const boundsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const layout = layers?.headline ? layers : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultHeroLayout"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: boundsRef,
        className: "pointer-events-none absolute inset-0 z-20",
        children: ORDER.map((id)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HeroLayerNode, {
                id: id,
                layer: layout[id],
                fallback: fallbacks[id],
                editable: editable,
                active: editable && activeLayer === id,
                boundsRef: boundsRef,
                bookHref: bookHref,
                onActive: ()=>onActiveLayer?.(id),
                onChange: (layer, persist)=>onLayerChange?.(id, layer, persist)
            }, id, false, {
                fileName: "[project]/src/components/hero-text-canvas.tsx",
                lineNumber: 58,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s(HeroTextCanvas, "JAfBz/829c3fcyR2H8k3uWeNRUg=");
_c = HeroTextCanvas;
function HeroLayerNode({ id, layer, fallback, editable, active, boundsRef, bookHref, onActive, onChange }) {
    _s1();
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dragX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const dragY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const shown = layer.text || fallback || "\u00a0";
    const gradient = layer.colorMode === "gradient" || layer.effect === "shimmer";
    function moveBy(dx, dy) {
        onChange({
            ...layer,
            position: {
                x: clampPercent(layer.position.x + dx),
                y: clampPercent(layer.position.y + dy)
            }
        }, true);
    }
    function onKeyDown(event) {
        if (!editable || editing) return;
        const step = event.shiftKey ? 5 : 1;
        const delta = event.key === "ArrowLeft" ? [
            -step,
            0
        ] : event.key === "ArrowRight" ? [
            step,
            0
        ] : event.key === "ArrowUp" ? [
            0,
            -step
        ] : event.key === "ArrowDown" ? [
            0,
            step
        ] : null;
        if (!delta) return;
        event.preventDefault();
        moveBy(delta[0], delta[1]);
    }
    const face = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LayerFace, {
        id: id,
        shown: shown,
        editing: editing,
        editable: editable,
        ink: paintStyle(layer),
        effect: layer.effect,
        mode: gradient ? "gradient" : "solid",
        onEditStart: ()=>{
            if (!editable) return;
            onActive();
            setEditing(true);
        },
        onCommit: (text)=>{
            setEditing(false);
            const next = !layer.text && text === fallback.trim() ? "" : text;
            onChange({
                ...layer,
                text: next
            }, true);
        }
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        drag: editable && !editing,
        dragConstraints: boundsRef,
        dragElastic: 0,
        dragMomentum: false,
        style: {
            x: dragX,
            y: dragY,
            left: `${layer.position.x}%`,
            top: `${layer.position.y}%`
        },
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("hero-type absolute max-w-[min(40rem,88%)] outline-none", id === "headline" && "text-[clamp(2.5rem,8vw,5.4rem)] leading-[0.92]", id === "subheadline" && "max-w-[min(28rem,80%)] text-base leading-snug sm:text-lg", id === "cta_button" && "max-w-[16rem]", editable && "pointer-events-auto cursor-grab touch-none active:cursor-grabbing", !editable && id === "cta_button" && "pointer-events-auto", active && "rounded-md ring-1 ring-accent ring-offset-2 ring-offset-transparent"),
        "data-spatial": editable ? undefined : id === "headline" ? "headline" : undefined,
        tabIndex: editable ? 0 : undefined,
        "aria-label": id === "headline" ? "Headline" : id === "subheadline" ? "Subheadline" : "Call to action",
        onPointerDown: onActive,
        onKeyDown: onKeyDown,
        onDragEnd: (_, info)=>{
            const bounds = boundsRef.current?.getBoundingClientRect();
            dragX.set(0);
            dragY.set(0);
            if (!bounds || bounds.width < 1 || bounds.height < 1) return;
            onChange({
                ...layer,
                position: {
                    x: clampPercent(layer.position.x + info.offset.x / bounds.width * 100),
                    y: clampPercent(layer.position.y + info.offset.y / bounds.height * 100)
                }
            }, true);
        },
        children: id === "cta_button" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CtaChrome, {
            href: editable ? undefined : bookHref,
            children: face
        }, void 0, false, {
            fileName: "[project]/src/components/hero-text-canvas.tsx",
            lineNumber: 199,
            columnNumber: 9
        }, this) : face
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 156,
        columnNumber: 5
    }, this);
}
_s1(HeroLayerNode, "tamWlsROEv1+55cEyyqyHhOFZIU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"]
    ];
});
_c1 = HeroLayerNode;
function CtaChrome({ href, children }) {
    const className = "glass-btn inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium";
    if (!href) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 209,
        columnNumber: 21
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        href: href,
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 211,
        columnNumber: 5
    }, this);
}
_c2 = CtaChrome;
function LayerFace({ id, shown, editing, editable, ink, effect, mode, onEditStart, onCommit }) {
    _s2();
    const editorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LayerFace.useEffect": ()=>{
            if (!editing || !editorRef.current) return;
            const node = editorRef.current;
            node.focus();
            const range = document.createRange();
            range.selectNodeContents(node);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }["LayerFace.useEffect"], [
        editing
    ]);
    if (!editing) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            onDoubleClick: onEditStart,
            className: "hero-type-ink block",
            style: ink,
            "data-effect": effect,
            "data-mode": mode,
            children: [
                shown,
                editable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "sr-only",
                    children: [
                        ". Double-click to edit the ",
                        id.replace("_", " "),
                        "."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/hero-text-canvas.tsx",
                    lineNumber: 261,
                    columnNumber: 21
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/hero-text-canvas.tsx",
            lineNumber: 253,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: editorRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        role: "textbox",
        "aria-label": id,
        className: "hero-type-ink block min-w-[4rem] outline-none",
        style: ink,
        "data-effect": effect,
        "data-mode": mode,
        onBlur: (event)=>{
            const text = (event.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
            onCommit(text);
        },
        onKeyDown: (event)=>{
            if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
            }
        },
        children: shown
    }, void 0, false, {
        fileName: "[project]/src/components/hero-text-canvas.tsx",
        lineNumber: 266,
        columnNumber: 5
    }, this);
}
_s2(LayerFace, "FXGU5sRik9TpAO5B+Yli91RwFDk=");
_c3 = LayerFace;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "HeroTextCanvas");
__turbopack_context__.k.register(_c1, "HeroLayerNode");
__turbopack_context__.k.register(_c2, "CtaChrome");
__turbopack_context__.k.register(_c3, "LayerFace");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/holo-card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HoloCard",
    ()=>HoloCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/magnetic.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function HoloCard({ children, className, tilt = true }) {
    _s();
    const live = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const tiltRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(tilt);
    tiltRef.current = tilt;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HoloCard.useEffect": ()=>{
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
            const fine = window.matchMedia("(pointer: fine)");
            const sync = {
                "HoloCard.useEffect.sync": ()=>{
                    live.current = fine.matches && !reduce.matches;
                }
            }["HoloCard.useEffect.sync"];
            sync();
            reduce.addEventListener("change", sync);
            fine.addEventListener("change", sync);
            return ({
                "HoloCard.useEffect": ()=>{
                    reduce.removeEventListener("change", sync);
                    fine.removeEventListener("change", sync);
                }
            })["HoloCard.useEffect"];
        }
    }["HoloCard.useEffect"], []);
    function onMove(event) {
        if (!live.current) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) return;
        const px = (event.clientX - box.left) / box.width - 0.5;
        const py = (event.clientY - box.top) / box.height - 0.5;
        event.currentTarget.style.setProperty("--sx", `${((px + 0.5) * 100).toFixed(1)}%`);
        event.currentTarget.style.setProperty("--sy", `${((py + 0.5) * 100).toFixed(1)}%`);
        if (!tiltRef.current) return;
        event.currentTarget.style.setProperty("--rx", `${(-py * 2.5).toFixed(2)}deg`);
        event.currentTarget.style.setProperty("--ry", `${(px * 2.5).toFixed(2)}deg`);
    }
    function onLeave(event) {
        event.currentTarget.style.setProperty("--rx", "0deg");
        event.currentTarget.style.setProperty("--ry", "0deg");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Magnetic"], {
        className: "h-full min-w-0 max-w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("holo-tilt h-full min-w-0", tilt && "holo-tilt-on", className),
            onPointerMove: onMove,
            onPointerLeave: onLeave,
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "holo-sheen",
                    "aria-hidden": true
                }, void 0, false, {
                    fileName: "[project]/src/components/holo-card.tsx",
                    lineNumber: 63,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/holo-card.tsx",
            lineNumber: 57,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/holo-card.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s(HoloCard, "cipDBUGSb8jmk3h9Mz0NV+iAeTM=");
_c = HoloCard;
var _c;
__turbopack_context__.k.register(_c, "HoloCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/magnetic.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Magnetic",
    ()=>Magnetic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function Magnetic({ children, className }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [live, setLive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const springX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(x, {
        stiffness: 220,
        damping: 18,
        mass: 0.35
    });
    const springY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(y, {
        stiffness: 220,
        damping: 18,
        mass: 0.35
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Magnetic.useEffect": ()=>{
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
            const fine = window.matchMedia("(pointer: fine)");
            const sync = {
                "Magnetic.useEffect.sync": ()=>setLive(fine.matches && !reduce.matches)
            }["Magnetic.useEffect.sync"];
            sync();
            reduce.addEventListener("change", sync);
            fine.addEventListener("change", sync);
            return ({
                "Magnetic.useEffect": ()=>{
                    reduce.removeEventListener("change", sync);
                    fine.removeEventListener("change", sync);
                }
            })["Magnetic.useEffect"];
        }
    }["Magnetic.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
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
_s(Magnetic, "9SB3VxOplzqOWYljLDoB+i/yDN4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"]
    ];
});
_c = Magnetic;
var _c;
__turbopack_context__.k.register(_c, "Magnetic");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/niche-storefront.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NicheStorefront",
    ()=>NicheStorefront,
    "ServiceCards",
    ()=>ServiceCards
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$text$2d$canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/hero-text-canvas.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$router$2f$dist$2f$esm$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-router/dist/esm/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$cinematic$2d$hero$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/cinematic-hero.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/auto-sequence.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$holo$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/holo-card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/reveal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/status-pill.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/niches.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$spatial$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/hero-spatial.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$barber$2d$mirror$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/barber-mirror-studio.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$outdoor$2d$guide$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/outdoor-guide-studio.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$cockpit$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/cockpit.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
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
;
;
;
;
;
;
;
;
function NicheStorefront({ businessName, kicker, tagline, description, address, accent, logoUrl, contactName, contactPhone, contactEmail, services, hours, staff, heroImageUrl, heroVideoUrl, blendPercent, introPreset, surface = {}, introSpeed, introIntensity, tone, fallbackImageUrl, fallbackVideoUrl, bookLabel, bookHref, header, extra, footer, niche = "", autoHero = false, hud = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_HUD"], headline = "", layoutEditable = false, activeLayer = "headline", onActiveLayer, onLayerChange }) {
    _s();
    const contact = [
        contactName,
        contactPhone ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPhone"])(contactPhone) : "",
        contactEmail
    ].filter(Boolean).join(" · ");
    const stageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [masterLines, setMasterLines] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [filmOverride, setFilmOverride] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NicheStorefront.useEffect": ()=>{
            setMasterLines((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readMasterTelemetry"])());
            setFilmOverride((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readNicheFilmOverride"])(niche));
        }
    }["NicheStorefront.useEffect"], [
        niche
    ]);
    const nicheFilm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(niche) ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][niche].heroVideoUrl : "";
    const playedVideo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyBrowserFilmOverride"])(heroVideoUrl, nicheFilm, filmOverride);
    const city = (address ?? "").split(",").map((part)=>part.trim()).filter(Boolean)[1] ?? "";
    const tradeLabel = kicker || niche;
    const tradeText = [
        businessName,
        kicker,
        tagline,
        description
    ].filter(Boolean).join(" ");
    const telemetry = masterLines;
    const brand = {
        name: businessName,
        accent,
        logoUrl,
        city,
        trade: tradeLabel
    };
    const cockpit = autoHero || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$cockpit$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usesAutomotiveCockpit"])(niche, tradeText);
    const mirror = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$barber$2d$mirror$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usesBarberMirror"])(niche, tradeText);
    const outdoor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$outdoor$2d$guide$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usesOutdoorGuide"])(niche, tradeText);
    const chrome = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hero-scrim pointer-events-none absolute inset-x-0 top-0 z-0 h-40",
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-spatial": "nav",
                className: "relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex min-w-0 items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BrandMark, {
                                name: businessName,
                                logoUrl: logoUrl ?? ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this),
                            header
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "hidden max-w-xs truncate text-right text-sm text-muted sm:block",
                        children: contact || "\u00a0"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: stageRef,
        className: "storefront-stage",
        "data-neon": "on",
        "data-ripple-theme": surface["--ripple"] ? "on" : "off",
        "data-wash": hud.wash,
        "data-rim": hud.rim ? "on" : "off",
        "data-scan": hud.scan ? "on" : "off",
        style: {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hudVars"])(hud, accent),
            ...surface
        },
        children: [
            cockpit || mirror || outdoor ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$spatial$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HeroSpatial"], {
                rootRef: stageRef
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 158,
                columnNumber: 46
            }, this),
            cockpit ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$cinematic$2d$hero$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CinematicHero"], {
                sequence: "auto",
                imageUrl: heroImageUrl || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_POSTER"],
                videoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$auto$2d$sequence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUTO_HERO_SRC"],
                blendPercent: blendPercent,
                introPreset: introPreset,
                introSpeed: introSpeed,
                introIntensity: introIntensity,
                tone: tone ?? null,
                fallbackImageUrl: fallbackImageUrl,
                fallbackVideoUrl: fallbackVideoUrl,
                brand: brand,
                telemetry: telemetry,
                dashboard: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OfferingDesk, {
                    businessName: businessName,
                    services: services,
                    staff: staff,
                    hours: hours,
                    bookHref: bookHref,
                    bookLabel: bookLabel
                }, void 0, false, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 174,
                    columnNumber: 13
                }, this),
                children: chrome
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this) : mirror ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$barber$2d$mirror$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarberMirrorStudio"], {
                businessName: businessName,
                bookHref: bookHref,
                services: services,
                children: chrome
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 187,
                columnNumber: 9
            }, this) : outdoor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$outdoor$2d$guide$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OutdoorGuideStudio"], {
                businessName: businessName,
                bookHref: bookHref,
                services: services,
                hud: hud,
                children: chrome
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 191,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$cinematic$2d$hero$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CinematicHero"], {
                imageUrl: heroImageUrl,
                videoUrl: playedVideo,
                blendPercent: blendPercent,
                introPreset: introPreset,
                introSpeed: introSpeed,
                introIntensity: introIntensity,
                tone: tone ?? null,
                fallbackImageUrl: fallbackImageUrl,
                fallbackVideoUrl: fallbackVideoUrl,
                brand: brand,
                telemetry: telemetry,
                children: [
                    chrome,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative z-10 flex min-h-[18rem] flex-1 flex-col px-5 pb-24 pt-6 sm:px-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "pointer-events-none min-h-4 text-[11px] uppercase tracking-[0.22em] text-muted",
                                children: kicker || "\u00a0"
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "pointer-events-none mt-2 min-h-5 text-sm text-muted sm:hidden",
                                children: contact || "\u00a0"
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative mt-4 min-h-[16rem] flex-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2d$text$2d$canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HeroTextCanvas"], {
                                    layers: hud.layers,
                                    fallbacks: {
                                        headline: businessName,
                                        subheadline: tagline || headline,
                                        cta_button: bookLabel
                                    },
                                    editable: layoutEditable,
                                    activeLayer: activeLayer,
                                    onActiveLayer: onActiveLayer,
                                    onLayerChange: onLayerChange,
                                    bookHref: bookHref
                                }, void 0, false, {
                                    fileName: "[project]/src/components/niche-storefront.tsx",
                                    lineNumber: 213,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hero-contact",
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 230,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ServiceCards, {
                services: services,
                description: description
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StaffRow, {
                people: staff
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this),
            hours ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HoursBlock, {
                hours: hours,
                address: address,
                contact: contact
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 234,
                columnNumber: 16
            }, this) : null,
            extra,
            footer
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 148,
        columnNumber: 5
    }, this);
}
_s(NicheStorefront, "/kVVGbk33AbOVtbLCzhInWXkKeU=");
_c = NicheStorefront;
function shopSlugFromBook(bookHref) {
    if (!bookHref) return null;
    const match = /^\/([^/?#]+)\/book\/?$/.exec(bookHref);
    return match?.[1] ?? null;
}
function OfferingDesk({ businessName, services, staff, hours, bookHref, bookLabel }) {
    const slug = shopSlugFromBook(bookHref);
    const openDays = hours ? Object.values(hours).filter((value)=>value && !/closed/i.test(value)).length : 0;
    const crew = staff.filter((person)=>person.displayName).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-0 flex-1 flex-col justify-end px-5 pb-8 sm:px-10 sm:pb-12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-5xl rounded-[28px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] uppercase tracking-[0.22em] text-muted",
                    children: "Axiom desk"
                }, void 0, false, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 268,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "mt-2 font-display text-4xl text-fg sm:text-5xl",
                    children: businessName
                }, void 0, false, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 269,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 max-w-xl text-sm text-muted",
                    children: "The book, the crew, and the prices for this curb. This is the desk the shop runs."
                }, void 0, false, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 270,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-6 grid grid-cols-3 gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeskStat, {
                            label: "On the book",
                            value: String(services.length)
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 274,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeskStat, {
                            label: "Crew",
                            value: String(crew)
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 275,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeskStat, {
                            label: "Open days",
                            value: hours ? String(openDays) : "—"
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 276,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 273,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "mt-6 divide-y divide-line",
                    children: services.slice(0, 4).map((service)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            className: "flex items-baseline justify-between gap-3 py-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm text-fg",
                                    children: service.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/niche-storefront.tsx",
                                    lineNumber: 281,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "shrink-0 text-sm text-accent",
                                    children: service.price
                                }, void 0, false, {
                                    fileName: "[project]/src/components/niche-storefront.tsx",
                                    lineNumber: 282,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, service.key, true, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 278,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-6 flex flex-wrap gap-2",
                    children: [
                        bookHref ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: bookHref,
                            className: "inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm text-bg",
                            children: bookLabel
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 288,
                            columnNumber: 13
                        }, this) : null,
                        slug ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: `/${slug}/admin`,
                            className: "inline-flex h-11 items-center rounded-xl px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]",
                            children: "Open the live desk"
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 293,
                            columnNumber: 13
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/niche-storefront.tsx",
                    lineNumber: 286,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/niche-storefront.tsx",
            lineNumber: 267,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 266,
        columnNumber: 5
    }, this);
}
_c1 = OfferingDesk;
function DeskStat({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-2xl bg-bg px-3 py-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[11px] uppercase tracking-[0.18em] text-muted",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 309,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 font-display text-2xl text-fg",
                children: value
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 310,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 308,
        columnNumber: 5
    }, this);
}
_c2 = DeskStat;
function BrandMark({ name, logoUrl }) {
    _s1();
    const [failed, setFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const show = Boolean(logoUrl) && !failed;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 font-display text-lg",
        children: show ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: logoUrl,
            alt: name,
            className: "size-11 object-contain",
            onError: ()=>setFailed(true)
        }, void 0, false, {
            fileName: "[project]/src/components/niche-storefront.tsx",
            lineNumber: 321,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "aria-hidden": true,
            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initials"])(name || "Shop")
        }, void 0, false, {
            fileName: "[project]/src/components/niche-storefront.tsx",
            lineNumber: 328,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 319,
        columnNumber: 5
    }, this);
}
_s1(BrandMark, "BFa/7w0IiJnSoWJxZHxuU4kOwF4=");
_c3 = BrandMark;
function ServiceCards({ services, description }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mx-auto max-w-5xl px-5 py-16 sm:px-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] uppercase tracking-[0.2em] text-muted",
                        children: "The book"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "mt-2 font-display text-3xl sm:text-4xl",
                        children: "Services"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 345,
                        columnNumber: 9
                    }, this),
                    description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 max-w-xl text-muted",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 346,
                        columnNumber: 24
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusRow"], {}, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 347,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 343,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                stagger: true,
                className: "mt-8 grid gap-4 lg:grid-cols-12",
                children: services.map((service, index)=>{
                    const previous = services[index - 1];
                    const showGroup = service.group && service.group !== previous?.group;
                    const span = index % 3 === 0 ? "lg:col-span-7" : index % 3 === 1 ? "lg:col-span-5 lg:mt-10" : "lg:col-span-8 lg:col-start-3";
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-spatial": "card",
                        className: `min-w-0 ${span}`,
                        children: [
                            showGroup ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-3 mt-6 text-[11px] uppercase tracking-[0.18em] text-muted",
                                children: service.group
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 357,
                                columnNumber: 17
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$holo$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HoloCard"], {
                                className: "hud-card h-full rounded-[24px] px-5 py-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-baseline justify-between gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: service.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/niche-storefront.tsx",
                                                lineNumber: 361,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "shrink-0 text-sm text-muted",
                                                children: service.price
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/niche-storefront.tsx",
                                                lineNumber: 362,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 360,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-muted",
                                        children: service.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 364,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusPill"], {
                                        tone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toneAt"])(index),
                                        className: "mt-3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 365,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 359,
                                columnNumber: 15
                            }, this)
                        ]
                    }, service.key, true, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 355,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 349,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 342,
        columnNumber: 5
    }, this);
}
_c4 = ServiceCards;
function StaffRow({ people }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mx-auto max-w-5xl px-5 pb-16 sm:px-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] uppercase tracking-[0.2em] text-muted",
                        children: "The crew"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 379,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "mt-2 font-display text-3xl sm:text-4xl",
                        children: "Who takes the book"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusRow"], {}, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 381,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 378,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                stagger: true,
                className: "mt-8 grid gap-4 sm:grid-cols-2",
                children: people.map((person, index)=>{
                    const body = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: person.avatarUrl,
                                alt: "",
                                className: "size-24 shrink-0 rounded-2xl object-cover"
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 387,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0 py-2 pr-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-display text-2xl leading-tight",
                                        children: person.displayName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 389,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-muted",
                                        children: person.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 390,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 line-clamp-3 text-sm text-muted",
                                        children: person.bio
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 391,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusPill"], {
                                        tone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toneAt"])(index),
                                        className: "mt-3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/niche-storefront.tsx",
                                        lineNumber: 392,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 388,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 386,
                        columnNumber: 13
                    }, this);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$holo$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HoloCard"], {
                            className: `hud-card h-full rounded-[24px] p-3 ${index === 1 ? "lg:mt-12" : ""}`,
                            children: person.shopSlug && person.employeeId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$router$2f$dist$2f$esm$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                                to: "/$shopSlug/staff/$employeeId",
                                params: {
                                    shopSlug: person.shopSlug,
                                    employeeId: person.employeeId
                                },
                                className: "flex h-full gap-4",
                                children: body
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 400,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full gap-4",
                                children: body
                            }, void 0, false, {
                                fileName: "[project]/src/components/niche-storefront.tsx",
                                lineNumber: 408,
                                columnNumber: 19
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 398,
                            columnNumber: 15
                        }, this)
                    }, person.key, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 397,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 383,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 377,
        columnNumber: 5
    }, this);
}
_c5 = StaffRow;
function HoursBlock({ hours, address, contact }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mx-auto max-w-5xl px-5 pb-16 sm:px-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "font-display text-3xl",
                        children: "Hours"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 431,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusRow"], {
                        tones: [
                            "node",
                            "latency"
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 432,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 min-h-5 text-sm text-muted",
                        children: address || "\u00a0"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 433,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 min-h-5 text-sm text-muted",
                        children: contact || "\u00a0"
                    }, void 0, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 434,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 430,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                stagger: true,
                className: "mt-4 grid gap-2 sm:grid-cols-2",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEEKDAYS"].map(([key, label], index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$holo$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HoloCard"], {
                            className: "hud-card flex h-full flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/niche-storefront.tsx",
                                    lineNumber: 440,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex min-w-0 items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$status$2d$pill$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusPill"], {
                                            tone: index % 2 === 0 ? "latency" : "node"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/niche-storefront.tsx",
                                            lineNumber: 442,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "shrink-0 text-muted",
                                            children: hours[key] || "closed"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/niche-storefront.tsx",
                                            lineNumber: 443,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/niche-storefront.tsx",
                                    lineNumber: 441,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/niche-storefront.tsx",
                            lineNumber: 439,
                            columnNumber: 13
                        }, this)
                    }, key, false, {
                        fileName: "[project]/src/components/niche-storefront.tsx",
                        lineNumber: 438,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/niche-storefront.tsx",
                lineNumber: 436,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/niche-storefront.tsx",
        lineNumber: 429,
        columnNumber: 5
    }, this);
}
_c6 = HoursBlock;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "NicheStorefront");
__turbopack_context__.k.register(_c1, "OfferingDesk");
__turbopack_context__.k.register(_c2, "DeskStat");
__turbopack_context__.k.register(_c3, "BrandMark");
__turbopack_context__.k.register(_c4, "ServiceCards");
__turbopack_context__.k.register(_c5, "StaffRow");
__turbopack_context__.k.register(_c6, "HoursBlock");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/outdoor-guide-studio.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OutdoorGuideStudio",
    ()=>OutdoorGuideStudio,
    "usesOutdoorGuide",
    ()=>usesOutdoorGuide
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$template$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-template.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-transform.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-biokinetic-engine.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
const FILM = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].hunting.heroVideoUrl;
const DEFAULT_OFFERS = [
    {
        name: "Half day",
        description: "A morning or an evening on private ground.",
        price: "$350"
    },
    {
        name: "Full day",
        description: "Dawn to dark. The guide, the ground, and the plan.",
        price: "$650"
    },
    {
        name: "Scouting walk",
        description: "A look at the ground before the hunt day.",
        price: "$180"
    }
];
function usesOutdoorGuide(niche, text = "") {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOutdoorGuideNiche"])(niche) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOutdoorGuideNiche"])(text);
}
function OutdoorGuideStudio({ businessName, bookHref, services, hud = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_HUD"], children }) {
    _s();
    const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
    const reduce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const biokinetic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBiokineticEngine"])({
        cameraGranted: false,
        reducedMotion: reduce
    });
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const offer = offers[index] ?? offers[0];
    const feather = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEPTH_STEPS"][hud.depth] ?? 1.25;
    const canopyBlur = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$template$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionTemplate"]`blur(calc(${feather * 10}px + ${biokinetic.backdropBlurAmount}px))`;
    const frameScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"])(biokinetic.cameraDollyScale, [
        1,
        1.16
    ], [
        1,
        1.48
    ]);
    const frameFade = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"])(biokinetic.cameraDollyScale, [
        1,
        1.16
    ], [
        1,
        0.35
    ]);
    const cardLift = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"])(biokinetic.cameraDollyScale, [
        1,
        1.16
    ], [
        18,
        -28
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "outdoor-stage",
        "aria-label": "Outdoor guide studio",
        "data-asset": "hunting-guide.mp4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "outdoor-rig",
                style: {
                    scale: biokinetic.cameraDollyScale
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "outdoor-canopy",
                        style: {
                            filter: canopyBlur
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                            src: FILM,
                            muted: true,
                            playsInline: true,
                            autoPlay: true,
                            loop: true,
                            className: "h-full w-full object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                            lineNumber: 54,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "outdoor-subject",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                            src: FILM,
                            muted: true,
                            playsInline: true,
                            autoPlay: true,
                            loop: true,
                            className: "h-full w-full object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "outdoor-frame",
                        style: {
                            scale: frameScale,
                            opacity: frameFade
                        },
                        "aria-hidden": true
                    }, void 0, false, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10",
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "outdoor-hud",
                style: {
                    y: cardLift
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] uppercase tracking-[0.22em] text-accent",
                        children: "Tactical book"
                    }, void 0, false, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "outdoor-cards",
                        children: offers.map((item, itemIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: itemIndex === index ? "outdoor-card is-on" : "outdoor-card",
                                "aria-pressed": itemIndex === index,
                                onClick: ()=>setIndex(itemIndex),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-medium text-fg",
                                        children: item.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mt-1 block text-xs text-muted",
                                        children: item.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mt-2 block text-sm text-accent",
                                        children: item.price
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                                        lineNumber: 75,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, item.name, true, {
                                fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "outdoor-book",
                        href: bookHref || "#book",
                        children: [
                            "Book ",
                            offer?.name ?? businessName
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/outdoor-guide-studio.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/outdoor-guide-studio.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_s(OutdoorGuideStudio, "RFL3g9OYotLcG4A6bSKl8aavPEU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$biokinetic$2d$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBiokineticEngine"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"]
    ];
});
_c = OutdoorGuideStudio;
var _c;
__turbopack_context__.k.register(_c, "OutdoorGuideStudio");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/preview-studio.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FaqAccordion",
    ()=>FaqAccordion,
    "PreviewStudio",
    ()=>PreviewStudio
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
function PreviewStudio({ hud, onChange, onCommit, heroChoices, activeLayer = "headline", onActiveLayer, variant = "public" }) {
    function patch(partial) {
        onChange({
            ...hud,
            ...partial
        });
    }
    function editLayer(partial, persist = false) {
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setHeroLayer"])(hud, activeLayer, {
            ...hud.layers[activeLayer],
            ...partial
        });
        onChange(next);
        if (persist) onCommit?.(next);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mx-auto max-w-5xl px-5 py-8 sm:px-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hud-card grid min-h-[22rem] gap-5 rounded-[24px] p-5 lg:grid-cols-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "lg:col-span-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] uppercase tracking-[0.2em] text-muted",
                            children: "Live preview studio"
                        }, void 0, false, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 font-display text-3xl",
                            children: "Feather, glow, and the line."
                        }, void 0, false, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 text-sm text-muted",
                            children: "Drag a line on the hero, then set its type, color, and effect here. The preview updates before you save."
                        }, void 0, false, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/preview-studio.tsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-4 lg:col-span-7",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HeroTypeControls, {
                            hud: hud,
                            activeLayer: activeLayer,
                            onActiveLayer: onActiveLayer,
                            editLayer: editLayer
                        }, void 0, false, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 68,
                            columnNumber: 11
                        }, this),
                        variant === "public" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LookPresets, {
                            hud: hud,
                            onPick: patch
                        }, void 0, false, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 74,
                            columnNumber: 35
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "text-sm text-muted",
                            children: [
                                "Card opacity ",
                                Math.round((__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CARD_STEPS"][hud.card] ?? 0.5) * 100),
                                "%",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "range",
                                    min: 0,
                                    max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CARD_STEPS"].length - 1,
                                    step: 1,
                                    value: hud.card,
                                    onChange: (event)=>patch({
                                            card: Number(event.target.value)
                                        }),
                                    className: "mt-2 w-full accent-accent"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 77,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this),
                        variant === "admin" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                            className: "rounded-2xl bg-surface-2 px-4 py-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                    className: "cursor-pointer text-sm text-fg",
                                    children: "Advanced 3D & Shader Physics (Developer Mode)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 89,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Edge fade ${hud.fade}%`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FADE_STEPS"].length - 1,
                                            value: Math.max(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FADE_STEPS"].indexOf(hud.fade)),
                                            onChange: (index)=>patch({
                                                    fade: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FADE_STEPS"][index] ?? hud.fade
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 91,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Glow ${hud.glow}`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOW_STEPS"].length - 1,
                                            value: Math.max(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOW_STEPS"].indexOf(hud.glow)),
                                            onChange: (index)=>patch({
                                                    glow: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOW_STEPS"][index] ?? hud.glow
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 97,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Glass blur ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BLUR_STEPS"][hud.blur] ?? 22}px`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BLUR_STEPS"].length - 1,
                                            value: hud.blur,
                                            onChange: (index)=>patch({
                                                    blur: index
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 103,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Spring damping ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DAMP_STEPS"][hud.damp] ?? 10}`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DAMP_STEPS"].length - 1,
                                            value: hud.damp,
                                            onChange: (index)=>patch({
                                                    damp: index
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 109,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Displacement ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FORCE_STEPS"][hud.force] ?? 16}px`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FORCE_STEPS"].length - 1,
                                            value: hud.force,
                                            onChange: (index)=>patch({
                                                    force: index
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 115,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Proximity ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RADIUS_STEPS"][hud.radius] ?? 140}px`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RADIUS_STEPS"].length - 1,
                                            value: hud.radius,
                                            onChange: (index)=>patch({
                                                    radius: index
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 121,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhysicsSlider, {
                                            label: `Depth feather ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEPTH_STEPS"][hud.depth] ?? 0.7}`,
                                            max: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEPTH_STEPS"].length - 1,
                                            value: hud.depth,
                                            onChange: (index)=>patch({
                                                    depth: index
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 127,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 90,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "text-sm text-muted",
                            children: [
                                "Wash",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: hud.wash,
                                    onChange: (event)=>patch({
                                            wash: event.target.value
                                        }),
                                    className: "mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_WASHES"].map((wash)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: wash,
                                            children: wash
                                        }, wash, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 144,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "text-sm text-muted",
                            children: [
                                "Hero asset",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: hud.heroPick,
                                    onChange: (event)=>patch({
                                            heroPick: event.target.value
                                        }),
                                    className: "mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg",
                                    children: heroChoices.map((choice)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: choice.id,
                                            children: choice.label
                                        }, choice.id, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 158,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 152,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this),
                        hud.heroPick === "url" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "text-sm text-muted",
                            children: [
                                "Custom media URL",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: hud.heroUrl,
                                    onChange: (event)=>patch({
                                            heroUrl: event.target.value
                                        }),
                                    placeholder: "/media/... or https://",
                                    className: "mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 167,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 165,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-pressed": hud.rim,
                                    onClick: ()=>patch({
                                            rim: !hud.rim
                                        }),
                                    className: "h-11 rounded-full bg-surface-2 px-4 text-sm",
                                    children: [
                                        "Border glow ",
                                        hud.rim ? "on" : "off"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 176,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-pressed": hud.scan,
                                    onClick: ()=>patch({
                                            scan: !hud.scan
                                        }),
                                    className: "h-11 rounded-full bg-surface-2 px-4 text-sm",
                                    children: [
                                        "Scan ",
                                        hud.scan ? "on" : "off"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 184,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 175,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/preview-studio.tsx",
                    lineNumber: 67,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/preview-studio.tsx",
            lineNumber: 59,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/preview-studio.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_c = PreviewStudio;
function LookPresets({ hud, onPick }) {
    const active = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["activeLookPreset"])(hud);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-2 sm:grid-cols-3",
        role: "radiogroup",
        "aria-label": "Studio look",
        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LOOK_PRESETS"].map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                role: "radio",
                "aria-checked": active === preset.id,
                onClick: ()=>onPick(preset.hud),
                className: `rounded-2xl px-3 py-3 text-left ${active === preset.id ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: `block h-8 rounded-lg ${preset.id === "studio" ? "bg-accent" : preset.id === "frost" ? "bg-surface" : "bg-bg"}`,
                        style: preset.id === "frost" ? {
                            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-fg) 28%, transparent)",
                            backdropFilter: "blur(8px)"
                        } : preset.id === "minimal" ? {
                            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-fg) 18%, transparent)"
                        } : {
                            boxShadow: "0 0 18px color-mix(in srgb, var(--color-accent) 55%, transparent)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 212,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "mt-2 block text-sm",
                        children: preset.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `mt-1 block text-xs ${active === preset.id ? "text-bg/70" : "text-muted"}`,
                        children: preset.line
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this)
                ]
            }, preset.id, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/preview-studio.tsx",
        lineNumber: 202,
        columnNumber: 5
    }, this);
}
_c1 = LookPresets;
function PhysicsSlider({ label, max, value, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "text-sm text-muted",
        children: [
            label,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "range",
                min: 0,
                max: max,
                step: 1,
                value: value,
                onChange: (event)=>onChange(Number(event.target.value)),
                className: "mt-2 w-full accent-accent"
            }, void 0, false, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/preview-studio.tsx",
        lineNumber: 243,
        columnNumber: 5
    }, this);
}
_c2 = PhysicsSlider;
function HeroTypeControls({ hud, activeLayer, onActiveLayer, editLayer }) {
    _s();
    const layer = hud.layers[activeLayer];
    const [gradientDraft, setGradientDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(layer.gradientCss);
    const [colorDraft, setColorDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(layer.solidColor);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeroTypeControls.useEffect": ()=>{
            setGradientDraft(layer.gradientCss);
            setColorDraft(layer.solidColor);
        }
    }["HeroTypeControls.useEffect"], [
        activeLayer,
        layer.gradientCss,
        layer.solidColor
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
        className: "grid gap-3 rounded-2xl bg-surface-2/70 p-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                className: "px-1 text-[11px] uppercase tracking-[0.18em] text-muted",
                children: "Hero type"
            }, void 0, false, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 280,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                role: "radiogroup",
                "aria-label": "Text layer",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_LAYER_IDS"].map((id)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        role: "radio",
                        "aria-checked": activeLayer === id,
                        onClick: ()=>onActiveLayer?.(id),
                        className: `h-10 rounded-full px-3 text-sm ${activeLayer === id ? "bg-fg text-bg" : "bg-surface text-fg"}`,
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_LAYER_LABELS"][id]
                    }, id, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 283,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 281,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-muted",
                children: [
                    "Text",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: layer.text,
                        maxLength: activeLayer === "cta_button" ? 48 : activeLayer === "subheadline" ? 180 : 140,
                        onChange: (event)=>editLayer({
                                text: event.target.value
                            }),
                        onBlur: ()=>editLayer({
                                text: layer.text
                            }, true),
                        placeholder: activeLayer === "headline" ? "Blank keeps the shop name" : activeLayer === "cta_button" ? "Blank keeps the book label" : "Blank keeps the tagline",
                        className: "mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg"
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 297,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 295,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-muted",
                children: [
                    "Font",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: layer.fontFamily,
                        onChange: (event)=>editLayer({
                                fontFamily: event.target.value
                            }, true),
                        className: "mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_FONTS"].map((font)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: font,
                                children: font
                            }, font, false, {
                                fileName: "[project]/src/components/preview-studio.tsx",
                                lineNumber: 316,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                role: "radiogroup",
                "aria-label": "Color mode",
                children: [
                    "solid",
                    "gradient"
                ].map((mode)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        role: "radio",
                        "aria-checked": layer.colorMode === mode,
                        onClick: ()=>editLayer({
                                colorMode: mode
                            }, true),
                        className: `h-10 rounded-full px-3 text-sm capitalize ${layer.colorMode === mode ? "bg-fg text-bg" : "bg-surface text-fg"}`,
                        children: mode
                    }, mode, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 324,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 322,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-muted",
                children: [
                    "Solid color",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "mt-2 flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: layer.solidColor,
                                "aria-label": "Solid color picker",
                                onChange: (event)=>editLayer({
                                        solidColor: event.target.value.toUpperCase()
                                    }),
                                onBlur: ()=>editLayer({
                                        solidColor: layer.solidColor
                                    }, true),
                                className: "h-11 w-14 cursor-pointer rounded-xl bg-surface p-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/preview-studio.tsx",
                                lineNumber: 339,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: colorDraft,
                                onChange: (event)=>{
                                    setColorDraft(event.target.value);
                                    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(event.target.value);
                                    if (next) editLayer({
                                        solidColor: next
                                    });
                                },
                                onBlur: ()=>{
                                    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(colorDraft) || layer.solidColor;
                                    setColorDraft(next);
                                    editLayer({
                                        solidColor: next
                                    }, true);
                                },
                                spellCheck: false,
                                className: "h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 font-mono text-sm text-fg"
                            }, void 0, false, {
                                fileName: "[project]/src/components/preview-studio.tsx",
                                lineNumber: 347,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 338,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 336,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-muted",
                children: [
                    "CSS gradient",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: gradientDraft,
                        onChange: (event)=>{
                            setGradientDraft(event.target.value);
                            const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeGradient"])(event.target.value, "");
                            if (next) editLayer({
                                gradientCss: next
                            });
                        },
                        onBlur: ()=>{
                            const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeGradient"])(gradientDraft, layer.gradientCss);
                            setGradientDraft(next);
                            editLayer({
                                gradientCss: next
                            }, true);
                        },
                        spellCheck: false,
                        placeholder: "linear-gradient(...)",
                        className: "mt-2 h-11 w-full rounded-xl bg-surface px-3 font-mono text-sm text-fg"
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 366,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 364,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-muted",
                children: [
                    "Visual effect",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: layer.effect,
                        onChange: (event)=>editLayer({
                                effect: event.target.value
                            }, true),
                        className: "mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_EFFECTS"].map((effect)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: effect,
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERO_EFFECT_LABELS"][effect]
                            }, effect, false, {
                                fileName: "[project]/src/components/preview-studio.tsx",
                                lineNumber: 391,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/preview-studio.tsx",
                        lineNumber: 385,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/preview-studio.tsx",
                lineNumber: 383,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/preview-studio.tsx",
        lineNumber: 279,
        columnNumber: 5
    }, this);
}
_s(HeroTypeControls, "Fqxz5FPuaBUvTbwwEY9BCn5ZCSs=");
_c3 = HeroTypeControls;
const FAQ = [
    {
        q: "What does the trial cost today?",
        a: "The 30-day trial is $0 today. The published renewal is $497 a month starting day 31."
    },
    {
        q: "What is the monthly plan?",
        a: "Managed Territory Growth Engine is $497 every month. The calculator multiplies that published price. It is not a discount."
    },
    {
        q: "What is the one-time plan?",
        a: "Lifetime Territory Monopoly is $2,497 once. The territory stays with that purchase."
    },
    {
        q: "Does the page send outreach?",
        a: "No. Campaign mode stays in simulation. Nothing on this page sends a live message."
    }
];
function FaqAccordion() {
    _s1();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const reduced = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "faq",
        className: "px-5 py-16 sm:px-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-3xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] uppercase tracking-[0.22em] text-muted",
                    children: "Questions"
                }, void 0, false, {
                    fileName: "[project]/src/components/preview-studio.tsx",
                    lineNumber: 426,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "mt-2 font-display text-3xl",
                    children: "The book, in plain terms."
                }, void 0, false, {
                    fileName: "[project]/src/components/preview-studio.tsx",
                    lineNumber: 427,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 grid gap-2",
                    children: FAQ.map((item, index)=>{
                        const on = open === index;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hud-card overflow-hidden rounded-2xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-expanded": on,
                                    onClick: ()=>setOpen(on ? null : index),
                                    className: "flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm",
                                    children: [
                                        item.q,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-muted",
                                            children: on ? "−" : "+"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 440,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 433,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                    initial: false,
                                    children: on ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: reduced ? false : {
                                            height: 0,
                                            opacity: 0
                                        },
                                        animate: {
                                            height: "auto",
                                            opacity: 1
                                        },
                                        exit: reduced ? {
                                            height: "auto",
                                            opacity: 1
                                        } : {
                                            height: 0,
                                            opacity: 0
                                        },
                                        transition: reduced ? {
                                            duration: 0
                                        } : {
                                            type: "spring",
                                            stiffness: 420,
                                            damping: 34
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "px-4 pb-4 text-sm text-muted",
                                            children: item.a
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/preview-studio.tsx",
                                            lineNumber: 451,
                                            columnNumber: 23
                                        }, this)
                                    }, "body", false, {
                                        fileName: "[project]/src/components/preview-studio.tsx",
                                        lineNumber: 444,
                                        columnNumber: 21
                                    }, this) : null
                                }, void 0, false, {
                                    fileName: "[project]/src/components/preview-studio.tsx",
                                    lineNumber: 442,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, item.q, true, {
                            fileName: "[project]/src/components/preview-studio.tsx",
                            lineNumber: 432,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/src/components/preview-studio.tsx",
                    lineNumber: 428,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/preview-studio.tsx",
            lineNumber: 425,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/preview-studio.tsx",
        lineNumber: 424,
        columnNumber: 5
    }, this);
}
_s1(FaqAccordion, "Qd4f1wpdrDvJoeWUIRvGjxU2k4E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"]
    ];
});
_c4 = FaqAccordion;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "PreviewStudio");
__turbopack_context__.k.register(_c1, "LookPresets");
__turbopack_context__.k.register(_c2, "PhysicsSlider");
__turbopack_context__.k.register(_c3, "HeroTypeControls");
__turbopack_context__.k.register(_c4, "FaqAccordion");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/reveal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Reveal",
    ()=>Reveal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const spring = {
    type: "spring",
    stiffness: 70,
    damping: 16,
    mass: 0.85
};
function Reveal({ children, className, delay = 0, stagger = false }) {
    _s();
    const reduce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const still = reduce !== false;
    if (stagger) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(className),
            children: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].map(children, (child, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    className: "min-w-0",
                    initial: still ? false : {
                        opacity: 0,
                        y: 22
                    },
                    whileInView: {
                        opacity: 1,
                        y: 0
                    },
                    viewport: {
                        once: true,
                        margin: "0px 0px -24px 0px"
                    },
                    transition: still ? {
                        duration: 0
                    } : {
                        ...spring,
                        delay: delay + index * 0.06
                    },
                    children: child
                }, index, false, {
                    fileName: "[project]/src/components/reveal.tsx",
                    lineNumber: 27,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/reveal.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        className: className,
        initial: still ? false : {
            opacity: 0,
            y: 28
        },
        whileInView: {
            opacity: 1,
            y: 0
        },
        viewport: {
            once: true,
            margin: "0px 0px -24px 0px"
        },
        transition: still ? {
            duration: 0
        } : {
            ...spring,
            delay
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/reveal.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(Reveal, "VqoxUmuj54Zl2QZdC/zIZVdX+nY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"]
    ];
});
_c = Reveal;
var _c;
__turbopack_context__.k.register(_c, "Reveal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/status-pill.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StatusPill",
    ()=>StatusPill,
    "StatusRow",
    ()=>StatusRow,
    "toneAt",
    ()=>toneAt,
    "useOsTicker",
    ()=>useOsTicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const listeners = new Set();
let snap = {
    online: true,
    secure: true,
    latency: 18
};
let timer = 0;
let raf = 0;
function publish(next) {
    snap = next;
    listeners.forEach((fn)=>fn(next));
}
function sample() {
    const start = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame((now)=>{
        const frame = Math.min(16, Math.abs(now - start));
        const drift = performance.now() % 29;
        publish({
            online: navigator.onLine,
            secure: window.isSecureContext,
            latency: Math.round(8 + drift + frame)
        });
    });
}
function onNet() {
    publish({
        ...snap,
        online: navigator.onLine,
        secure: window.isSecureContext
    });
}
function ensure() {
    if (timer) return;
    sample();
    timer = window.setInterval(sample, 1000);
    window.addEventListener("online", onNet);
    window.addEventListener("offline", onNet);
}
function release() {
    if (listeners.size > 0) return;
    window.clearInterval(timer);
    timer = 0;
    cancelAnimationFrame(raf);
    window.removeEventListener("online", onNet);
    window.removeEventListener("offline", onNet);
}
function useOsTicker() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(snap);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useOsTicker.useEffect": ()=>{
            listeners.add(setState);
            ensure();
            setState(snap);
            return ({
                "useOsTicker.useEffect": ()=>{
                    listeners.delete(setState);
                    release();
                }
            })["useOsTicker.useEffect"];
        }
    }["useOsTicker.useEffect"], []);
    return state;
}
_s(useOsTicker, "VlWJRZL0pM1TWQnpbmP/LotG4aI=");
function toneAt(index) {
    const tones = [
        "node",
        "channel",
        "latency"
    ];
    return tones[index % tones.length] ?? "node";
}
function StatusPill({ tone = "node", className }) {
    _s1();
    const link = useOsTicker();
    const synced = link.online && link.secure;
    const label = tone === "latency" ? link.online ? `link ${link.latency} ms` : "link standby" : tone === "channel" ? synced ? "channel sync" : link.online ? "channel open" : "channel standby" : link.online ? "node live" : "node standby";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("status-pill", className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("status-dot", link.online ? "is-live" : "is-wait"),
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/src/components/status-pill.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "min-w-0 truncate",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/status-pill.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/status-pill.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
_s1(StatusPill, "U/X3/iLTL97FUmPQ7lxlGUmkrfw=", false, function() {
    return [
        useOsTicker
    ];
});
_c = StatusPill;
function StatusRow({ tones = [
    "node",
    "channel",
    "latency"
], className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("status-row", className),
        children: tones.map((tone)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                tone: tone
            }, tone, false, {
                fileName: "[project]/src/components/status-pill.tsx",
                lineNumber: 119,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/status-pill.tsx",
        lineNumber: 117,
        columnNumber: 5
    }, this);
}
_c1 = StatusRow;
var _c, _c1;
__turbopack_context__.k.register(_c, "StatusPill");
__turbopack_context__.k.register(_c1, "StatusRow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/telemetry-log.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TelemetryLog",
    ()=>TelemetryLog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const TYPE_MS = 32;
const HOLD_MS = 1100;
function readLink() {
    return {
        webgl: typeof WebGL2RenderingContext !== "undefined" && !document.documentElement.classList.contains("fluid-off"),
        secure: window.isSecureContext,
        online: navigator.onLine
    };
}
function lineFor(snap, index) {
    const key = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BROWSER_LOG_ORDER"][index];
    if (key === "GPU") return `GPU  ${snap.webgl ? "WebGL2 core online" : "WebGL core standby"}`;
    if (key === "FRAME") return `FRAME  ${snap.fps > 0 ? snap.fps : "—"} fps`;
    if (key === "LINK") return `LINK  ${snap.secure ? "secure" : "open"}  ${snap.online ? "verified" : "down"}`;
    return "AI  engine standby";
}
function TelemetryLog({ dataset = [] }) {
    _s();
    const extra = dataset.map((line)=>line.trim()).filter(Boolean).slice(0, 3);
    const total = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BROWSER_LOG_ORDER"].length + extra.length;
    const [snap, setSnap] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        webgl: true,
        fps: 0,
        secure: true,
        online: true
    });
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [count, setCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [reduced, setReduced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [script, setScript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(extra[0] || "GPU  WebGL2 core online");
    const snapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(snap);
    snapRef.current = snap;
    const extraKey = extra.join("\n");
    const lineAt = (shot, cursor)=>{
        if (cursor < extra.length) return extra[cursor] ?? "";
        return lineFor(shot, cursor - extra.length);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TelemetryLog.useEffect": ()=>{
            const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
            setReduced(motion.matches);
            const onMotion = {
                "TelemetryLog.useEffect.onMotion": ()=>setReduced(motion.matches)
            }["TelemetryLog.useEffect.onMotion"];
            motion.addEventListener("change", onMotion);
            let frames = 0;
            let last = performance.now();
            let raf = 0;
            let dead = false;
            const loop = {
                "TelemetryLog.useEffect.loop": (now)=>{
                    if (dead) return;
                    raf = 0;
                    if (document.visibilityState !== "visible") return;
                    frames += 1;
                    if (now - last >= 1000) {
                        const fps = Math.round(frames * 1000 / (now - last));
                        const link = readLink();
                        setSnap({
                            fps,
                            ...link
                        });
                        frames = 0;
                        last = now;
                    }
                    raf = requestAnimationFrame(loop);
                }
            }["TelemetryLog.useEffect.loop"];
            const onVisibility = {
                "TelemetryLog.useEffect.onVisibility": ()=>{
                    if (dead) return;
                    if (document.visibilityState !== "visible") {
                        cancelAnimationFrame(raf);
                        raf = 0;
                        return;
                    }
                    if (!raf) raf = requestAnimationFrame(loop);
                }
            }["TelemetryLog.useEffect.onVisibility"];
            document.addEventListener("visibilitychange", onVisibility);
            raf = requestAnimationFrame(loop);
            const onNet = {
                "TelemetryLog.useEffect.onNet": ()=>setSnap({
                        "TelemetryLog.useEffect.onNet": (prev)=>({
                                ...prev,
                                ...readLink()
                            })
                    }["TelemetryLog.useEffect.onNet"])
            }["TelemetryLog.useEffect.onNet"];
            window.addEventListener("online", onNet);
            window.addEventListener("offline", onNet);
            return ({
                "TelemetryLog.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(raf);
                    document.removeEventListener("visibilitychange", onVisibility);
                    motion.removeEventListener("change", onMotion);
                    window.removeEventListener("online", onNet);
                    window.removeEventListener("offline", onNet);
                }
            })["TelemetryLog.useEffect"];
        }
    }["TelemetryLog.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TelemetryLog.useEffect": ()=>{
            setScript(lineAt(snapRef.current, index));
            setCount(0);
        }
    }["TelemetryLog.useEffect"], [
        index,
        extraKey
    ]);
    const full = reduced ? lineAt(snap, index) : script;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TelemetryLog.useEffect": ()=>{
            if (!reduced) return;
            const timer = window.setInterval({
                "TelemetryLog.useEffect.timer": ()=>setIndex({
                        "TelemetryLog.useEffect.timer": (n)=>(n + 1) % total
                    }["TelemetryLog.useEffect.timer"])
            }["TelemetryLog.useEffect.timer"], 2400);
            return ({
                "TelemetryLog.useEffect": ()=>window.clearInterval(timer)
            })["TelemetryLog.useEffect"];
        }
    }["TelemetryLog.useEffect"], [
        reduced,
        total
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TelemetryLog.useEffect": ()=>{
            if (reduced) return;
            if (count < full.length) {
                const timer = window.setTimeout({
                    "TelemetryLog.useEffect.timer": ()=>setCount({
                            "TelemetryLog.useEffect.timer": (n)=>n + 1
                        }["TelemetryLog.useEffect.timer"])
                }["TelemetryLog.useEffect.timer"], TYPE_MS);
                return ({
                    "TelemetryLog.useEffect": ()=>window.clearTimeout(timer)
                })["TelemetryLog.useEffect"];
            }
            const timer = window.setTimeout({
                "TelemetryLog.useEffect.timer": ()=>{
                    setIndex({
                        "TelemetryLog.useEffect.timer": (n)=>(n + 1) % total
                    }["TelemetryLog.useEffect.timer"]);
                    setCount(0);
                }
            }["TelemetryLog.useEffect.timer"], HOLD_MS);
            return ({
                "TelemetryLog.useEffect": ()=>window.clearTimeout(timer)
            })["TelemetryLog.useEffect"];
        }
    }["TelemetryLog.useEffect"], [
        count,
        full,
        reduced,
        total
    ]);
    const shown = reduced ? full : full.slice(0, count);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "telemetry-panel pointer-events-none left-3 top-[5.25rem] sm:left-8",
        "aria-label": "System core log",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "telemetry-live",
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/src/components/telemetry-log.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-fg/80",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-emerald",
                        children: "CORE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/telemetry-log.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "mx-1.5 text-faint",
                        children: "/"
                    }, void 0, false, {
                        fileName: "[project]/src/components/telemetry-log.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: shown
                    }, void 0, false, {
                        fileName: "[project]/src/components/telemetry-log.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this),
                    reduced ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "telemetry-caret",
                        "aria-hidden": true
                    }, void 0, false, {
                        fileName: "[project]/src/components/telemetry-log.tsx",
                        lineNumber: 135,
                        columnNumber: 27
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/telemetry-log.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/telemetry-log.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
_s(TelemetryLog, "QttEiA6hchbjkfdETSn4JsJ+q5E=");
_c = TelemetryLog;
var _c;
__turbopack_context__.k.register(_c, "TelemetryLog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/tenant-preview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TenantPreview",
    ()=>TenantPreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/magnetic.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$niche$2d$storefront$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/niche-storefront.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$nichePresets$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/nichePresets.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$business$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/business-brand.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$preview$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/preview-studio.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$brand$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/brand-studio.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/brand-studio.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/preview-link.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/niches.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
;
;
;
;
function TenantPreview({ niche, search, loaded = null, onNiche, claim }) {
    _s();
    const template = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHES"][niche];
    const media = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][niche];
    const copy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nicheCopy"])(niche);
    const bookLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$nichePresets$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["presetForShopNiche"])(niche).bookingCta || copy.bookLabel;
    const previewOn = search.preview === true || Boolean(search.business);
    const seedName = (search.business || search.biz || template.defaultName).trim();
    const [hud, setHud] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "TenantPreview.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyDepthStudio"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_HUD"], niche)
    }["TenantPreview.useState"]);
    const [activeLayer, setActiveLayer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("headline");
    const [header, setHeader] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(seedName);
    const [tagline, setTagline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(template.tagline);
    const [themeId, setThemeId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "TenantPreview.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["previewThemeId"])(seedName)
    }["TenantPreview.useState"]);
    const [styleId, setStyleId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "TenantPreview.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["previewStyleId"])(seedName)
    }["TenantPreview.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TenantPreview.useEffect": ()=>{
            setHud((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyDepthStudio"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_HUD"], niche));
        }
    }["TenantPreview.useEffect"], [
        niche
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TenantPreview.useEffect": ()=>{
            setHeader(seedName);
            setTagline(template.tagline);
            setThemeId((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["previewThemeId"])(seedName));
            setStyleId((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["previewStyleId"])(seedName));
        }
    }["TenantPreview.useEffect"], [
        seedName,
        template.tagline
    ]);
    const mapped = loaded ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$business$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapBusinessToTemplateBrand"])(loaded) : null;
    const brand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveProspectBrand"])({
        fallbackName: mapped?.businessName || template.defaultName,
        fallbackAccent: template.ringColor,
        businessName: search.biz || search.business || mapped?.businessName,
        logoUrl: search.logo || mapped?.logoUrl || undefined,
        accent: search.accent || mapped?.accent || undefined,
        contactName: mapped?.contactName,
        contactPhone: search.phone || mapped?.contactPhone,
        contactEmail: search.email || mapped?.contactEmail
    });
    const theme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rippleTheme"])(themeId);
    const mark = theme ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileBrandMark"])(header || seedName, tagline, theme.accent) : null;
    const services = template.services.map((service, index)=>({
            key: `${service.name}-${index}`,
            name: service.name,
            description: service.description,
            price: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatOffer"])(service),
            group: service.group
        }));
    const staff = [
        0,
        1
    ].map((index)=>{
        const person = template.employees[index];
        return {
            key: person?.displayName ?? `staff-${index}`,
            displayName: person?.displayName ?? (index === 0 ? "Alex Morgan" : "Willa Grant"),
            title: person?.title ?? "",
            bio: person?.bio ?? "",
            avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHARED_STAFF"][index]
        };
    });
    const painted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["paintHero"])(media.heroImageUrl, media.heroVideoUrl || null, hud, media.heroVideos);
    const heroChoices = [
        {
            id: "film",
            label: media.loopLabel
        },
        ...media.heroImageUrl ? [
            {
                id: "still",
                label: "Niche still"
            }
        ] : [],
        {
            id: "url",
            label: "Custom URL"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-dvh bg-transparent pb-28",
        children: [
            previewOn && theme ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "axiom-ring",
                "data-state": "idle",
                style: {
                    ["--ring-color"]: theme.ring
                },
                "aria-hidden": "true",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "axiom-ring-edge"
                    }, void 0, false, {
                        fileName: "[project]/src/components/tenant-preview.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "axiom-ring-bloom"
                    }, void 0, false, {
                        fileName: "[project]/src/components/tenant-preview.tsx",
                        lineNumber: 109,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/tenant-preview.tsx",
                lineNumber: 107,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$niche$2d$storefront$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NicheStorefront"], {
                businessName: previewOn ? header || seedName : brand.businessName,
                kicker: `Live preview · ${mapped?.categoryLabel || template.label}`,
                tagline: previewOn ? tagline : template.tagline,
                description: template.description,
                address: mapped?.location || (search.city ? `${search.city}` : template.address),
                accent: previewOn && theme ? theme.accent : brand.accent,
                logoUrl: previewOn && mark ? mark.dataUrl : brand.logoUrl,
                contactName: brand.contactName,
                contactPhone: brand.contactPhone,
                contactEmail: brand.contactEmail,
                services: services,
                hours: template.hours ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_HOURS"],
                staff: staff,
                heroImageUrl: painted.imageUrl,
                heroVideoUrl: painted.videos.length > 1 ? painted.videos : painted.videoUrl,
                blendPercent: hud.fade,
                introPreset: previewOn ? styleId : template.introPreset,
                introSpeed: template.introSpeed,
                introIntensity: template.introIntensity,
                tone: media.tone ?? null,
                fallbackImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].trade.heroImageUrl,
                fallbackVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].trade.heroVideoUrl,
                bookLabel: bookLabel,
                bookHref: "#book",
                niche: niche,
                hud: hud,
                headline: hud.headline,
                layoutEditable: true,
                surface: previewOn && theme ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["themeSurface"])(theme) : undefined,
                activeLayer: activeLayer,
                onActiveLayer: setActiveLayer,
                onLayerChange: (id, layer)=>setHud((current)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hud$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setHeroLayer"])(current, id, layer)),
                extra: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        previewOn && theme ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "mx-auto grid max-w-5xl gap-4 px-5 pb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$brand$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AxiomGenerativeBrandingStudio"], {
                                    header: header,
                                    tagline: tagline,
                                    theme: themeId,
                                    onHeader: setHeader,
                                    onTagline: setTagline,
                                    onTheme: setThemeId
                                }, void 0, false, {
                                    fileName: "[project]/src/components/tenant-preview.tsx",
                                    lineNumber: 149,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "grid gap-2 text-sm text-fg",
                                    children: [
                                        "Hero presentation",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "h-11 rounded-xl bg-surface px-3",
                                            value: styleId,
                                            onChange: (event)=>setStyleId(event.target.value),
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"].map((style)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: style.id,
                                                    children: style.label
                                                }, style.id, false, {
                                                    fileName: "[project]/src/components/tenant-preview.tsx",
                                                    lineNumber: 165,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/tenant-preview.tsx",
                                            lineNumber: 159,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/tenant-preview.tsx",
                                    lineNumber: 157,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/tenant-preview.tsx",
                            lineNumber: 148,
                            columnNumber: 15
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$preview$2d$studio$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PreviewStudio"], {
                            hud: hud,
                            onChange: setHud,
                            heroChoices: heroChoices,
                            activeLayer: activeLayer,
                            onActiveLayer: setActiveLayer
                        }, void 0, false, {
                            fileName: "[project]/src/components/tenant-preview.tsx",
                            lineNumber: 173,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/tenant-preview.tsx",
                    lineNumber: 146,
                    columnNumber: 11
                }, this),
                header: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "min-w-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "sr-only",
                            children: "Explore industries"
                        }, void 0, false, {
                            fileName: "[project]/src/components/tenant-preview.tsx",
                            lineNumber: 184,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            className: "h-11 max-w-48 rounded-xl bg-surface px-3 text-sm text-fg",
                            value: niche,
                            onChange: (event)=>{
                                const next = event.target.value;
                                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPublicNiche"])(next)) return;
                                onNiche(next);
                            },
                            children: [
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PUBLIC_NICHE_ORDER"].map((key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: key,
                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHES"][key].label
                                    }, key, false, {
                                        fileName: "[project]/src/components/tenant-preview.tsx",
                                        lineNumber: 195,
                                        columnNumber: 17
                                    }, this)),
                                !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPublicNiche"])(niche) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: niche,
                                    children: template.label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/tenant-preview.tsx",
                                    lineNumber: 199,
                                    columnNumber: 40
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/tenant-preview.tsx",
                            lineNumber: 185,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/tenant-preview.tsx",
                    lineNumber: 183,
                    columnNumber: 11
                }, this),
                footer: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    id: "book",
                    className: "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:pl-36",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted",
                                children: [
                                    template.label,
                                    " preview. The services and the book are this trade’s."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/tenant-preview.tsx",
                                lineNumber: 209,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$magnetic$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Magnetic"], {
                                className: "inline-flex w-full sm:w-auto",
                                children: claim
                            }, void 0, false, {
                                fileName: "[project]/src/components/tenant-preview.tsx",
                                lineNumber: 210,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/tenant-preview.tsx",
                        lineNumber: 208,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/tenant-preview.tsx",
                    lineNumber: 204,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/tenant-preview.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/tenant-preview.tsx",
        lineNumber: 105,
        columnNumber: 5
    }, this);
}
_s(TenantPreview, "0ZEwRihgxhvVrP4XkGBiQUCwAyo=");
_c = TenantPreview;
var _c;
__turbopack_context__.k.register(_c, "TenantPreview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input,
    "Label",
    ()=>Label
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
function Input({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm text-fg placeholder:text-faint shadow-[0_0_0_1px_rgba(243,241,235,0.08)] outline-none transition-[box-shadow] duration-150 focus:shadow-[0_0_0_2px_var(--color-accent)]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/input.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Input;
function Label({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mb-1.5 block text-xs font-medium tracking-wide text-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/input.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_c1 = Label;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input");
__turbopack_context__.k.register(_c1, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/config/nichePresets.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NICHE_PRESETS",
    ()=>NICHE_PRESETS,
    "nichePresetById",
    ()=>nichePresetById,
    "presetForShopNiche",
    ()=>presetForShopNiche,
    "presetsForShop",
    ()=>presetsForShop
]);
const NICHE_PRESETS = [
    {
        id: "barbershop",
        shopNiche: "location",
        label: "Barbershop",
        title: "The Chair",
        tagline: "Fades, hot towels, and a chair that starts on time.",
        accent: "#E7B48A",
        keywords: [
            "barber near me",
            "fade",
            "hot towel shave",
            "beard trim",
            "walk-in haircut"
        ],
        auditTitle: "How soon do you need the chair?",
        auditNote: "A short check so the shop can hold the right block.",
        auditQuestions: [
            {
                id: "visit",
                label: "What do you need?",
                choices: [
                    {
                        value: "Cut",
                        label: "A cut"
                    },
                    {
                        value: "Fade",
                        label: "A fade"
                    },
                    {
                        value: "Beard",
                        label: "Beard and lineup"
                    }
                ]
            },
            {
                id: "lastVisit",
                label: "Last time in a chair",
                choices: [
                    {
                        value: "This month",
                        label: "This month"
                    },
                    {
                        value: "A few months",
                        label: "A few months ago"
                    },
                    {
                        value: "Not sure",
                        label: "Not sure"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Signature cut",
                detail: "Consult, cut, and finish.",
                priceLabel: "$45",
                durationMin: 45
            },
            {
                name: "Skin fade",
                detail: "Tight blend, razor line, hot towel.",
                priceLabel: "$52",
                durationMin: 50
            },
            {
                name: "Beard sculpt",
                detail: "Shape, lineup, and oil.",
                priceLabel: "$28",
                durationMin: 25
            }
        ],
        bookingCta: "Book a chair"
    },
    {
        id: "contractor",
        shopNiche: "contractor",
        label: "General contractor",
        title: "Hearth Line",
        tagline: "Walk the job site. Leave with a scope and a number.",
        accent: "#D7A15A",
        keywords: [
            "general contractor",
            "home repair",
            "remodel",
            "handyman",
            "home services"
        ],
        auditTitle: "What should the estimate cover?",
        auditNote: "A plain description is enough to hold the visit.",
        auditQuestions: [
            {
                id: "job",
                label: "The job",
                choices: [
                    {
                        value: "Repair",
                        label: "A repair"
                    },
                    {
                        value: "Remodel",
                        label: "A remodel"
                    },
                    {
                        value: "Look",
                        label: "Just come look"
                    }
                ]
            },
            {
                id: "timing",
                label: "When?",
                choices: [
                    {
                        value: "This week",
                        label: "This week"
                    },
                    {
                        value: "This month",
                        label: "This month"
                    },
                    {
                        value: "Planning",
                        label: "I'm still planning"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Site visit",
                detail: "A walk-through and a written range.",
                priceLabel: "$95",
                durationMin: 60
            },
            {
                name: "Small repair",
                detail: "One problem, finished in a visit.",
                priceLabel: "$240",
                durationMin: 120
            },
            {
                name: "Remodel consult",
                detail: "The plan before the work starts.",
                priceLabel: "$150",
                durationMin: 75
            }
        ],
        bookingCta: "Book a site visit"
    },
    {
        id: "roofing",
        shopNiche: "contractor",
        label: "Roofing",
        title: "Ridge Roofing",
        tagline: "A look at the roof, then a price you can read.",
        accent: "#C4783A",
        keywords: [
            "roof repair",
            "roof leak",
            "shingle replacement",
            "roof inspection",
            "storm damage"
        ],
        auditTitle: "What is the roof doing?",
        auditNote: "Tell the crew what you can see from the ground.",
        auditQuestions: [
            {
                id: "symptom",
                label: "What is happening?",
                choices: [
                    {
                        value: "Leak",
                        label: "A leak"
                    },
                    {
                        value: "Missing shingles",
                        label: "Missing shingles"
                    },
                    {
                        value: "Just a look",
                        label: "I want it looked at"
                    }
                ]
            },
            {
                id: "age",
                label: "How old is the roof?",
                choices: [
                    {
                        value: "Under 10 years",
                        label: "Under 10 years"
                    },
                    {
                        value: "10-20 years",
                        label: "10–20 years"
                    },
                    {
                        value: "Older or unknown",
                        label: "Older, or I don't know"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Roof look",
                detail: "A walk of the roof and a plain report.",
                priceLabel: "$149",
                durationMin: 60
            },
            {
                name: "Leak stop",
                detail: "Find the leak and close it.",
                priceLabel: "$350",
                durationMin: 120
            },
            {
                name: "Shingle repair",
                detail: "Replace the damaged run.",
                priceLabel: "$680",
                durationMin: 180
            }
        ],
        bookingCta: "Book a roof visit"
    },
    {
        id: "plumbing",
        shopNiche: "contractor",
        label: "Plumbing",
        title: "Clear Line Plumbing",
        tagline: "The leak, the drain, or the water heater. We come to the house.",
        accent: "#7EC8E3",
        keywords: [
            "plumber near me",
            "clogged drain",
            "water heater",
            "leaky faucet",
            "emergency plumber"
        ],
        auditTitle: "Where is the water going?",
        auditNote: "A few taps so the plumber brings the right parts.",
        auditQuestions: [
            {
                id: "problem",
                label: "What is wrong?",
                choices: [
                    {
                        value: "Drain",
                        label: "A drain won't clear"
                    },
                    {
                        value: "Leak",
                        label: "Something is leaking"
                    },
                    {
                        value: "No hot water",
                        label: "No hot water"
                    }
                ]
            },
            {
                id: "urgency",
                label: "How soon?",
                choices: [
                    {
                        value: "Today",
                        label: "Today"
                    },
                    {
                        value: "This week",
                        label: "This week"
                    },
                    {
                        value: "Whenever",
                        label: "Whenever you can"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Drain call",
                detail: "One drain, cleared and checked.",
                priceLabel: "$165",
                durationMin: 60
            },
            {
                name: "Leak visit",
                detail: "Find the drip and stop it.",
                priceLabel: "$189",
                durationMin: 75
            },
            {
                name: "Water heater check",
                detail: "Look at the tank and the lines.",
                priceLabel: "$129",
                durationMin: 45
            }
        ],
        bookingCta: "Book a plumber"
    },
    {
        id: "hvac",
        shopNiche: "contractor",
        label: "HVAC",
        title: "North Cooling",
        tagline: "Heat, cool, and the filter that should have been changed.",
        accent: "#6FA8A0",
        keywords: [
            "ac repair",
            "furnace repair",
            "hvac tune up",
            "no heat",
            "air conditioning"
        ],
        auditTitle: "Is the house too hot or too cold?",
        auditNote: "The tech uses this to know which unit to open.",
        auditQuestions: [
            {
                id: "system",
                label: "Which system?",
                choices: [
                    {
                        value: "Cooling",
                        label: "Air conditioning"
                    },
                    {
                        value: "Heat",
                        label: "Furnace or heat"
                    },
                    {
                        value: "Both",
                        label: "Both"
                    }
                ]
            },
            {
                id: "lastService",
                label: "Last tune-up",
                choices: [
                    {
                        value: "This year",
                        label: "This year"
                    },
                    {
                        value: "Over a year",
                        label: "More than a year"
                    },
                    {
                        value: "Never",
                        label: "Never, or I don't know"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Tune-up",
                detail: "Filters, coils, and a run test.",
                priceLabel: "$129",
                durationMin: 60
            },
            {
                name: "No-cool call",
                detail: "The unit that stopped cooling.",
                priceLabel: "$189",
                durationMin: 90
            },
            {
                name: "No-heat call",
                detail: "The unit that stopped heating.",
                priceLabel: "$189",
                durationMin: 90
            }
        ],
        bookingCta: "Book a tune-up"
    },
    {
        id: "content",
        shopNiche: "creator",
        label: "Cinematic Video and Content Creator",
        title: "Frame Desk",
        tagline: "Shot, cut, and ready to post when you book it.",
        accent: "#7C6BF2",
        keywords: [
            "video editor",
            "content creator",
            "social video",
            "youtube edit",
            "shoot and edit"
        ],
        auditTitle: "What should the video do?",
        auditNote: "So the editor knows the length before the shoot.",
        auditQuestions: [
            {
                id: "job",
                label: "What do you need?",
                choices: [
                    {
                        value: "Shoot",
                        label: "Someone to film"
                    },
                    {
                        value: "Edit",
                        label: "An edit of footage I have"
                    },
                    {
                        value: "Both",
                        label: "Film and edit"
                    }
                ]
            },
            {
                id: "length",
                label: "How long is the piece?",
                choices: [
                    {
                        value: "Short",
                        label: "Under a minute"
                    },
                    {
                        value: "Standard",
                        label: "A few minutes"
                    },
                    {
                        value: "Long",
                        label: "Longer than that"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Content day",
                detail: "A half day on camera.",
                priceLabel: "$450",
                durationMin: 180
            },
            {
                name: "Video edit",
                detail: "One finished piece from your footage.",
                priceLabel: "$180",
                durationMin: 90
            },
            {
                name: "Shoot and cut",
                detail: "The day plus the edit.",
                priceLabel: "$720",
                durationMin: 240
            }
        ],
        bookingCta: "Book the edit"
    },
    {
        id: "prompt",
        shopNiche: "prompt",
        label: "AI prompt engineering and creation",
        title: "Prompt Desk",
        tagline: "The prompt is written before the piece is made.",
        accent: "#3D7EFF",
        keywords: [
            "prompt engineering",
            "ai prompt",
            "ai creation",
            "custom prompts"
        ],
        auditTitle: "What should the prompt do?",
        auditNote: "So the desk knows the job before the session.",
        auditQuestions: [
            {
                id: "job",
                label: "What do you need?",
                choices: [
                    {
                        value: "Session",
                        label: "A prompt session"
                    },
                    {
                        value: "Pack",
                        label: "A written prompt pack"
                    },
                    {
                        value: "Build",
                        label: "Prompts and the finished piece"
                    }
                ]
            },
            {
                id: "use",
                label: "Where will it be used?",
                choices: [
                    {
                        value: "Image",
                        label: "Images"
                    },
                    {
                        value: "Video",
                        label: "Video"
                    },
                    {
                        value: "Copy",
                        label: "Writing"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Prompt session",
                detail: "An hour on the brief.",
                priceLabel: "$150",
                durationMin: 60
            },
            {
                name: "Prompt pack",
                detail: "A written set for the work you named.",
                priceLabel: "$280",
                durationMin: 90
            },
            {
                name: "Creation block",
                detail: "The prompts plus the finished piece.",
                priceLabel: "$480",
                durationMin: 180
            }
        ],
        bookingCta: "Book a session"
    },
    {
        id: "entertainer",
        shopNiche: "entertainer",
        label: "Entertainer",
        title: "House Act",
        tagline: "A set for the room, booked before the night starts.",
        accent: "#E23D8C",
        keywords: [
            "live entertainment",
            "event performer",
            "private show",
            "party act",
            "book a performer"
        ],
        auditTitle: "What kind of night is it?",
        auditNote: "The act uses this to hold the right length.",
        auditQuestions: [
            {
                id: "room",
                label: "Where is it?",
                choices: [
                    {
                        value: "House",
                        label: "A house party"
                    },
                    {
                        value: "Venue",
                        label: "A venue"
                    },
                    {
                        value: "Not sure",
                        label: "Still deciding"
                    }
                ]
            },
            {
                id: "length",
                label: "How long?",
                choices: [
                    {
                        value: "Short set",
                        label: "A short set"
                    },
                    {
                        value: "Hour",
                        label: "About an hour"
                    },
                    {
                        value: "Night",
                        label: "The whole night"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Short set",
                detail: "Twenty minutes. One room.",
                priceLabel: "$150",
                durationMin: 20
            },
            {
                name: "Private show",
                detail: "A booked hour.",
                priceLabel: "$400",
                durationMin: 60
            },
            {
                name: "Full night",
                detail: "Sets, breaks, and the close.",
                priceLabel: "$900",
                durationMin: 180
            }
        ],
        bookingCta: "Book a set"
    },
    {
        id: "locksmith",
        shopNiche: "locksmith",
        label: "Mobile locksmith",
        title: "Night Key",
        tagline: "Lockout, rekey, or a new lock. The van comes to you.",
        accent: "#C6A15B",
        keywords: [
            "locksmith near me",
            "car lockout",
            "house lockout",
            "rekey",
            "emergency locksmith"
        ],
        auditTitle: "Which lock is the problem?",
        auditNote: "So the van leaves with the right blanks.",
        auditQuestions: [
            {
                id: "lock",
                label: "Where is the lock?",
                choices: [
                    {
                        value: "House",
                        label: "House"
                    },
                    {
                        value: "Car",
                        label: "Car"
                    },
                    {
                        value: "Shop",
                        label: "Shop or office"
                    }
                ]
            },
            {
                id: "job",
                label: "What do you need?",
                choices: [
                    {
                        value: "Locked out",
                        label: "I'm locked out"
                    },
                    {
                        value: "Rekey",
                        label: "New keys for the same lock"
                    },
                    {
                        value: "New lock",
                        label: "A new lock"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Lockout",
                detail: "Emergency open. House, car, or door.",
                priceLabel: "$125",
                durationMin: 45
            },
            {
                name: "Rekey",
                detail: "Same lock, new keys.",
                priceLabel: "$95",
                durationMin: 60
            },
            {
                name: "Lock install",
                detail: "A new deadbolt, fitted and tested.",
                priceLabel: "$180",
                durationMin: 75
            }
        ],
        bookingCta: "Book a locksmith"
    },
    {
        id: "firewood",
        shopNiche: "firewood",
        label: "Firewood",
        title: "Cord Line",
        tagline: "Cut, split, and dropped where you want the pile.",
        accent: "#C4783A",
        keywords: [
            "firewood delivery",
            "cord of wood",
            "seasoned firewood",
            "firewood near me",
            "stack firewood"
        ],
        auditTitle: "How much wood do you need?",
        auditNote: "The truck is loaded to the size you pick.",
        auditQuestions: [
            {
                id: "amount",
                label: "How much?",
                choices: [
                    {
                        value: "Face cord",
                        label: "A face cord"
                    },
                    {
                        value: "Half cord",
                        label: "Half a cord"
                    },
                    {
                        value: "Full cord",
                        label: "A full cord"
                    }
                ]
            },
            {
                id: "drop",
                label: "Where does it land?",
                choices: [
                    {
                        value: "Driveway",
                        label: "The driveway"
                    },
                    {
                        value: "Side yard",
                        label: "The side yard"
                    },
                    {
                        value: "Not sure",
                        label: "I'll explain when you call"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Cut and split",
                detail: "One cord, cut and split.",
                priceLabel: "$280",
                durationMin: 180
            },
            {
                name: "Cord delivery",
                detail: "A cord dropped at the house.",
                priceLabel: "$320",
                durationMin: 60
            },
            {
                name: "Stack the cord",
                detail: "Stacked and covered.",
                priceLabel: "$80",
                durationMin: 90
            }
        ],
        bookingCta: "Book a cord"
    },
    {
        id: "cleaning",
        shopNiche: "clean",
        label: "Home cleaning",
        title: "Bright House",
        tagline: "A standard clean, a deep clean, or the move-out.",
        accent: "#9FD3C7",
        keywords: [
            "house cleaning",
            "deep clean",
            "move out clean",
            "maid service",
            "recurring cleaning"
        ],
        auditTitle: "What kind of clean?",
        auditNote: "The crew sizes the visit from the rooms, not a long form.",
        auditQuestions: [
            {
                id: "clean",
                label: "Which clean?",
                choices: [
                    {
                        value: "Standard",
                        label: "The regular clean"
                    },
                    {
                        value: "Deep",
                        label: "A deep clean"
                    },
                    {
                        value: "Move-out",
                        label: "Moving out"
                    }
                ]
            },
            {
                id: "size",
                label: "How big is the place?",
                choices: [
                    {
                        value: "Small",
                        label: "1–2 bedrooms"
                    },
                    {
                        value: "Medium",
                        label: "3 bedrooms"
                    },
                    {
                        value: "Large",
                        label: "Bigger than that"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Standard clean",
                detail: "The rooms you live in.",
                priceLabel: "$140",
                durationMin: 120
            },
            {
                name: "Deep clean",
                detail: "Inside the appliances and the baseboards.",
                priceLabel: "$240",
                durationMin: 180
            },
            {
                name: "Move-out",
                detail: "Empty house, ready for the next keys.",
                priceLabel: "$320",
                durationMin: 240
            }
        ],
        bookingCta: "Book a clean"
    },
    {
        id: "landscaper",
        shopNiche: "landscaper",
        label: "Landscaper",
        title: "Green Line",
        tagline: "The yard is booked before the truck leaves.",
        accent: "#6FA86A",
        keywords: [
            "landscaper near me",
            "lawn care",
            "yard cleanup",
            "mowing",
            "planting"
        ],
        auditTitle: "What does the yard need?",
        auditNote: "A couple of taps so the crew brings the right tools.",
        auditQuestions: [
            {
                id: "job",
                label: "The visit",
                choices: [
                    {
                        value: "Mow",
                        label: "A mow"
                    },
                    {
                        value: "Cleanup",
                        label: "A cleanup"
                    },
                    {
                        value: "Planting",
                        label: "Planting"
                    }
                ]
            },
            {
                id: "size",
                label: "How big is the yard?",
                choices: [
                    {
                        value: "Small",
                        label: "A small yard"
                    },
                    {
                        value: "Medium",
                        label: "A regular lot"
                    },
                    {
                        value: "Large",
                        label: "Bigger than that"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Mow and edge",
                detail: "The lawn, the edges, and the blow-off.",
                priceLabel: "$85",
                durationMin: 60
            },
            {
                name: "Cleanup",
                detail: "Beds, leaves, and the haul-away.",
                priceLabel: "$180",
                durationMin: 120
            },
            {
                name: "Planting visit",
                detail: "A bed or a row, planted and watered in.",
                priceLabel: "$240",
                durationMin: 150
            }
        ],
        bookingCta: "Book the yard"
    },
    {
        id: "foodtruck",
        shopNiche: "foodtruck",
        label: "Mobile food truck",
        title: "Window Line",
        tagline: "The truck is booked before the window opens.",
        accent: "#E07A3D",
        keywords: [
            "food truck near me",
            "food truck catering",
            "mobile food",
            "lunch truck",
            "private event food"
        ],
        auditTitle: "What should the truck do?",
        auditNote: "So the window is the right length.",
        auditQuestions: [
            {
                id: "stop",
                label: "The booking",
                choices: [
                    {
                        value: "Lunch",
                        label: "A lunch stop"
                    },
                    {
                        value: "Event",
                        label: "A private event"
                    },
                    {
                        value: "Tray",
                        label: "A tray, no full stop"
                    }
                ]
            },
            {
                id: "crowd",
                label: "How many people?",
                choices: [
                    {
                        value: "Small",
                        label: "Under 30"
                    },
                    {
                        value: "Medium",
                        label: "30–80"
                    },
                    {
                        value: "Large",
                        label: "More than that"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Lunch stop",
                detail: "The truck on site for a lunch window.",
                priceLabel: "$450",
                durationMin: 120
            },
            {
                name: "Private event",
                detail: "A booked window for a party or a crew.",
                priceLabel: "$750",
                durationMin: 180
            },
            {
                name: "Catering tray",
                detail: "Food from the truck, dropped without the full stop.",
                priceLabel: "$180",
                durationMin: 45
            }
        ],
        bookingCta: "Book the truck"
    },
    {
        id: "dogwalk",
        shopNiche: "dogwalk",
        label: "Dog walking",
        title: "Leash Line",
        tagline: "The walk is booked before the leash is clipped.",
        accent: "#C4A15A",
        keywords: [
            "dog walker near me",
            "dog walking",
            "midday dog walk",
            "pack walk",
            "puppy walk"
        ],
        auditTitle: "What does the dog need?",
        auditNote: "So the walker brings the right leash.",
        auditQuestions: [
            {
                id: "walk",
                label: "The visit",
                choices: [
                    {
                        value: "Solo",
                        label: "One dog"
                    },
                    {
                        value: "Pack",
                        label: "A few dogs"
                    },
                    {
                        value: "Midday",
                        label: "A short midday check"
                    }
                ]
            },
            {
                id: "energy",
                label: "How is the dog on a leash?",
                choices: [
                    {
                        value: "Easy",
                        label: "Easy"
                    },
                    {
                        value: "Pulls",
                        label: "Pulls a bit"
                    },
                    {
                        value: "Strong",
                        label: "Needs a strong walker"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Solo walk",
                detail: "One dog, one loop, back at the door.",
                priceLabel: "$25",
                durationMin: 30
            },
            {
                name: "Pack walk",
                detail: "Two or three dogs from the same house.",
                priceLabel: "$40",
                durationMin: 45
            },
            {
                name: "Midday visit",
                detail: "A short walk and a water check.",
                priceLabel: "$20",
                durationMin: 20
            }
        ],
        bookingCta: "Book the walk"
    },
    {
        id: "detailer",
        shopNiche: "detailer",
        label: "Mobile detailer",
        title: "Curb Shine",
        tagline: "The van is booked before it leaves the curb.",
        accent: "#7EC8E3",
        keywords: [
            "mobile detailer",
            "auto detailing",
            "mobile car wash",
            "interior detail",
            "driveway detail"
        ],
        auditTitle: "What does the car need?",
        auditNote: "So the van brings the right kit.",
        auditQuestions: [
            {
                id: "job",
                label: "The visit",
                choices: [
                    {
                        value: "Exterior",
                        label: "An exterior wash"
                    },
                    {
                        value: "Interior",
                        label: "The interior"
                    },
                    {
                        value: "Full",
                        label: "A full detail"
                    }
                ]
            },
            {
                id: "size",
                label: "What kind of vehicle?",
                choices: [
                    {
                        value: "Car",
                        label: "A car"
                    },
                    {
                        value: "Suv",
                        label: "An SUV"
                    },
                    {
                        value: "Truck",
                        label: "A truck or van"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Exterior wash",
                detail: "Rinse, wash, and dry in the driveway.",
                priceLabel: "$80",
                durationMin: 60
            },
            {
                name: "Interior reset",
                detail: "Vacuum, wipe-down, and the windows.",
                priceLabel: "$140",
                durationMin: 90
            },
            {
                name: "Full detail",
                detail: "Outside and inside, including the wheels.",
                priceLabel: "$250",
                durationMin: 180
            }
        ],
        bookingCta: "Book the detail"
    },
    {
        id: "hunting",
        shopNiche: "hunting",
        label: "Rugged Backcountry Services",
        title: "Ridge Line",
        tagline: "The hunt is booked before the gate opens.",
        accent: "#8B7355",
        keywords: [
            "private hunting guide",
            "guided hunt",
            "hunting guide near me",
            "half day hunt",
            "scouting"
        ],
        auditTitle: "What kind of day?",
        auditNote: "So the guide holds the right block of ground.",
        auditQuestions: [
            {
                id: "day",
                label: "The booking",
                choices: [
                    {
                        value: "Half",
                        label: "A half day"
                    },
                    {
                        value: "Full",
                        label: "A full day"
                    },
                    {
                        value: "Scout",
                        label: "A scouting walk"
                    }
                ]
            },
            {
                id: "party",
                label: "How many hunters?",
                choices: [
                    {
                        value: "One",
                        label: "Just me"
                    },
                    {
                        value: "Two",
                        label: "Two of us"
                    },
                    {
                        value: "More",
                        label: "A small group"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Half day",
                detail: "A morning or an evening on private ground.",
                priceLabel: "$350",
                durationMin: 240
            },
            {
                name: "Full day",
                detail: "Dawn to dark with the guide.",
                priceLabel: "$650",
                durationMin: 600
            },
            {
                name: "Scouting walk",
                detail: "A look at the ground before the hunt day.",
                priceLabel: "$180",
                durationMin: 120
            }
        ],
        bookingCta: "Book the hunt"
    },
    {
        id: "therapy",
        shopNiche: "therapy",
        label: "Physical therapy",
        title: "Motion Room",
        tagline: "Eval, treatment, and the plan of care.",
        accent: "#6FA8C9",
        keywords: [
            "physical therapy",
            "physical therapist",
            "pt near me",
            "rehab session",
            "follow-up visit"
        ],
        auditTitle: "What does the session need?",
        auditNote: "A couple of taps so the room is set up.",
        auditQuestions: [
            {
                id: "visit",
                label: "The visit",
                choices: [
                    {
                        value: "Evaluation",
                        label: "A first evaluation"
                    },
                    {
                        value: "Follow-up",
                        label: "A follow-up"
                    },
                    {
                        value: "Return",
                        label: "A longer return visit"
                    }
                ]
            },
            {
                id: "area",
                label: "Where is the work?",
                choices: [
                    {
                        value: "Back",
                        label: "Back or neck"
                    },
                    {
                        value: "Joint",
                        label: "A joint"
                    },
                    {
                        value: "Other",
                        label: "Somewhere else"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Evaluation",
                detail: "Initial eval. Range, strength, and the plan of care.",
                priceLabel: "$150",
                durationMin: 60
            },
            {
                name: "Follow-up",
                detail: "A treatment visit on the plan you already have.",
                priceLabel: "$95",
                durationMin: 45
            },
            {
                name: "Return visit",
                detail: "A longer treatment block when the plan calls for it.",
                priceLabel: "$120",
                durationMin: 60
            }
        ],
        bookingCta: "Book a treatment"
    },
    {
        id: "bowtech",
        shopNiche: "bowtech",
        label: "Custom bow technician",
        title: "String Bench",
        tagline: "The bow is booked before it hits the bench.",
        accent: "#C4A15A",
        keywords: [
            "custom bow technician",
            "bow tech",
            "bow tune",
            "bow setup",
            "archery repair"
        ],
        auditTitle: "What does the bow need?",
        auditNote: "So the bench is set for the job.",
        auditQuestions: [
            {
                id: "job",
                label: "The job",
                choices: [
                    {
                        value: "Tune",
                        label: "A tune"
                    },
                    {
                        value: "Setup",
                        label: "A new setup"
                    },
                    {
                        value: "Repair",
                        label: "A repair"
                    }
                ]
            },
            {
                id: "when",
                label: "When do you need it?",
                choices: [
                    {
                        value: "This week",
                        label: "This week"
                    },
                    {
                        value: "Before season",
                        label: "Before the season"
                    },
                    {
                        value: "No rush",
                        label: "No rush"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Tune",
                detail: "Paper tune and a walk-back.",
                priceLabel: "$75",
                durationMin: 60
            },
            {
                name: "Setup",
                detail: "A new bow, built and set to you.",
                priceLabel: "$150",
                durationMin: 90
            },
            {
                name: "Repair",
                detail: "Strings, cams, or the thing that let go.",
                priceLabel: "$60",
                durationMin: 45
            }
        ],
        bookingCta: "Book the bench"
    },
    {
        id: "guide",
        shopNiche: "guide",
        label: "Guide services",
        title: "Glass Eddy",
        tagline: "The boat leaves when you do.",
        accent: "#7EC8E3",
        keywords: [
            "fishing guide",
            "river guide",
            "private boat",
            "rafting"
        ],
        auditTitle: "How do you want to go out?",
        auditNote: "So the boat and the shuttle are held for that put-in.",
        auditQuestions: [
            {
                id: "trip",
                label: "The trip",
                choices: [
                    {
                        value: "Shared",
                        label: "A shared seat"
                    },
                    {
                        value: "Private",
                        label: "A private boat"
                    },
                    {
                        value: "Not sure",
                        label: "Not sure yet"
                    }
                ]
            },
            {
                id: "party",
                label: "How many people?",
                choices: [
                    {
                        value: "One",
                        label: "Just me"
                    },
                    {
                        value: "Pair",
                        label: "Two of us"
                    },
                    {
                        value: "Group",
                        label: "A small group"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Morning half-day",
                detail: "Class II. Paddle, vest, and the shuttle back.",
                priceLabel: "$95",
                durationMin: 240
            },
            {
                name: "Full-day canyon",
                detail: "The long line. Lunch on the gravel. Gear included.",
                priceLabel: "$165",
                durationMin: 480
            },
            {
                name: "Private half-day",
                detail: "Your group only. Up to six. Same water, no other boat.",
                priceLabel: "$520",
                durationMin: 240
            }
        ],
        bookingCta: "Book a trip"
    },
    {
        id: "fitness",
        shopNiche: "fitness",
        label: "Fitness coaching",
        title: "Form Room",
        tagline: "Show up. The coach counts the rest.",
        accent: "#E07A73",
        keywords: [
            "personal training",
            "fitness coach",
            "private session"
        ],
        auditTitle: "What is the training for?",
        auditNote: "So the hour is programmed before you walk in.",
        auditQuestions: [
            {
                id: "goal",
                label: "The goal",
                choices: [
                    {
                        value: "Strength",
                        label: "Get stronger"
                    },
                    {
                        value: "Conditioning",
                        label: "Conditioning"
                    },
                    {
                        value: "Return",
                        label: "Coming back after time off"
                    }
                ]
            },
            {
                id: "format",
                label: "How do you want to train?",
                choices: [
                    {
                        value: "Private",
                        label: "One to one"
                    },
                    {
                        value: "Small",
                        label: "A small group"
                    },
                    {
                        value: "Assess",
                        label: "Start with an assessment"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Intro assessment",
                detail: "How you move, what hurts, and the first block of work.",
                priceLabel: "$80",
                durationMin: 45
            },
            {
                name: "Personal training",
                detail: "One coach, one hour, the program you are actually on.",
                priceLabel: "$120",
                durationMin: 60
            },
            {
                name: "Small group",
                detail: "Four people. The same hour, a shared floor.",
                priceLabel: "$40",
                durationMin: 50
            }
        ],
        bookingCta: "Book a training"
    },
    {
        id: "combat",
        shopNiche: "combat",
        label: "Combat sports",
        title: "Iron Round",
        tagline: "Gloves on when the round is booked.",
        accent: "#E25B3A",
        keywords: [
            "mma",
            "boxing",
            "private pad work",
            "fight camp"
        ],
        auditTitle: "What round are you booking?",
        auditNote: "So the coach knows if this is an intro or camp work.",
        auditQuestions: [
            {
                id: "round",
                label: "The booking",
                choices: [
                    {
                        value: "Intro",
                        label: "A first class"
                    },
                    {
                        value: "Private",
                        label: "Private pad work"
                    },
                    {
                        value: "Camp",
                        label: "Camp before a fight"
                    }
                ]
            },
            {
                id: "experience",
                label: "Where are you?",
                choices: [
                    {
                        value: "New",
                        label: "New to this"
                    },
                    {
                        value: "Training",
                        label: "Already training"
                    },
                    {
                        value: "Fighting",
                        label: "I have a date"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Intro class",
                detail: "One class. Gloves on, the basics, no sparring.",
                priceLabel: "$40",
                durationMin: 60
            },
            {
                name: "Private hour",
                detail: "One coach and the thing you came to fix.",
                priceLabel: "$120",
                durationMin: 60
            },
            {
                name: "Camp block",
                detail: "Four sessions in the weeks before a fight.",
                priceLabel: "$360",
                durationMin: 75
            }
        ],
        bookingCta: "Book a round"
    },
    {
        id: "wellness",
        shopNiche: "wellness",
        label: "Massage and bodywork",
        title: "Still Water",
        tagline: "The table is held for the hour you booked.",
        accent: "#7EC8E3",
        keywords: [
            "massage",
            "bodywork",
            "deep tissue"
        ],
        auditTitle: "What should the table feel like?",
        auditNote: "Pressure and focus, before the hour starts.",
        auditQuestions: [
            {
                id: "work",
                label: "The hour",
                choices: [
                    {
                        value: "Relax",
                        label: "Even pressure"
                    },
                    {
                        value: "Deep",
                        label: "Deeper work"
                    },
                    {
                        value: "First",
                        label: "A first session"
                    }
                ]
            },
            {
                id: "focus",
                label: "Where should the work go?",
                choices: [
                    {
                        value: "Back",
                        label: "Back and shoulders"
                    },
                    {
                        value: "Full",
                        label: "The whole hour"
                    },
                    {
                        value: "Not sure",
                        label: "I'll say when I arrive"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Relaxation",
                detail: "Sixty minutes. Even pressure.",
                priceLabel: "$110",
                durationMin: 60
            },
            {
                name: "Deep work",
                detail: "Ninety minutes on the places that hurt.",
                priceLabel: "$150",
                durationMin: 90
            },
            {
                name: "First session",
                detail: "What hurts, what helps, and the first hour.",
                priceLabel: "$130",
                durationMin: 75
            }
        ],
        bookingCta: "Book the table"
    },
    {
        id: "lessons",
        shopNiche: "lessons",
        label: "Lessons and tutoring",
        title: "Second Chair",
        tagline: "The same hour, every week, if you want it.",
        accent: "#C9A227",
        keywords: [
            "tutor",
            "private lesson",
            "after school"
        ],
        auditTitle: "Who is the lesson for?",
        auditNote: "So the hour is planned for that student.",
        auditQuestions: [
            {
                id: "format",
                label: "The lesson",
                choices: [
                    {
                        value: "Private",
                        label: "One student"
                    },
                    {
                        value: "Placement",
                        label: "A placement first"
                    },
                    {
                        value: "Group",
                        label: "A small group"
                    }
                ]
            },
            {
                id: "subject",
                label: "What are you working on?",
                choices: [
                    {
                        value: "School",
                        label: "Schoolwork"
                    },
                    {
                        value: "Skill",
                        label: "A skill"
                    },
                    {
                        value: "Test",
                        label: "A test coming up"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Private lesson",
                detail: "One student and the work they are actually on.",
                priceLabel: "$70",
                durationMin: 50
            },
            {
                name: "Placement",
                detail: "Where they are, and the plan for the next month.",
                priceLabel: "$50",
                durationMin: 40
            },
            {
                name: "Small group",
                detail: "Up to four, on the same lesson.",
                priceLabel: "$35",
                durationMin: 60
            }
        ],
        bookingCta: "Book a lesson"
    },
    {
        id: "salon",
        shopNiche: "salon",
        label: "Hair salon",
        title: "Halo Room",
        tagline: "Color and the cut that holds it.",
        accent: "#E7B48A",
        keywords: [
            "hair salon",
            "color",
            "blowout",
            "haircut"
        ],
        auditTitle: "What is the appointment?",
        auditNote: "Color needs a longer block than a cut.",
        auditQuestions: [
            {
                id: "service",
                label: "The appointment",
                choices: [
                    {
                        value: "Cut",
                        label: "A cut and style"
                    },
                    {
                        value: "Color",
                        label: "Color"
                    },
                    {
                        value: "Gloss",
                        label: "A gloss and style"
                    }
                ]
            },
            {
                id: "hair",
                label: "How much hair are we working with?",
                choices: [
                    {
                        value: "Short",
                        label: "Short"
                    },
                    {
                        value: "Medium",
                        label: "Medium"
                    },
                    {
                        value: "Long",
                        label: "Long or thick"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Cut and style",
                detail: "Consultation, cut, and the finish.",
                priceLabel: "$85",
                durationMin: 60
            },
            {
                name: "Color consult",
                detail: "The formula and a date for the work.",
                priceLabel: "$40",
                durationMin: 30
            },
            {
                name: "Gloss and style",
                detail: "Tone and a blowout, one sitting.",
                priceLabel: "$160",
                durationMin: 90
            }
        ],
        bookingCta: "Book a style"
    },
    {
        id: "beauty",
        shopNiche: "beauty",
        label: "Nails, lashes, makeup",
        title: "Set Apart",
        tagline: "The set is booked. The chair is held.",
        accent: "#E07A73",
        keywords: [
            "gel nails",
            "lash fill",
            "makeup artist"
        ],
        auditTitle: "Which set are you booking?",
        auditNote: "A full set and a fill are different blocks.",
        auditQuestions: [
            {
                id: "set",
                label: "The appointment",
                choices: [
                    {
                        value: "Nails",
                        label: "A gel set"
                    },
                    {
                        value: "Lashes",
                        label: "A lash fill"
                    },
                    {
                        value: "Face",
                        label: "Makeup"
                    }
                ]
            },
            {
                id: "when",
                label: "When do you need it?",
                choices: [
                    {
                        value: "This week",
                        label: "This week"
                    },
                    {
                        value: "Event",
                        label: "Before an event"
                    },
                    {
                        value: "Flexible",
                        label: "Whenever the book is open"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Gel set",
                detail: "Shape, color, and a finish that lasts.",
                priceLabel: "$65",
                durationMin: 75
            },
            {
                name: "Lash fill",
                detail: "A fill on a set you already wear.",
                priceLabel: "$85",
                durationMin: 60
            },
            {
                name: "Makeup",
                detail: "The face for the event.",
                priceLabel: "$95",
                durationMin: 50
            }
        ],
        bookingCta: "Book a set"
    },
    {
        id: "tattoo",
        shopNiche: "tattoo",
        label: "Tattoo shop",
        title: "Iron Ledger",
        tagline: "Draw it. Then sit for it.",
        accent: "#E07A73",
        keywords: [
            "tattoo",
            "tattoo consult",
            "flash"
        ],
        auditTitle: "What are you sitting for?",
        auditNote: "A consult and a session are different blocks on the book.",
        auditQuestions: [
            {
                id: "piece",
                label: "The booking",
                choices: [
                    {
                        value: "Consult",
                        label: "A drawing consult"
                    },
                    {
                        value: "Small",
                        label: "A small piece"
                    },
                    {
                        value: "Session",
                        label: "A longer session"
                    }
                ]
            },
            {
                id: "place",
                label: "Where does it go?",
                choices: [
                    {
                        value: "Arm",
                        label: "Arm or leg"
                    },
                    {
                        value: "Torso",
                        label: "Torso"
                    },
                    {
                        value: "Other",
                        label: "Somewhere else"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Consult",
                detail: "Placement, size, and a date for the work.",
                priceLabel: "$40",
                durationMin: 30
            },
            {
                name: "Small piece",
                detail: "One sitting. Flash or a simple custom.",
                priceLabel: "$180",
                durationMin: 90
            },
            {
                name: "Session",
                detail: "A longer sitting on a piece already drawn.",
                priceLabel: "$450",
                durationMin: 180
            }
        ],
        bookingCta: "Book the chair"
    },
    {
        id: "photo",
        shopNiche: "photo",
        label: "Photography",
        title: "North Light",
        tagline: "The hour is shot, then edited.",
        accent: "#B388FF",
        keywords: [
            "portrait photographer",
            "mini session",
            "event photos"
        ],
        auditTitle: "What are we shooting?",
        auditNote: "So the light and the edit are planned for that hour.",
        auditQuestions: [
            {
                id: "shoot",
                label: "The session",
                choices: [
                    {
                        value: "Portrait",
                        label: "A portrait hour"
                    },
                    {
                        value: "Mini",
                        label: "A mini"
                    },
                    {
                        value: "Event",
                        label: "An event"
                    }
                ]
            },
            {
                id: "where",
                label: "Where?",
                choices: [
                    {
                        value: "Studio",
                        label: "In the studio"
                    },
                    {
                        value: "Outside",
                        label: "On location"
                    },
                    {
                        value: "Not sure",
                        label: "Not sure yet"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Portrait hour",
                detail: "One hour. The edit is included.",
                priceLabel: "$250",
                durationMin: 60
            },
            {
                name: "Mini",
                detail: "Twenty directed frames.",
                priceLabel: "$150",
                durationMin: 30
            },
            {
                name: "Event consult",
                detail: "The timeline, the light, and the date.",
                priceLabel: "$100",
                durationMin: 45
            }
        ],
        bookingCta: "Book a shoot"
    },
    {
        id: "pets",
        shopNiche: "pets",
        label: "Pet grooming",
        title: "Good Coat",
        tagline: "In clean. Out finished.",
        accent: "#E7B48A",
        keywords: [
            "dog grooming",
            "pet groomer",
            "nail trim"
        ],
        auditTitle: "What does the coat need?",
        auditNote: "A full groom and a nail trim are different blocks.",
        auditQuestions: [
            {
                id: "groom",
                label: "The appointment",
                choices: [
                    {
                        value: "Full",
                        label: "A full groom"
                    },
                    {
                        value: "Bath",
                        label: "Bath and brush"
                    },
                    {
                        value: "Nails",
                        label: "Nails only"
                    }
                ]
            },
            {
                id: "coat",
                label: "How is the coat?",
                choices: [
                    {
                        value: "Kept",
                        label: "Kept up"
                    },
                    {
                        value: "Grown",
                        label: "It has been a while"
                    },
                    {
                        value: "Matted",
                        label: "Matted"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Full groom",
                detail: "Bath, cut, ears, and nails.",
                priceLabel: "$85",
                durationMin: 90
            },
            {
                name: "Bath and brush",
                detail: "A clean coat. No haircut.",
                priceLabel: "$45",
                durationMin: 45
            },
            {
                name: "Nail trim",
                detail: "Nails only.",
                priceLabel: "$18",
                durationMin: 20
            }
        ],
        bookingCta: "Book a groom"
    },
    {
        id: "music",
        shopNiche: "music",
        label: "Music artist",
        title: "Lowlight",
        tagline: "The booth, then the room.",
        accent: "#B388FF",
        keywords: [
            "recording session",
            "mix",
            "live set"
        ],
        auditTitle: "What are you booking in the room?",
        auditNote: "A vocal session and a live set need different blocks.",
        auditQuestions: [
            {
                id: "room",
                label: "The booking",
                choices: [
                    {
                        value: "Booth",
                        label: "A recording session"
                    },
                    {
                        value: "Mix",
                        label: "A mix"
                    },
                    {
                        value: "Show",
                        label: "A live set"
                    }
                ]
            },
            {
                id: "ready",
                label: "How ready is the song?",
                choices: [
                    {
                        value: "Idea",
                        label: "Still an idea"
                    },
                    {
                        value: "Demo",
                        label: "There is a demo"
                    },
                    {
                        value: "Done",
                        label: "It is tracked"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Studio session",
                detail: "Booth time with an engineer. Two songs, or one until it sits right.",
                priceLabel: "$400",
                durationMin: 120
            },
            {
                name: "Mix + master",
                detail: "One song. Notes back in the same sitting.",
                priceLabel: "$280",
                durationMin: 90
            },
            {
                name: "Live set",
                detail: "A room, a set length, and the night.",
                priceLabel: "$800",
                durationMin: 45
            }
        ],
        bookingCta: "Book the room"
    },
    {
        id: "events",
        shopNiche: "events",
        label: "Events",
        title: "Hold the Date",
        tagline: "The date is held when the timeline is booked.",
        accent: "#B388FF",
        keywords: [
            "event planner",
            "day of coordination",
            "venue walkthrough"
        ],
        auditTitle: "What part of the day do you need?",
        auditNote: "A walkthrough and day-of lead are different holds.",
        auditQuestions: [
            {
                id: "block",
                label: "The booking",
                choices: [
                    {
                        value: "Walk",
                        label: "A venue walkthrough"
                    },
                    {
                        value: "Lead",
                        label: "Day-of lead"
                    },
                    {
                        value: "Reception",
                        label: "The reception block"
                    }
                ]
            },
            {
                id: "size",
                label: "How big is the room?",
                choices: [
                    {
                        value: "Small",
                        label: "Under 50"
                    },
                    {
                        value: "Medium",
                        label: "50–150"
                    },
                    {
                        value: "Large",
                        label: "Bigger than that"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Venue walkthrough",
                detail: "The room, the load-in, and whether the date is open.",
                priceLabel: "$0",
                durationMin: 45
            },
            {
                name: "Day-of lead",
                detail: "The timeline in the room.",
                priceLabel: "$800",
                durationMin: 90
            },
            {
                name: "Reception block",
                detail: "Room, vendors, and the close.",
                priceLabel: "$1,500",
                durationMin: 240
            }
        ],
        bookingCta: "Book the date"
    },
    {
        id: "security",
        shopNiche: "security",
        label: "Private security",
        title: "Night Watch",
        tagline: "The post is covered when the shift is booked.",
        accent: "#7EC8E3",
        keywords: [
            "security guard",
            "event security",
            "standing post"
        ],
        auditTitle: "What does the post need to cover?",
        auditNote: "So the officer knows the door, the lot, and the hours.",
        auditQuestions: [
            {
                id: "post",
                label: "The booking",
                choices: [
                    {
                        value: "Consult",
                        label: "A site walk"
                    },
                    {
                        value: "Shift",
                        label: "A standing post"
                    },
                    {
                        value: "Event",
                        label: "An event night"
                    }
                ]
            },
            {
                id: "site",
                label: "What kind of site?",
                choices: [
                    {
                        value: "Door",
                        label: "A door"
                    },
                    {
                        value: "Lot",
                        label: "A lot or perimeter"
                    },
                    {
                        value: "Event",
                        label: "An event floor"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Site consult",
                detail: "Walk the door, the lot, and what the post needs.",
                priceLabel: "$0",
                durationMin: 45
            },
            {
                name: "Standing post",
                detail: "One officer, one shift, the site you named.",
                priceLabel: "$320",
                durationMin: 240
            },
            {
                name: "Event detail",
                detail: "Door, floor, and the close.",
                priceLabel: "$480",
                durationMin: 300
            }
        ],
        bookingCta: "Book a post"
    },
    {
        id: "clinic",
        shopNiche: "practice",
        label: "Clinic",
        title: "Lane Practice",
        tagline: "New patients and follow-ups, on the book.",
        accent: "#7EC8E3",
        keywords: [
            "clinic",
            "new patient",
            "follow-up visit"
        ],
        auditTitle: "What kind of visit is this?",
        auditNote: "A new chart takes longer than a follow-up.",
        auditQuestions: [
            {
                id: "visit",
                label: "The visit",
                choices: [
                    {
                        value: "New",
                        label: "A new patient"
                    },
                    {
                        value: "Follow-up",
                        label: "A follow-up"
                    },
                    {
                        value: "Consult",
                        label: "A consult, no procedure"
                    }
                ]
            },
            {
                id: "when",
                label: "How soon?",
                choices: [
                    {
                        value: "This week",
                        label: "This week"
                    },
                    {
                        value: "This month",
                        label: "This month"
                    },
                    {
                        value: "Flexible",
                        label: "Whenever the book is open"
                    }
                ]
            }
        ],
        services: [
            {
                name: "New patient",
                detail: "History, exam, and the chart.",
                priceLabel: "$180",
                durationMin: 60
            },
            {
                name: "Follow-up",
                detail: "A return on a chart that already exists.",
                priceLabel: "$90",
                durationMin: 30
            },
            {
                name: "Consult",
                detail: "A question and a recommendation. No procedure that day.",
                priceLabel: "$75",
                durationMin: 30
            }
        ],
        bookingCta: "Book a visit"
    },
    {
        id: "counsel",
        shopNiche: "counsel",
        label: "Advisor",
        title: "Plain Counsel",
        tagline: "The hour has an agenda and notes you keep.",
        accent: "#C9A227",
        keywords: [
            "advisor",
            "bookkeeping consult",
            "file review"
        ],
        auditTitle: "What should the hour cover?",
        auditNote: "So the file is open before the call starts.",
        auditQuestions: [
            {
                id: "hour",
                label: "The booking",
                choices: [
                    {
                        value: "Intro",
                        label: "An intro call"
                    },
                    {
                        value: "Working",
                        label: "A working hour"
                    },
                    {
                        value: "Review",
                        label: "A review of the file"
                    }
                ]
            },
            {
                id: "file",
                label: "How ready is the file?",
                choices: [
                    {
                        value: "None",
                        label: "We have not started"
                    },
                    {
                        value: "Partial",
                        label: "Some of it is together"
                    },
                    {
                        value: "Ready",
                        label: "It is ready to review"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Intro consult",
                detail: "What you need, and whether this is the right hour.",
                priceLabel: "$0",
                durationMin: 30
            },
            {
                name: "Working session",
                detail: "One file, one hour, notes you can act on.",
                priceLabel: "$200",
                durationMin: 60
            },
            {
                name: "File review",
                detail: "A read of the work already done.",
                priceLabel: "$150",
                durationMin: 45
            }
        ],
        bookingCta: "Book a consult"
    },
    {
        id: "studio",
        shopNiche: "studio",
        label: "App studio",
        title: "Forge Studio",
        tagline: "Scope it, then launch the book.",
        accent: "#2EE6D6",
        keywords: [
            "app studio",
            "booking site",
            "operator desk"
        ],
        auditTitle: "What should the build cover?",
        auditNote: "A scope call is shorter than a launch.",
        auditQuestions: [
            {
                id: "build",
                label: "The engagement",
                choices: [
                    {
                        value: "Scope",
                        label: "A scope call"
                    },
                    {
                        value: "Launch",
                        label: "A site launch"
                    },
                    {
                        value: "Desk",
                        label: "The operator desk"
                    }
                ]
            },
            {
                id: "stage",
                label: "Where is the shop today?",
                choices: [
                    {
                        value: "Idea",
                        label: "Still an idea"
                    },
                    {
                        value: "Named",
                        label: "The services are named"
                    },
                    {
                        value: "Live",
                        label: "Something is already live"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Discovery call",
                detail: "What you run, and what the book should say.",
                priceLabel: "$150",
                durationMin: 45
            },
            {
                name: "Site launch",
                detail: "A live booking page, services, and staff.",
                priceLabel: "$480",
                durationMin: 90
            },
            {
                name: "Operator desk",
                detail: "Admin, the employee board, and the incoming book.",
                priceLabel: "$320",
                durationMin: 60
            }
        ],
        bookingCta: "Book a scope"
    },
    {
        id: "retail",
        shopNiche: "retail",
        label: "Retail",
        title: "Counter Goods",
        tagline: "The item is yours when you order it.",
        accent: "#E7B48A",
        keywords: [
            "merch",
            "shop print",
            "counter goods"
        ],
        auditTitle: "What are you ordering?",
        auditNote: "Counted stock. No appointment required.",
        auditQuestions: [
            {
                id: "item",
                label: "The order",
                choices: [
                    {
                        value: "Cap",
                        label: "A cap"
                    },
                    {
                        value: "Print",
                        label: "A print"
                    },
                    {
                        value: "Bundle",
                        label: "The bundle"
                    }
                ]
            },
            {
                id: "qty",
                label: "How many?",
                choices: [
                    {
                        value: "One",
                        label: "One"
                    },
                    {
                        value: "Few",
                        label: "A few"
                    },
                    {
                        value: "More",
                        label: "A larger order"
                    }
                ]
            }
        ],
        services: [
            {
                name: "House cap",
                detail: "Embroidered mark. One size.",
                priceLabel: "$32",
                durationMin: 0
            },
            {
                name: "Shop print",
                detail: "An 18×24 poster.",
                priceLabel: "$24",
                durationMin: 0
            },
            {
                name: "Counter bundle",
                detail: "The cap and the print together.",
                priceLabel: "$48",
                durationMin: 0
            }
        ],
        bookingCta: "Order product"
    },
    {
        id: "field",
        shopNiche: "field",
        label: "Field service",
        title: "Northline Repair",
        tagline: "The van rolls when the call is booked.",
        accent: "#7EC8E3",
        keywords: [
            "mobile mechanic",
            "no start",
            "driveway diagnostic"
        ],
        auditTitle: "What is the vehicle doing?",
        auditNote: "So the van leaves with the right scan tool.",
        auditQuestions: [
            {
                id: "symptom",
                label: "The call",
                choices: [
                    {
                        value: "No start",
                        label: "It will not start"
                    },
                    {
                        value: "Noise",
                        label: "A noise or a light"
                    },
                    {
                        value: "Service",
                        label: "Oil and an inspection"
                    }
                ]
            },
            {
                id: "where",
                label: "Where is the vehicle?",
                choices: [
                    {
                        value: "Driveway",
                        label: "The driveway"
                    },
                    {
                        value: "Lot",
                        label: "A lot"
                    },
                    {
                        value: "Bay",
                        label: "It can come to the bay"
                    }
                ]
            }
        ],
        services: [
            {
                name: "Driveway diagnostic",
                detail: "A scan and a plain-language report.",
                priceLabel: "$129",
                durationMin: 60
            },
            {
                name: "Mobile rescue",
                detail: "Battery, jump, and no-start triage.",
                priceLabel: "$149",
                durationMin: 50
            },
            {
                name: "Oil and filter",
                detail: "On the hoist, with the inspection.",
                priceLabel: "$89",
                durationMin: 45
            }
        ],
        bookingCta: "Book a service call"
    }
];
const BY_ID = new Map(NICHE_PRESETS.map((preset)=>[
        preset.id,
        preset
    ]));
/** Used when a trade has no ready page of its own. The questions stay tappable. */ const GENERAL_PRESET = {
    id: "general",
    shopNiche: "trade",
    label: "Local service",
    title: "The Shop",
    tagline: "Book a time. We'll take it from there.",
    accent: "#E7B48A",
    keywords: [
        "local service",
        "book online",
        "near me"
    ],
    auditTitle: "What do you need?",
    auditNote: "A couple of taps is enough to hold a time.",
    auditQuestions: [
        {
            id: "job",
            label: "The visit",
            choices: [
                {
                    value: "Standard",
                    label: "The usual visit"
                },
                {
                    value: "Larger",
                    label: "Something larger"
                },
                {
                    value: "Not sure",
                    label: "Not sure yet"
                }
            ]
        },
        {
            id: "timing",
            label: "When?",
            choices: [
                {
                    value: "Soon",
                    label: "As soon as you can"
                },
                {
                    value: "This month",
                    label: "This month"
                },
                {
                    value: "Planning",
                    label: "I'm still planning"
                }
            ]
        }
    ],
    services: [
        {
            name: "First visit",
            detail: "The standard booking.",
            priceLabel: "$80",
            durationMin: 60
        },
        {
            name: "Follow-up",
            detail: "A return visit.",
            priceLabel: "$60",
            durationMin: 45
        }
    ],
    bookingCta: "Book a time"
};
function nichePresetById(id) {
    return BY_ID.get(id);
}
function presetsForShop(niche) {
    return NICHE_PRESETS.filter((preset)=>preset.shopNiche === niche);
}
function presetForShopNiche(niche) {
    return presetsForShop(niche)[0] ?? GENERAL_PRESET;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/use-biokinetic-engine.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BLUR_MAX",
    ()=>BLUR_MAX,
    "BLUR_MIN",
    ()=>BLUR_MIN,
    "DOLLY_MAX",
    ()=>DOLLY_MAX,
    "DOLLY_MIN",
    ()=>DOLLY_MIN,
    "IHI_DECISIVE_AT",
    ()=>IHI_DECISIVE_AT,
    "IHI_HESITANT_AT",
    ()=>IHI_HESITANT_AT,
    "IHI_MAX",
    ()=>IHI_MAX,
    "IHI_MIN",
    ()=>IHI_MIN,
    "blendIhi",
    ()=>blendIhi,
    "blurFromIhi",
    ()=>blurFromIhi,
    "clampUnit",
    ()=>clampUnit,
    "classifyIhi",
    ()=>classifyIhi,
    "dollyFromIhi",
    ()=>dollyFromIhi,
    "fallbackIhi",
    ()=>fallbackIhi,
    "gazeIntent",
    ()=>gazeIntent,
    "pointerIntent",
    ()=>pointerIntent,
    "scrollDecayScore",
    ()=>scrollDecayScore,
    "stepPointer",
    ()=>stepPointer,
    "stepScroll",
    ()=>stepScroll,
    "useBiokineticEngine",
    ()=>useBiokineticEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
const IHI_MIN = 0;
const IHI_MAX = 1;
const IHI_DECISIVE_AT = 0.66;
const IHI_HESITANT_AT = 0.34;
const DOLLY_MIN = 1;
const DOLLY_MAX = 1.16;
const BLUR_MIN = 0;
const BLUR_MAX = 10;
const NEUTRAL = 0.5;
const MAX_SPEED = 4000;
const MAX_ACCEL = 12000;
function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}
function clampUnit(value) {
    return Math.max(IHI_MIN, Math.min(IHI_MAX, finite(value, NEUTRAL)));
}
function classifyIhi(score) {
    const ihiScore = clampUnit(score);
    return {
        ihiScore,
        isDecisive: ihiScore >= IHI_DECISIVE_AT,
        isHesitating: ihiScore <= IHI_HESITANT_AT
    };
}
function dollyFromIhi(score) {
    const unit = clampUnit(score);
    return DOLLY_MIN + unit * (DOLLY_MAX - DOLLY_MIN);
}
function blurFromIhi(score) {
    const unit = clampUnit(score);
    return BLUR_MIN + (1 - unit) * (BLUR_MAX - BLUR_MIN);
}
function stepPointer(sample, prev) {
    if (!prev || sample.t <= prev.t) {
        return {
            t: sample.t,
            x: sample.x,
            y: sample.y,
            vx: 0,
            vy: 0,
            speed: 0,
            accel: 0,
            reversal: false,
            decel: 0
        };
    }
    const dt = Math.max(0.008, (sample.t - prev.t) / 1000);
    const vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (sample.x - prev.x) / dt));
    const vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (sample.y - prev.y) / dt));
    const speed = Math.hypot(vx, vy);
    const accel = Math.max(0, Math.min(MAX_ACCEL, Math.hypot((vx - prev.vx) / dt, (vy - prev.vy) / dt)));
    const reversal = prev.speed > 40 && speed > 40 && vx * prev.vx + vy * prev.vy < 0;
    const decel = Math.max(0, Math.min(MAX_ACCEL, (prev.speed - speed) / dt));
    return {
        t: sample.t,
        x: sample.x,
        y: sample.y,
        vx,
        vy,
        speed,
        accel,
        reversal,
        decel
    };
}
function stepScroll(y, t, prev) {
    if (!prev || t <= prev.t) return {
        t,
        y,
        speed: 0,
        decay: 0
    };
    const dt = Math.max(0.008, (t - prev.t) / 1000);
    const speed = Math.max(0, Math.min(MAX_SPEED, Math.abs(y - prev.y) / dt));
    const decay = prev.speed > 1 ? Math.max(0, Math.min(1, 1 - speed / prev.speed)) : 0;
    return {
        t,
        y,
        speed,
        decay
    };
}
function pointerIntent(kin) {
    if (kin.decel > 280 && !kin.reversal) return clampUnit(0.64 + kin.decel / MAX_ACCEL);
    if (kin.reversal) return clampUnit(0.36 - kin.accel / MAX_ACCEL);
    if (kin.speed < 12) return NEUTRAL;
    return clampUnit(0.5 - Math.min(0.16, kin.accel / (MAX_ACCEL * 1.6)));
}
function scrollDecayScore(kin) {
    if (kin.speed > 140 && kin.decay > 0.45) return clampUnit(0.72 + kin.decay * 0.28);
    if (kin.speed > 24 && kin.speed < 160 && kin.decay < 0.2) return 0.3;
    return NEUTRAL;
}
function gazeIntent(gaze) {
    const dwell = Math.max(0, Math.min(3, finite(gaze.dwellSec, 0)));
    const stability = Math.max(0, Math.min(1, finite(gaze.stability, 0)));
    if (dwell > 0.7 && stability > 0.65) return clampUnit(0.7 + dwell * 0.1);
    if (dwell > 0.25 && stability < 0.4) return 0.22;
    return NEUTRAL;
}
function fallbackIhi(scroll, pointer) {
    const decelScore = pointer.decel > 200 ? clampUnit(0.58 + pointer.decel / MAX_ACCEL) : 0.42;
    return clampUnit(scrollDecayScore(scroll) * 0.55 + decelScore * 0.45);
}
function blendIhi(pointer, gaze) {
    if (gaze == null) return clampUnit(pointer);
    return clampUnit(pointer * 0.5 + gaze * 0.5);
}
function touchOnlyDevice() {
    if (("TURBOPACK compile-time value", "object") === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches;
}
function useBiokineticEngine(options = {}) {
    _s();
    const cameraDollyScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(dollyFromIhi(NEUTRAL), {
        stiffness: 140,
        damping: 22,
        mass: 0.55
    });
    const backdropBlurAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(blurFromIhi(NEUTRAL), {
        stiffness: 140,
        damping: 22,
        mass: 0.55
    });
    const [band, setBand] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useBiokineticEngine.useState": ()=>classifyIhi(NEUTRAL)
    }["useBiokineticEngine.useState"]);
    const optionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(options);
    optionsRef.current = options;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBiokineticEngine.useEffect": ()=>{
            let dead = false;
            let raf = 0;
            let ema = NEUTRAL;
            let pointer = null;
            let scroll = {
                t: 0,
                y: 0,
                speed: 0,
                decay: 0
            };
            let queued = null;
            let queuedScroll = null;
            const coarse = touchOnlyDevice();
            const publish = {
                "useBiokineticEngine.useEffect.publish": (score)=>{
                    const next = classifyIhi(ema * 0.84 + clampUnit(score) * 0.16);
                    ema = next.ihiScore;
                    const dolly = dollyFromIhi(ema);
                    const blur = blurFromIhi(ema);
                    if (optionsRef.current.reducedMotion) {
                        cameraDollyScale.jump(dolly);
                        backdropBlurAmount.jump(blur);
                    } else {
                        cameraDollyScale.set(dolly);
                        backdropBlurAmount.set(blur);
                    }
                    if (dead) return;
                    setBand({
                        "useBiokineticEngine.useEffect.publish": (prev)=>{
                            if (prev.isDecisive === next.isDecisive && prev.isHesitating === next.isHesitating && Math.abs(prev.ihiScore - next.ihiScore) < 0.035) {
                                return prev;
                            }
                            return next;
                        }
                    }["useBiokineticEngine.useEffect.publish"]);
                }
            }["useBiokineticEngine.useEffect.publish"];
            const tick = {
                "useBiokineticEngine.useEffect.tick": ()=>{
                    if (dead) return;
                    raf = requestAnimationFrame(tick);
                    if (queued) {
                        pointer = stepPointer(queued, pointer);
                        queued = null;
                    } else if (pointer && performance.now() - pointer.t > 280) {
                        pointer = {
                            ...pointer,
                            t: performance.now(),
                            speed: pointer.speed * 0.82,
                            accel: pointer.accel * 0.82,
                            decel: pointer.decel * 0.82,
                            reversal: false
                        };
                    }
                    if (queuedScroll) {
                        scroll = stepScroll(queuedScroll.y, queuedScroll.t, scroll.t ? scroll : null);
                        queuedScroll = null;
                    }
                    if (!pointer && scroll.t === 0) return;
                    const kin = pointer ?? {
                        t: 0,
                        x: 0,
                        y: 0,
                        vx: 0,
                        vy: 0,
                        speed: 0,
                        accel: 0,
                        reversal: false,
                        decel: 0
                    };
                    const granted = optionsRef.current.cameraGranted !== false;
                    const gaze = granted && !coarse ? optionsRef.current.gazeRef?.current ?? null : null;
                    const score = !granted || coarse ? fallbackIhi(scroll, kin) : blendIhi(pointerIntent(kin), gaze ? gazeIntent(gaze) : null);
                    publish(score);
                }
            }["useBiokineticEngine.useEffect.tick"];
            const onPointer = {
                "useBiokineticEngine.useEffect.onPointer": (event)=>{
                    queued = {
                        t: performance.now(),
                        x: event.clientX,
                        y: event.clientY
                    };
                }
            }["useBiokineticEngine.useEffect.onPointer"];
            const onScroll = {
                "useBiokineticEngine.useEffect.onScroll": ()=>{
                    queuedScroll = {
                        t: performance.now(),
                        y: window.scrollY
                    };
                }
            }["useBiokineticEngine.useEffect.onScroll"];
            raf = requestAnimationFrame(tick);
            window.addEventListener("pointermove", onPointer, {
                passive: true
            });
            window.addEventListener("pointerdown", onPointer, {
                passive: true
            });
            window.addEventListener("scroll", onScroll, {
                passive: true
            });
            return ({
                "useBiokineticEngine.useEffect": ()=>{
                    dead = true;
                    cancelAnimationFrame(raf);
                    window.removeEventListener("pointermove", onPointer);
                    window.removeEventListener("pointerdown", onPointer);
                    window.removeEventListener("scroll", onScroll);
                }
            })["useBiokineticEngine.useEffect"];
        }
    }["useBiokineticEngine.useEffect"], [
        backdropBlurAmount,
        cameraDollyScale
    ]);
    return {
        ihiScore: band.ihiScore,
        isDecisive: band.isDecisive,
        isHesitating: band.isHesitating,
        cameraDollyScale,
        backdropBlurAmount
    };
}
_s(useBiokineticEngine, "vPMdnbOd8n78yWhVF8Xt4+1qjWA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/auto-sequence.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Portal opener, then the single auto-hero film, then the live desk. */ __turbopack_context__.s([
    "AUTO_HERO_POSTER",
    ()=>AUTO_HERO_POSTER,
    "AUTO_HERO_SRC",
    ()=>AUTO_HERO_SRC,
    "AUTO_PORTAL_SRC",
    ()=>AUTO_PORTAL_SRC,
    "AUTO_REPAIR_SRC",
    ()=>AUTO_REPAIR_SRC,
    "AUTO_SEQUENCE",
    ()=>AUTO_SEQUENCE,
    "autoBeatFromFilm",
    ()=>autoBeatFromFilm,
    "swapMissingAutoHero",
    ()=>swapMissingAutoHero
]);
const AUTO_HERO_SRC = "/media/heroes/auto-hero.mp4";
const AUTO_REPAIR_SRC = "/media/heroes/auto-repair.mp4";
function swapMissingAutoHero(video) {
    if (video.dataset.repairFallback === "1") return;
    const src = video.currentSrc || video.src;
    if (!src.includes("auto-hero.mp4")) return;
    video.dataset.repairFallback = "1";
    video.src = AUTO_REPAIR_SRC;
    void video.play().catch(()=>{});
}
const AUTO_PORTAL_SRC = AUTO_HERO_SRC;
const AUTO_HERO_POSTER = "/media/auto-hero.jpg";
const AUTO_SEQUENCE = {
    /** How long the portal stays up before the cut into the mechanic. */ portalMs: 2400,
    /** auto-hero.mp4 is inside the car and the head unit is on. */ headUnitSec: 11.2,
    /** Last clear head-unit frame. The file goes dark after this. */ dashboardSec: 21.6
};
function autoBeatFromFilm(filmSec) {
    if (filmSec >= AUTO_SEQUENCE.dashboardSec) return "dashboard";
    if (filmSec >= AUTO_SEQUENCE.headUnitSec) return "headunit";
    return "mechanic";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/brand-studio.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EMPTY_BRAND_STUDIO",
    ()=>EMPTY_BRAND_STUDIO,
    "RIPPLE_THEMES",
    ()=>RIPPLE_THEMES,
    "compileBrandMark",
    ()=>compileBrandMark,
    "initialsFrom",
    ()=>initialsFrom,
    "isRippleTheme",
    ()=>isRippleTheme,
    "parseBrandStudio",
    ()=>parseBrandStudio,
    "rippleTheme",
    ()=>rippleTheme,
    "themeSurface",
    ()=>themeSurface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-client] (ecmascript)");
;
const RIPPLE_THEMES = [
    {
        id: "electric-blue",
        label: "Electric Blue Metallic",
        accent: "#3D7EFF",
        metal: "#B9D2FF",
        ring: "#6AA4FF"
    },
    {
        id: "fuchsia",
        label: "Fuchsia Neon",
        accent: "#FF2BD6",
        metal: "#FF9BE8",
        ring: "#FF57DE"
    },
    {
        id: "silver",
        label: "Metallic Silver",
        accent: "#C5CED8",
        metal: "#F3F6F8",
        ring: "#E4EAF0"
    },
    {
        id: "gold",
        label: "Gold/Amber",
        accent: "#E0A23A",
        metal: "#F6D48A",
        ring: "#F0B84A"
    },
    {
        id: "crimson",
        label: "Crimson Red",
        accent: "#E0233A",
        metal: "#FF9AA6",
        ring: "#FF4D62"
    }
];
const EMPTY_BRAND_STUDIO = {
    header: "",
    tagline: "",
    theme: "",
    presentation: ""
};
const SYMBOLS = [
    "arc",
    "diamond",
    "bolt",
    "ring"
];
function cleanLine(value, limit) {
    return String(value ?? "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, limit);
}
function escapeXml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function isRippleTheme(value) {
    return RIPPLE_THEMES.some((theme)=>theme.id === value);
}
function rippleTheme(id) {
    return RIPPLE_THEMES.find((theme)=>theme.id === id) ?? null;
}
function parseBrandStudio(raw) {
    const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const theme = typeof record.theme === "string" && isRippleTheme(record.theme) ? record.theme : "";
    const presentation = typeof record.presentation === "string" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPresentationStyle"])(record.presentation) ? record.presentation : "";
    return {
        header: cleanLine(record.header, 48),
        tagline: cleanLine(record.tagline, 72),
        theme,
        presentation
    };
}
function initialsFrom(header) {
    const words = header.split(" ").filter(Boolean);
    if (words.length === 0) return "AX";
    const first = words[0]?.[0] ?? "A";
    const second = words.length > 1 ? words[1]?.[0] ?? "" : words[0]?.[1] ?? "";
    return (first + second).toUpperCase();
}
function symbolFor(initials) {
    const code = initials.split("").reduce((sum, char)=>sum + char.charCodeAt(0), 0);
    return SYMBOLS[code % SYMBOLS.length] ?? "arc";
}
function symbolPath(symbol, accent) {
    if (symbol === "diamond") {
        return `<path d="M128 62 L150 104 L128 146 L106 104 Z" fill="none" stroke="${accent}" stroke-width="2"/>`;
    }
    if (symbol === "bolt") {
        return `<path d="M136 64 L118 108 H136 L120 148" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>`;
    }
    if (symbol === "ring") {
        return `<circle cx="128" cy="104" r="18" fill="none" stroke="${accent}" stroke-width="2"/>`;
    }
    return `<path d="M96 128 A32 32 0 0 1 160 128" fill="none" stroke="${accent}" stroke-width="2"/>`;
}
function compileBrandMark(header, tagline, accent = "#3D7EFF") {
    const title = cleanLine(header, 48) || "Axiom";
    const line = cleanLine(tagline, 72);
    const initials = initialsFrom(title);
    const symbol = symbolFor(initials);
    const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : "#3D7EFF";
    const left = escapeXml(initials[0] ?? "A");
    const right = escapeXml(initials[1] ?? left);
    const gid = `mark-${initials.toLowerCase()}-${symbol}`;
    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${escapeXml(title)}">`,
        `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">`,
        `<stop offset="0" stop-color="#F3F6F8"/><stop offset="1" stop-color="${safeAccent}"/>`,
        `</linearGradient></defs>`,
        `<rect width="256" height="256" rx="48" fill="#121216"/>`,
        `<circle cx="128" cy="104" r="74" fill="none" stroke="url(#${gid})" stroke-width="3"/>`,
        symbolPath(symbol, safeAccent),
        `<text x="104" y="120" text-anchor="middle" font-size="68" font-family="Georgia, serif" fill="#F3F1EB">${left}</text>`,
        `<text x="152" y="120" text-anchor="middle" font-size="68" font-family="Georgia, serif" fill="${safeAccent}">${right}</text>`,
        `<text x="128" y="198" text-anchor="middle" font-size="16" font-family="Outfit, sans-serif" fill="#F3F1EB">${escapeXml(title)}</text>`,
        line ? `<text x="128" y="222" text-anchor="middle" font-size="11" font-family="Outfit, sans-serif" fill="#9A9AA3">${escapeXml(line)}</text>` : "",
        `</svg>`
    ].join("");
    return {
        header: title,
        tagline: line,
        initials,
        symbol,
        accent: safeAccent,
        svg,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    };
}
function themeSurface(theme) {
    return {
        "--neon": theme.accent,
        "--ring-color": theme.ring,
        "--glass-tint": theme.metal,
        "--ripple": theme.accent
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/business-brand.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BUSINESS_PAGE_CAP",
    ()=>BUSINESS_PAGE_CAP,
    "BUSINESS_PAGE_DEFAULT",
    ()=>BUSINESS_PAGE_DEFAULT,
    "clampPageLimit",
    ()=>clampPageLimit,
    "decodePageCursor",
    ()=>decodePageCursor,
    "encodePageCursor",
    ()=>encodePageCursor,
    "mapBusinessToTemplateBrand",
    ()=>mapBusinessToTemplateBrand,
    "normalizeAccent",
    ()=>normalizeAccent,
    "pageWindow",
    ()=>pageWindow,
    "parseBusinessId",
    ()=>parseBusinessId,
    "parseBusinessRef",
    ()=>parseBusinessRef,
    "parseKeyList",
    ()=>parseKeyList,
    "previewUrlForBusiness",
    ()=>previewUrlForBusiness,
    "slugPrefixBounds",
    ()=>slugPrefixBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)");
;
;
const BUSINESS_PAGE_DEFAULT = 50;
const BUSINESS_PAGE_CAP = 100;
const BUSINESS_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const SLUG_PREFIX = /^[a-z0-9]+(?:-[a-z0-9]+)*-?$/;
function normalizeAccent(value) {
    const hex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(value);
    return hex || null;
}
function parseBusinessId(value) {
    const raw = String(value ?? "").trim();
    if (!BUSINESS_ID.test(raw)) return "";
    return raw;
}
function clampPageLimit(value) {
    if (value == null || value === "") return BUSINESS_PAGE_DEFAULT;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(n)) return BUSINESS_PAGE_DEFAULT;
    const whole = Math.floor(n);
    if (whole < 1) return 1;
    if (whole > BUSINESS_PAGE_CAP) return BUSINESS_PAGE_CAP;
    return whole;
}
function slugPrefixBounds(prefix) {
    const raw = prefix.trim().toLowerCase();
    if (!raw || raw.length > 64 || !SLUG_PREFIX.test(raw)) return null;
    const last = raw.charCodeAt(raw.length - 1);
    const end = `${raw.slice(0, -1)}${String.fromCharCode(last + 1)}`;
    return {
        start: raw,
        end
    };
}
function encodePageCursor(kind, value) {
    return `${kind}:${value}`;
}
function decodePageCursor(value, kind) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const split = raw.indexOf(":");
    if (split < 1) return null;
    const cursorKind = raw.slice(0, split);
    const key = raw.slice(split + 1);
    if (cursorKind !== kind) return null;
    if (kind === "id") return parseBusinessId(key) || null;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeadSlug"])(key) ? key : null;
}
function parseBusinessRef(input) {
    if (typeof input === "string") {
        const slug = input.trim().toLowerCase();
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeadSlug"])(slug)) throw new Error("Unknown business");
        return {
            slug
        };
    }
    const source = input && typeof input === "object" ? input : {};
    const id = parseBusinessId(source.id);
    const slugRaw = String(source.slug ?? "").trim().toLowerCase();
    const slug = slugRaw && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeadSlug"])(slugRaw) ? slugRaw : "";
    if (slugRaw && !slug) throw new Error("Unknown business");
    if (id && slug) throw new Error("Pass a business id or a slug");
    if (id) return {
        id
    };
    if (slug) return {
        slug
    };
    throw new Error("Pass a business id or a slug");
}
function parseKeyList(value, kind) {
    if (value == null) return [];
    if (!Array.isArray(value)) throw new Error(kind === "id" ? "Batch must be a list of ids" : "Batch must be a list of slugs");
    if (value.length > BUSINESS_PAGE_CAP) throw new Error(`Batch is capped at ${BUSINESS_PAGE_CAP}`);
    const seen = new Set();
    const out = [];
    for (const item of value){
        const raw = String(item ?? "").trim();
        if (!raw) continue;
        const key = kind === "slug" ? raw.toLowerCase() : parseBusinessId(raw);
        if (!key || kind === "slug" && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeadSlug"])(key)) throw new Error("Unknown business");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(key);
    }
    return out;
}
function mapBusinessToTemplateBrand(record) {
    const city = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.city, 80);
    const county = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.county, 80);
    const category = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.category, 80);
    const categoryLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.categoryLabel, 80) || category;
    return {
        businessName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.businessName, 80),
        logoUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(record.logoUrl),
        accent: normalizeAccent(record.accent),
        contactName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.contactName, 80),
        contactPhone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.phone, 40),
        contactEmail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.email, 120),
        category,
        categoryLabel,
        city,
        county,
        location: [
            city,
            county
        ].filter(Boolean).join(" · ")
    };
}
function previewUrlForBusiness(origin, record) {
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deskPreviewPath"])({
        leadSlug: record.slug,
        county: record.county,
        city: record.city,
        businessName: record.businessName,
        trade: record.categoryLabel || record.category
    });
    const base = origin.trim().replace(/\/$/, "") || "http://localhost";
    return new URL(path, `${base}/`).toString();
}
function pageWindow(rows, limit, order) {
    const capped = clampPageLimit(limit);
    const page = rows.slice(0, capped);
    const last = page[page.length - 1];
    const nextCursor = rows.length > capped && last ? encodePageCursor(order, order === "id" ? last.id : last.slug) : null;
    return {
        rows: page,
        nextCursor
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/cockpit.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usesAutomotiveCockpit",
    ()=>usesAutomotiveCockpit
]);
const AUTOMOTIVE = /\b(mobile mechanics?|auto(?:motive)?\s+repairs?|auto services?|mechanics?)\b/i;
const OTHER_FIELD = /\b(handym[ae]n|handy man|appliances?|garage doors?|towing|pressure wash\w*|window clean\w*|junk removal|tree services?|pest control|pool services?|chimneys?|hauling|movers?|moving compan(?:y|ies))\b/i;
function usesAutomotiveCockpit(niche, text = "") {
    const blob = `${niche} ${text}`;
    if (OTHER_FIELD.test(blob) && !AUTOMOTIVE.test(blob)) return false;
    if (AUTOMOTIVE.test(blob)) return true;
    return niche === "field";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/directory.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-client] (ecmascript)");
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(id)) return NICHE_LABELS[id];
    return id.replace(/-/g, " ");
}
function classifyTrade(raw) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (label.length < 2) throw new Error("Trade is required");
    const key = label.toLowerCase();
    if (key === "all" || key === "all trades") throw new Error("Name the trade");
    const byId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(key) ? key : null;
    const byLabel = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHOP_NICHES"].find((id)=>NICHE_LABELS[id].toLowerCase() === key) ?? null;
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
    const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["slugify"])(label);
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return tradeType;
    const label = tradeLabel.trim() || tradeType.replace(/-/g, " ");
    try {
        const classified = classifyTrade(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/funnel.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_OUTREACH_TEMPLATE",
    ()=>DEFAULT_OUTREACH_TEMPLATE,
    "FOLLOW_UP_STEPS",
    ()=>FOLLOW_UP_STEPS,
    "LEAD_STORAGE_KEY",
    ()=>LEAD_STORAGE_KEY,
    "OUTREACH_STRATEGIES",
    ()=>OUTREACH_STRATEGIES,
    "channelFromPackage",
    ()=>channelFromPackage,
    "deskPreviewPath",
    ()=>deskPreviewPath,
    "followUpBody",
    ()=>followUpBody,
    "followUpSchedule",
    ()=>followUpSchedule,
    "funnelUrl",
    ()=>funnelUrl,
    "isEmailReady",
    ()=>isEmailReady,
    "isLeadSlug",
    ()=>isLeadSlug,
    "isSmsReady",
    ()=>isSmsReady,
    "leadChannelTags",
    ()=>leadChannelTags,
    "leadPublicTags",
    ()=>leadPublicTags,
    "leadSlugFrom",
    ()=>leadSlugFrom,
    "nurtureStatus",
    ()=>nurtureStatus,
    "outreachPublicTokens",
    ()=>outreachPublicTokens,
    "outreachStrategy",
    ()=>outreachStrategy,
    "packOutreachPackage",
    ()=>packOutreachPackage,
    "parseFunnelQuery",
    ()=>parseFunnelQuery,
    "parseFunnelSearch",
    ()=>parseFunnelSearch,
    "parseHasWebsite",
    ()=>parseHasWebsite,
    "parsePhoneLine",
    ()=>parsePhoneLine,
    "parseReviewCount",
    ()=>parseReviewCount,
    "parseReviewScore",
    ()=>parseReviewScore,
    "publicLeadFromRow",
    ()=>publicLeadFromRow,
    "renderOutreachMessage",
    ()=>renderOutreachMessage,
    "strategyLabelFromPackage",
    ()=>strategyLabelFromPackage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)");
;
const LEAD_STORAGE_KEY = "axiom.lead";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function clip(value, max) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
}
function isLeadSlug(value) {
    return SLUG.test(value);
}
function leadSlugFrom(businessName, city) {
    const raw = `${businessName} ${city}`.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
    return raw || "lead";
}
function parseFunnelQuery(source) {
    const fromB = clip(source.b, 64).toLowerCase();
    const fromLead = clip(source.lead_slug, 64).toLowerCase();
    const leadSlug = isLeadSlug(fromB) ? fromB : isLeadSlug(fromLead) ? fromLead : "";
    const stopToken = clip(source.t, 80).toLowerCase();
    return {
        leadSlug,
        utmSource: clip(source.utm_source, 80),
        county: clip(source.county, 80),
        stopToken: /^[a-f0-9]{32,80}$/.test(stopToken) ? stopToken : ""
    };
}
function parseFunnelSearch(source) {
    const query = parseFunnelQuery(source);
    return {
        ...query.leadSlug ? {
            b: query.leadSlug,
            lead_slug: query.leadSlug
        } : {},
        ...query.utmSource ? {
            utm_source: query.utmSource
        } : {},
        ...query.county ? {
            county: query.county
        } : {},
        ...query.stopToken ? {
            t: query.stopToken
        } : {},
        ...source.pitch === true || source.pitch === "1" || source.pitch === "true" ? {
            pitch: true
        } : {},
        ...source.greet === true || source.greet === "1" || source.greet === "true" ? {
            greet: true
        } : {},
        ...source.preview === true || source.preview === "1" || source.preview === "true" ? {
            preview: true
        } : {},
        ...clip(source.business, 80) ? {
            business: clip(source.business, 80)
        } : {},
        ...clip(source.biz, 80) ? {
            biz: clip(source.biz, 80)
        } : {},
        ...clip(source.trade, 80) ? {
            trade: clip(source.trade, 80)
        } : {},
        ...clip(source.city, 80) ? {
            city: clip(source.city, 80)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo) ? {
            logo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent) ? {
            accent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40) ? {
            phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120) ? {
            email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120)
        } : {},
        .../^cs_[A-Za-z0-9_]+$/.test(clip(source.session_id, 80)) ? {
            session_id: clip(source.session_id, 80)
        } : {}
    };
}
const DEFAULT_OUTREACH_TEMPLATE = "Hi {business} — a booking page is waiting for you.\n{url}";
const OUTREACH_STRATEGIES = [
    {
        id: "done-for-you",
        label: "Done-For-You Hook",
        line: "The booking page is already built. They only claim it.",
        text: "{owner} — {business} has {website}. A {trade} booking page for {city} is already built. Claim it before another shop in {county} does.\n{url}\nAsk Eric greets {business} on that page.",
        emailSubject: "{owner}, the {business} page is already live",
        emailBody: "Hi {owner},\n\n{business} has {website}. The {trade} page for {city} is built, ahead of the other shops in {county}. Reviews on file: {reviews}.\n\nClaim it here:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOnce you open it, the page is yours."
    },
    {
        id: "missed-calls",
        label: "Missed Calls Hook",
        line: "A call they miss while with a client becomes a booking.",
        text: "{owner}, calls to the {line} at {business} go quiet mid-appointment. Your {trade} page in {city} takes the request.\n{url}\nAsk Eric greets {business} on that page.",
        emailSubject: "The {line} at {business} didn't pick up",
        emailBody: "Hi {owner},\n\nWhile you're with a client, the {line} at {business} goes to voicemail and that {trade} job walks to the next shop in {county}.\n\nThis page takes the booking instead:\n{url}\n\nAsk Eric greets {business} on that page.\n\nThey pick a time. You see it when you're free."
    },
    {
        id: "competitor-edge",
        label: "Competitor Edge Hook",
        line: "Other shops in the county already take the online book.",
        text: "{owner} — other {trade} shops in {county} are taking the online book. {business} is listed with {reviews} and {website}.\n{url}\nAsk Eric greets {business} on that page.",
        emailSubject: "{county} shops are ahead of {business}",
        emailBody: "Hi {owner},\n\nPeople in {county} already book {trade} work without calling. {business} is listed with {reviews} and {website}.\n\nYour page is ready:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOpen it and the link is yours."
    }
];
function outreachStrategy(id) {
    return OUTREACH_STRATEGIES.find((item)=>item.id === id) ?? OUTREACH_STRATEGIES[0];
}
function parsePhoneLine(value) {
    const raw = String(value ?? "").trim().toLowerCase();
    if (raw === "" || raw === "unknown") return "";
    if (raw === "mobile" || raw === "cell") return "mobile";
    if (raw === "landline" || raw === "land line") return "landline";
    throw new Error("Phone line must be mobile or landline");
}
function parseHasWebsite(value) {
    if (value == null || value === "" || value === "unknown") return null;
    if (typeof value === "boolean") return value;
    const raw = String(value).trim().toLowerCase();
    if (raw === "yes" || raw === "true") return true;
    if (raw === "no" || raw === "false") return false;
    throw new Error("Website status must be yes or no");
}
function parseReviewScore(value) {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(n) || n < 0 || n > 5) throw new Error("Review score must be between 0 and 5");
    return Math.round(n * 10) / 10;
}
function parseReviewCount(value) {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new Error("Review count must be a whole number");
    return n;
}
function readScore(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
function readCount(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
}
function publicLeadFromRow(row) {
    const line = String(row.phone_line ?? "").trim().toLowerCase();
    return {
        contactName: (row.contact_name ?? "").trim(),
        reviewScore: readScore(row.review_score),
        reviewCount: readCount(row.review_count),
        hasWebsite: typeof row.has_website === "boolean" ? row.has_website : null,
        phoneLine: line === "mobile" || line === "landline" ? line : ""
    };
}
function outreachPublicTokens(facts, business) {
    const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
    const reviews = facts.reviewScore == null ? "no public reviews" : facts.reviewCount == null ? `${score} on public reviews` : `${score} from ${facts.reviewCount} reviews`;
    const website = facts.hasWebsite == null ? "no website listed" : facts.hasWebsite ? "a website already up" : "no website";
    const line = facts.phoneLine === "mobile" ? "mobile" : facts.phoneLine === "landline" ? "landline" : "listed number";
    return {
        owner: facts.contactName || business || "{owner}",
        reviews,
        website,
        line
    };
}
const EMAIL_READY = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
function isEmailReady(value) {
    const email = value.trim().toLowerCase();
    if (email.length < 6 || email.length > 120) return false;
    return EMAIL_READY.test(email);
}
function isSmsReady(phoneLine) {
    return phoneLine === "mobile";
}
function leadChannelTags(lead) {
    const tags = [];
    if (isSmsReady(lead.phoneLine)) tags.push("SMS-ready");
    if (isEmailReady(lead.contactEmail)) tags.push("Email-ready");
    if (tags.length === 0) tags.push("No channel");
    return tags;
}
function leadPublicTags(facts) {
    const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
    const reviews = facts.reviewScore == null ? "No reviews" : facts.reviewCount == null ? score : `${score} · ${facts.reviewCount}`;
    return [
        facts.contactName || "No owner",
        reviews,
        facts.hasWebsite == null ? "Website unknown" : facts.hasWebsite ? "Has website" : "No website",
        facts.phoneLine === "mobile" ? "Mobile" : facts.phoneLine === "landline" ? "Landline" : "Line unknown"
    ];
}
function renderOutreachMessage(template, lead) {
    return template.replaceAll("{business}", lead.business).replaceAll("{url}", lead.url).replaceAll("{trade}", lead.trade ?? "").replaceAll("{county}", lead.county ?? "").replaceAll("{city}", lead.city ?? "").replaceAll("{owner}", lead.owner ?? "").replaceAll("{reviews}", lead.reviews ?? "").replaceAll("{website}", lead.website ?? "").replaceAll("{line}", lead.line ?? "");
}
function packOutreachPackage(draft) {
    const channel = draft.channel === "email" || draft.channel === "sms" ? draft.channel : "";
    return JSON.stringify({
        strategy: outreachStrategy(draft.strategy).id,
        text: draft.text,
        emailSubject: draft.emailSubject,
        emailBody: draft.emailBody,
        channel,
        queue: channel ? "trickle" : ""
    });
}
const FOLLOW_UP_STEPS = [
    {
        day: 0,
        label: "Day 0 Initial Hook"
    },
    {
        day: 2,
        label: "48 hour unactivated reminder"
    },
    {
        day: 3,
        label: "Day 3 Competitor Proof Bump"
    },
    {
        day: 6,
        label: "Day 6 Loss Aversion Final Call"
    }
];
function followUpSchedule(from) {
    return FOLLOW_UP_STEPS.map((step)=>({
            day: step.day,
            label: step.label,
            scheduledAt: new Date(from.getTime() + step.day * 86_400_000).toISOString(),
            status: step.day === 0 ? "sent" : "scheduled"
        }));
}
function followUpBody(day, channel, launched) {
    if (day === 0) {
        return channel === "sms" ? launched.text : `${launched.emailSubject}\n\n${launched.emailBody}`;
    }
    if (day === 2) {
        return channel === "sms" ? "{owner} — {business} has not activated the page. The book is still open.\n{url}" : "48 hours on the {business} page\n\nHi {owner},\n\nThe {trade} page for {city} is still unactivated. The book stays open.\n\n{url}";
    }
    if (day === 3) {
        return channel === "sms" ? "{owner} — {business} still has not opened the page. Other {trade} shops in {county} took the book. Listed with {reviews}.\n{url}" : "{county} booked while {business} waited\n\nHi {owner},\n\nOther {trade} shops in {county} kept taking the online book. {business} is still listed with {reviews} and {website}, and the page has not been opened.\n\nThe proof is the link:\n{url}";
    }
    return channel === "sms" ? "{owner}, last note for {business}. The {city} page is pulled if it stays unclaimed.\n{url}" : "Last call for the {business} page\n\nHi {owner},\n\nThis is the last note. The {trade} page for {city} comes off the book if {business} leaves it unclaimed.\n\n{url}";
}
function nurtureStatus(input) {
    if (input.touches.length === 0) return "none";
    if (input.clicked) return "stopped";
    if (input.touches.some((touch)=>touch.status === "scheduled")) return "active";
    return "complete";
}
function channelFromPackage(stored) {
    if (!stored.startsWith("{")) return "";
    try {
        const parsed = JSON.parse(stored);
        return parsed.channel === "email" || parsed.channel === "sms" ? parsed.channel : "";
    } catch  {
        return "";
    }
}
function strategyLabelFromPackage(stored) {
    if (!stored.startsWith("{")) return "";
    try {
        const parsed = JSON.parse(stored);
        if (!parsed.strategy) return "";
        const known = OUTREACH_STRATEGIES.find((item)=>item.id === parsed.strategy);
        return known?.label ?? "";
    } catch  {
        return "";
    }
}
function funnelUrl(origin, lead) {
    const base = origin.replace(/\/$/, "");
    const url = new URL("/", base.endsWith("/") ? base : `${base}/`);
    url.searchParams.set("b", lead.leadSlug);
    if (lead.county) url.searchParams.set("county", lead.county);
    url.searchParams.set("utm_source", "regional");
    if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
    if (lead.greet) {
        url.searchParams.set("greet", "1");
        const business = (lead.businessName ?? "").trim().slice(0, 80);
        const trade = (lead.trade ?? "").trim().slice(0, 80);
        const city = (lead.city ?? "").trim().slice(0, 80);
        if (business) url.searchParams.set("biz", business);
        if (trade) url.searchParams.set("trade", trade);
        if (city) url.searchParams.set("city", city);
    }
    return url.toString();
}
function deskPreviewPath(lead) {
    const params = new URLSearchParams({
        b: lead.leadSlug,
        utm_source: "desk"
    });
    const county = (lead.county ?? "").trim();
    const city = (lead.city ?? "").trim();
    const business = (lead.businessName ?? "").trim();
    const trade = (lead.trade ?? "").trim();
    if (county) params.set("county", county);
    if (city) params.set("city", city);
    if (business) params.set("biz", business);
    if (trade) params.set("trade", trade);
    return `/?${params.toString()}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/hero-video.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/hud.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BLUR_STEPS",
    ()=>BLUR_STEPS,
    "CARD_STEPS",
    ()=>CARD_STEPS,
    "DAMP_STEPS",
    ()=>DAMP_STEPS,
    "DEFAULT_HUD",
    ()=>DEFAULT_HUD,
    "DEPTH_STEPS",
    ()=>DEPTH_STEPS,
    "FADE_STEPS",
    ()=>FADE_STEPS,
    "FORCE_STEPS",
    ()=>FORCE_STEPS,
    "GLOW_STEPS",
    ()=>GLOW_STEPS,
    "HERO_EFFECTS",
    ()=>HERO_EFFECTS,
    "HERO_EFFECT_LABELS",
    ()=>HERO_EFFECT_LABELS,
    "HERO_FONTS",
    ()=>HERO_FONTS,
    "HERO_LAYER_IDS",
    ()=>HERO_LAYER_IDS,
    "HERO_LAYER_LABELS",
    ()=>HERO_LAYER_LABELS,
    "HERO_WASHES",
    ()=>HERO_WASHES,
    "LOOK_PRESETS",
    ()=>LOOK_PRESETS,
    "RADIUS_STEPS",
    ()=>RADIUS_STEPS,
    "activeLookPreset",
    ()=>activeLookPreset,
    "applyDepthStudio",
    ()=>applyDepthStudio,
    "cloneHeroLayout",
    ()=>cloneHeroLayout,
    "defaultHeroLayout",
    ()=>defaultHeroLayout,
    "depthStudio",
    ()=>depthStudio,
    "hudVars",
    ()=>hudVars,
    "paintHero",
    ()=>paintHero,
    "parseHeroLayout",
    ()=>parseHeroLayout,
    "parseHud",
    ()=>parseHud,
    "sanitizeGradient",
    ()=>sanitizeGradient,
    "setHeroLayer",
    ()=>setHeroLayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)");
;
;
;
const HERO_WASHES = [
    "obsidian",
    "ember",
    "tide",
    "copper"
];
const FADE_STEPS = [
    28,
    44,
    60,
    76,
    92
];
const GLOW_STEPS = [
    0,
    25,
    50,
    75,
    100
];
const CARD_STEPS = [
    0.38,
    0.52,
    0.66,
    0.82
];
const BLUR_STEPS = [
    12,
    18,
    28,
    40
];
const FORCE_STEPS = [
    8,
    16,
    24,
    32,
    20
];
const RADIUS_STEPS = [
    80,
    140,
    220,
    300,
    170
];
const DAMP_STEPS = [
    6,
    10,
    14,
    20
];
const DEPTH_STEPS = [
    0,
    0.35,
    0.7,
    1,
    1.25
];
const HERO_LAYER_IDS = [
    "headline",
    "subheadline",
    "cta_button"
];
const HERO_FONTS = [
    "Outfit",
    "Instrument Serif",
    "Inter",
    "Playfair Display",
    "Fira Code",
    "Montserrat"
];
const HERO_EFFECTS = [
    "none",
    "shimmer",
    "pulsating",
    "flicker"
];
const HERO_LAYER_LABELS = {
    headline: "Headline",
    subheadline: "Subheadline",
    cta_button: "CTA Text"
};
const HERO_EFFECT_LABELS = {
    none: "None",
    shimmer: "Metallic Shimmer",
    pulsating: "Pulsating Glow",
    flicker: "Neon Light Flicker"
};
const LAYER_TEXT_LIMIT = {
    headline: 140,
    subheadline: 180,
    cta_button: 48
};
function layerDefaults(id) {
    if (id === "headline") {
        return {
            text: "",
            position: {
                x: 5,
                y: 46
            },
            fontFamily: "Instrument Serif",
            colorMode: "solid",
            solidColor: "#F3F1EB",
            gradientCss: "linear-gradient(105deg, #F3F1EB 0%, #2EE6D6 42%, #F3F1EB 78%)",
            effect: "none"
        };
    }
    if (id === "subheadline") {
        return {
            text: "",
            position: {
                x: 5,
                y: 68
            },
            fontFamily: "Outfit",
            colorMode: "solid",
            solidColor: "#F3F1EB",
            gradientCss: "linear-gradient(100deg, #F3F1EB 0%, #9A9AA3 100%)",
            effect: "none"
        };
    }
    return {
        text: "",
        position: {
            x: 5,
            y: 74
        },
        fontFamily: "Outfit",
        colorMode: "solid",
        solidColor: "#F3F1EB",
        gradientCss: "linear-gradient(100deg, #2EE6D6 0%, #F3F1EB 100%)",
        effect: "none"
    };
}
function defaultHeroLayout() {
    return {
        headline: layerDefaults("headline"),
        subheadline: layerDefaults("subheadline"),
        cta_button: layerDefaults("cta_button")
    };
}
function cloneHeroLayout(layout) {
    return {
        headline: {
            ...layout.headline,
            position: {
                ...layout.headline.position
            }
        },
        subheadline: {
            ...layout.subheadline,
            position: {
                ...layout.subheadline.position
            }
        },
        cta_button: {
            ...layout.cta_button,
            position: {
                ...layout.cta_button.position
            }
        }
    };
}
const LOOK_PRESETS = [
    {
        id: "studio",
        label: "High-Tech Studio",
        line: "A bright rim, a deep field, and a live scan.",
        hud: {
            wash: "obsidian",
            fade: 76,
            glow: 100,
            blur: 3,
            force: 3,
            radius: 2,
            damp: 1,
            depth: 4,
            rim: true,
            scan: true,
            card: 1
        }
    },
    {
        id: "frost",
        label: "Frosted Glass",
        line: "Soft glass, a wide field, and a slow settle.",
        hud: {
            wash: "tide",
            fade: 60,
            glow: 25,
            blur: 3,
            force: 1,
            radius: 3,
            damp: 3,
            depth: 2,
            rim: true,
            scan: false,
            card: 2
        }
    },
    {
        id: "minimal",
        label: "Clean Minimal",
        line: "Quiet type, a short reach, and no glow.",
        hud: {
            wash: "obsidian",
            fade: 44,
            glow: 0,
            blur: 0,
            force: 0,
            radius: 0,
            damp: 2,
            depth: 0,
            rim: false,
            scan: false,
            card: 0
        }
    }
];
function activeLookPreset(hud) {
    const match = LOOK_PRESETS.find((preset)=>{
        const look = preset.hud;
        return look.wash === hud.wash && look.fade === hud.fade && look.glow === hud.glow && look.blur === hud.blur && look.force === hud.force && look.radius === hud.radius && look.damp === hud.damp && look.depth === hud.depth && look.rim === hud.rim && look.scan === hud.scan && look.card === hud.card;
    });
    return match?.id ?? null;
}
const DEFAULT_HUD = {
    wash: "obsidian",
    fade: 60,
    glow: 50,
    headline: "",
    heroPick: "film",
    heroUrl: "",
    card: 1,
    blur: 2,
    rim: true,
    scan: true,
    force: 1,
    radius: 1,
    damp: 1,
    depth: 2,
    layers: defaultHeroLayout()
};
const VIDEO = /\.(mp4|webm|mov)(?:$|[?#])/i;
function nearest(steps, value) {
    return steps.reduce((best, step)=>Math.abs(step - value) < Math.abs(best - value) ? step : best);
}
function indexOf(length, value, fallback) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(n) || n < 0 || n >= length) return fallback;
    return n;
}
function percent(value, fallback) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}
function sanitizeGradient(value, fallback) {
    const raw = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 240);
    if (!raw) return fallback;
    if (/url\s*\(|expression\s*\(|javascript:|@import|[;{}<>]|&/i.test(raw)) return fallback;
    if (!/^(linear|radial|conic)-gradient\([^()]*(?:\([^()]*\)[^()]*)*\)$/i.test(raw)) return fallback;
    return raw;
}
function parseLayer(id, raw, legacyText = "") {
    const base = layerDefaults(id);
    const record = raw && typeof raw === "object" ? raw : null;
    const position = record?.position && typeof record.position === "object" ? record.position : {};
    const font = record && HERO_FONTS.includes(record.fontFamily) ? record.fontFamily : base.fontFamily;
    const effect = record && HERO_EFFECTS.includes(record.effect) ? record.effect : "none";
    const mode = record?.colorMode === "gradient" ? "gradient" : "solid";
    const text = record ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.text, LAYER_TEXT_LIMIT[id]) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(legacyText, LAYER_TEXT_LIMIT[id]);
    return {
        text,
        position: {
            x: percent(position.x, base.position.x),
            y: percent(position.y, base.position.y)
        },
        fontFamily: font,
        colorMode: mode,
        solidColor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeAccent"])(record?.solidColor) || base.solidColor,
        gradientCss: sanitizeGradient(record?.gradientCss, base.gradientCss),
        effect
    };
}
function parseHeroLayout(raw, legacyHeadline = "") {
    const record = raw && typeof raw === "object" ? raw : null;
    const subRaw = record && "subheadline" in record ? record.subheadline : null;
    return {
        headline: parseLayer("headline", record && "headline" in record ? record.headline : null),
        subheadline: parseLayer("subheadline", subRaw, record && "subheadline" in record ? "" : legacyHeadline),
        cta_button: parseLayer("cta_button", record?.cta_button)
    };
}
/** Stronger depth look for the five 3D hero films. Indexes append onto the step lists. */ const DEPTH_LOOK = {
    tattoo: {
        wash: "ember",
        glow: 75,
        force: 4,
        radius: 4,
        blur: 3,
        depth: 4,
        damp: 3,
        rim: true,
        scan: true
    },
    field: {
        wash: "obsidian",
        glow: 75,
        force: 4,
        radius: 4,
        blur: 3,
        depth: 4,
        damp: 3,
        rim: true,
        scan: true
    },
    contractor: {
        wash: "tide",
        glow: 75,
        force: 4,
        radius: 4,
        blur: 3,
        depth: 4,
        damp: 3,
        rim: true,
        scan: true
    },
    events: {
        wash: "copper",
        glow: 75,
        force: 4,
        radius: 4,
        blur: 3,
        depth: 4,
        damp: 3,
        rim: true,
        scan: true
    },
    location: {
        wash: "obsidian",
        glow: 75,
        force: 4,
        radius: 4,
        blur: 3,
        depth: 4,
        damp: 3,
        rim: true,
        scan: true
    }
};
function depthStudio(niche) {
    return DEPTH_LOOK[niche] ?? null;
}
function applyDepthStudio(hud, niche) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOutdoorGuideNiche"])(niche)) return {
        ...hud,
        ...LOOK_PRESETS[0].hud
    };
    const look = depthStudio(niche);
    if (!look) return hud;
    return {
        ...hud,
        ...look
    };
}
function setHeroLayer(hud, id, layer) {
    const layers = cloneHeroLayout(hud.layers);
    layers[id] = parseLayer(id, layer);
    return {
        ...hud,
        layers,
        headline: layers.subheadline.text
    };
}
function parseHud(raw) {
    const record = raw && typeof raw === "object" ? raw : {};
    const wash = HERO_WASHES.includes(record.wash) ? record.wash : DEFAULT_HUD.wash;
    const pick = record.heroPick === "still" || record.heroPick === "url" || record.heroPick === "film" ? record.heroPick : "film";
    const legacyHeadline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(record.headline, 140);
    const layers = parseHeroLayout(record.layers, legacyHeadline);
    return {
        wash,
        fade: nearest(FADE_STEPS, Number(record.fade)),
        glow: nearest(GLOW_STEPS, Number(record.glow)),
        headline: layers.subheadline.text,
        layers,
        heroPick: pick,
        heroUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(record.heroUrl),
        card: indexOf(CARD_STEPS.length, record.card, DEFAULT_HUD.card),
        blur: indexOf(BLUR_STEPS.length, record.blur, DEFAULT_HUD.blur),
        rim: typeof record.rim === "boolean" ? record.rim : DEFAULT_HUD.rim,
        scan: typeof record.scan === "boolean" ? record.scan : DEFAULT_HUD.scan,
        force: indexOf(FORCE_STEPS.length, record.force, DEFAULT_HUD.force),
        radius: indexOf(RADIUS_STEPS.length, record.radius, DEFAULT_HUD.radius),
        damp: indexOf(DAMP_STEPS.length, record.damp, DEFAULT_HUD.damp),
        depth: indexOf(DEPTH_STEPS.length, record.depth, DEFAULT_HUD.depth)
    };
}
function hudVars(hud, accent) {
    const card = CARD_STEPS[hud.card] ?? CARD_STEPS[DEFAULT_HUD.card];
    const blur = BLUR_STEPS[hud.blur] ?? BLUR_STEPS[DEFAULT_HUD.blur];
    const force = FORCE_STEPS[hud.force] ?? FORCE_STEPS[DEFAULT_HUD.force];
    const radius = RADIUS_STEPS[hud.radius] ?? RADIUS_STEPS[DEFAULT_HUD.radius];
    const damp = DAMP_STEPS[hud.damp] ?? DAMP_STEPS[DEFAULT_HUD.damp];
    const depth = DEPTH_STEPS[hud.depth] ?? DEPTH_STEPS[DEFAULT_HUD.depth];
    const vars = {
        ["--hero-fade"]: `${hud.fade}%`,
        ["--glow"]: hud.rim ? String(hud.glow / 100) : "0",
        ["--card-alpha"]: String(card),
        ["--glass-blur"]: `${blur}px`,
        ["--displace"]: `${force}px`,
        ["--prox"]: `${radius}px`,
        ["--spring-damp"]: String(damp),
        ["--depth-feather"]: String(depth)
    };
    if (!accent) return vars;
    return {
        ...vars,
        ["--neon"]: accent
    };
}
function paintHero(nicheImage, nicheVideo, hud, nicheVideos) {
    const film = nicheVideo || null;
    const playlist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(nicheVideos && nicheVideos.length > 0 ? nicheVideos : film);
    const still = nicheImage || "";
    if (hud.heroPick === "still") {
        return still ? {
            imageUrl: still,
            videoUrl: null,
            videos: []
        } : {
            imageUrl: "",
            videoUrl: film,
            videos: playlist
        };
    }
    if (hud.heroPick === "url") {
        const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(hud.heroUrl);
        if (!url) return {
            imageUrl: still,
            videoUrl: film,
            videos: playlist
        };
        if (VIDEO.test(url)) return {
            imageUrl: still,
            videoUrl: url,
            videos: [
                url
            ]
        };
        return {
            imageUrl: url,
            videoUrl: null,
            videos: []
        };
    }
    return {
        imageUrl: still,
        videoUrl: playlist[0] ?? film,
        videos: playlist
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/intro.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INTRO_FX_EVENT",
    ()=>INTRO_FX_EVENT,
    "INTRO_FX_KEY",
    ()=>INTRO_FX_KEY,
    "INTRO_PRESETS",
    ()=>INTRO_PRESETS,
    "PRESENTATION_STYLES",
    ()=>PRESENTATION_STYLES,
    "cameraMotion",
    ()=>cameraMotion,
    "heroPlaybackRate",
    ()=>heroPlaybackRate,
    "introDurationSec",
    ()=>introDurationSec,
    "isPresentationStyle",
    ()=>isPresentationStyle,
    "parallaxTravel",
    ()=>parallaxTravel,
    "parseIntroPreset",
    ()=>parseIntroPreset,
    "presentationForIntro",
    ()=>presentationForIntro,
    "readIntroFx",
    ()=>readIntroFx,
    "writeIntroFx",
    ()=>writeIntroFx
]);
const PRESENTATION_STYLES = [
    {
        id: "cinematic-pan",
        label: "Cinematic Pan"
    },
    {
        id: "hud-lock",
        label: "HUD Tactical Lock-In"
    },
    {
        id: "split-velocity",
        label: "Split-Screen Velocity"
    },
    {
        id: "orbital-pulse",
        label: "Orbital Ambient Pulse"
    }
];
const INTRO_PRESETS = [
    {
        id: "kenburns",
        label: "Ken Burns (Scale + Pan Inward)"
    },
    {
        id: "zoomin",
        label: "Zoom In Only"
    },
    {
        id: "zoomout",
        label: "Zoom Out Only"
    },
    {
        id: "panlr",
        label: "Pan Left-to-Right"
    },
    {
        id: "pantd",
        label: "Pan Top-Down"
    },
    {
        id: "fade",
        label: "Fade In + Subtle Scale"
    },
    {
        id: "none",
        label: "None (Static)"
    }
];
const INTRO_FX_KEY = "axiom:intro-fx";
const INTRO_FX_EVENT = "axiom:intro-fx";
function isPresentationStyle(value) {
    return PRESENTATION_STYLES.some((style)=>style.id === value);
}
function parseIntroPreset(raw) {
    const v = typeof raw === "string" ? raw.toLowerCase() : "";
    if (isPresentationStyle(v)) return v;
    if (INTRO_PRESETS.some((p)=>p.id === v)) return v;
    return "kenburns";
}
function presentationForIntro(preset) {
    if (isPresentationStyle(preset)) return preset;
    if (preset === "panlr" || preset === "pantd" || preset === "kenburns") return "cinematic-pan";
    if (preset === "zoomin" || preset === "zoomout") return "hud-lock";
    if (preset === "fade" || preset === "none") return "orbital-pulse";
    return "split-velocity";
}
function readIntroFx() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.localStorage.getItem(INTRO_FX_KEY) !== "off";
}
function writeIntroFx(on) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    window.localStorage.setItem(INTRO_FX_KEY, on ? "on" : "off");
    window.dispatchEvent(new Event(INTRO_FX_EVENT));
}
function introDurationSec(speed) {
    const s = Math.min(100, Math.max(1, speed));
    return 3 + (100 - s) / 100 * 9;
}
function parallaxTravel(intensity, speed = 40) {
    const depth = Math.min(100, Math.max(0, intensity)) / 100;
    if (depth === 0) {
        return {
            plate: 0,
            background: 0,
            particles: 0,
            wash: 0,
            light: 0,
            foreground: 0
        };
    }
    const pace = 0.85 + 0.3 * (Math.min(100, Math.max(1, speed)) / 100);
    return {
        plate: Math.round((8 + 20 * depth) * pace),
        background: Math.round((16 + 36 * depth) * pace),
        particles: Math.round((28 + 62 * depth) * pace),
        wash: Math.round((36 + 78 * depth) * pace),
        light: Math.round((48 + 96 * depth) * pace),
        foreground: -Math.round((24 + 70 * depth) * pace)
    };
}
function heroPlaybackRate(progress, intensity) {
    const p = Math.min(1, Math.max(0, progress));
    if (p <= 0.04 || p >= 0.96) return 1;
    const depth = Math.min(100, Math.max(0, intensity)) / 100;
    return 1 + 0.18 * depth * Math.sin(p * Math.PI);
}
function cameraMotion(preset, intensity) {
    const i = Math.min(100, Math.max(0, intensity)) / 100;
    // Scale stays at or above 1 so object-cover fills the viewport while the camera moves.
    const fit = 1 + 0.12 * i;
    const pan = 3.5 * i;
    switch(preset){
        case "kenburns":
            return {
                initial: {
                    scale: fit,
                    x: `${-pan * 0.4}%`,
                    y: `${-pan * 0.2}%`,
                    opacity: 1
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "zoomin":
            return {
                initial: {
                    scale: fit,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "zoomout":
            return {
                initial: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                },
                animate: {
                    scale: fit,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "panlr":
            return {
                initial: {
                    scale: fit,
                    x: `${-pan}%`,
                    y: "0%",
                    opacity: 1
                },
                animate: {
                    scale: fit,
                    x: `${pan}%`,
                    y: "0%",
                    opacity: 1
                }
            };
        case "pantd":
            return {
                initial: {
                    scale: fit,
                    x: "0%",
                    y: `${-pan}%`,
                    opacity: 1
                },
                animate: {
                    scale: fit,
                    x: "0%",
                    y: `${pan}%`,
                    opacity: 1
                }
            };
        case "fade":
            return {
                initial: {
                    scale: fit,
                    x: "0%",
                    y: "0%",
                    opacity: 0
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "cinematic-pan":
            return {
                initial: {
                    scale: fit,
                    x: `${-pan * 1.8}%`,
                    y: "0%",
                    opacity: 1
                },
                animate: {
                    scale: fit,
                    x: `${pan * 1.8}%`,
                    y: "0%",
                    opacity: 1
                }
            };
        case "hud-lock":
            return {
                initial: {
                    scale: fit + 0.08,
                    x: `${pan}%`,
                    y: `${-pan * 0.45}%`,
                    opacity: 0.35
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "split-velocity":
            return {
                initial: {
                    scale: fit,
                    x: `${-pan * 2.4}%`,
                    y: `${pan * 0.2}%`,
                    opacity: 1
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
        case "orbital-pulse":
            return {
                initial: {
                    scale: 1,
                    x: `${pan}%`,
                    y: `${-pan}%`,
                    opacity: 0.8
                },
                animate: {
                    scale: fit,
                    x: `${-pan * 0.4}%`,
                    y: `${pan * 0.4}%`,
                    opacity: 1
                }
            };
        default:
            return {
                initial: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                },
                animate: {
                    scale: 1,
                    x: "0%",
                    y: "0%",
                    opacity: 1
                }
            };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/lake-physics.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LAKE_CAMERA",
    ()=>LAKE_CAMERA,
    "createLake",
    ()=>createLake,
    "packHeights",
    ()=>packHeights,
    "pointerToLake",
    ()=>pointerToLake,
    "stampLake",
    ()=>stampLake,
    "stepLake",
    ()=>stepLake,
    "stillLake",
    ()=>stillLake,
    "strokeMode",
    ()=>strokeMode
]);
const LAKE_CAMERA = {
    eyeY: 1.55,
    eyeZ: 3.1,
    focal: 1.55,
    scaleX: 0.22,
    scaleZ: 0.28,
    biasX: 0.5,
    biasZ: 0.55
};
function createLake(cols = 128, rows = 72) {
    const count = cols * rows;
    return {
        cols,
        rows,
        curr: new Float32Array(count),
        prev: new Float32Array(count),
        next: new Float32Array(count)
    };
}
function stillLake(sim) {
    sim.curr.fill(0);
    sim.prev.fill(0);
    sim.next.fill(0);
}
function stepLake(sim, tension, damping) {
    const { cols, rows, curr, prev, next } = sim;
    const speed = Math.min(1, Math.max(0.2, tension));
    const c2 = speed * speed * 0.18;
    const damp = Math.min(0.999, Math.max(0.9, damping));
    for(let y = 1; y < rows - 1; y += 1){
        const row = y * cols;
        for(let x = 1; x < cols - 1; x += 1){
            const i = row + x;
            const lap = curr[i - 1] + curr[i + 1] + curr[i - cols] + curr[i + cols] - 4 * curr[i];
            next[i] = damp * (2 * curr[i] - prev[i] + c2 * lap);
        }
    }
    prev.set(curr);
    curr.set(next);
}
function stampLake(sim, x, y, radius, amp) {
    const { cols, rows, curr } = sim;
    const r = Math.max(0.6, radius);
    const reach = r * 3;
    const x0 = Math.max(1, Math.floor(x - reach));
    const x1 = Math.min(cols - 2, Math.ceil(x + reach));
    const y0 = Math.max(1, Math.floor(y - reach));
    const y1 = Math.min(rows - 2, Math.ceil(y + reach));
    const inv = 1 / (2 * r * r);
    const reachSq = reach * reach;
    for(let yy = y0; yy <= y1; yy += 1){
        for(let xx = x0; xx <= x1; xx += 1){
            const dx = xx - x;
            const dy = yy - y;
            const d2 = dx * dx + dy * dy;
            if (d2 > reachSq) continue;
            curr[yy * cols + xx] += amp * Math.exp(-d2 * inv);
        }
    }
}
function strokeMode(distancePx, threshold = 16) {
    return distancePx >= threshold ? "swipe" : "droplet";
}
function pointerToLake(px, py, width, height, cols, rows) {
    if (width <= 0 || height <= 0) return null;
    const uvx = px / width;
    const uvy = 1 - py / height;
    const aspect = width / height;
    const rdx = (uvx * 2 - 1) * aspect;
    const rdy = uvy * 2 - 1;
    const rdz = -LAKE_CAMERA.focal;
    const len = Math.hypot(rdx, rdy, rdz) || 1;
    const dy = rdy / len;
    if (dy >= -0.02) return null;
    const t = -LAKE_CAMERA.eyeY / dy;
    const x = rdx / len * t;
    const z = LAKE_CAMERA.eyeZ + rdz / len * t;
    const u = x * LAKE_CAMERA.scaleX + LAKE_CAMERA.biasX;
    const v = z * LAKE_CAMERA.scaleZ + LAKE_CAMERA.biasZ;
    if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) return null;
    return {
        x: u * (cols - 1),
        y: v * (rows - 1)
    };
}
function packHeights(curr, out) {
    for(let i = 0; i < curr.length; i += 1){
        const packed = Math.max(0, Math.min(1, curr[i] * 4 + 0.5));
        const byte = Math.round(packed * 255);
        const o = i * 4;
        out[o] = byte;
        out[o + 1] = byte;
        out[o + 2] = byte;
        out[o + 3] = 255;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/media.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/directory.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-video.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-client] (ecmascript)");
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
    const videos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(spec.video);
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
    const listed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(spec?.video);
    if (listed.length > 1) {
        const ready = listed.filter((url)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(url));
        const videos = ready.length > 0 ? ready : [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UNIVERSAL_FALLBACK"]
        ];
        return filmFrom({
            ...base,
            image: spec?.image,
            video: videos,
            label: spec && ready.length === listed.length ? spec.label : base.label
        });
    }
    const resolved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveNicheFilm"])(niche, listed[0] ?? "");
    const video = resolved || (spec ? listed[0] ?? "" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(TRADE_HERO.video)[0] ?? "");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHOP_NICHES"].map((niche)=>{
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
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filmMatchingText"])(text, film.heroVideoUrl);
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
        const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyTrade"])(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) {
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return withSpecificFilm(NICHE_MEDIA[tradeType], text);
    return withSpecificFilm(NICHE_MEDIA.trade, text);
}
function classifyQuiet(label) {
    const clean = cleanCustomNiche(label);
    if (clean.length < 2) return null;
    try {
        const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyTrade"])(clean);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
    } catch  {
        return null;
    }
    return null;
}
function isPinnedCatalog(url, niche) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCatalogHeroUrl"])(url) || !url) return false;
    const media = NICHE_MEDIA[niche];
    if (media?.heroVideos.includes(url) || url === NICHE_MEDIA.trade.heroVideoUrl) return false;
    const spec = niche === "trade" ? TRADE_HERO : CURATED_HERO[niche];
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(spec?.video).includes(url)) return false;
    return true;
}
function resolveHeroMedia(shop) {
    const customTitle = cleanCustomNiche(shop.customNiche ?? "");
    const media = customTitle ? heroForCustomNiche(customTitle) : NICHE_MEDIA[shop.niche] ?? NICHE_MEDIA.trade;
    const stillUrl = shop.heroImageUrl ?? "";
    const customStill = stillUrl.startsWith("data:");
    const customVideo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$video$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCustomHeroVideo"])(shop.heroVideoUrl);
    if (customVideo) {
        return {
            imageUrl: customStill ? stillUrl : media.heroImageUrl,
            videoUrl: shop.heroVideoUrl,
            videos: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(shop.heroVideoUrl),
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
            videos: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heroVideoList"])(shop.heroVideoUrl),
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/menu.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/niches.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/menu.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
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
    ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHOP_NICHES"]
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].guide.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].fitness.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].music.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].contractor.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].tattoo.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].location.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].field.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"].studio.introIntensity,
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
        heroImageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroImageUrl,
        heroVideoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroVideoUrl,
        heroBlendPercent: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].heroBlendPercent,
        introPreset: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introPreset,
        introSpeed: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introSpeed,
        introIntensity: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][input.niche].introIntensity,
        employees: withSharedStaff(input.employees),
        portfolio: []
    };
}
function withSharedStaff(employees) {
    const next = employees.slice(0, 2).map((person, index)=>({
            ...person,
            avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHARED_STAFF"][index] ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHARED_STAFF"][0]
        }));
    while(next.length < 2){
        const index = next.length;
        next.push({
            displayName: index === 0 ? "Alex Morgan" : "Willa Grant",
            title: index === 0 ? "Lead" : "Crew",
            bio: "On the book for this shop.",
            avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHARED_STAFF"][index] ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHARED_STAFF"][0],
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
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["unitsForTemplate"])(NICHES[niche]?.priceUnits);
}
function defaultPriceUnit(niche) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$menu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultUnit"])(priceUnitsFor(niche));
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
    const money = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMoney"])(service.priceCents);
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/particle-brand.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/hero-films.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/media.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/niches.ts [app-client] (ecmascript)");
;
;
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
function particleStudioModel(niche, business) {
    const template = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$niches$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHES"][niche];
    const film = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$media$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NICHE_MEDIA"][niche];
    const brand = twoWordBrand(business?.trim() || template.defaultName, template.defaultName);
    const video = heroesUrl(film.heroVideoUrl);
    const image = heroesUrl(film.heroImageUrl);
    return {
        ...brand,
        heroUrl: video || image || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$hero$2d$films$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UNIVERSAL_FALLBACK"],
        heroKind: video ? "video" : "image",
        staffFront: film.staff[0],
        staffBack: film.staff[1],
        filmLabel: film.loopLabel
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/preview-link.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UNACTIVATED_FOLLOW_UP_HOURS",
    ()=>UNACTIVATED_FOLLOW_UP_HOURS,
    "UNACTIVATED_FOLLOW_UP_MS",
    ()=>UNACTIVATED_FOLLOW_UP_MS,
    "appendPreviewLink",
    ()=>appendPreviewLink,
    "bodyHasPreviewLink",
    ()=>bodyHasPreviewLink,
    "isHomePreviewCounty",
    ()=>isHomePreviewCounty,
    "outreachDestination",
    ()=>outreachDestination,
    "previewNicheSlug",
    ()=>previewNicheSlug,
    "previewStyleId",
    ()=>previewStyleId,
    "previewThemeId",
    ()=>previewThemeId,
    "resolveDemoNiche",
    ()=>resolveDemoNiche,
    "shouldSendUnactivatedFollowUp",
    ()=>shouldSendUnactivatedFollowUp,
    "tenantPreviewUrl",
    ()=>tenantPreviewUrl,
    "unactivatedFollowUpAt",
    ()=>unactivatedFollowUpAt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/brand-studio.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/directory.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/regional-roster.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-client] (ecmascript)");
;
;
;
;
;
;
const UNACTIVATED_FOLLOW_UP_HOURS = 48;
const UNACTIVATED_FOLLOW_UP_MS = UNACTIVATED_FOLLOW_UP_HOURS * 60 * 60 * 1000;
function isHomePreviewCounty(county) {
    const key = county.trim().toLowerCase();
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HOME_REGION_COUNTIES"].some((item)=>item.toLowerCase() === key);
}
function resolveDemoNiche(slug) {
    const key = slug.trim().toLowerCase().replace(/(\.mp4)+$/g, "").replace(/_/g, "-");
    if (!key) return null;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(key)) return key;
    for (const candidate of [
        key,
        key.replace(/-/g, " ")
    ]){
        try {
            const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyTrade"])(candidate);
            if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
        } catch  {
        // A blank or generic phrase is not a demo.
        }
    }
    return null;
}
function previewNicheSlug(tradeType, tradeLabel = "") {
    const niche = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nicheForLead"])(tradeType, tradeLabel);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isShopNiche"])(niche) ? niche : "trade";
}
function tenantPreviewUrl(origin, lead) {
    if (!isHomePreviewCounty(lead.county)) return null;
    const business = lead.businessName.trim().slice(0, 80);
    if (!business) return null;
    const niche = previewNicheSlug(lead.tradeType, lead.tradeLabel ?? "");
    const base = origin.trim().replace(/\/$/, "") || "http://localhost";
    const url = new URL(`/demo/${niche}`, `${base}/`);
    url.searchParams.set("preview", "true");
    url.searchParams.set("business", business);
    if (lead.leadSlug) url.searchParams.set("b", lead.leadSlug);
    const county = lead.county.trim();
    if (county) url.searchParams.set("county", county);
    const city = (lead.city ?? "").trim().slice(0, 80);
    if (city) url.searchParams.set("city", city);
    if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
    return url.toString();
}
function outreachDestination(origin, lead) {
    return tenantPreviewUrl(origin, lead) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["funnelUrl"])(origin, {
        leadSlug: lead.leadSlug,
        county: lead.county,
        stopToken: lead.stopToken,
        greet: lead.greet,
        businessName: lead.businessName,
        trade: lead.trade,
        city: lead.city
    });
}
function bodyHasPreviewLink(body) {
    return body.includes("/demo/") && body.includes("preview=true");
}
function appendPreviewLink(body, url) {
    const link = url.trim();
    if (!link || bodyHasPreviewLink(body) || body.includes(link)) return body;
    const base = body.trimEnd();
    return base ? `${base}\n${link}` : link;
}
function shouldSendUnactivatedFollowUp(input) {
    if (input.clicked) return false;
    if (input.step !== 2) return true;
    return !input.claimed;
}
function unactivatedFollowUpAt(from) {
    return new Date(from.getTime() + UNACTIVATED_FOLLOW_UP_MS).toISOString();
}
function nameCode(value) {
    return [
        ...value
    ].reduce((sum, char)=>sum + char.charCodeAt(0), 0);
}
function previewThemeId(businessName) {
    const theme = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"][nameCode(businessName) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"].length];
    return theme?.id ?? "electric-blue";
}
function previewStyleId(businessName) {
    const style = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"][(nameCode(businessName) + 3) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"].length];
    return style?.id ?? "cinematic-pan";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/prospect-brand.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveProspectBrand",
    ()=>resolveProspectBrand,
    "sanitizeAccent",
    ()=>sanitizeAccent,
    "sanitizeContactLine",
    ()=>sanitizeContactLine,
    "sanitizeLogoUrl",
    ()=>sanitizeLogoUrl
]);
/** Runtime branding for an outreach preview. Nothing here is written to the database. */ const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function sanitizeAccent(value) {
    const raw = String(value ?? "").trim();
    const match = HEX.exec(raw);
    if (!match) return "";
    const hex = match[1] ?? "";
    if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
    }
    return `#${hex.toUpperCase()}`;
}
function sanitizeLogoUrl(value) {
    const raw = String(value ?? "").trim();
    if (!raw || raw.length > 400) return "";
    if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") && !raw.includes("..")) return raw;
    try {
        const url = new URL(raw);
        if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch  {
        return "";
    }
    return "";
}
function sanitizeContactLine(value, max = 80) {
    return String(value ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}
function resolveProspectBrand(input) {
    const businessName = sanitizeContactLine(input.businessName, 80) || input.fallbackName;
    const accent = sanitizeAccent(input.accent) || sanitizeAccent(input.fallbackAccent) || "#2EE6D6";
    return {
        businessName,
        logoUrl: sanitizeLogoUrl(input.logoUrl),
        accent,
        contactName: sanitizeContactLine(input.contactName, 80),
        contactPhone: sanitizeContactLine(input.contactPhone, 40),
        contactEmail: sanitizeContactLine(input.contactEmail, 120)
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/regional-roster.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Southern Oregon test roster for the master desk.
 * Names, owners, reviews, and 541-555 numbers are invented listing fields.
 * This stays out of migrations so it does not ship into the live database.
 * Several shops are generated for every vertical, including trades that are
 * not one of the built-in niches.
 */ __turbopack_context__.s([
    "HOME_REGION_CITIES",
    ()=>HOME_REGION_CITIES,
    "HOME_REGION_COPIES",
    ()=>HOME_REGION_COPIES,
    "HOME_REGION_COUNTIES",
    ()=>HOME_REGION_COUNTIES,
    "HOME_REGION_LABEL",
    ()=>HOME_REGION_LABEL,
    "REGIONAL_VERTICALS",
    ()=>REGIONAL_VERTICALS,
    "homeRegionLeads",
    ()=>homeRegionLeads
]);
const HOME_REGION_LABEL = "Southern Oregon";
const HOME_REGION_COUNTIES = [
    "Jackson County",
    "Josephine County",
    "Douglas County"
];
const HOME_REGION_CITIES = {
    "Jackson County": [
        "Medford",
        "Ashland",
        "Central Point"
    ],
    "Josephine County": [
        "Grants Pass",
        "Cave Junction"
    ],
    "Douglas County": [
        "Roseburg",
        "Winston",
        "Sutherlin"
    ]
};
const HOME_REGION_COPIES = 3;
const LANES = [
    "North",
    "South",
    "East"
];
const REGIONAL_VERTICALS = [
    {
        category: "Guide services",
        craft: "Drift"
    },
    {
        category: "Fitness coaching / Personal training",
        craft: "Training"
    },
    {
        category: "Combat sports",
        craft: "Round"
    },
    {
        category: "Massage and bodywork",
        craft: "Bodywork"
    },
    {
        category: "Lessons and tutoring",
        craft: "Lessons"
    },
    {
        category: "Hair salon",
        craft: "Shear"
    },
    {
        category: "Nails, lashes, makeup",
        craft: "Lash"
    },
    {
        category: "Tattoo shop",
        craft: "Needle"
    },
    {
        category: "Photography",
        craft: "Frame"
    },
    {
        category: "Pet grooming",
        craft: "Paws"
    },
    {
        category: "Music artist / Rapper",
        craft: "Sessions"
    },
    {
        category: "Content creator",
        craft: "Edit"
    },
    {
        category: "AI prompt engineering and creation",
        craft: "Prompt"
    },
    {
        category: "Entertainer",
        craft: "Stage"
    },
    {
        category: "Events",
        craft: "Hosts"
    },
    {
        category: "General contractor / Home services",
        craft: "Build"
    },
    {
        category: "Home cleaning",
        craft: "Shine"
    },
    {
        category: "Field service",
        craft: "Curb Call"
    },
    {
        category: "Mobile locksmith",
        craft: "Keys"
    },
    {
        category: "Private security",
        craft: "Watch"
    },
    {
        category: "Practice",
        craft: "Visit Room"
    },
    {
        category: "Advisor",
        craft: "Consult"
    },
    {
        category: "Barber",
        craft: "Fades"
    },
    {
        category: "Studio",
        craft: "Daylight"
    },
    {
        category: "Retail / Merchandise",
        craft: "Counter"
    },
    {
        category: "HVAC",
        craft: "HVAC"
    },
    {
        category: "Electrical",
        craft: "Wiring"
    },
    {
        category: "Landscaper",
        craft: "Lawn"
    },
    {
        category: "Roofing",
        craft: "Roofing"
    },
    {
        category: "Plumbing",
        craft: "Plumbing"
    },
    {
        category: "Hunting guide",
        craft: "Hunting"
    },
    {
        category: "Physical therapy",
        craft: "Physio"
    },
    {
        category: "Custom bow technician",
        craft: "Bowtech"
    },
    {
        category: "Firewood",
        craft: "Firewood"
    },
    {
        category: "Mobile food truck",
        craft: "Food Truck"
    },
    {
        category: "Air conditioning",
        craft: "Cooling"
    },
    {
        category: "Dog walking",
        craft: "Walks"
    },
    {
        category: "Auto detailing",
        craft: "Detail"
    },
    {
        category: "Towing",
        craft: "Towing"
    },
    {
        category: "Pest control",
        craft: "Pest"
    },
    {
        category: "Locksmith",
        craft: "Lock"
    },
    {
        category: "Painting",
        craft: "Paint"
    },
    {
        category: "Flooring",
        craft: "Floor"
    },
    {
        category: "Window cleaning",
        craft: "Glass"
    },
    {
        category: "Pressure washing",
        craft: "Wash"
    },
    {
        category: "Tree service",
        craft: "Tree"
    },
    {
        category: "Handyman",
        craft: "Handyman"
    },
    {
        category: "Moving",
        craft: "Moving"
    },
    {
        category: "Junk removal",
        craft: "Haul"
    },
    {
        category: "Pool service",
        craft: "Pool"
    },
    {
        category: "Garage door",
        craft: "Garage"
    },
    {
        category: "Appliance repair",
        craft: "Appliance"
    },
    {
        category: "Computer repair",
        craft: "Circuit"
    },
    {
        category: "Bookkeeping",
        craft: "Ledger"
    },
    {
        category: "Notary",
        craft: "Notary"
    },
    {
        category: "House sitting",
        craft: "Sit"
    },
    {
        category: "Pet sitting",
        craft: "Sitters"
    },
    {
        category: "Dog training",
        craft: "Recall"
    },
    {
        category: "Personal chef",
        craft: "Table"
    },
    {
        category: "Catering",
        craft: "Catering"
    },
    {
        category: "Fence building",
        craft: "Fence"
    },
    {
        category: "Concrete",
        craft: "Concrete"
    },
    {
        category: "Septic service",
        craft: "Septic"
    },
    {
        category: "Solar install",
        craft: "Solar"
    },
    {
        category: "Chimney sweep",
        craft: "Chimney"
    },
    {
        category: "Irrigation",
        craft: "Irrigation"
    },
    {
        category: "Mobile mechanic",
        craft: "Wrench"
    }
];
const FIRST = [
    "Maren",
    "Cole",
    "Dana",
    "Jonah",
    "Elena",
    "Priya",
    "Noah",
    "Leah",
    "Nina",
    "Luis",
    "Amira",
    "Claire",
    "Malik",
    "Carmen",
    "Hector",
    "Helen",
    "Omar",
    "Mateo",
    "June",
    "Alex"
];
const LAST = [
    "Holt",
    "Brennan",
    "Okonkwo",
    "Hale",
    "Voss",
    "Shah",
    "Feldman",
    "Ortiz",
    "Brooks",
    "Navarro",
    "Nguyen",
    "Greene",
    "Solis",
    "Ramos",
    "Cho",
    "Aziz",
    "Diaz",
    "Park",
    "Morgan",
    "Walsh"
];
/** Rotates SMS-only, email-only, both, and no-channel so every batch shape exists. */ const CHANNELS = [
    {
        phoneLine: "landline",
        hasWebsite: true
    },
    {
        phoneLine: "mobile",
        hasWebsite: false
    },
    {
        phoneLine: "mobile",
        hasWebsite: true
    },
    {
        phoneLine: "landline",
        hasWebsite: false
    },
    {
        phoneLine: "mobile",
        hasWebsite: true
    }
];
function leadSlug(businessName, city) {
    const raw = `${businessName} ${city}`.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
    return raw || "lead";
}
function mockEmail(businessName, city, hasWebsite) {
    if (!hasWebsite) return "";
    const host = leadSlug(businessName, city).replace(/-/g, "");
    return `desk@${host}.example`;
}
function homeRegionLeads() {
    const rows = [];
    let index = 0;
    for (const county of HOME_REGION_COUNTIES){
        for (const city of HOME_REGION_CITIES[county]){
            for (const vertical of REGIONAL_VERTICALS){
                for(let copy = 0; copy < HOME_REGION_COPIES; copy += 1){
                    const lane = LANES[copy] ?? `Lane ${copy + 1}`;
                    const businessName = `${lane} ${vertical.craft}`;
                    const channel = CHANNELS[index % CHANNELS.length] ?? CHANNELS[0];
                    const contactName = `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]}`;
                    rows.push({
                        businessName,
                        contactName,
                        city,
                        county,
                        tradeType: vertical.category,
                        reviewScore: Math.round((4.2 + index % 8 * 0.1) * 10) / 10,
                        reviewCount: 12 + index % 90,
                        hasWebsite: channel.hasWebsite,
                        phoneLine: channel.phoneLine,
                        leadSlug: leadSlug(businessName, city),
                        contactPhone: `541-555-${String(1001 + index).padStart(4, "0")}`,
                        contactEmail: mockEmail(businessName, city, channel.hasWebsite)
                    });
                    index += 1;
                }
            }
        }
    }
    return rows;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/axiom/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);})()

//# sourceMappingURL=src_0fz8n4ajs1rts._.js.map