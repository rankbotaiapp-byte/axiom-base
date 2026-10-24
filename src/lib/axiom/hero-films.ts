import type { ShopNiche } from "./types.ts";

/**
 * Films on disk under public/media/heroes. The matcher is case-insensitive
 * and ignores a repeated .mp4 extension, so plumbers-hero.mp4.mp4 still
 * reads as "plumbers hero".
 */
export const HERO_MP4_FILES = [
  "admin-welcome.mp4",
  "aesthetic-master.mp4",
  "auto-repair.mp4",
  "barber-hero.mp4",
  "car-pristine-base.mp4",
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
  "owl-prey-hero.mp4",
  "owl_midnight_dive.mp4",
  "outreach-welcome.mp4",
  "petgroom.mp4",
  "photographer.mp4",
  "plumbers-hero.mp4.mp4",
  "private-security.mp4",
  "pro-drone-surveyer.mp4 (2).mp4",
  "river-hawk-base.mp4",
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
  "wildlife-photographer.mp4",
] as const;

export const UNIVERSAL_FALLBACK = "/media/heroes/universal-fallback.mp4.mp4";
export const MASTER_TELEMETRY_KEY = "axiom-master-telemetry";
export const NICHE_FILM_KEY = "axiom-hero-niche-map";
/** Core log after the saved lines: GPU, frame rate, link, engine. */
export const BROWSER_LOG_ORDER = ["GPU", "FRAME", "LINK", "AI engine"] as const;

const NICHE_PHRASES: Record<ShopNiche, readonly string[]> = {
  guide: ["guide", "white water rafting", "rafting"],
  fitness: ["fitness", "tiger deer", "training"],
  combat: ["combat"],
  wellness: ["wellness", "massage"],
  lessons: ["lessons", "snow sports lessons"],
  salon: ["salon", "hair salon"],
  beauty: ["nails lashes", "aesthetic", "lashes", "beauty"],
  tattoo: ["tattoo hero", "tattoo", "tattooshop"],
  photo: ["photo", "wildlife photographer", "photography"],
  pets: ["petgroom", "pet groom", "grooming"],
  music: ["music artist", "music"],
  creator: ["content creator", "social media content creator", "creator"],
  prompt: ["prompt"],
  entertainer: ["entertainer"],
  events: ["events", "event planner"],
  landscaper: ["landscaper", "landscape"],
  foodtruck: ["mobile foodtruck", "foodtruck", "food truck"],
  dogwalk: ["dogwalking", "dog walking"],
  detailer: ["mobile detailer", "detailer"],
  hunting: ["hunting guide", "hunting", "outdoor master"],
  therapy: ["physical therapist", "physicaltherapist", "therapy"],
  bowtech: ["custom bow tech", "bow tech", "bowtech"],
  contractor: ["contractors hero", "contractors", "contractor"],
  clean: ["clean"],
  field: ["auto repair", "auto hero", "mobile mechanic", "field"],
  locksmith: ["mobile locksmith", "locksmith"],
  firewood: ["firewood", "wood"],
  security: ["private security", "security"],
  practice: ["practice"],
  counsel: ["counsel", "advisor"],
  location: ["barbers hero", "barber hero", "barbers", "barber"],
  studio: ["studio"],
  retail: ["retail"],
  trade: ["welding trade", "welding", "trade"],
};

const SKIP = /\b(welcome|outreach|coastal|charging)\b/;
const FILLER = new Set(["hero", "master", "mobile", "custom", "loop"]);

/** Named films win their niche even when another file scores as high. */
const NICHE_PRIORITY: Partial<Record<ShopNiche, string>> = {
  contractor: "contractors-hero.mp4",
  field: "auto-repair.mp4",
  photo: "photographer.mp4",
};

/** A business title uses these before the fuzzy score. Plumbing stays off the contractor reel. */
const TEXT_PRIORITY: readonly { pattern: RegExp; file: string }[] = [
  { pattern: /\bplumb(?:ing|ers|er)?\b/i, file: "plumbers-hero.mp4.mp4" },
  { pattern: /\bauto[\s-]*repair\b|\bmechanics?\b/i, file: "auto-repair.mp4" },
  { pattern: /\bbarbers?\b/i, file: "barber-hero.mp4" },
  {
    pattern: /\b(?:hvac|roof(?:ing|ers|er)?|electric(?:al|ian|ians)?|air conditioning|contractors?)\b/i,
    file: "contractors-hero.mp4",
  },
];

