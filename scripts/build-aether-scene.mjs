import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
let body = readFileSync(join(rootDir, "src/components/aether/engine.js"), "utf8");

// Drop nocheck + banner + imports + register + asset consts — re-added in wrapper
body = body.replace(/^\/\/ @ts-nocheck\r?\n/, "");
const importEnd = body.indexOf("gsap.registerPlugin(ScrollTrigger);");
if (importEnd < 0) throw new Error("registerPlugin not found");
body = body.slice(importEnd + "gsap.registerPlugin(ScrollTrigger);".length);
body = body.replace(/^\s*/, "");
body = body.replace(
  /^const AETHER_POSTER = [^;]+;\r?\nconst AETHER_VIDEO = [^;]+;\r?\n/,
  "",
);

// Scope query helpers
body = body.replace(
  /const \$ = \(sel, root = document\) => root\.querySelector\(sel\);\r?\nconst \$\$ = \(sel, root = document\) => Array\.from\(root\.querySelectorAll\(sel\)\);/,
  "const $ = (sel, base = root) => base.querySelector(sel);\nconst $$ = (sel, base = root) => Array.from(base.querySelectorAll(sel));",
);

// Use injected video element
body = body.replace(
  `const video = /** @type {HTMLVideoElement} */ ($('#engineVideo'));
if (video) {
  video.src = AETHER_VIDEO;
  video.setAttribute('poster', AETHER_POSTER);
}
const igniteBtn = $('#ignite');`,
  `video.src = AETHER_VIDEO;
video.setAttribute('poster', AETHER_POSTER);
const igniteBtn = $('#ignite');`,
);

// Use injected canvas
body = body.replace(
  `  setBoot(0.55);

  const canvas = $('#stage');
  const renderer = new THREE.WebGLRenderer({`,
  `  setBoot(0.55);

  const renderer = new THREE.WebGLRenderer({`,
);

body = body.replaceAll(
  "document.documentElement.style.setProperty('--pulse'",
  "root.style.setProperty('--pulse'",
);
body = body.replaceAll(
  "(document.querySelector('.aether-root') || document.body)",
  "root",
);

// fallbackParallax used documentElement as `root` — rename local
body = body.replace(
  `function fallbackParallax() {
  const root = document.documentElement;
  const cur = { x: 0, y: 0 };
  gsap.ticker.add(() => {
    const k = 1 - Math.pow(0.94, gsap.ticker.deltaRatio());
    cur.x += (state.pointer.nx * -14 - cur.x) * k;
    cur.y += (state.pointer.ny * 10 - state.scrollTarget * 40 - cur.y) * k;
    root.style.setProperty('--fx', \`\${cur.x.toFixed(2)}px\`);
    root.style.setProperty('--fy', \`\${cur.y.toFixed(2)}px\`);
  });
}`,
  `function fallbackParallax() {
  const cur = { x: 0, y: 0 };
  gsap.ticker.add(() => {
    const k = 1 - Math.pow(0.94, gsap.ticker.deltaRatio());
    cur.x += (state.pointer.nx * -14 - cur.x) * k;
    cur.y += (state.pointer.ny * 10 - state.scrollTarget * 40 - cur.y) * k;
    root.style.setProperty('--fx', \`\${cur.x.toFixed(2)}px\`);
    root.style.setProperty('--fy', \`\${cur.y.toFixed(2)}px\`);
  });
}`,
);

