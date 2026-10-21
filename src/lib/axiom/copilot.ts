import { BLUR_STEPS, CARD_STEPS, FADE_STEPS, GLOW_STEPS, type StorefrontHud } from "./hud.ts";
import { sanitizeAccent } from "./prospect-brand.ts";

/** Closed visual parameters the storefront HUD already understands. */
export const STYLE_FIELDS = [
  "accent",
  "edgeFeather",
  "glow",
  "cardOpacity",
  "blur",
  "borderGlow",
  "headline",
] as const;

/** Every generated hero prompt carries these constraints. */
export const HERO_STAGE_RULES =
  "Obsidian background #050507. Soft alpha-edge feathering. Subject sits on the z-space hero plane with no hard rectangular frame.";

export type StyleField = (typeof STYLE_FIELDS)[number];

/** Normalized onto StorefrontHud: fade/glow are step values, the rest are indexes. */
export type StyleTokenPatch = {
  accent?: string;
  edgeFeather?: (typeof FADE_STEPS)[number];
  glow?: (typeof GLOW_STEPS)[number];
  cardOpacity?: number;
  blur?: number;
  borderGlow?: boolean;
  headline?: string;
};

export type StagedHero = {
  url: string;
  medium: "image" | "video";
  prompt: string;
};

export type HeroConcept = {
  medium: "image" | "video";
  prompt: string;
};

export type CopilotTurn = {
  reply: string;
  style: StyleTokenPatch;
  hero: HeroConcept | null;
  brandNote: string;
};

export type StyleDiffLine = {
  field: StyleField;
  label: string;
  from: string;
  to: string;
};

export type StyleSnapshot = {
  at: string;
  summary: string;
  accent: string;
  fade: number;
  glow: number;
  card: number;
  blur: number;
  rim: boolean;
  headline: string;
  force: number;
  radius: number;
  damp: number;
  assetUrl: string;
};

const FIELD_LABEL: Record<StyleField, string> = {
  accent: "Accent",
  edgeFeather: "Edge feather",
  glow: "Neon glow",
  cardOpacity: "Card opacity",
  blur: "Blur threshold",
  borderGlow: "Border glow",
  headline: "Headline",
};

const ALIAS: Record<string, StyleField> = {
  accent: "accent",
  neon: "accent",
  edgefeather: "edgeFeather",
  edge_feather: "edgeFeather",
  fade: "edgeFeather",
  glow: "glow",
  glowintensity: "glow",
  glow_intensity: "glow",
  neonglow: "glow",
  neon_glow: "glow",
  cardopacity: "cardOpacity",
  card_opacity: "cardOpacity",
  card: "cardOpacity",
  blur: "blur",
  blurthreshold: "blur",
  blur_threshold: "blur",
  borderglow: "borderGlow",
  border_glow: "borderGlow",
  rim: "borderGlow",
  headline: "headline",
};

