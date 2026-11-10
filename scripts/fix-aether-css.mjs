import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const temp = join(root, "_temp_caude_build/aether-propulsion-site");
const components = join(root, "src/components/aether");
const publicDir = join(root, "public/assets/aether");

mkdirSync(components, { recursive: true });
mkdirSync(publicDir, { recursive: true });
copyFileSync(join(temp, "poster.jpg"), join(publicDir, "poster.jpg"));
copyFileSync(join(temp, "propulsion.mp4"), join(publicDir, "propulsion.mp4"));

let css = readFileSync(join(temp, "styles.css"), "utf8");
css = css
  .replace(/^:root\s*\{/m, ".aether-root {")
  .replace(/^html\s*\{/m, ".aether-root {")
  .replace(/^body\s*\{/m, ".aether-root {")
  .replace(/body\.is-/g, ".aether-root.is-")
  .replace(/body:not\(/g, ".aether-root:not(")
  .replace(
    /^\*, \*::before, \*::after \{ box-sizing: border-box; margin: 0; padding: 0; \}\s*/m,
    ".aether-root *, .aether-root *::before, .aether-root *::after { box-sizing: border-box; }\n",
  );

writeFileSync(
  join(components, "aether.css"),
  `/* Aether Dynamics — scoped under .aether-root */
@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap");

${css}
`,
);

let eng = readFileSync(join(temp, "main.js"), "utf8");
eng = eng.replace(
  `const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);`,
  `import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AETHER_POSTER = "/assets/aether/poster.jpg";
const AETHER_VIDEO = "/assets/aether/propulsion.mp4";`,
);
eng = eng.replace(
  `const video = $('#engineVideo');
const igniteBtn = $('#ignite');`,
  `const video = /** @type {HTMLVideoElement} */ ($('#engineVideo'));
if (video) {
  video.src = AETHER_VIDEO;
  video.setAttribute('poster', AETHER_POSTER);
}
const igniteBtn = $('#ignite');`,
);
eng = eng.replace(
  `const posterTex = new THREE.TextureLoader().load('poster.jpg');`,
  `const posterTex = new THREE.TextureLoader().load(AETHER_POSTER);`,
);
eng = eng.replace(/document\.body/g, `(document.querySelector('.aether-root') || document.body)`);

// Stop auto-boot; export mount for React.
eng = eng.replace(/\nboot\(\);\n/, "\n");
eng = eng.replace(
  /window\.addEventListener\('pagehide', \(e\) => \{[\s\S]*?\}\);\s*$/,
  `export function mountAether() {
  void boot();
  const onHide = (e) => {
    if (e.persisted) return;
    if (stage) stage.teardown();
    audio.dispose();
    listeners.abort();
    ScrollTrigger.getAll().forEach((st) => st.kill());
    window.removeEventListener('pagehide', onHide);
  };
  window.addEventListener('pagehide', onHide);
  return () => onHide({ persisted: false });
}
`,
);

writeFileSync(join(components, "engine.js"), eng);
writeFileSync(
  join(components, "assets.ts"),
  `/** Public URLs for the Aether propulsion media pack. */
export const AETHER_ASSETS = {
  video: "/assets/aether/propulsion.mp4",
  poster: "/assets/aether/poster.jpg",
} as const;
`,
);

console.log("fixed", {
  css: readFileSync(join(components, "aether.css"), "utf8").length,
  engine: eng.length,
});
