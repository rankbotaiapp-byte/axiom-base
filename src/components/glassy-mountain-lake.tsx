"use client";

import { useEffect, useRef, useState } from "react";
import {
  LAKE_CAMERA,
  createLake,
  packHeights,
  pointerToLake,
  stampLake,
  stepLake,
  stillLake,
  strokeMode,
  type LakeSim,
  type StrokeMode,
} from "@/lib/axiom/lake-physics";

const COLS = 128;
const ROWS = 72;

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uHeight;
uniform vec2 uRes;
uniform vec2 uGrid;
uniform float uSunY;
uniform float uGlass;
in vec2 vUv;
out vec4 frag;

float peaks(vec2 xz) {
  float far = 1.0 - smoothstep(-1.5, 0.35, xz.y);
  float h = 0.0;
  h += 0.9 * exp(-pow((xz.x + 0.72) * 1.8, 2.0));
  h += 1.35 * exp(-pow(xz.x * 1.2, 2.0));
  h += 0.75 * exp(-pow((xz.x - 0.82) * 1.9, 2.0));
  h += 0.12 * sin(xz.x * 6.0);
  return h * far;
}

vec3 sky(vec3 rd, vec3 sun) {
  float lift = clamp(rd.y, 0.0, 1.0);
  vec3 zenith = vec3(0.08, 0.06, 0.16);
  vec3 horizon = vec3(0.93, 0.34, 0.14);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.72, lift));
  float glow = pow(max(dot(rd, sun), 0.0), 7.0);
  float disk = pow(max(dot(rd, sun), 0.0), 260.0);
  col += vec3(1.0, 0.58, 0.26) * glow * 0.7;
  col += vec3(1.0, 0.86, 0.62) * disk;
  return col;
}

float sunShadow(vec3 p, vec3 sun) {
  vec3 q = p;
  for (int i = 0; i < 10; i++) {
    q += sun * 0.22;
    if (q.y < peaks(q.xz)) return 0.42;
  }
  return 1.0;
}

