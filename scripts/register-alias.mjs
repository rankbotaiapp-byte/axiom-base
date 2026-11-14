import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const encoded = encodeURIComponent(`
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = ${JSON.stringify(root)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const dest = join(root, "src", specifier.slice(2));
    for (const candidate of [dest, dest + ".ts", dest + ".tsx", dest + ".js", dest + ".mjs"]) {
      if (existsSync(candidate)) {
        return { shortCircuit: true, url: pathToFileURL(candidate).href };
      }
    }
  }
  if (specifier.startsWith(".") && context.parentURL) {
    const fromDir = join(fileURLToPath(context.parentURL), "..");
    const dest = join(fromDir, specifier);
    for (const candidate of [dest, dest + ".ts", dest + ".tsx", dest + ".js", dest + ".mjs"]) {
      if (existsSync(candidate)) {
        return { shortCircuit: true, url: pathToFileURL(candidate).href };
      }
    }
  }
  return nextResolve(specifier, context);
}
`);

register(`data:text/javascript,${encoded}`, pathToFileURL(join(root, "scripts", "register-alias.mjs")));
