module.exports = [
(()=>{"use strict";return[
"[project]/scripts/migration-plan.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// @ts-check
/**
 * Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
 * (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
 *
 * Applied files are keyed by BASENAME, so the same file applies once no matter
 * which directory it is globbed from. That is what makes the auth schema safe to
 * copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
 * a database that already has `0001_auth.sql` will not re-run it.
 *
 * Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
 * out of scope for both until it is copied up.
 */ /**
 * The `_migrations` key for a migration path (or bare filename).
 * @param {string} path
 * @returns {string}
 */ __turbopack_context__.s([
    "isMigrationFile",
    ()=>isMigrationFile,
    "migrationName",
    ()=>migrationName,
    "pendingMigrations",
    ()=>pendingMigrations
]);
function migrationName(path) {
    return path.split("/").pop() ?? path;
}
function isMigrationFile(path) {
    return path.endsWith(".sql");
}
function pendingMigrations(paths, applied) {
    const done = new Set(applied);
    return [
        ...paths
    ].filter(isMigrationFile).map((path)=>({
            name: migrationName(path),
            path
        })).sort((a, b)=>a.name.localeCompare(b.name)).filter(({ name })=>!done.has(name));
}
}),
"[project]/src/lib/axiom/brand-studio.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-route] (ecmascript)");
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
    const presentation = typeof record.presentation === "string" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPresentationStyle"])(record.presentation) ? record.presentation : "";
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
"[project]/src/lib/axiom/directory.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-route] (ecmascript)");
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(id)) return NICHE_LABELS[id];
    return id.replace(/-/g, " ");
}
function classifyTrade(raw) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (label.length < 2) throw new Error("Trade is required");
    const key = label.toLowerCase();
    if (key === "all" || key === "all trades") throw new Error("Name the trade");
    const byId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(key) ? key : null;
    const byLabel = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHOP_NICHES"].find((id)=>NICHE_LABELS[id].toLowerCase() === key) ?? null;
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
    const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["slugify"])(label);
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
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(tradeType)) return tradeType;
    const label = tradeLabel.trim() || tradeType.replace(/-/g, " ");
    try {
        const classified = classifyTrade(label);
        if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
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
"[project]/src/lib/axiom/funnel-guard.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FUNNEL_IP_LIMIT",
    ()=>FUNNEL_IP_LIMIT,
    "FUNNEL_SLUG_LIMIT",
    ()=>FUNNEL_SLUG_LIMIT,
    "funnelBucketOpen",
    ()=>funnelBucketOpen,
    "hashStopToken",
    ()=>hashStopToken,
    "isDueNurtureStep",
    ()=>isDueNurtureStep,
    "newStopToken",
    ()=>newStopToken,
    "nurtureReleasePlan",
    ()=>nurtureReleasePlan,
    "splitOutreachEmail",
    ()=>splitOutreachEmail,
    "tokenHashMatches",
    ()=>tokenHashMatches
]);
const FUNNEL_IP_LIMIT = 30;
const FUNNEL_SLUG_LIMIT = 60;
function newStopToken() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return [
        ...bytes
    ].map((byte)=>byte.toString(16).padStart(2, "0")).join("");
}
async function hashStopToken(token) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return [
        ...new Uint8Array(digest)
    ].map((byte)=>byte.toString(16).padStart(2, "0")).join("");
}
function tokenHashMatches(actual, stored) {
    if (!actual || !stored || actual.length !== stored.length) return false;
    let diff = 0;
    for(let i = 0; i < actual.length; i += 1)diff |= actual.charCodeAt(i) ^ stored.charCodeAt(i);
    return diff === 0;
}
function funnelBucketOpen(hitsInWindow, limit) {
    return hitsInWindow < limit;
}
function isDueNurtureStep(step) {
    return step === 2 || step === 3 || step === 6;
}
function nurtureReleasePlan(mode, credentialsReady) {
    if (mode !== "live") return "log";
    if (!credentialsReady) return "hold";
    return "send";
}
function splitOutreachEmail(body) {
    const breakAt = body.indexOf("\n\n");
    if (breakAt === -1) return {
        subject: body.slice(0, 140),
        text: body
    };
    return {
        subject: body.slice(0, breakAt).slice(0, 200),
        text: body.slice(breakAt + 2)
    };
}
}),
"[project]/src/lib/axiom/funnel.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/prospect-brand.ts [app-route] (ecmascript)");
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
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo) ? {
            logo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeLogoUrl"])(source.logo)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent) ? {
            accent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeAccent"])(source.accent)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40) ? {
            phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.phone, 40)
        } : {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120) ? {
            email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$prospect$2d$brand$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeContactLine"])(source.email, 120)
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
"[project]/src/lib/axiom/intro.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/axiom/notify-target.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isNotifyEmail",
    ()=>isNotifyEmail,
    "toE164",
    ()=>toE164
]);
function isNotifyEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function toE164(raw) {
    const trimmed = raw.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
}
}),
"[project]/src/lib/axiom/outreach-cron.server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "handleOutreachCron",
    ()=>handleOutreachCron
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/outreach-queue.server.ts [app-route] (ecmascript)");
;
;
;
;
function secretMatches(header, secret) {
    if (header.length !== secret.length) return false;
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(Buffer.from(header), Buffer.from(secret));
}
async function handleOutreachCron(request) {
    const secret = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("OUTREACH_CRON_SECRET");
    if (!secret) return new Response(null, {
        status: 404
    });
    const header = request.headers.get("x-outreach-cron") ?? "";
    if (!secretMatches(header, secret)) return Response.json({
        error: "Forbidden"
    }, {
        status: 403
    });
    const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
    const origin = new URL(request.url).origin;
    const batch = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drainOutreachQueue"])(sql, origin);
    const nurture = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drainNurtureTouches"])(sql, origin);
    return Response.json({
        batchReleased: batch.released,
        nurtureReleased: nurture.released
    });
}
}),
"[project]/src/lib/axiom/outreach-queue.server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "drainNurtureTouches",
    ()=>drainNurtureTouches,
    "drainOutreachQueue",
    ()=>drainOutreachQueue,
    "ensureOutreachWorker",
    ()=>ensureOutreachWorker,
    "readOutreachConfig",
    ()=>readOutreachConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel-guard.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/preview-link.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/notify-target.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/outreach-queue.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
