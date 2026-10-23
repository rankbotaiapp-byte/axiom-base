module.exports = [
(()=>{"use strict";return[
"[project]/src/app/demo/[niche]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DemoPage,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/preview-link.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$search$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/search.ts [app-rsc] (ecmascript)");
;
;
;
;
;
const dynamic = "force-dynamic";
async function DemoPage({ params, searchParams }) {
    const { niche: requested } = await params;
    const niche = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveDemoNiche"])(requested);
    if (!niche) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const search = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseFunnelSearch"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$search$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flatSearch"])(await searchParams));
    const branded = {
        ...search,
        preview: true,
        business: search.business || search.biz || undefined
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PreviewFrame, {
        niche: niche,
        search: branded
    }, void 0, false, {
        fileName: "[project]/src/app/demo/[niche]/page.tsx",
        lineNumber: 24,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/app/search.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "flatSearch",
    ()=>flatSearch
]);
function flatSearch(raw) {
    const out = {};
    for (const [key, value] of Object.entries(raw)){
        out[key] = Array.isArray(value) ? value[0] ?? "" : value ?? "";
    }
    return out;
}
}),
"[project]/src/lib/axiom/brand-studio.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-rsc] (ecmascript)");
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
    const presentation = typeof record.presentation === "string" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isPresentationStyle"])(record.presentation) ? record.presentation : "";
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
}),
"[project]/src/lib/axiom/directory.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-rsc] (ecmascript)");
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(id)) return NICHE_LABELS[id];
    return id.replace(/-/g, " ");
}
function classifyTrade(raw) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (label.length < 2) throw new Error("Trade is required");
    const key = label.toLowerCase();
    if (key === "all" || key === "all trades") throw new Error("Name the trade");
    const byId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(key) ? key : null;
    const byLabel = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SHOP_NICHES"].find((id)=>NICHE_LABELS[id].toLowerCase() === key) ?? null;
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
    const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["slugify"])(label);
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return tradeType;
    const label = tradeLabel.trim() || tradeType.replace(/-/g, " ");
    try {
        const classified = classifyTrade(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
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
"[project]/src/lib/axiom/funnel.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-rsc] (ecmascript)");
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
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo) ? {
            logo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent) ? {
            accent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40) ? {
            phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120) ? {
            email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120)
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
}),
"[project]/src/lib/axiom/intro.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
    if ("TURBOPACK compile-time truthy", 1) return true;
    //TURBOPACK unreachable
    ;
}
function writeIntroFx(on) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
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
}),
"[project]/src/lib/axiom/preview-link.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/brand-studio.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/directory.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/regional-roster.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-rsc] (ecmascript)");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HOME_REGION_COUNTIES"].some((item)=>item.toLowerCase() === key);
}
function resolveDemoNiche(slug) {
    const key = slug.trim().toLowerCase().replace(/(\.mp4)+$/g, "").replace(/_/g, "-");
    if (!key) return null;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(key)) return key;
    for (const candidate of [
        key,
        key.replace(/-/g, " ")
    ]){
        try {
            const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["classifyTrade"])(candidate);
            if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
        } catch  {
        // A blank or generic phrase is not a demo.
        }
    }
    return null;
}
function previewNicheSlug(tradeType, tradeLabel = "") {
    const niche = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nicheForLead"])(tradeType, tradeLabel);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isShopNiche"])(niche) ? niche : "trade";
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
    return tenantPreviewUrl(origin, lead) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["funnelUrl"])(origin, {
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
    const theme = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"][nameCode(businessName) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"].length];
    return theme?.id ?? "electric-blue";
}
function previewStyleId(businessName) {
    const style = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"][(nameCode(businessName) + 3) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"].length];
    return style?.id ?? "cinematic-pan";
}
}),
"[project]/src/lib/axiom/prospect-brand.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/lib/axiom/regional-roster.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/lib/axiom/types.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-rsc] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
]})(),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/demo/[niche]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/demo/[niche]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__07-7f175ebkbb._.js.map