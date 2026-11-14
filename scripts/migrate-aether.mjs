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
  .replace(/^html\s*\{/m, ".aether-root {")
  .replace(/^body\s*\{/m, ".aether-root {")
  .replace(/body\.is-/g, ".aether-root.is-")
  .replace(
    /^\*, \*::before, \*::after \{ box-sizing: border-box; margin: 0; padding: 0; \}\s*/m,
    ".aether-root *, .aether-root *::before, .aether-root *::after { box-sizing: border-box; }\n",
  );
css = `/* Aether Dynamics — scoped under .aether-root */
@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap");

${css}`;
writeFileSync(join(components, "aether.css"), css);

writeFileSync(
  join(components, "assets.ts"),
  `/** Public URLs for the Aether propulsion media pack. */
export const AETHER_ASSETS = {
  video: "/assets/aether/propulsion.mp4",
  poster: "/assets/aether/poster.jpg",
} as const;
`,
);

let js = readFileSync(join(temp, "main.js"), "utf8");

// Drop the auto-boot footer; React mounts via mountAether().
js = js.replace(/\n\/\* -+\n\s+Cleanup[\s\S]*$/, "\n");

js = js.replace(
  `const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);`,
  `import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** @type {HTMLElement} */
let root;
/** @type {{ video: string; poster: string }} */
let assets;`,
);

js = js.replace(
  `const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));`,
  `const $ = (sel, base = root) => base.querySelector(sel);
const $$ = (sel, base = root) => Array.from(base.querySelectorAll(sel));`,
);

js = js.replace(
  `const video = $('#engineVideo');
const igniteBtn = $('#ignite');`,
  `/** @type {HTMLVideoElement} */
let video;
/** @type {HTMLButtonElement} */
let igniteBtn;`,
);

// Defer HUD/form bindings that run at module load — they need the mounted root.
const deferredBlocks = [
  ["const audio = new AudioReactor(video);", "let audio;"],
  ["const audioBtn = $('#audioToggle');", "let audioBtn;"],
  ["const hero = $('.hero');", "let hero;"],
  [
    `const hud = {
  thrust: $('#thrustVal'),
  ring: $('#thrustRing'),
  vector: $('#vectorVal'),
  coreTemp: $('#coreTemp'),
  coreState: $('#coreState'),
  plasma: $('#plasmaVal'),
  segs: $('#plasmaSegs'),
  xenon: $('#xenonVal'),
  meter: $('#audioMeter'),
  audioState: $('#audioState'),
  fps: $('#fpsVal'),
  lat: $('#latVal'),
  tier: $('#hudTier'),
  roCam: $('#roCam'),
  roZoom: $('#roZoom'),
  roScroll: $('#roScroll'),
};

const SEG_COUNT = 14;
for (let i = 0; i < SEG_COUNT; i++) hud.segs.appendChild(document.createElement('i'));
const segEls = Array.from(hud.segs.children);
const METER_COUNT = 10;
for (let i = 0; i < METER_COUNT; i++) hud.meter.appendChild(document.createElement('i'));
const meterEls = Array.from(hud.meter.children);
const RING_C = 2 * Math.PI * 26;`,
    `let hud;
let segEls;
let meterEls;
const SEG_COUNT = 14;
const METER_COUNT = 10;
const RING_C = 2 * Math.PI * 26;`,
  ],
  ["const form = $('#briefForm');", "let form;"],
  ["const formStatus = $('#formStatus');", "let formStatus;"],
  ["const ctaPrimary = $('#ctaPrimary');", "let ctaPrimary;"],
  ["const bootBar = $('#bootBar');", "let bootBar;"],
];

for (const [from, to] of deferredBlocks) {
  if (!js.includes(from)) {
    console.warn("missing block", from.slice(0, 60));
  } else {
    js = js.replace(from, to);
  }
}

js = js.replace(/document\.body\.classList\.add\('is-fallback'\)/g, "root.classList.add('is-fallback')");
js = js.replace(/document\.body\.classList\.remove\('is-booting'\)/g, "root.classList.remove('is-booting')");
js = js.replace(/document\.body\.dataset\.tier = state\.tier;/g, "root.dataset.tier = state.tier;");
js = js.replace(
  /document\.documentElement\.style\.setProperty\('--pulse'/g,
  "root.style.setProperty('--pulse'",
);
js = js.replace(
  `function fallbackParallax() {
  const root = document.documentElement;
  const cur = { x: 0, y: 0 };`,
  `function fallbackParallax() {
  const cur = { x: 0, y: 0 };`,
);
js = js.replace(
  `const posterTex = new THREE.TextureLoader().load('poster.jpg');`,
  `const posterTex = new THREE.TextureLoader().load(assets.poster);`,
);
js = js.replace(`$('#year').textContent = new Date().getFullYear();`, `if ($('#year')) $('#year').textContent = String(new Date().getFullYear());`);

// Remove auto-boot call; mountAether will call it.
js = js.replace(/\nboot\(\);\n/, "\n");

js += `

function bindChrome() {
  video = /** @type {HTMLVideoElement} */ ($("#engineVideo"));
  igniteBtn = /** @type {HTMLButtonElement} */ ($("#ignite"));
  audio = new AudioReactor(video);
  audioBtn = $("#audioToggle");
  hero = $(".hero");
  ctaPrimary = $("#ctaPrimary");
  form = $("#briefForm");
  formStatus = $("#formStatus");
  bootBar = $("#bootBar");

  hud = {
    thrust: $("#thrustVal"),
    ring: $("#thrustRing"),
    vector: $("#vectorVal"),
    coreTemp: $("#coreTemp"),
    coreState: $("#coreState"),
    plasma: $("#plasmaVal"),
    segs: $("#plasmaSegs"),
    xenon: $("#xenonVal"),
    meter: $("#audioMeter"),
    audioState: $("#audioState"),
    fps: $("#fpsVal"),
    lat: $("#latVal"),
    tier: $("#hudTier"),
    roCam: $("#roCam"),
    roZoom: $("#roZoom"),
    roScroll: $("#roScroll"),
  };
  for (let i = 0; i < SEG_COUNT; i++) hud.segs.appendChild(document.createElement("i"));
  segEls = Array.from(hud.segs.children);
  for (let i = 0; i < METER_COUNT; i++) hud.meter.appendChild(document.createElement("i"));
  meterEls = Array.from(hud.meter.children);

  on(igniteBtn, "click", () => {
    playVideo();
    igniteBtn.hidden = true;
  });
  on(audioBtn, "click", async () => {
    if (audio.enabled) {
      audio.disable();
      audioBtn.setAttribute("aria-pressed", "false");
      $(".audio-label", audioBtn).textContent = "AUDIO OFF";
    } else {
      const ok = await audio.enable();
      if (!ok) return;
      audioBtn.setAttribute("aria-pressed", "true");
      $(".audio-label", audioBtn).textContent = "AUDIO ON";
      gsap.fromTo(state, { boost: 1.2 }, { boost: 0, duration: 1.6, ease: "power3.out" });
    }
  });
  on(ctaPrimary, "mouseenter", () => gsap.to(state, { boost: 1, duration: 0.8, ease: "power2.out" }));
  on(ctaPrimary, "mouseleave", () => gsap.to(state, { boost: 0, duration: 1.2, ease: "power2.inOut" }));

  on(
    form,
    "submit",
    async (e) => {
      e.preventDefault();
      formStatus.classList.remove("is-error");
      let valid = true;
      $$("input, select", form).forEach((el) => {
        const ok = el.checkValidity();
        el.closest(".field").classList.toggle("is-invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        formStatus.textContent = "CHECK HIGHLIGHTED FIELDS";
        formStatus.classList.add("is-error");
        return;
      }
      const payload = Object.fromEntries(new FormData(form).entries());
      const ref = \`AX-\${Date.now().toString(36).toUpperCase().slice(-6)}\`;
      formStatus.textContent = "TRANSMITTING…";
      gsap.fromTo(state, { boost: 0.8 }, { boost: 0, duration: 2, ease: "power2.out" });
      try {
        if (CONFIG.portalEndpoint) {
          const res = await fetch(CONFIG.portalEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ...payload, ref }),
          });
          if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        }
        formStatus.textContent = \`REQUEST QUEUED · REF \${ref} · EXPECT CONTACT WITHIN 1 BUSINESS DAY\`;
        form.reset();
      } catch {
        formStatus.textContent = "UPLINK FAILED · PLEASE RETRY";
        formStatus.classList.add("is-error");
      }
    },
    { passive: false },
  );
  $$("input, select", form).forEach((el) =>
    on(el, "input", () => el.closest(".field").classList.remove("is-invalid")),
  );
}

/**
 * @param {HTMLElement} mountRoot
 * @param {{ video: string; poster: string }} media
 */
export function mountAether(mountRoot, media) {
  root = mountRoot;
  assets = media;
  root.classList.add("is-booting");
  bindChrome();
  if (video) {
    video.src = assets.video;
    video.setAttribute("poster", assets.poster);
  }
  void boot();
  return function unmount() {
    if (stage) stage.teardown();
    if (audio) audio.dispose();
    listeners.abort();
    ScrollTrigger.getAll().forEach((st) => st.kill());
  };
}
`;

// Remove duplicated listeners that were registered at module scope for audio/cta/form/ignite
// (they now live in bindChrome). Strip the original one-shot registrations.
js = js.replace(
  /on\(igniteBtn, 'click', \(\) => \{ playVideo\(\); igniteBtn\.hidden = true; \}\);\n/,
  "",
);
js = js.replace(
  /on\(audioBtn, 'click', async \(\) => \{[\s\S]*?\}\);\n\n\/\* -+\n\s+Input:/,
  "/* Input:",
);
js = js.replace(
  /const ctaPrimary = \$('#ctaPrimary');\non\(ctaPrimary, 'mouseenter'[\s\S]*?on\(ctaPrimary, 'mouseleave'[\s\S]*?\);\n\n\/\* -+\n\s+HUD/,
  "/* HUD",
);
js = js.replace(
  /\/\* -+\n\s+Briefing form[\s\S]*?\$\$\('input, select', form\)\.forEach\(\(el\) => on\(el, 'input'[\s\S]*?\);\n\n\$\('#year'\)[\s\S]*?\n\n\/\* -+\n\s+Shaders/,
  "/* Shaders",
);

writeFileSync(join(components, "engine.js"), js);
console.log("aether migration complete", {
  css: css.length,
  engine: js.length,
});