function readOutreachConfig() {
    return {
        mode: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseOutreachMode"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("OUTREACH_MODE")),
        intervalSeconds: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseTrickleSeconds"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("OUTREACH_TRICKLE_SECONDS")),
        chunkSize: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseChunkSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"])("OUTREACH_CHUNK_SIZE"))
    };
}
function slugList(slugs) {
    return [
        ...new Set(slugs.filter((slug)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLeadSlug"])(slug)))
    ].join(",");
}
function missingRelation(err, name) {
    const message = err instanceof Error ? err.message : "";
    return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}
function ensureOutreachWorker() {
    const host = globalThis;
    if (host.__axiomOutreachWorker) return;
    host.__axiomOutreachWorker = true;
    const timer = setInterval(()=>{
        void tickOutreachQueue();
    }, 15_000);
    if (typeof timer === "object" && timer && "unref" in timer) timer.unref();
}
async function tickOutreachQueue() {
    try {
        const sql = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSql"])();
        await drainOutreachQueue(sql);
        await drainNurtureTouches(sql);
    } catch (err) {
        if (missingRelation(err, "outreach_dispatches") || missingRelation(err, "outreach_touches") || missingRelation(err, "attempts")) return;
        console.error("outreach queue", err instanceof Error ? err.message : err);
    }
}
function dispatchWindow(row) {
    const timing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseSendTiming"])(row.timing);
    return {
        timing,
        profile: timing === "smart" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseTimingProfile"])(row.profile) : "general"
    };
}
async function drainOutreachQueue(sql, origin = "") {
    await sql`
    update outreach_dispatches
    set status = 'queued'
    where status = 'releasing'
      and scheduled_at <= now() - interval '2 minutes'
  `;
    const due = await sql`
    select id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
      payload, interval_seconds, county, timing, profile
    from outreach_dispatches
    where status = 'queued' and scheduled_at <= now()
    order by scheduled_at asc, chunk_index asc
    limit 12
  `;
    const now = new Date();
    let row;
    for (const candidate of due){
        const window = dispatchWindow(candidate);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["insideSendWindow"])(now, window.timing, window.profile)) {
            row = candidate;
            break;
        }
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextSendInstant"])(now, window.timing, window.profile).toISOString();
        await sql`
      update outreach_dispatches
      set scheduled_at = ${next}
      where id = ${candidate.id} and status = 'queued'
    `;
    }
    if (!row) return {
        released: false
    };
    const intervalSeconds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseTrickleSeconds"])(String(row.interval_seconds));
    const recent = await sql`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null
        and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `;
    const lastSent = recent[0]?.sent_at;
    const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["trickleMayRelease"])(lastSentAt, new Date(), intervalSeconds)) return {
        released: false
    };
    const claimed = await sql`
    update outreach_dispatches
    set status = 'releasing'
    where id = ${row.id} and status = 'queued'
    returning id
  `;
    if (!claimed[0]) return {
        released: false
    };
    const channel = row.channel === "sms" ? "sms" : "email";
    const mode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseOutreachMode"])(row.mode);
    let messages = [];
    try {
        const parsed = JSON.parse(row.payload);
        messages = Array.isArray(parsed) ? parsed : [];
    } catch  {
        messages = [];
    }
    messages = await stampPreviewLinks(sql, row.county, origin, messages);
    const slugs = slugList(messages.map((message)=>message.leadSlug));
    const clicked = new Set();
    if (slugs) {
        const hits = await sql`
      select distinct lead_slug from funnel_visits
      where lead_slug <> ''
        and verified = true
        and lead_slug = any(string_to_array(${slugs}, ','))
    `;
        for (const hit of hits)clicked.add(hit.lead_slug);
    }
    let status = "skipped";
    let detail = "Nothing to release";
    const delivered = [];
    const stopped = [];
    if (messages.length === 0) {
        status = "failed";
        detail = "Chunk payload was empty";
    } else if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["outreachMayCallProviders"])(mode)) {
        for (const message of messages){
            if (clicked.has(message.leadSlug)) stopped.push(message.leadSlug);
            else delivered.push(message.leadSlug);
        }
        status = delivered.length === 0 ? "skipped" : "logged";
        detail = stopped.length > 0 ? `Simulation log for ${delivered.length} leads. ${stopped.length} stopped after opening the booking link. No provider call.` : `Simulation log for ${delivered.length} leads. No provider call.`;
    } else {
        const { missingOutreachCredentials, deliverOutreachMessage } = await __turbopack_context__.A("[project]/src/lib/axiom/notify.server.ts [app-route] (ecmascript, async loader)");
        const missing = missingOutreachCredentials();
        if (missing.length > 0) {
            status = "failed";
            detail = `Live outreach needs ${missing.join(", ")}`;
        } else {
            const notes = [];
            let failed = 0;
            for (const message of messages){
                if (clicked.has(message.leadSlug)) {
                    stopped.push(message.leadSlug);
                    continue;
                }
                if (channel === "sms" && !message.to.startsWith("+")) {
                    failed += 1;
                    notes.push(`${message.leadSlug}: phone is not dialable`);
                    continue;
                }
                const result = await deliverOutreachMessage({
                    channel,
                    to: message.to,
                    subject: message.subject,
                    body: message.body
                });
                if (result.status === "sent") delivered.push(message.leadSlug);
                else {
                    failed += 1;
                    notes.push(`${message.leadSlug}: ${result.detail || result.status}`);
                }
            }
            if (delivered.length === 0 && failed === 0) status = "skipped";
            else if (failed > 0) status = "failed";
            else status = "sent";
            const summary = `${delivered.length} sent, ${stopped.length} stopped, ${failed} failed`;
            detail = notes.length > 0 ? `${summary}. ${notes.slice(0, 3).join("; ")}` : summary;
        }
    }
    await sql`
    update outreach_dispatches
    set status = ${status}, sent_at = now(), detail = ${detail.slice(0, 400)}
    where id = ${row.id}
  `;
    if (delivered.length > 0) await markDayZero(sql, row.campaign_id, delivered, "sent");
    if (stopped.length > 0) await markDayZero(sql, row.campaign_id, stopped, "skipped");
    return {
        released: true
    };
}
async function drainNurtureTouches(sql, origin = "") {
    const config = readOutreachConfig();
    const credentialsReady = config.mode === "live" ? (await __turbopack_context__.A("[project]/src/lib/axiom/notify.server.ts [app-route] (ecmascript, async loader)")).missingOutreachCredentials().length === 0 : false;
    const plan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nurtureReleasePlan"])(config.mode, credentialsReady);
    if (plan === "hold") return {
        released: 0
    };
    const due = await sql`
    select t.id, t.step, t.body, t.attempts, s.id as sequence_id, s.lead_slug, s.channel, s.county,
      s.trade_type, s.timing, l.business_name, l.claimed, l.contact_email, l.contact_phone
    from outreach_touches t
    join outreach_sequences s on s.id = t.sequence_id
    left join preloaded_leads l on l.lead_slug = s.lead_slug
    where t.status = 'scheduled'
      and t.step in (2, 3, 6)
      and t.scheduled_at <= now()
      and s.status = 'active'
    order by t.scheduled_at asc, t.step asc
    limit 24
  `;
    const now = new Date();
    const batch = [];
    for (const row of due){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isDueNurtureStep"])(numStep(row.step))) continue;
        const timing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseSendTiming"])(row.timing);
        const profile = timing === "smart" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timingProfileFor"])(row.trade_type) : "general";
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["insideSendWindow"])(now, timing, profile)) {
            const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextSendInstant"])(now, timing, profile).toISOString();
            await sql`
        update outreach_touches
        set scheduled_at = ${next}
        where id = ${row.id} and status = 'scheduled'
      `;
            continue;
        }
        batch.push(row);
        if (batch.length >= config.chunkSize) break;
    }
    if (batch.length === 0) return {
        released: 0
    };
    const recent = await sql`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `;
    const lastSent = recent[0]?.sent_at;
    const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$outreach$2d$queue$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["trickleMayRelease"])(lastSentAt, new Date(), config.intervalSeconds)) return {
        released: 0
    };
    let sent = 0;
    let failed = 0;
    const channel = batch[0]?.channel === "sms" ? "sms" : "email";
    const county = batch[0]?.county ?? "";
    for (const touch of batch){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["shouldSendUnactivatedFollowUp"])({
            step: numStep(touch.step),
            claimed: Boolean(touch.claimed),
            clicked: false
        })) {
            await sql`update outreach_touches set status = 'skipped' where id = ${touch.id} and status = 'scheduled'`;
            continue;
        }
        const claimed = await sql`
      update outreach_touches
      set attempts = attempts + 1
      where id = ${touch.id} and status = 'scheduled' and attempts < 3
      returning id
    `;
        if (!claimed[0]) continue;
        const touchChannel = touch.channel === "sms" ? "sms" : "email";
        const preview = origin ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tenantPreviewUrl"])(origin, {
            businessName: touch.business_name ?? "",
            tradeType: touch.trade_type,
            county: touch.county,
            leadSlug: touch.lead_slug
        }) : null;
        const body = preview && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isHomePreviewCounty"])(touch.county) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendPreviewLink"])(touch.body, preview) : touch.body;
        const outcome = await releaseNurtureTouch({
            ...touch,
            body
        }, touchChannel, plan);
        if (outcome === "sent") {
            sent += 1;
            await sql`update outreach_touches set status = 'sent' where id = ${touch.id}`;
            await sql`
        update outreach_sequences s
        set status = 'complete', stopped_reason = ''
        where s.id = ${touch.sequence_id}
          and s.status = 'active'
          and not exists (
            select 1 from outreach_touches t
            where t.sequence_id = s.id and t.status = 'scheduled'
          )
      `;
        } else {
            failed += 1;
            const attempts = numStep(touch.attempts) + 1;
            if (attempts >= 3) {
                await sql`update outreach_touches set status = 'skipped' where id = ${touch.id} and status = 'scheduled'`;
            } else {
                const next = new Date(Date.now() + config.intervalSeconds * 1000).toISOString();
                await sql`
          update outreach_touches
          set scheduled_at = ${next}
          where id = ${touch.id} and status = 'scheduled'
        `;
            }
        }
    }
    if (sent + failed === 0) return {
        released: 0
    };
    const status = plan === "log" ? "logged" : failed > 0 ? "failed" : "sent";
    const summary = plan === "log" ? `Day 3/6 simulation log for ${sent} leads. No provider call.` : `${sent} sent, ${failed} failed`;
    await sql`
    insert into outreach_events (id, county, channel, summary, status)
    values (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["newId"])("evt")}, ${county}, ${channel}, ${summary}, ${status})
  `;
    return {
        released: sent
    };
}
async function releaseNurtureTouch(touch, channel, plan) {
    if (plan === "log") return "sent";
    const { deliverOutreachMessage } = await __turbopack_context__.A("[project]/src/lib/axiom/notify.server.ts [app-route] (ecmascript, async loader)");
    if (channel === "sms") {
        const to = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$notify$2d$target$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toE164"])(touch.contact_phone ?? "");
        if (!to) return "failed";
        const result = await deliverOutreachMessage({
            channel,
            to,
            subject: "",
            body: touch.body.slice(0, 640)
        });
        return result.status === "sent" ? "sent" : "failed";
    }
    const to = (touch.contact_email ?? "").trim();
    if (!to) return "failed";
    const message = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["splitOutreachEmail"])(touch.body);
    const result = await deliverOutreachMessage({
        channel,
        to,
        subject: message.subject,
        body: message.text
    });
    return result.status === "sent" ? "sent" : "failed";
}
async function stampPreviewLinks(sql, county, origin, messages) {
    if (!origin || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isHomePreviewCounty"])(county)) return messages;
    const pending = messages.filter((message)=>!message.body.includes("preview=true"));
    if (pending.length === 0) return messages;
    const slugs = slugList(pending.map((message)=>message.leadSlug));
    if (!slugs) return messages;
    let rows = [];
    try {
        rows = await sql`
      select business_name, trade_type, lead_slug, county
      from preloaded_leads
      where lead_slug = any(string_to_array(${slugs}, ','))
    `;
    } catch (err) {
        if (missingRelation(err, "preloaded_leads")) return messages;
        throw err;
    }
    const bySlug = new Map(rows.map((row)=>[
            row.lead_slug,
            row
        ]));
    return messages.map((message)=>{
        const row = bySlug.get(message.leadSlug);
        if (!row) return message;
        const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tenantPreviewUrl"])(origin, {
            businessName: row.business_name,
            tradeType: row.trade_type,
            county: row.county || county,
            leadSlug: row.lead_slug
        });
        if (!url) return message;
        return {
            ...message,
            body: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$preview$2d$link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendPreviewLink"])(message.body, url)
        };
    });
}
function numStep(value) {
    if (typeof value === "bigint") return Number(value);
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}
async function markDayZero(sql, campaignId, slugs, status) {
    const list = slugList(slugs);
    if (!list) return;
    await sql`
    update outreach_touches
    set status = ${status}
    where step = 0
      and status = 'scheduled'
      and sequence_id in (
        select id from outreach_sequences
        where campaign_id = ${campaignId}
          and lead_slug = any(string_to_array(${list}, ','))
      )
  `;
}
}),
"[project]/src/lib/axiom/outreach-queue.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_CHUNK_SIZE",
    ()=>DEFAULT_CHUNK_SIZE,
    "DEFAULT_TRICKLE_SECONDS",
    ()=>DEFAULT_TRICKLE_SECONDS,
    "OUTREACH_TIME_ZONE",
    ()=>OUTREACH_TIME_ZONE,
    "formatSendSlot",
    ()=>formatSendSlot,
    "insideSendWindow",
    ()=>insideSendWindow,
    "nextSendInstant",
    ()=>nextSendInstant,
    "outreachMayCallProviders",
    ()=>outreachMayCallProviders,
    "parseChunkSize",
    ()=>parseChunkSize,
    "parseOutreachMode",
    ()=>parseOutreachMode,
    "parseSendTiming",
    ()=>parseSendTiming,
    "parseTimingProfile",
    ()=>parseTimingProfile,
    "parseTrickleSeconds",
    ()=>parseTrickleSeconds,
    "planSmartChunks",
    ()=>planSmartChunks,
    "planTrickleChunks",
    ()=>planTrickleChunks,
    "planWindowedChunks",
    ()=>planWindowedChunks,
    "sendWindowBlurb",
    ()=>sendWindowBlurb,
    "timingProfileFor",
    ()=>timingProfileFor,
    "trickleMayRelease",
    ()=>trickleMayRelease
]);
const DEFAULT_TRICKLE_SECONDS = 45;
const DEFAULT_CHUNK_SIZE = 5;
function parseOutreachMode(value) {
    return value?.trim().toLowerCase() === "live" ? "live" : "simulation";
}
function parseTrickleSeconds(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return DEFAULT_TRICKLE_SECONDS;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_TRICKLE_SECONDS;
    return Math.min(60, Math.max(30, Math.round(n)));
}
function parseChunkSize(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return DEFAULT_CHUNK_SIZE;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_CHUNK_SIZE;
    return Math.min(20, Math.max(1, Math.round(n)));
}
function planTrickleChunks(items, options) {
    const size = Math.max(1, Math.floor(options.chunkSize));
    const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1000;
    const chunks = [];
    for(let offset = 0; offset < items.length; offset += size){
        const index = chunks.length;
        chunks.push({
            index,
            items: items.slice(offset, offset + size),
            scheduledAt: new Date(options.start.getTime() + index * intervalMs).toISOString()
        });
    }
    return chunks;
}
function trickleMayRelease(lastSentAt, now, intervalSeconds) {
    if (!lastSentAt) return true;
    const then = new Date(lastSentAt).getTime();
    if (!Number.isFinite(then)) return true;
    return now.getTime() - then >= intervalSeconds * 1000;
}
function outreachMayCallProviders(mode) {
    return mode === "live";
}
const OUTREACH_TIME_ZONE = "America/Los_Angeles";
const WEEKDAYS = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
];
const GUARDRAIL = {
    days: new Set([
        1,
        2,
        3,
        4
    ]),
    ranges: [
        {
            start: 8 * 60,
            end: 19 * 60
        }
    ]
};
const PROFILE_CLOCKS = {
    trades: {
        days: new Set([
            1,
            2,
            3,
            4
        ]),
        ranges: [
            {
                start: 7 * 60,
                end: 8 * 60 + 30
            },
            {
                start: 16 * 60 + 30,
                end: 18 * 60
            }
        ]
    },
    salon: {
        days: new Set([
            1,
            2
        ]),
        ranges: [
            {
                start: 8 * 60,
                end: 11 * 60
            }
        ]
    },
    general: {
        days: new Set([
            1,
            2,
            3,
            4
        ]),
        ranges: [
            {
                start: 10 * 60,
                end: 14 * 60
            }
        ]
    }
};
const TRADE_PROFILES = new Set([
    "contractor",
    "clean",
    "field",
    "hvac",
    "plumbing",
    "electrical",
    "roofing",
    "landscaping",
    "air-conditioning"
]);
const SALON_PROFILES = new Set([
    "salon",
    "beauty"
]);
function parseSendTiming(value) {
    return value === "smart" ? "smart" : "immediate";
}
function parseTimingProfile(value) {
    return value === "trades" || value === "salon" || value === "general" ? value : "general";
}
function timingProfileFor(tradeType) {
    const key = tradeType.trim().toLowerCase();
    if (SALON_PROFILES.has(key)) return "salon";
    if (TRADE_PROFILES.has(key)) return "trades";
    if (key.includes("hvac") || key.includes("plumb") || key.includes("air-condition")) return "trades";
    return "general";
}
function sendWindowBlurb(timing, profile) {
    if (timing === "immediate") {
        return "Monday–Thursday, 8:00 AM–7:00 PM Pacific. A launch outside that window stays queued until it opens.";
    }
    if (profile === "trades") return "Home services wait for 7:00–8:30 AM or 4:30–6:00 PM, Monday–Thursday.";
    if (profile === "salon") return "Salons and beauty wait for Monday or Tuesday, 8:00–11:00 AM.";
    if (profile === "general") return "This trade waits for Monday–Thursday, 10:00 AM–2:00 PM.";
    return "Home services use early morning or late afternoon. Salons and beauty use Monday and Tuesday mornings. Every other trade uses 10:00 AM–2:00 PM.";
}
function zonedParts(date, timeZone) {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    });
    const bag = {};
    for (const part of fmt.formatToParts(date))bag[part.type] = part.value;
    let hour = Number(bag.hour);
    if (hour === 24) hour = 0;
    const weekday = WEEKDAYS.indexOf(bag.weekday);
    return {
        year: Number(bag.year),
        month: Number(bag.month),
        day: Number(bag.day),
        weekday: weekday < 0 ? 0 : weekday,
        minutes: hour * 60 + Number(bag.minute)
    };
}
function timeZoneOffsetMs(instant, timeZone) {
    const parts = zonedParts(instant, timeZone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, Math.floor(parts.minutes / 60), parts.minutes % 60, 0);
    return asUtc - instant.getTime();
}
function zonedDateTime(year, month, day, minutes, timeZone) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
    let utc = utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone);
    const adjusted = utcGuess - timeZoneOffsetMs(new Date(utc), timeZone);
    if (adjusted !== utc) utc = adjusted;
    return new Date(utc);
}
function addCalendarDays(year, month, day, add) {
    const utc = new Date(Date.UTC(year, month - 1, day + add));
    return {
        year: utc.getUTCFullYear(),
        month: utc.getUTCMonth() + 1,
        day: utc.getUTCDate(),
        weekday: utc.getUTCDay()
    };
}
function sendClock(timing, profile) {
    return timing === "smart" ? PROFILE_CLOCKS[profile] : GUARDRAIL;
}
function minuteInside(minutes, clock, weekday) {
    if (!clock.days.has(weekday)) return false;
    return clock.ranges.some((range)=>minutes >= range.start && minutes < range.end);
}
function insideSendWindow(now, timing, profile, timeZone = OUTREACH_TIME_ZONE) {
    const parts = zonedParts(now, timeZone);
    return minuteInside(parts.minutes, sendClock(parseSendTiming(timing), parseTimingProfile(profile)), parts.weekday);
}
function nextSendInstant(now, timing, profile, timeZone = OUTREACH_TIME_ZONE) {
    const clock = sendClock(parseSendTiming(timing), parseTimingProfile(profile));
    const parts = zonedParts(now, timeZone);
    if (minuteInside(parts.minutes, clock, parts.weekday)) return now;
    const ranges = [
        ...clock.ranges
    ].sort((a, b)=>a.start - b.start);
    for(let add = 0; add < 8; add += 1){
        const day = addCalendarDays(parts.year, parts.month, parts.day, add);
        if (!clock.days.has(day.weekday)) continue;
        for (const range of ranges){
            if (add === 0 && parts.minutes >= range.start) continue;
            const instant = zonedDateTime(day.year, day.month, day.day, range.start, timeZone);
            if (instant.getTime() >= now.getTime() - 1_000) return instant;
        }
    }
    return now;
}
function formatSendSlot(date, timeZone = OUTREACH_TIME_ZONE) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
    }).format(date);
}
function planWindowedChunks(items, options) {
    const size = Math.max(1, Math.floor(options.chunkSize));
    const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1000;
    const timeZone = options.timeZone ?? OUTREACH_TIME_ZONE;
    const chunks = [];
    let cursor = nextSendInstant(options.start, options.timing, options.profile, timeZone);
    for(let offset = 0; offset < items.length; offset += size){
        chunks.push({
            index: chunks.length,
            items: items.slice(offset, offset + size),
            scheduledAt: cursor.toISOString()
        });
        cursor = nextSendInstant(new Date(cursor.getTime() + intervalMs), options.timing, options.profile, timeZone);
    }
    return chunks;
}
function planSmartChunks(items, options) {
    const timing = parseSendTiming(options.timing);
    const groups = new Map();
    for (const item of items){
        const profile = timing === "smart" ? timingProfileFor(item.tradeType ?? "") : "general";
        const list = groups.get(profile) ?? [];
        list.push(item);
        groups.set(profile, list);
    }
    const planned = [];
    for (const [profile, group] of groups){
        for (const chunk of planWindowedChunks(group, {
            ...options,
            timing,
            profile
        })){
            planned.push({
                ...chunk,
                profile
            });
        }
    }
    planned.sort((a, b)=>a.scheduledAt.localeCompare(b.scheduledAt));
    return planned.map((chunk, index)=>({
            ...chunk,
            index
        }));
}
}),
"[project]/src/lib/axiom/preview-link.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/brand-studio.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/directory.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/funnel.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/intro.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/regional-roster.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/axiom/types.ts [app-route] (ecmascript)");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$regional$2d$roster$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HOME_REGION_COUNTIES"].some((item)=>item.toLowerCase() === key);
}
function resolveDemoNiche(slug) {
    const key = slug.trim().toLowerCase().replace(/(\.mp4)+$/g, "").replace(/_/g, "-");
    if (!key) return null;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(key)) return key;
    for (const candidate of [
        key,
        key.replace(/-/g, " ")
    ]){
        try {
            const classified = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyTrade"])(candidate);
            if (classified.known && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(classified.tradeType)) return classified.tradeType;
        } catch  {
        // A blank or generic phrase is not a demo.
        }
    }
    return null;
}
function previewNicheSlug(tradeType, tradeLabel = "") {
    const niche = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$directory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nicheForLead"])(tradeType, tradeLabel);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isShopNiche"])(niche) ? niche : "trade";
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
    return tenantPreviewUrl(origin, lead) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$funnel$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["funnelUrl"])(origin, {
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
    const theme = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"][nameCode(businessName) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$brand$2d$studio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RIPPLE_THEMES"].length];
    return theme?.id ?? "electric-blue";
}
function previewStyleId(businessName) {
    const style = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"][(nameCode(businessName) + 3) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$axiom$2f$intro$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRESENTATION_STYLES"].length];
    return style?.id ?? "cinematic-pan";
}
}),
"[project]/src/lib/axiom/prospect-brand.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/axiom/regional-roster.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/axiom/types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dbSource",
    ()=>dbSource,
    "ensureDbReady",
    ()=>ensureDbReady,
    "getPglite",
    ()=>getPglite,
    "getSql",
    ()=>getSql,
    "withTransaction",
    ()=>withTransaction
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/scripts/migration-plan.mjs [app-route] (ecmascript)");
var __TURBOPACK__import$2e$meta__ = {
    get url () {
        return __turbopack_context__.F("src/lib/db.ts");
    },
    env: {
        DEV: true,
        PROD: false,
        MODE: "development",
        BASE_URL: "/",
        SSR: true
    },
    get turbopackHot () {
        return __turbopack_context__.m.hot;
    }
};
;
;
;
;
// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;
const dbSource = databaseUrl ? "neon" : "pglite";
/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */ const globalRef = globalThis;
/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */ const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v)=>v;
function transientDbError(err) {
    const message = err instanceof Error ? err.message : "";
    const code = err && typeof err === "object" && "code" in err ? String(err.code ?? "") : "";
    if (code === "57014" || /statement timeout/i.test(message)) return false;
    return code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "08000" || code === "08003" || code === "08006" || code === "57P01" || /connection terminated|connection timeout|timeout expired|ENOTFOUND|ECONNRESET|EAI_AGAIN/i.test(message);
}
async function withDbRetry(run) {
    let last;
    for(let attempt = 0; attempt < 3; attempt++){
        try {
            return await run();
        } catch (err) {
            last = err;
            if (!transientDbError(err) || attempt === 2) throw err;
            await new Promise((resolve)=>setTimeout(resolve, 250 * (attempt + 1)));
        }
    }
    throw last;
}
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */ function toSql(run) {
    const sql = async (strings, ...values)=>{
        // Rebuild with $1, $2, … placeholders so values stay parameterized.
        let text = strings[0];
        for(let i = 0; i < values.length; i += 1)text += `$${i + 1}${strings[i + 1]}`;
        return run(text, values);
    };
    sql.query = (text, params = [])=>run(text, params);
    return sql;
}
function migrationSources() {
    try {
        return __turbopack_context__.r("[project]/src/lib/db.ts [app-route] (import.meta.glob /migrations/*.sql eager import=default query=?raw)");
    } catch (err) {
        // Vite replaces the glob call. A plain Node script, such as the California
        // seed, reads the same files from disk.
        if (!(err instanceof TypeError)) throw err;
        const dir = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"])(__TURBOPACK__import$2e$meta__.url)), "../../migrations");
        const sources = {};
        for (const name of (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readdirSync"])(dir)){
            if (!name.endsWith(".sql")) continue;
            sources[`/migrations/${name}`] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readFileSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(dir, name), "utf8");
        }
        return sources;
    }
}
/**
 * Apply pending `migrations/*.sql` to the Postgres named by `DATABASE_URL`.
 * The build step also runs this. Boot runs it again so a long-lived server
 * picks up a new file without waiting for the next deploy, including send-window
 * columns. Applied names live
 * in `_migrations`, so a restart does not re-run them or touch existing rows.
 */ async function migratePostgres() {
    if (!databaseUrl) return;
    await withDbRetry(()=>migratePostgresConnected());
}
async function migratePostgresConnected() {
    if (!databaseUrl) return;
    const { Pool } = await __turbopack_context__.A("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg, async loader)");
    const pool = new Pool({
        connectionString: databaseUrl,
        max: 1
    });
    try {
        const client = await pool.connect();
        try {
            await client.query("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
            const applied = (await client.query("select name from _migrations")).rows.map((row)=>row.name);
            const migrations = migrationSources();
            for (const { name, path } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingMigrations"])(Object.keys(migrations), applied)){
                try {
                    await client.query("BEGIN");
                    await client.query(migrations[path]);
                    await client.query("insert into _migrations (name) values ($1)", [
                        name
                    ]);
                    await client.query("COMMIT");
                    console.info(`[db] applied ${name}`);
                } catch (err) {
                    try {
                        await client.query("ROLLBACK");
                    } catch  {
                    // Keep the original migration error if the connection already died.
                    }
                    console.error(`[db] migration failed: ${name}`);
                    throw err;
                }
            }
        } finally{
            client.release();
        }
    } finally{
        await pool.end();
    }
}
function migratePostgresOnce() {
    globalRef.__pgMigratePromise__ ??= migratePostgres().catch((err)=>{
        globalRef.__pgMigratePromise__ = undefined;
        throw err;
    });
    return globalRef.__pgMigratePromise__;
}
function createNeonSql() {
    globalRef.__pgSqlPromise__ ??= (async ()=>{
        // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
        // pooled endpoint. One pool per process; warm serverless instances reuse it.
        const { Pool, types } = await __turbopack_context__.A("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg, async loader)");
        types.setTypeParser(OID_INT8, Number);
        types.setTypeParser(OID_DATE, identity);
        types.setTypeParser(OID_INTERVAL, identity);
        // One pool per process. Bulk import holds a single client for each
        // stage-and-promote transaction so the batch is not split across connections.
        const pool = new Pool({
            connectionString: databaseUrl,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 15_000
        });
        // A reset from the pooler emits `error` on an idle client. Without a
        // listener Node treats that as fatal and exits the dev server.
        pool.on("error", (err)=>{
            console.error("[db] connection dropped", err instanceof Error ? err.message : err);
        });
        pool.on("connect", (client)=>{
            client.on("error", (err)=>{
                console.error("[db] connection dropped", err instanceof Error ? err.message : err);
            });
        });
        globalRef.__pgPool__ = pool;
        return toSql(async (text, params)=>withDbRetry(async ()=>{
                const res = await pool.query(text, params);
                return res.rows;
            }));
    })().catch((err)=>{
        globalRef.__pgSqlPromise__ = undefined;
        throw err;
    });
    return globalRef.__pgSqlPromise__;
}
/** PGLite asks the engine for a 2GB block. On an 8GB machine that reservation
 *  starves the dev server. Cap it at 256MB before the database module loads. */ function capDatabaseMemory() {
    const Memory = WebAssembly.Memory;
    if (Memory.capped) return;
    const maxPages = 4096;
    function CappedMemory(descriptor) {
        const maximum = Math.min(descriptor.maximum ?? maxPages, maxPages);
        const initial = Math.min(descriptor.initial, maximum);
        return new Memory({
            ...descriptor,
            initial,
            maximum
        });
    }
    CappedMemory.prototype = Memory.prototype;
    Object.setPrototypeOf(CappedMemory, Memory);
    CappedMemory.capped = true;
    WebAssembly.Memory = CappedMemory;
}
async function createPgliteSql() {
    // Embedded Postgres, imported on demand so it never loads on the Neon path.
    // One in-memory instance per process, shared across HMR module instances, so
    // data survives source edits (it resets on dev-server restart).
    globalRef.__pgliteInstance__ ??= (async ()=>{
        capDatabaseMemory();
        const { PGlite } = await __turbopack_context__.A("[project]/node_modules/@electric-sql/pglite/dist/index.js [app-route] (ecmascript, async loader)");
        const pg = new PGlite({
            parsers: {
                [OID_INT8]: Number,
                [OID_DATE]: identity,
                [OID_INTERVAL]: identity
            }
        });
        await pg.waitReady;
        await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
        return pg;
    })().catch((err)=>{
        globalRef.__pgliteInstance__ = undefined;
        throw err;
    });
    const pg = await globalRef.__pgliteInstance__;
    // Apply migrations/ (the single schema source, including open trades) so preview matches production.
    // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
    // files are tracked in _migrations. The glob does not descend, so the opt-in
    // auth schema under migrations/auth/ stays out. Runs once per module instance
    // — so an HMR reload after adding a migration file applies it live — with
    // passes serialized on a global chain so concurrent callers never
    // double-apply.
    const migrate = async ()=>{
        const migrations = migrationSources();
        const doneRows = await pg.query("select name from _migrations");
        const done = doneRows.rows.map((r)=>r.name);
        for (const { name, path } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$scripts$2f$migration$2d$plan$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingMigrations"])(Object.keys(migrations), done)){
            // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
            // statement can't leave a file half-applied but untracked.
            await pg.transaction(async (tx)=>{
                await tx.exec(migrations[path]);
                await tx.query("insert into _migrations (name) values ($1)", [
                    name
                ]);
            });
        }
    };
    const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(()=>undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
    globalRef.__pgliteMigrateChain__ = pass;
    await pass;
    return toSql(async (text, params)=>{
        const result = await pg.query(text, params);
        return result.rows;
    });
}
let sqlPromise = null;
async function createSql() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (dbSource === "neon") {
        await migratePostgresOnce();
        return createNeonSql();
    }
    return createPgliteSql();
}
async function withTransaction(fn) {
    if (dbSource === "neon") {
        await getSql();
        const pool = globalRef.__pgPool__;
        if (!pool) throw new Error("Postgres pool is not ready");
        const client = await withDbRetry(()=>pool.connect());
        try {
            await client.query("BEGIN");
            await client.query("SET LOCAL statement_timeout = '120s'");
            const sql = toSql(async (text, params)=>{
                const res = await client.query(text, params);
                return res.rows;
            });
            const result = await fn(sql);
            await client.query("COMMIT");
            return result;
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch  {
            // Keep the original error if the connection already died.
            }
            throw err;
        } finally{
            client.release();
        }
    }
    const pg = await getPglite();
    return pg.transaction(async (tx)=>{
        const sql = toSql(async (text, params)=>{
            const result = await tx.query(text, params);
            return result.rows;
        });
        return fn(sql);
    });
}
function getSql() {
    sqlPromise ??= createSql().catch((err)=>{
        sqlPromise = null; // don't memoize failures — let the next call retry
        throw err;
    });
    return sqlPromise;
}
async function getPglite() {
    if (dbSource !== "pglite") {
        throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
    }
    await getSql();
    const pg = await globalRef.__pgliteInstance__;
    if (!pg) throw new Error("PGLite instance failed to initialize");
    return pg;
}
function ensureDbReady() {
    if (dbSource === "neon") return migratePostgresOnce();
    return getSql().then(()=>undefined);
}
// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis;
if ("TURBOPACK compile-time truthy", 1) {
    console.info(dbSource === "neon" ? "[db] postgres via DATABASE_URL" : "[db] in-memory postgres — DATABASE_URL is unset, so rows reset when this process stops");
    globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err)=>{
        globalBoot.__pgBootstrapPromise__ = undefined;
        console.error("[db] bootstrap failed:", err);
        throw err;
    });
}
}),
"[project]/src/lib/env.server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "env",
    ()=>env,
    "isWorkspacePreview",
    ()=>isWorkspacePreview
]);
function env(key) {
    const v = process.env[key]?.trim();
    return v || undefined;
}
function isWorkspacePreview() {
    return !env("GROK_PROJECT_ID");
}
}),
"[project]/src/lib/utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-route] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (import.meta.glob /migrations/*.sql eager import=default query=?raw)", (function(__turbopack_context__){

__turbopack_context__.v({
    "/migrations/0001_auth.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0002_schema.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0003_seed.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0004_rebrand.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0005_intro.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0006_tenant_platform.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0007_hero_video.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0008_music_and_contractor.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0009_dashboard_override.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0010_tattoo_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0011_guide_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0012_universal_niches.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0013_booking_notices.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0014_master_funnel.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0015_outreach.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0016_lead_public.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0017_followups.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0018_outreach_queue.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0019_nurture_guard.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0020_territory_activation.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0021_open_trades.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0022_appointment_slot.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0023_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0024_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0025_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0026_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0027_hero_stills.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0028_send_windows.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0029_security_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0030_storefront.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0031_niche_hero_films.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0032_retail_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0033_lead_audits.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0034_audit_status.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0035_funnel_source.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0036_lead_website.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0037_locksmith_combat.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0038_trade_profile.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0039_lead_staging.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0040_client_audit_submissions.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0041_creator_entertainer.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0042_landscaper_foodtruck.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0043_auth_identity.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0044_consumer_prospects.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0045_dogwalk_detailer.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0046_handle_new_user.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0047_tenant_scan_limit.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0048_hunting_therapy.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0049_bowtech.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0050_custom_niche.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0051_prompt.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0052_lead_targeting_index.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0053_merchant_pricing_settings.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0054_pricing_collection.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0055_shop_copilot_memory.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0056_copilot_stage.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0057_business_memories.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0058_hero_text_layers.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0059_auto_hero_film.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0060_preloaded_lead_geo.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0061_profiles.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0062_consumer_leads.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0063_shop_memberships.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"],
    "/migrations/0064_active_shop_memberships.sql": (()=>{
        const e = new Error("Cannot find module 'unknown module type'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })()["default"]
});
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__07a05ud2qm_g1._.js.map