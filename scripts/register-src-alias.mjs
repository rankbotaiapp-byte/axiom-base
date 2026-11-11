import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function candidate(url) {
  if (existsSync(url)) return url;
  if (existsSync(`${url}.ts`)) return `${url}.ts`;
  if (existsSync(`${url}.tsx`)) return `${url}.tsx`;
  if (existsSync(`${url}.mjs`)) return `${url}.mjs`;
  if (existsSync(join(url, "index.ts"))) return join(url, "index.ts");
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const abs = join(root, "src", specifier.slice(2));
    const hit = candidate(abs);
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
