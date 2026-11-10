import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "_temp_caude_build/aether-propulsion-site/styles.css"),
  "utf8",
);
const SCOPE = ".aether-root";

function skipWsComment(s, i) {
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }
    if (s[i] === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      i = end < 0 ? s.length : end + 2;
      continue;
    }
    break;
  }
  return i;
}

function readBlock(s, i) {
  // i points at '{'
  let depth = 0;
  const start = i;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < s.length && s[i] !== q) {
        if (s[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      i = end < 0 ? s.length : end + 1;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { block: s.slice(start, i + 1), end: i + 1 };
    }
  }
  return { block: s.slice(start), end: s.length };
}

function prefixSelectorList(selectors) {
  return selectors
    .split(",")
    .map((raw) => {
      let sel = raw.trim();
      if (!sel) return sel;
      if (sel.startsWith(SCOPE)) return sel;
      // Promote document-level selectors onto the React mount root.
      sel = sel
        .replace(/^:root\b/, SCOPE)
        .replace(/^html\b/, SCOPE)
        .replace(/^body\b/, SCOPE);
      if (sel.startsWith(SCOPE)) return sel;
      if (sel.includes(SCOPE)) return sel;
      return `${SCOPE} ${sel}`;
    })
    .join(", ");
}

function transform(css, { keyframes = false } = {}) {
  let i = 0;
  let out = "";
  while (i < css.length) {
    const from = i;
    i = skipWsComment(css, i);
    out += css.slice(from, i);
    if (i >= css.length) break;

    if (css.startsWith("@import", i)) {
      const semi = css.indexOf(";", i);
      out += css.slice(i, semi + 1);
      i = semi + 1;
      continue;
    }

    if (css[i] === "@") {
      const nameMatch = css.slice(i).match(/^@([a-zA-Z-]+)/);
      const name = nameMatch?.[1]?.toLowerCase() ?? "";
      let j = i + 1 + name.length;
      j = skipWsComment(css, j);

      if (name === "keyframes" || name === "font-face" || name === "property" || name === "charset") {
        // copy prelude + block untouched
        while (j < css.length && css[j] !== "{") j++;
        const { block, end } = readBlock(css, j);
        out += css.slice(i, end);
        i = end;
        continue;
      }

      if (name === "media" || name === "supports") {
        while (j < css.length && css[j] !== "{") j++;
        const prelude = css.slice(i, j);
        const { block, end } = readBlock(css, j);
        const inner = block.slice(1, -1);
        out += `${prelude}{${transform(inner)}}`;
        i = end;
        continue;
      }

      // unknown at-rule: copy through
      while (j < css.length && css[j] !== "{" && css[j] !== ";") j++;
      if (css[j] === ";") {
        out += css.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      const { end } = readBlock(css, j);
      out += css.slice(i, end);
      i = end;
      continue;
    }

    // regular rule
    let j = i;
    while (j < css.length && css[j] !== "{") j++;
    if (j >= css.length) {
      out += css.slice(i);
      break;
    }
    const selector = css.slice(i, j).trim();
    const { block, end } = readBlock(css, j);
    if (keyframes) {
      out += selector + block;
    } else {
      out += prefixSelectorList(selector) + block;
    }
    i = end;
  }
  return out;
}

const header = `/* Aether Dynamics — scoped under ${SCOPE} */
@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap");

`;
const scoped = transform(src);

// Ensure shell layout on the root itself
const shell = `
${SCOPE} {
  min-height: 100vh;
  color-scheme: dark;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  text-rendering: optimizeLegibility;
}
${SCOPE}.is-booting .boot { opacity: 1; pointer-events: auto; }
`;

const out = header + scoped + shell;
const dest = join(root, "src/components/aether/aether.css");
writeFileSync(dest, out);
console.log("wrote", dest, "bytes", out.length);

// sanity: count bare top-level `a {` etc.
const bare = out.split("\n").filter((l) => /^(a |button|#stage|\.btn)/.test(l.trim()));
console.log("bare_leaks", bare.length, bare.slice(0, 5));
