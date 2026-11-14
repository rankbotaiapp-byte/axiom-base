import fs from "fs";
import path from "path";

const rawPath = path.join(
  process.cwd(),
  "src/components/abyssal/abyssalScene.raw.js",
);
const outPath = path.join(process.cwd(), "src/components/abyssal/abyssalScene.ts");

let s = fs.readFileSync(rawPath, "utf8");
s = s.replace(
  /^\/\* =+[\s\S]*?\*\/\s*\(\(\) => \{\s*'use strict';\s*/,
  "",
);
s = s.replace(
  /\s*if \(document\.readyState === 'loading'\)[\s\S]*?\}\)\(\);\s*$/,
  "",
);

const header = `// @ts-nocheck
/** Abyssal Sanctuary scene — mount on a React-owned root; returns dispose. */
export function mountAbyssal(root) {
  'use strict';

  const q = (id) => root.querySelector('#' + id);
  const abort = new AbortController();
  const signal = abort.signal;
  const on = (target, type, fn, opts = {}) => {
    if (!target) return;
    target.addEventListener(type, fn, { passive: true, ...opts, signal });
  };

  let rafId = 0;
  let resizeTimer;
  let resizeObserver = null;
  let disposed = false;

`;

const footer = `
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    cancelAnimationFrame(rafId);
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeObserver?.disconnect();
    document.body.style.cursor = '';
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) { /* ignore */ }
    if (GLR.ok && GLR.gl) {
      try {
        const ext = GLR.gl.getExtension('WEBGL_lose_context');
        ext?.loseContext();
      } catch (e) { /* ignore */ }
      GLR.ok = false;
    }
    delete window.Abyss;
  }

  boot();
  return dispose;
}
`;

s = s.replace(
  "const host = document.getElementById('ocean');",
  "const host = q('ocean');",
);
s = s.replace(
  "const video = document.getElementById('feed');",
  "const video = q('feed');",
);
s = s.replace(
  "const glc = document.getElementById('ocean-gl');",
  "const glc = q('ocean-gl');",
);
s = s.replace(
  "const hud = document.getElementById('ocean-hud');",
  "const hud = q('ocean-hud');",
);
s = s.replace(
  "const hx = hud.getContext('2d');",
  "if (!host || !video || !glc || !hud) return () => {};\n  const hx = hud.getContext('2d');",
);
s = s.replaceAll("document.getElementById('contact-list')", "q('contact-list')");
s = s.replaceAll("document.getElementById('contacts-n')", "q('contacts-n')");
s = s.replaceAll("document.getElementById('g-depth')", "q('g-depth')");
s = s.replaceAll("document.getElementById('g-temp')", "q('g-temp')");
s = s.replaceAll("document.getElementById('feed-tc')", "q('feed-tc')");

s = s.replace(
  "const $ = (id) => document.getElementById(id);",
  "const el = (id) => q(id);",
);
for (const id of [
  "nav-toggle",
  "nav-links",
  "t-sound",
  "t-trail",
  "t-quality",
  "t-quality-l",
  "hud-bearing",
  "book-form",
  "book-out",
  "f-date",
  "f-dive",
  "f-divers",
]) {
  s = s.replaceAll(`$('${id}')`, `el('${id}')`);
}

s = s.replace(
  "if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', (e) => { S.reduced = e.matches; });",
  "on(reducedMQ, 'change', (e) => { S.reduced = e.matches; });",
);
s = s.replace(
  "glc.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fallback2D(); }, false);",
  "on(glc, 'webglcontextlost', (e) => { e.preventDefault(); fallback2D(); }, { passive: false });",
);

s = s.replaceAll("window.addEventListener('pointerdown',", "on(window, 'pointerdown',");
s = s.replaceAll("window.addEventListener('pointermove',", "on(window, 'pointermove',");
s = s.replaceAll("window.addEventListener('touchmove',", "on(window, 'touchmove',");
s = s.replaceAll("window.addEventListener('pointerup',", "on(window, 'pointerup',");
s = s.replaceAll("window.addEventListener('pointercancel',", "on(window, 'pointercancel',");
s = s.replaceAll("document.addEventListener('pointerleave',", "on(document, 'pointerleave',");
s = s.replaceAll("window.addEventListener('blur',", "on(window, 'blur',");

s = s.replace(
  "video.addEventListener('error', () => { q('feed-tc').textContent = 'NO SIGNAL'; });",
  "on(video, 'error', () => { const tc = q('feed-tc'); if (tc) tc.textContent = 'NO SIGNAL'; });",
);
s = s.replace(
  "if (typeof ResizeObserver === 'function') new ResizeObserver(() => { clearTimeout(boot.rt); boot.rt = setTimeout(() => resize(false), 120); }).observe(host);",
  "if (typeof ResizeObserver === 'function') { resizeObserver = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => resize(false), 120); }); resizeObserver.observe(host); }",
);
s = s.replace(
  "window.addEventListener('resize', () => { clearTimeout(boot.rt); boot.rt = setTimeout(() => resize(false), 120); });",
  "on(window, 'resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => resize(false), 120); });",
);
s = s.replace(
  "document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden && video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } });",
  "on(document, 'visibilitychange', () => { last = 0; if (!document.hidden && video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } });",
);

s = s.replace(
  "function frame(now) {\n    requestAnimationFrame(frame);",
  "function frame(now) {\n    if (disposed) return;\n    rafId = requestAnimationFrame(frame);",
);
s = s.replace(
  "requestAnimationFrame(frame);\n    window.Abyss",
  "rafId = requestAnimationFrame(frame);\n    window.Abyss",
);

fs.writeFileSync(outPath, header + s + footer);
console.log("Wrote", outPath);
