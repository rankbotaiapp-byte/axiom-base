import { useEffect, useRef } from "react";
import { mixRgb, paletteFromFrame, type Rgb } from "@/lib/axiom/film-palette";

const VERT = `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform vec3 uAccent;
uniform vec3 uCopper;
uniform vec3 uBg;
uniform vec2 uTrail[8];
uniform float uAge[8];
uniform float uVel;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);
  float n = noise(p * 2.2 + vec2(uTime * 0.03, uTime * 0.02));
  float n2 = noise(p * 4.0 - vec2(uTime * 0.02, n));
  float field = 0.0;

  for (int i = 0; i < 8; i++) {
    float age = uAge[i];
    float live = 1.0 - step(3.2, age);
    vec2 tp = vec2(uTrail[i].x * aspect, uTrail[i].y);
    float d = distance(p, tp);
    float ring = sin(d * 46.0 - age * 10.0);
    float bandX = (d - age * 0.11) * 16.0;
    float band = exp(-(bandX * bandX));
    float fade = exp(-age * 1.25) * exp(-d * 2.4);
    field += ring * band * fade * live;
  }

  vec2 cursor = vec2(uPointer.x * aspect, uPointer.y);
  float glow = exp(-distance(p, cursor) * 3.4);
  vec3 color = uBg;
  color += uAccent * (0.05 + n2 * 0.08);
  color += uCopper * (n2 - 0.5) * 0.06;
  color += uAccent * field * 0.22;
  color += mix(uAccent, uCopper, 0.35) * glow * 0.18;
  color += uAccent * uVel * 0.22;
  float vig = smoothstep(0.15, 0.95, length(uv - 0.5));
  color = mix(color, uBg, vig * 0.55);
  outColor = vec4(color, 1.0);
}
`;