// Scope GSAP to root via context for selector strings
body = body.replace(
  `function introUI() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  // clearProps: a leftover inline transform would make the bar a containing block for the fixed mobile nav dock
  tl.from('.topbar', { y: -30, autoAlpha: 0, duration: 1.1, clearProps: 'transform,opacity,visibility' })
    .from('.hero .eyebrow', { x: -20, autoAlpha: 0, duration: 0.9 }, '-=0.7')
    .from('.hero-title .line-inner', { yPercent: 110, duration: 1.2, stagger: 0.09 }, '-=0.7')
    .from('.lede, .cta-row', { y: 20, autoAlpha: 0, duration: 1, stagger: 0.1 }, '-=0.8')
    .from('.hud', { y: 30, autoAlpha: 0, duration: 1.1 }, '-=0.8')
    .from('.hud .widget', { y: 10, autoAlpha: 0, duration: 0.6, stagger: 0.05 }, '-=0.8')
    .from('.frame .corner', { scale: 0.4, autoAlpha: 0, duration: 0.8, stagger: 0.05 }, 0.2)
    .from('.hero-hint', { autoAlpha: 0, duration: 1 }, '-=0.4');
}

function revealOnScroll() {
  gsap.set('.reveal', { y: 34, autoAlpha: 0 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
  $$('.spec').forEach((card) => {
    gsap.from($('.spec-meter i', card), {
      scaleX: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 85%', once: true },
    });
  });
}`,
  `function introUI() {
  gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // clearProps: leftover inline transform would make the bar a containing block for the fixed mobile nav dock
    tl.from('.topbar', { y: -30, autoAlpha: 0, duration: 1.1, clearProps: 'transform,opacity,visibility' })
      .from('.hero .eyebrow', { x: -20, autoAlpha: 0, duration: 0.9 }, '-=0.7')
      .from('.hero-title .line-inner', { yPercent: 110, duration: 1.2, stagger: 0.09 }, '-=0.7')
      .from('.lede, .cta-row', { y: 20, autoAlpha: 0, duration: 1, stagger: 0.1 }, '-=0.8')
      .from('.hud', { y: 30, autoAlpha: 0, duration: 1.1 }, '-=0.8')
      .from('.hud .widget', { y: 10, autoAlpha: 0, duration: 0.6, stagger: 0.05 }, '-=0.8')
      .from('.frame .corner', { scale: 0.4, autoAlpha: 0, duration: 0.8, stagger: 0.05 }, 0.2)
      .from('.hero-hint', { autoAlpha: 0, duration: 1 }, '-=0.4');
  }, root);
}

function revealOnScroll() {
  gsap.context(() => {
    gsap.set('.reveal', { y: 34, autoAlpha: 0 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }),
    });
    $$('.spec').forEach((card) => {
      const meter = $('.spec-meter i', card);
      if (!meter) return;
      gsap.from(meter, {
        scaleX: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      });
    });
  }, root);
}`,
);

// Strip mountAether — replaced by wrapper return
const cleanupIdx = body.indexOf("/* ---------------------------------------------------------\n   Cleanup");
const cleanupIdxCR = body.indexOf("/* ---------------------------------------------------------\r\n   Cleanup");
const cut = cleanupIdx >= 0 ? cleanupIdx : cleanupIdxCR;
if (cut < 0) throw new Error("Cleanup section not found");
body = body.slice(0, cut).trimEnd() + "\n";

const out = `// @ts-nocheck
/* Aether scene — Three.js + GSAP, scoped to React-owned DOM nodes */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AETHER_ASSETS } from "./assets";

gsap.registerPlugin(ScrollTrigger);

const AETHER_POSTER = AETHER_ASSETS.poster;
const AETHER_VIDEO = AETHER_ASSETS.video;

/** Attach the full Aether experience to React refs; returns teardown. */
export function createAetherScene({ root, canvas, video }) {
${body}
  if (listeners.signal.aborted) listeners = new AbortController();
  void boot();
  const onHide = (e) => {
    if (e && e.persisted) return;
    if (stage) {
      stage.teardown();
      stage = null;
    }
    audio.dispose();
    listeners.abort();
    ScrollTrigger.getAll().forEach((st) => st.kill());
    window.removeEventListener("pagehide", onHide);
  };
  window.addEventListener("pagehide", onHide);
  return () => onHide({ persisted: false });
}
`;

writeFileSync(join(rootDir, "src/components/aether/aetherScene.ts"), out);
console.log("ok", out.length);
for (const needle of ["$('#stage')", "engineVideo", "mountAether", "export function createAetherScene", "const canvas ="]) {
  console.log(needle, out.includes(needle));
}
