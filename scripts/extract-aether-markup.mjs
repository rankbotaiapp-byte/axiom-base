import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "_temp_caude_build/aether-propulsion-site/index.html"), "utf8");
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
const markup = body
  .replace(/\sclass="is-booting"/, "")
  .replace(
    /src="propulsion\.mp4" poster="poster\.jpg"/,
    'src="/assets/aether/propulsion.mp4" poster="/assets/aether/poster.jpg"',
  )
  .trim();

const out = `/** Auto-extracted from _temp_caude_build/aether-propulsion-site/index.html */
export const AETHER_MARKUP = ${JSON.stringify(markup)};
`;
writeFileSync(join(root, "src/components/aether/markup.ts"), out);
console.log("markup chars", markup.length);