const ACCENT: [number, number, number] = [0.18, 0.902, 0.839];
const COPPER: [number, number, number] = [0.906, 0.706, 0.541];
const BG: [number, number, number] = [0.0196, 0.0196, 0.0275];
const TRAIL = 8;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function hexToRgb(raw: string): [number, number, number] | null {
  const hex = raw.trim().replace("#", "");
  if (hex.length !== 6) return null;
  const n = Number.parseInt(hex, 16);
  if (!Number.isFinite(n)) return null;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readAccent(): [number, number, number] {
  const host = document.querySelector<HTMLElement>("[data-neon]");
  const raw = host ? getComputedStyle(host).getPropertyValue("--neon") : "";
  return hexToRgb(raw) ?? ACCENT;
}

const HERO_FILM = "/media/heroes/auto-hero.mp4";

function heroFilm(): HTMLVideoElement | null {
  const marked = document.querySelector<HTMLVideoElement>('video[data-film="auto-hero"]');
  if (marked && marked.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && marked.videoWidth >= 2) {
    return marked;
  }
  const nodes = document.querySelectorAll("video");
  for (const node of nodes) {
    if (!(node instanceof HTMLVideoElement)) continue;
    const src = node.currentSrc || node.src;
    if (!src.includes(HERO_FILM)) continue;
    if (node.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || node.videoWidth < 2) continue;
    return node;
  }
  return null;
}

function sampleHeroFilm(
  video: HTMLVideoElement,
  sample: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { accent: Rgb; copper: Rgb } | null {
  try {
    const w = sample.width;
    const h = sample.height;
    ctx.drawImage(video, 0, 0, w, h);
    return paletteFromFrame(ctx.getImageData(0, 0, w, h).data);
  } catch {
    return null;
  }
}

/** Buffer scale for the fluid canvas. Hard ceiling is 2 so 3x/4x phones do not oversample. */
function drawingPixelRatio() {
  const capped = Math.min(window.devicePixelRatio || 1, 2);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse ? Math.min(capped, 1) : capped;
}

const GL_ATTRS = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
} as const;

export function FluidField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const contextAttrs: WebGLContextAttributes = {
      ...GL_ATTRS,
      powerPreference: coarse ? "low-power" : "high-performance",
      failIfMajorPerformanceCaveat: coarse,
    };

    type Gpu = {
      gl: WebGL2RenderingContext;
      program: WebGLProgram;
      buffer: WebGLBuffer;
      uRes: WebGLUniformLocation | null;
      uTime: WebGLUniformLocation | null;
      uPointer: WebGLUniformLocation | null;
      uAccent: WebGLUniformLocation | null;
      uCopper: WebGLUniformLocation | null;
      uBg: WebGLUniformLocation | null;
      uTrail: WebGLUniformLocation | null;
      uAge: WebGLUniformLocation | null;
      uVel: WebGLUniformLocation | null;
    };

    const acquire = (): Gpu | null => {
      let gl: WebGL2RenderingContext | null = null;
      try {
        gl = canvas.getContext("webgl2", contextAttrs);
      } catch {
        gl = null;
      }
      if (!gl || gl.isContextLost()) return null;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      const program = gl.createProgram();
      if (!vs || !fs || !program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
      const buffer = gl.createBuffer();
      if (!buffer) return null;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      return {
        gl,
        program,
        buffer,
        uRes: gl.getUniformLocation(program, "uRes"),
        uTime: gl.getUniformLocation(program, "uTime"),
        uPointer: gl.getUniformLocation(program, "uPointer"),
        uAccent: gl.getUniformLocation(program, "uAccent"),
        uCopper: gl.getUniformLocation(program, "uCopper"),
        uBg: gl.getUniformLocation(program, "uBg"),
        uTrail: gl.getUniformLocation(program, "uTrail[0]"),
        uAge: gl.getUniformLocation(program, "uAge[0]"),
        uVel: gl.getUniformLocation(program, "uVel"),
      };
    };

    let gpu = acquire();
    if (!gpu) {
      document.documentElement.classList.add("fluid-off");
      return () => document.documentElement.classList.remove("fluid-off");
    }
    document.documentElement.classList.remove("fluid-off");

    const trail = new Float32Array(TRAIL * 2);
    const age = new Float32Array(TRAIL);
    for (let i = 0; i < TRAIL; i++) {
      trail[i * 2] = 0.5;
      trail[i * 2 + 1] = 0.42;
      age[i] = 8;
    }

    let slot = 0;
    let pointerX = 0.5;
    let pointerY = 0.42;
    let steered = false;
    let accent: Rgb = readAccent();
    let copper: Rgb = COPPER;
    let lastPush = 0;
    let last = performance.now();
    let raf = 0;
    let frameCount = 0;
    let dead = false;
    let lost = false;
    let vel = 0;
    let lastScroll = window.scrollY;
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 18;
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });

    const bind = () => {
      if (!gpu || gpu.gl.isContextLost()) return;
      gpu.gl.useProgram(gpu.program);
      gpu.gl.bindBuffer(gpu.gl.ARRAY_BUFFER, gpu.buffer);
      gpu.gl.enableVertexAttribArray(0);
      gpu.gl.vertexAttribPointer(0, 2, gpu.gl.FLOAT, false, 0, 0);
    };

    const resize = () => {
      if (!gpu || gpu.gl.isContextLost()) return;
      const dpr = drawingPixelRatio();
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const w = Math.max(1, Math.floor(cssW * dpr));
      const h = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // Changing the drawing-buffer size resets WebGL state.
        bind();
      }
      gpu.gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      if (!gpu || gpu.gl.isContextLost()) return;
      const { gl } = gpu;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let i = 0; i < TRAIL; i++) age[i] += dt;
      if (!steered) {
        pointerX = 0.5 + Math.sin(now * 0.00015) * 0.06;
        pointerY = 0.42 + Math.cos(now * 0.00011) * 0.04;
      }
      frameCount += 1;
      if (sampleCtx && frameCount % 6 === 0) pullFilm();
      vel *= 0.9;
      gl.uniform2f(gpu.uRes, canvas.width, canvas.height);
      gl.uniform1f(gpu.uTime, now * 0.001);
      gl.uniform2f(gpu.uPointer, pointerX, pointerY);
      gl.uniform3f(gpu.uAccent, accent[0], accent[1], accent[2]);
      gl.uniform3f(gpu.uCopper, copper[0], copper[1], copper[2]);
      gl.uniform3f(gpu.uBg, BG[0], BG[1], BG[2]);
      gl.uniform2fv(gpu.uTrail, trail);
      gl.uniform1fv(gpu.uAge, age);
      if (gpu.uVel) gl.uniform1f(gpu.uVel, vel);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const pullFilm = () => {
      if (!sampleCtx) return false;
      const film = heroFilm();
      const next = film ? sampleHeroFilm(film, sample, sampleCtx) : null;
      if (!next) {
        if (!film && frameCount % 120 === 0) {
          accent = readAccent();
          copper = COPPER;
        }
        return false;
      }
      accent = mixRgb(accent, next.accent, 0.35);
      copper = mixRgb(copper, next.copper, 0.35);
      canvas.dataset.ripple = `${accent[0].toFixed(3)},${accent[1].toFixed(3)},${accent[2].toFixed(3)}`;
      return true;
    };

    const halt = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const frame = (now: number) => {
      if (dead) return;
      raf = 0;
      if (lost || !gpu || gpu.gl.isContextLost() || document.visibilityState !== "visible") return;
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const pump = () => {
      if (dead || lost || reduced.matches || document.visibilityState !== "visible" || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      const y = window.scrollY;
      vel = Math.min(1, Math.abs(y - lastScroll) / 48);
      lastScroll = y;
    };

    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth);
      pointerY = 1 - event.clientY / Math.max(1, window.innerHeight);
      steered = true;
      const now = performance.now();
      if (now - lastPush < 36) return;
      lastPush = now;
      trail[slot * 2] = pointerX;
      trail[slot * 2 + 1] = pointerY;
      age[slot] = 0;
      slot = (slot + 1) % TRAIL;
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        halt();
        return;
      }
      pump();
    };
    const onPageHide = () => halt();
    const onPageShow = () => pump();
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      halt();
      document.documentElement.classList.add("fluid-off");
    };
    const onRestored = () => {
      if (dead) return;
      gpu = acquire();
      lost = !gpu;
      if (!gpu) {
        document.documentElement.classList.add("fluid-off");
        return;
      }
      document.documentElement.classList.remove("fluid-off");
      resize();
      pump();
    };

    resize();
    const followFilm = window.setInterval(() => {
      if (dead || lost || !gpu || gpu.gl.isContextLost()) return;
      if (!pullFilm()) return;
      if (reduced.matches) draw(performance.now());
    }, 160);
    draw(performance.now());
    const kick = requestAnimationFrame(() => {
      if (dead || lost) return;
      resize();
      draw(performance.now());
    });

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    const stop = () => {
      dead = true;
      halt();
      window.clearInterval(followFilm);
      cancelAnimationFrame(kick);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };

    if (!reduced.matches) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(frame);
    }

    return stop;
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-dvh w-full"
    />
  );
}