bool marchMountain(vec3 ro, vec3 rd, float limit, out vec3 pos, out vec3 nor, out float dist) {
  float t = 0.2;
  for (int i = 0; i < 24; i++) {
    if (t >= limit) break;
    vec3 p = ro + rd * t;
    float h = peaks(p.xz);
    if (p.y < h && h > 0.04) {
      float e = 0.05;
      float hx = peaks(p.xz + vec2(e, 0.0));
      float hz = peaks(p.xz + vec2(0.0, e));
      pos = vec3(p.x, h, p.z);
      nor = normalize(vec3(h - hx, e, h - hz));
      dist = t;
      return true;
    }
    t += 0.12;
  }
  return false;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec3 ro = vec3(0.0, ${LAKE_CAMERA.eyeY.toFixed(2)}, ${LAKE_CAMERA.eyeZ.toFixed(2)});
  vec3 rd = normalize(vec3((uv.x * 2.0 - 1.0) * aspect, uv.y * 2.0 - 1.0, ${(-LAKE_CAMERA.focal).toFixed(2)}));
  vec3 sun = normalize(vec3(0.58, clamp(uSunY, 0.05, 0.9), -0.32));
  vec3 col = sky(rd, sun);
  float waterT = rd.y < -0.02 ? -ro.y / rd.y : 30.0;
  vec3 mpos;
  vec3 mnor;
  float mdist;
  if (marchMountain(ro, rd, waterT, mpos, mnor, mdist)) {
    float ndl = clamp(dot(mnor, sun), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(mnor, -rd), 0.0, 1.0), 2.2);
    vec3 rock = mix(vec3(0.08, 0.05, 0.09), vec3(0.72, 0.32, 0.18), ndl);
    rock += vec3(1.0, 0.55, 0.26) * rim * 0.45;
    col = rock * mix(0.4, 1.0, sunShadow(mpos + mnor * 0.08, sun));
  } else if (waterT > 0.0 && waterT < 16.0) {
    vec3 p = ro + rd * waterT;
    vec2 st = p.xz * vec2(${LAKE_CAMERA.scaleX.toFixed(2)}, ${LAKE_CAMERA.scaleZ.toFixed(2)}) + vec2(${LAKE_CAMERA.biasX.toFixed(2)}, ${LAKE_CAMERA.biasZ.toFixed(2)});
    if (st.x > 0.0 && st.x < 1.0 && st.y > 0.0 && st.y < 1.0) {
      vec2 texel = 1.0 / uGrid;
      float h = (texture(uHeight, st).r - 0.5) * 0.25;
      float hx = (texture(uHeight, st + vec2(texel.x, 0.0)).r - 0.5) * 0.25;
      float hy = (texture(uHeight, st + vec2(0.0, texel.y)).r - 0.5) * 0.25;
      vec3 n = normalize(vec3(h - hx, 0.055, h - hy));
      vec3 refl = reflect(rd, n);
      vec3 reflected = sky(refl, sun);
      vec3 rp;
      vec3 rn;
      float rd2;
      if (marchMountain(p + n * 0.05, refl, 12.0, rp, rn, rd2)) {
        float ndl = clamp(dot(rn, sun), 0.0, 1.0);
        reflected = mix(vec3(0.1, 0.06, 0.08), vec3(0.78, 0.36, 0.2), ndl);
      }
      float fres = mix(0.08, 0.96, pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0));
      fres = mix(0.2, fres, clamp(uGlass, 0.0, 1.0));
      float spec = pow(clamp(dot(refl, sun), 0.0, 1.0), 160.0);
      vec3 water = mix(vec3(0.03, 0.07, 0.1), reflected, fres);
      water += vec3(1.0, 0.8, 0.5) * spec;
      water *= mix(0.5, 1.0, sunShadow(p + vec3(0.0, 0.04, 0.0), sun));
      col = water;
    }
  }
  frag = vec4(col, 1.0);
}
`;

type Knobs = {
  tension: number;
  damping: number;
  droplet: number;
  swipe: number;
  glass: number;
  sun: number;
};

const INITIAL: Knobs = {
  tension: 0.72,
  damping: 0.986,
  droplet: 2.2,
  swipe: 7.2,
  glass: 0.86,
  sun: 0.24,
};

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function GlassyMountainLake({ title }: { title?: string }) {
  "use no memo";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const knobs = useRef<Knobs>({ ...INITIAL });
  const resetRef = useRef(false);
  const dropRef = useRef(false);
  const [mode, setMode] = useState<StrokeMode>("droplet");
  const [values, setValues] = useState<Knobs>({ ...INITIAL });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let frame = 0;
    let release: (() => void) | null = null;

    const start = () => {
      if (dead || release) return;
      try {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(2, Math.floor(rect.width * dpr));
      canvas.height = Math.max(2, Math.floor(rect.height * dpr));
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "high-performance",
      });
      if (!gl) {
        setReady(false);
        return;
      }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      setReady(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      setReady(false);
      return;
    }
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!buffer || !texture) {
      setReady(false);
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const uHeight = gl.getUniformLocation(program, "uHeight");
    const uRes = gl.getUniformLocation(program, "uRes");
    const uGrid = gl.getUniformLocation(program, "uGrid");
    const uSunY = gl.getUniformLocation(program, "uSunY");
    const uGlass = gl.getUniformLocation(program, "uGlass");

    const sim: LakeSim = createLake(COLS, ROWS);
    const packed = new Uint8Array(COLS * ROWS * 4);
    packHeights(sim.curr, packed);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, COLS, ROWS, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeUntil = 0;
    let pointerId = -1;
    let originX = 0;
    let originY = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    let down = false;
    let shown: StrokeMode = "droplet";
    const showMode = (next: StrokeMode) => {
      if (shown === next) return;
      shown = next;
      setMode(next);
    };

    const cellAt = (px: number, py: number) => {
      const rect = canvas.getBoundingClientRect();
      return pointerToLake(px - rect.left, py - rect.top, rect.width, rect.height, COLS, ROWS);
    };

    const draw = () => {
      const settings = knobs.current;
      if (resetRef.current) {
        stillLake(sim);
        resetRef.current = false;
      }
      if (dropRef.current) {
        stampLake(sim, COLS * 0.5, ROWS * 0.48, settings.droplet, 0.22);
        dropRef.current = false;
        activeUntil = performance.now() + 2400;
      }
      const moving = !reduced.matches || performance.now() < activeUntil;
      if (moving) stepLake(sim, settings.tension, settings.damping);
      packHeights(sim.curr, packed);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RGBA, gl.UNSIGNED_BYTE, packed);
      gl.useProgram(program);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1i(uHeight, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uGrid, COLS, ROWS);
      gl.uniform1f(uSunY, settings.sun);
      gl.uniform1f(uGlass, settings.glass);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      moved = 0;
      down = true;
      showMode("droplet");
    };

    const onMove = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      const dist = Math.hypot(event.clientX - originX, event.clientY - originY);
      moved = Math.max(moved, dist);
      const modeNow = strokeMode(moved);
      if (modeNow === "swipe") {
        showMode("swipe");
        const from = cellAt(lastX, lastY);
        const to = cellAt(event.clientX, event.clientY);
        if (from && to) {
          const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 1.4));
          const settings = knobs.current;
          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            stampLake(
              sim,
              from.x + (to.x - from.x) * t,
              from.y + (to.y - from.y) * t,
              settings.swipe,
              0.035,
            );
          }
          activeUntil = performance.now() + 2600;
        }
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onUp = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      down = false;
      const modeNow = strokeMode(moved);
      showMode(modeNow);
      if (modeNow === "droplet") {
        const hit = cellAt(event.clientX, event.clientY);
        if (hit) {
          stampLake(sim, hit.x, hit.y, knobs.current.droplet, 0.24);
          activeUntil = performance.now() + 2600;
        }
      }
    };

    const loop = () => {
      if (dead) return;
      draw();
      frame = requestAnimationFrame(loop);
    };

    draw();
    frame = requestAnimationFrame(loop);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    release = () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    } catch (err) {
      console.error(err);
      setReady(false);
    }
    };

    start();
    const observer = new ResizeObserver(() => start());
    observer.observe(canvas);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      release?.();
    };
  }, []);

  const setKnob = (key: keyof Knobs, value: number) => {
    knobs.current = { ...knobs.current, [key]: value };
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <section aria-label="Glassy mountain lake" className="pointer-events-auto relative z-40 mx-auto mb-8 w-full max-w-5xl px-5 pt-6">
      <div className="glass-panel overflow-hidden rounded-[24px]">
        <div className="relative h-[min(42vh,22rem)] min-h-56 bg-bg">
          <canvas
            ref={canvasRef}
            aria-label="Lake surface"
            className="pointer-events-auto absolute inset-0 h-full w-full touch-none"
          />
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-fg">{title || "Mountain lake"}</p>
          <p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-bg/70 px-3 py-1 text-sm text-fg">
            {mode === "swipe" ? "Wide swipe" : "Tap droplet"}
          </p>
          <div className="pointer-events-auto absolute right-4 top-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm font-medium text-bg"
              onClick={() => {
                dropRef.current = true;
                setMode("droplet");
              }}
            >
              Drop
            </button>
            <button
              type="button"
              className="pointer-events-auto inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm text-fg"
              onClick={() => {
                resetRef.current = true;
              }}
            >
              Still the lake
            </button>
          </div>
          {ready ? null : (
            <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
              This display has no WebGL2 lake.
            </p>
          )}
        </div>
        <div className="pointer-events-auto grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-[1fr_1fr] sm:px-5">
          <div>
            <p className="font-display text-2xl text-fg">Ripple Studio</p>
            <p className="mt-1 text-sm text-muted">Tap the water for a droplet. Drag across it for a smooth wide wake.</p>
          </div>
          <div className="grid gap-3 text-sm text-muted">
            <Knob label="Tension" min={0.35} max={1} step={0.01} value={values.tension} onChange={(value) => setKnob("tension", value)} />
            <Knob label="Damping" min={0.94} max={0.996} step={0.001} value={values.damping} onChange={(value) => setKnob("damping", value)} />
            <Knob label="Droplet" min={1} max={5} step={0.1} value={values.droplet} onChange={(value) => setKnob("droplet", value)} />
            <Knob label="Swipe width" min={3} max={14} step={0.1} value={values.swipe} onChange={(value) => setKnob("swipe", value)} />
            <Knob label="Glass" min={0.2} max={1} step={0.01} value={values.glass} onChange={(value) => setKnob("glass", value)} />
            <Knob label="Sunset" min={0.08} max={0.62} step={0.01} value={values.sun} onChange={(value) => setKnob("sun", value)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Knob({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        className="pointer-events-auto h-11 w-full accent-accent"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="w-10 text-right text-fg">{value.toFixed(2)}</span>
    </label>
  );
}
