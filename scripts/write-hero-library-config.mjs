import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "public/media";

function titleFrom(file) {
  return file
    .replace(/(\.mp4)+$/i, "")
    .replace(/-hero-animation$/i, "")
    .replace(/-hero-path$/i, "")
    .replace(/-loop$/i, "")
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function thumbFor(src) {
  const stem = src.replace(/^\/media\//, "").replace(/(\.mp4)+$/i, "");
  const base = stem.split("/").pop() ?? stem;
  const guesses = [
    `/media/${stem}.jpg`,
    `/media/heroes/${base}.jpg`,
    `/media/heroes/${base.replace(/-hero-animation$/i, "")}.jpg`,
    `/media/${base}.jpg`,
  ];
  for (const guess of guesses) {
    if (existsSync(join("public", guess.replace(/^\//, "")))) return guess;
  }
  return src;
}

function classify(path) {
  const s = path.toLowerCase();
  let collection = "Abstract";
  if (/(apex|auto-tuning|\/auto-hero|^auto-hero)/.test(s)) collection = "Auto";
  else if (
    /(leopard|leapard|otter|shark|polar-bear|tiger|trout|owl|bear-charge|raptor|snowleap|underwater|taxidermy|guide)/.test(
      s,
    )
  ) {
    collection = "Wildlife";
  } else if (/(orb|eye-hero)/.test(s)) collection = "Orbs";

  let category = "Specialty";
  if (/(apex|auto-tuning|\/auto-hero|^auto-hero|gunsmith)/.test(s)) category = "Auto";
  else if (/(plumber|electric|locksmith|otter|cleaner)/.test(s)) category = "Urgent";
  else if (/(leopard|leapard|firewood|infrastructure|boarding|owl)/.test(s)) category = "Residential";
  else if (/(polar-bear|barber|silver-orb|trainer|photog|content-cret|eye-hero|physical)/.test(s)) {
    category = "Personal";
  }
  return { category, collection };
}

function slugId(src) {
  return src
    .replace(/^\/media\//, "")
    .replace(/(\.mp4)+$/i, "")
    .replace(/[\\/]+/g, "-")
    .toLowerCase();
}

const seen = new Set();
const items = [];

function add(src) {
  const path = src.split("?")[0];
  if (seen.has(path)) return;
  if (/\.mp4\.mp4$/i.test(path)) return;
  seen.add(path);
  const file = path.replace(/^\/media\//, "");
  const { category, collection } = classify(file);
  items.push({
    id: slugId(path),
    name: titleFrom(file.split("/").pop() ?? file),
    category,
    collection,
    videoUrl: path,
    thumbnail: thumbFor(path),
  });
}

function walk(dir, prefix) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    const rel = prefix ? `${prefix}/${name.name}` : name.name;
    const unix = rel.replace(/\\/g, "/");
    if (name.isDirectory()) {
      walk(full, unix);
      continue;
    }
    if (!/\.mp4$/i.test(name.name)) continue;
    add(`/media/${unix}`);
  }
}

walk(root, "");
items.sort((a, b) => a.name.localeCompare(b.name) || a.videoUrl.localeCompare(b.videoUrl));

const body = `import { LOOP_TAIL_TRIM_SEC } from "../lib/axiom/loop-trim.ts";

export const HERO_LIBRARY_CATEGORIES = ["Auto", "Urgent", "Residential", "Personal", "Specialty"] as const;
export type HeroLibraryCategory = (typeof HERO_LIBRARY_CATEGORIES)[number];

export const HERO_LIBRARY_COLLECTIONS = ["Auto", "Wildlife", "Orbs", "Abstract"] as const;
export type HeroLibraryCollection = (typeof HERO_LIBRARY_COLLECTIONS)[number];

export type HeroLibraryEntry = {
  id: string;
  name: string;
  category: HeroLibraryCategory;
  collection: HeroLibraryCollection;
  videoUrl: string;
  thumbnail: string;
  loopTailTrimSec: typeof LOOP_TAIL_TRIM_SEC;
};

export const HERO_LIBRARY: readonly HeroLibraryEntry[] = [
${items
  .map(
    (item) =>
      `  { id: ${JSON.stringify(item.id)}, name: ${JSON.stringify(item.name)}, category: ${JSON.stringify(item.category)}, collection: ${JSON.stringify(item.collection)}, videoUrl: ${JSON.stringify(item.videoUrl)}, thumbnail: ${JSON.stringify(item.thumbnail)}, loopTailTrimSec: LOOP_TAIL_TRIM_SEC },`,
  )
  .join("\n")}
];

export function heroLibraryEntryByUrl(url: string | null | undefined): HeroLibraryEntry | undefined {
  if (!url) return undefined;
  const path = url.split("?")[0] ?? "";
  return HERO_LIBRARY.find((item) => item.videoUrl === path);
}
`;

writeFileSync("src/config/HeroLibrary.ts", body);
console.log(`indexed ${items.length} loops`);
