import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "public/media";

function titleFrom(file) {
  return file
    .replace(/(\.mp4)+$/i, "")
    .replace(/-hero-animation$/i, "")
    .replace(/-loop$/i, "")
    .split(/[-_]+/)
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

const items = [];
const seen = new Set();

function add(id, name, src, kind) {
  if (seen.has(src)) return;
  seen.add(src);
  items.push({ id, name, src, thumbnail: thumbFor(src), kind, loopTailTrimSec: 1.75 });
}

add("otter-loop", "Otter", "/media/master-defaults/otter-loop.mp4", "master-default");
add("leopard-loop", "Leopard", "/media/master-defaults/leopard-loop.mp4", "master-default");
add("polar-bear-loop", "Polar bear", "/media/master-defaults/polar-bear-loop.mp4", "master-default");
add("octopus-loop", "Octopus", "/media/master-defaults/octopus-loop.mp4", "master-default");
add("sharks-loop", "Sharks", "/media/master-defaults/sharks-loop.mp4", "master-default");

const animation = /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-(?:animation|path)\.mp4$/i;
for (const file of readdirSync(root)) {
  if (!animation.test(file)) continue;
  add(file.replace(/\.mp4$/i, ""), titleFrom(file), `/media/${file}`, "library");
}

const heroes = join(root, "heroes");
if (existsSync(heroes)) {
  for (const file of readdirSync(heroes)) {
    if (!/hero(?:-animation)?\.mp4$/i.test(file)) continue;
    add(`heroes-${file.replace(/(\.mp4)+$/i, "")}`, titleFrom(file), `/media/heroes/${file}`, "legacy");
  }
}

items.sort((a, b) => a.name.localeCompare(b.name) || a.src.localeCompare(b.src));
writeFileSync("src/assets/HeroLibrary.json", `${JSON.stringify({ loopTailTrimSec: 1.75, items }, null, 2)}\n`);
console.log(`wrote ${items.length} loops`);