function onDisk(file: string): boolean {
  return (HERO_MP4_FILES as readonly string[]).includes(file);
}

function doubledMp4(file: string): boolean {
  return /\.mp4\.mp4$/i.test(file);
}

function heroPath(file: string): string {
  return `/media/heroes/${file}`;
}

export function heroStem(file: string): string {
  return file
    .toLowerCase()
    .replace(/(\.mp4)+$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sharedPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i += 1;
  return i;
}

/** How well one filename names this niche. Welcome and coastal films stay out. */
export function scoreHeroFile(file: string, niche: ShopNiche): number {
  const stem = heroStem(file);
  if (!stem || SKIP.test(stem)) return 0;
  if (NICHE_PRIORITY[niche] === file) return 220;
  if (niche !== "trade" && /\b(fallback|universals?)\b/.test(stem)) return 0;
  let best = 0;
  for (const phrase of NICHE_PHRASES[niche]) {
    const p = phrase.toLowerCase();
    if (stem === p) best = Math.max(best, 180);
    else if (stem.includes(p)) best = Math.max(best, 100 + p.length);
    else {
      for (const word of stem.split(" ")) {
        if (FILLER.has(word)) continue;
        for (const pw of p.split(" ")) {
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
 */
function preferFile(candidate: string, incumbent: string, score: number, bestScore: number): boolean {
  if (score > bestScore) return true;
  if (score === 0 || score !== bestScore || !incumbent) return false;
  const sameStem = heroStem(candidate) === heroStem(incumbent);
  if (sameStem && doubledMp4(incumbent) && !doubledMp4(candidate)) return true;
  if (sameStem && doubledMp4(candidate) && !doubledMp4(incumbent)) return false;
  return candidate.length < incumbent.length;
}

export function resolveNicheFilm(niche: ShopNiche, curatedVideo = ""): string {
  const priority = NICHE_PRIORITY[niche];
  if (priority && onDisk(priority)) return heroPath(priority);
  let best = "";
  let bestScore = 0;
  for (const file of HERO_MP4_FILES) {
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

function wordRoot(word: string): string {
  return word.replace(/(ing|ers|er|es|ed|s)$/i, "");
}

function wordsAgree(word: string, token: string): boolean {
  if (word === token) return word.length >= 3;
  if (word.length < 4 || token.length < 4) return false;
  const a = wordRoot(word);
  const b = wordRoot(token);
  return a.length >= 4 && a === b;
}

function tokensJoin(tokens: string[], word: string): boolean {
  for (let i = 0; i < tokens.length; i += 1) {
    let joined = "";
    for (let j = i; j < tokens.length && joined.length < word.length; j += 1) {
      joined += tokens[j];
      if (joined === word) return true;
    }
  }
  return false;
}

function scoreText(hay: string, file: string): number {
  const stem = heroStem(file);
  if (!stem || SKIP.test(stem) || /\b(fallback|universals?)\b/.test(stem)) return 0;
  const tokens = hay.split(/[^a-z0-9]+/).filter(Boolean);
  let score = 0;
  for (const word of stem.split(" ")) {
    if (FILLER.has(word) || word.length < 3) continue;
    if (tokens.some((token) => wordsAgree(word, token))) score += 80 + word.length;
    else if (word.length >= 5 && tokensJoin(tokens, word)) score += 110;
  }
  if (score > 0 && /\b(hero|master)\b/.test(stem)) score += 16;
  return score;
}

/**
 * A business title can pick a tighter film than the niche default.
 * "Main Street Plumbing" plays the plumber film. "Rogue HVAC" stays on the contractor film.
 */
export function filmMatchingText(text: string, current = ""): string | null {
  const hay = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (hay.length < 3) return null;
  for (const rule of TEXT_PRIORITY) {
    if (!rule.pattern.test(hay) || !onDisk(rule.file)) continue;
    const url = heroPath(rule.file);
    return url === current ? null : url;
  }
  let best = "";
  let bestScore = 0;
  for (const file of HERO_MP4_FILES) {
    const score = scoreText(hay, file);
    const heroBias =
      score + 12 >= bestScore &&
      score >= 90 &&
      /\b(hero|master)\b/.test(heroStem(file)) &&
      best &&
      !/\b(hero|master)\b/.test(heroStem(best));
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

/** A niche entry may name one film or a rotation. Empty and repeated URLs drop out. */
export function heroVideoList(value: string | readonly string[] | null | undefined): string[] {
  const source = typeof value === "string" ? [value] : value;
  if (!source) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of source) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Next reel after `onEnded`. A single film stays put. */
export function nextReelIndex(index: number, count: number): number {
  if (count <= 1) return 0;
  const current = Number.isFinite(index) ? Math.trunc(index) : 0;
  return (current + count + 1) % count;
}

export function isCatalogHeroUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("/media/heroes/")) return false;
  const file = url.slice("/media/heroes/".length);
  return (HERO_MP4_FILES as readonly string[]).includes(file);
}

export type CatalogChoice = { url: string; label: string; score: number };

/** Films an admin can pin on this niche, best match first. */
export function catalogChoices(niche: ShopNiche): CatalogChoice[] {
  const ranked = HERO_MP4_FILES.map((file) => ({
    url: `/media/heroes/${file}`,
    label: heroStem(file),
    score: scoreHeroFile(file, niche),
  }))
    .filter((row) => row.score >= 70)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  if (niche === "contractor") {
    const plumber = filmMatchingText("plumbing", ranked[0]?.url ?? "");
    if (plumber && !ranked.some((row) => row.url === plumber)) {
      ranked.push({ url: plumber, label: heroStem(plumber.split("/").pop() ?? plumber), score: 60 });
    }
  }
  if (!ranked.some((row) => row.url === UNIVERSAL_FALLBACK)) {
    ranked.push({ url: UNIVERSAL_FALLBACK, label: "universal fallback", score: 0 });
  }
  return ranked.slice(0, 8);
}

export function readMasterTelemetry(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(MASTER_TELEMETRY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((line): line is string => typeof line === "string")
      .map((line) => line.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export function writeMasterTelemetry(lines: readonly string[]) {
  if (typeof localStorage === "undefined") return;
  const clean = lines
    .filter((line) => typeof line === "string")
    .map((line) => line.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 3);
  localStorage.setItem(MASTER_TELEMETRY_KEY, JSON.stringify(clean));
}

/** Browser-only niche film pins from the master desk. Shop uploads still win. */
export function readNicheOverrides(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(NICHE_FILM_KEY) || "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, string> = {};
    for (const [niche, url] of Object.entries(raw)) {
      if (typeof url === "string" && isCatalogHeroUrl(url)) out[niche] = url;
    }
    return out;
  } catch {
    return {};
  }
}

export function readNicheFilmOverride(niche: string): string {
  return readNicheOverrides()[niche] ?? "";
}

/**
 * A browser niche pick replaces only the matched niche film.
 * A shop upload or a tenant pin keeps the URL it already resolved to.
 */
export function applyBrowserFilmOverride(
  heroVideoUrl: string | readonly string[] | null,
  nicheFilm: string,
  override: string,
): string | readonly string[] | null {
  const list = heroVideoList(heroVideoUrl);
  const primary = list[0] ?? null;
  if (override && primary && primary === nicheFilm) return override;
  if (list.length > 1) return list;
  return primary;
}

/** Saved master-desk lines, then GPU, frame rate, link, and engine. */
export function heroTelemetryOrder(masterLines: readonly string[]): string[] {
  const saved = masterLines
    .map((line) => line.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 3);
  return [...saved, ...BROWSER_LOG_ORDER];
}

export function writeNicheFilmOverride(niche: string, url: string) {
  if (typeof localStorage === "undefined") return;
  const current = readNicheOverrides();
  if (!url || url === "default") delete current[niche];
  else if (isCatalogHeroUrl(url)) current[niche] = url;
  localStorage.setItem(NICHE_FILM_KEY, JSON.stringify(current));
}