export function sanitizePlain(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>{}`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const LOCAL_MEDIA = /^\/media\/[A-Za-z0-9._ ()-]+(?:\/[A-Za-z0-9._ ()-]+)*$/;

export function sanitizeAssetUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 500) return "";
  if (raw.includes("..") || raw.includes("\\") || raw.includes("\0") || raw.includes("?") || raw.includes("#")) return "";
  if (LOCAL_MEDIA.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    if (/api[_-]?key|xai_api_key/i.test(url.toString())) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function cleanSlug(value: unknown): string {
  const slug = String(value ?? "").trim();
  if (!/^[a-z0-9-]{1,80}$/i.test(slug)) throw new Error("Unknown shop");
  return slug;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function nearest<T extends number>(steps: readonly T[], value: number): T {
  return steps.reduce((best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best));
}

function clampStepValue<T extends number>(steps: readonly T[], value: unknown): T | undefined {
  const n = toNumber(value);
  if (n === undefined) return undefined;
  const exact = steps.find((step) => Math.abs(step - n) < 0.001);
  if (exact !== undefined) return exact;
  if (Number.isInteger(n) && n >= 0 && n < steps.length) return steps[n];
  return nearest(steps, n);
}

function clampStepIndex(steps: readonly number[], value: unknown): number | undefined {
  const n = toNumber(value);
  if (n === undefined) return undefined;
  const exact = steps.findIndex((step) => Math.abs(step - n) < 0.001);
  if (exact >= 0) return exact;
  if (Number.isInteger(n) && n >= 0 && n < steps.length) return n;
  if (n > 1 && n <= 100 && steps.every((step) => step <= 1)) {
    const ratio = n / 100;
    const picked = nearest(steps, ratio);
    return steps.indexOf(picked);
  }
  const picked = nearest(steps, n);
  return steps.indexOf(picked);
}

function clampBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "on" || value === "true" || value === 1) return true;
  if (value === "off" || value === "false" || value === 0) return false;
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function fieldOf(key: string): StyleField | undefined {
  return ALIAS[key.replace(/[^a-zA-Z_]/g, "").toLowerCase()];
}

/** Keep only closed style fields. Hex colors, stepped numbers, one boolean, plain headline. */
export function parseStylePatch(raw: unknown): StyleTokenPatch {
  const record = asRecord(raw);
  if (!record) return {};
  const patch: StyleTokenPatch = {};
  for (const [key, value] of Object.entries(record)) {
    const field = fieldOf(key);
    if (!field || field in patch) continue;
    if (field === "accent") {
      const hex = sanitizeAccent(value);
      if (hex) patch.accent = hex;
      continue;
    }
    if (field === "edgeFeather") {
      const step = clampStepValue(FADE_STEPS, value);
      if (step !== undefined) patch.edgeFeather = step;
      continue;
    }
    if (field === "glow") {
      const step = clampStepValue(GLOW_STEPS, value);
      if (step !== undefined) patch.glow = step;
      continue;
    }
    if (field === "cardOpacity") {
      const index = clampStepIndex(CARD_STEPS, value);
      if (index !== undefined) patch.cardOpacity = index;
      continue;
    }
    if (field === "blur") {
      const index = clampStepIndex(BLUR_STEPS, value);
      if (index !== undefined) patch.blur = index;
      continue;
    }
    if (field === "borderGlow") {
      const on = clampBool(value);
      if (on !== undefined) patch.borderGlow = on;
      continue;
    }
    if (field === "headline") {
      if (typeof value !== "string") continue;
      const text = sanitizePlain(value, 140);
      if (text || value.trim() === "") patch.headline = text;
    }
  }
  return patch;
}

function parseHero(raw: unknown): HeroConcept | null {
  const record = asRecord(raw);
  if (!record) return null;
  const medium = record.medium === "video" || record.kind === "video" ? "video" : record.medium === "image" || record.kind === "image" ? "image" : null;
  if (!medium) return null;
  const prompt = sanitizePlain(record.prompt ?? record.text, 400);
  if (!prompt) return null;
  if (/javascript:|data:text\/html/i.test(prompt)) return null;
  return { medium, prompt };
}

function noteFrom(value: unknown): string {
  if (typeof value !== "string") return "";
  return sanitizePlain(value, 400);
}

/** Structured actions only. CSS, HTML, code, and unknown keys are dropped. */
export function parseCopilotTurn(raw: unknown): CopilotTurn {
  const record = asRecord(raw);
  if (!record) {
    return { reply: "", style: {}, hero: null, brandNote: "" };
  }
  let styleRaw: unknown = record.style;
  let heroRaw: unknown = record.hero ?? record.heroConcept;
  let brandNote = noteFrom(record.brandNote ?? record.brandNotes);
  const actions = Array.isArray(record.actions) ? record.actions : [];
  const styleParts: Record<string, unknown>[] = [];
  if (asRecord(styleRaw)) styleParts.push(asRecord(styleRaw)!);
  for (const action of actions) {
    const item = asRecord(action);
    if (!item) continue;
    const type = String(item.type ?? item.kind ?? "").toLowerCase();
    if (type === "style" || type === "tokens") {
      styleParts.push(item);
      continue;
    }
    if (type === "hero" || type === "hero_concept" || type === "asset") {
      heroRaw = item;
      continue;
    }
    if (type === "remember" || type === "note") {
      const next = noteFrom(item.brandNote ?? item.brandNotes ?? item.text);
      if (next) brandNote = next;
    }
  }
  if (!styleParts.length) {
    const loose: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (fieldOf(key)) loose[key] = value;
    }
    if (Object.keys(loose).length) styleParts.push(loose);
  }
  const style = parseStylePatch(Object.assign({}, ...styleParts));
  const hero = parseHero(heroRaw);
  const reply = sanitizePlain(record.reply ?? record.message ?? "", 800);
  return { reply, style, hero, brandNote };
}

export function parseCopilotJson(text: string): CopilotTurn {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return parseCopilotTurn(JSON.parse(trimmed) as unknown);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return parseCopilotTurn(JSON.parse(trimmed.slice(start, end + 1)) as unknown);
      } catch {
        return { reply: "", style: {}, hero: null, brandNote: "" };
      }
    }
    return { reply: "", style: {}, hero: null, brandNote: "" };
  }
}

export function applyStylePatch(hud: StorefrontHud, patch: StyleTokenPatch): StorefrontHud {
  return {
    ...hud,
    ...(patch.edgeFeather !== undefined ? { fade: patch.edgeFeather } : {}),
    ...(patch.glow !== undefined ? { glow: patch.glow } : {}),
    ...(patch.cardOpacity !== undefined ? { card: patch.cardOpacity } : {}),
    ...(patch.blur !== undefined ? { blur: patch.blur } : {}),
    ...(patch.borderGlow !== undefined ? { rim: patch.borderGlow } : {}),
    ...(patch.headline !== undefined
      ? {
          headline: patch.headline,
          layers: {
            ...hud.layers,
            subheadline: { ...hud.layers.subheadline, text: patch.headline },
          },
        }
      : {}),
  };
}

function cardLabel(index: number): string {
  return `${Math.round((CARD_STEPS[index] ?? CARD_STEPS[1]) * 100)}%`;
}

function indexed(steps: readonly number[], index: number, unit: string): string {
  return `${steps[index] ?? steps[0]}${unit}`;
}

export function styleDiff(current: { accent: string; hud: StorefrontHud }, patch: StyleTokenPatch): StyleDiffLine[] {
  const hud = current.hud;
  const lines: StyleDiffLine[] = [];
  const push = (field: StyleField, from: string, to: string) => {
    if (from === to) return;
    lines.push({ field, label: FIELD_LABEL[field], from, to });
  };
  if (patch.accent !== undefined) push("accent", current.accent || "—", patch.accent);
  if (patch.edgeFeather !== undefined) push("edgeFeather", `${hud.fade}%`, `${patch.edgeFeather}%`);
  if (patch.glow !== undefined) push("glow", String(hud.glow), String(patch.glow));
  if (patch.cardOpacity !== undefined) push("cardOpacity", cardLabel(hud.card), cardLabel(patch.cardOpacity));
  if (patch.blur !== undefined) push("blur", indexed(BLUR_STEPS, hud.blur, "px"), indexed(BLUR_STEPS, patch.blur, "px"));
  if (patch.borderGlow !== undefined) push("borderGlow", hud.rim ? "on" : "off", patch.borderGlow ? "on" : "off");
  if (patch.headline !== undefined) push("headline", hud.headline || "Niche line", patch.headline || "Niche line");
  return lines;
}

export function rememberPrompt(existing: readonly string[], prompt: string, limit = 12): string[] {
  const text = sanitizePlain(prompt, 240);
  const kept = existing.map((item) => sanitizePlain(item, 240)).filter(Boolean);
  if (!text) return kept.slice(-limit);
  return [...kept, text].slice(-limit);
}

export function capHistory(raw: unknown, limit = 6): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const turns: { role: "user" | "assistant"; content: string }[] = [];
  for (const item of raw) {
    const record = asRecord(item);
    if (!record) continue;
    const role = record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : null;
    const content = sanitizePlain(record.content, 400);
    if (!role || !content) continue;
    turns.push({ role, content });
  }
  return turns.slice(-limit);
}

export function emptyPatch(patch: StyleTokenPatch): boolean {
  return STYLE_FIELDS.every((field) => patch[field] === undefined);
}

export type CopilotMemoryView = {
  brandNotes: string;
  niche: string;
  preferredAccent: string;
  pastPrompts: string[];
  feedback: string;
  latestSummary: string;
  confirmedColors: string[];
  aesthetic: string;
  styleTokens: StyleTokenPatch;
  stagedHero: StagedHero | null;
};

/** Closed fields the memory row stores for one shop. Past prompts stay JSON. */
export type BusinessMemoryPayload = {
  brandNotes: string;
  styleTokens: StyleTokenPatch;
  aesthetic: string;
  pastPrompts: string[];
};

export function packBusinessMemory(input: {
  brandNotes?: unknown;
  styleTokens?: unknown;
  aesthetic?: unknown;
  aestheticPreferences?: unknown;
  pastPrompts?: unknown;
}): BusinessMemoryPayload {
  const prompts = Array.isArray(input.pastPrompts)
    ? input.pastPrompts.filter((item): item is string => typeof item === "string")
    : [];
  return {
    brandNotes: sanitizePlain(input.brandNotes, 400),
    styleTokens: parseStylePatch(input.styleTokens),
    aesthetic: sanitizePlain(input.aesthetic ?? input.aestheticPreferences, 400),
    pastPrompts: rememberPrompt(prompts, ""),
  };
}

export function unpackBusinessMemory(raw: string): BusinessMemoryPayload {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record) return packBusinessMemory({});
    return packBusinessMemory({
      brandNotes: record.brandNotes,
      styleTokens: record.styleTokens,
      aesthetic: record.aesthetic ?? record.aestheticPreferences,
      pastPrompts: record.pastPrompts,
    });
  } catch {
    return packBusinessMemory({});
  }
}

/** Owner films under public/media/heroes. Creator uses leopard; the hunting template uses the verified Sasquatch film. */
export const STAGE_LIBRARY = [
  {
    id: "leopard",
    label: "Leopard",
    url: "/media/heroes/leopard.mp4",
    medium: "video",
    prompt: "Leopard film on the staging plane",
  },
  {
    id: "bear",
    label: "Bear",
    url: "/media/heroes/charging-bear.mp4",
    medium: "video",
    prompt: "Charging bear film on the staging plane",
  },
  {
    id: "kayak",
    label: "Kayak",
    url: "/media/heroes/white-water-rafting.mp4",
    medium: "video",
    prompt: "Kayak film on the staging plane",
  },
  {
    id: "sasquatch",
    label: "Sasquatch",
    url: "/media/heroes/hunting-guide.mp4",
    medium: "video",
    prompt: "Verified hunting guide film on the staging plane",
  },
] as const;

export function stageLibraryHero(id: unknown): StagedHero | null {
  const key = String(id ?? "");
  const item = STAGE_LIBRARY.find((entry) => entry.id === key);
  if (!item) return null;
  return stageHero(item.url, item.medium, item.prompt);
}

/** Staging paint. The returned HUD keeps the live hero pick; previewUrl is the sandbox only. */
export function stagingFrame(
  live: StorefrontHud,
  accent: string,
  patch: StyleTokenPatch,
  staged: StagedHero | null,
): { accent: string; hud: StorefrontHud; previewUrl: string } {
  const tokens = parseStylePatch(patch);
  return {
    accent: tokens.accent || sanitizeAccent(accent),
    hud: applyStylePatch(live, tokens),
    previewUrl: staged?.url ?? "",
  };
}

/** Public hero is the live HUD only. A staged URL is invisible until it is copied onto that HUD. */
export function publicHeroUrl(live: Pick<StorefrontHud, "heroPick" | "heroUrl">, stagedUrl: string): string {
  if (live.heroPick !== "url") return "";
  const liveUrl = sanitizeAssetUrl(live.heroUrl);
  if (!liveUrl) return "";
  if (stagedUrl && liveUrl === stagedUrl) return liveUrl;
  return liveUrl;
}

export function stageHero(url: unknown, medium: unknown, prompt: unknown): StagedHero | null {
  const safe = sanitizeAssetUrl(url);
  const kind = medium === "video" ? "video" : medium === "image" ? "image" : null;
  const text = sanitizePlain(prompt, 400);
  if (!safe || !kind || !text) return null;
  return { url: safe, medium: kind, prompt: text };
}

export function promoteStagedHero(live: StorefrontHud, staged: StagedHero | null): StorefrontHud {
  const url = sanitizeAssetUrl(staged?.url);
  if (!url || !staged) return live;
  return { ...live, heroPick: "url", heroUrl: url };
}

export function heroGenerationPrompt(sentence: string, accent: string): string {
  const hex = sanitizeAccent(accent);
  const color = hex ? ` Accent ${hex}.` : "";
  const rules = `${HERO_STAGE_RULES}${color}`;
  const lead = sanitizePlain(sentence, Math.max(0, 500 - rules.length - 1));
  return `${rules} ${lead}`.trim();
}

export function rememberColors(existing: readonly string[], accent: string, limit = 8): string[] {
  const hex = sanitizeAccent(accent);
  const kept = existing.map((item) => sanitizeAccent(item)).filter(Boolean);
  if (!hex) return [...new Set(kept)].slice(-limit);
  return [...new Set([...kept, hex])].slice(-limit);
}

export type CopilotLook = {
  accent: string;
  hud: StorefrontHud;
};

export type CopilotHeroPreview = HeroConcept & { assetUrl: string };

export type CopilotSendResult = {
  ok: boolean;
  available: boolean;
  error: string;
  reply: string;
  style: StyleTokenPatch;
  hero: CopilotHeroPreview | null;
  brandNote: string;
  look: CopilotLook;
  memory: CopilotMemoryView;
};

export type CopilotDesk = {
  available: boolean;
  shopName: string;
  look: CopilotLook;
  memory: CopilotMemoryView;
};

export function snapshotFromHud(
  hud: StorefrontHud,
  accent: string,
  summary: string,
  assetUrl: string,
  at: string,
): StyleSnapshot {
  return {
    at,
    summary: sanitizePlain(summary, 200),
    accent: sanitizeAccent(accent),
    fade: hud.fade,
    glow: hud.glow,
    card: hud.card,
    blur: hud.blur,
    rim: hud.rim,
    headline: sanitizePlain(hud.headline, 140),
    force: hud.force,
    radius: hud.radius,
    damp: hud.damp,
    assetUrl: sanitizeAssetUrl(assetUrl),
  };
}
