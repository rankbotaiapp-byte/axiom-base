import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Speck } from "@/lib/axiom/swipe-reveal";
import {
  advanceSplash,
  encodeHeight,
  encodeMask,
  erodeCover,
  spawnSplash,
  stepHeight,
  wake,
  washCover,
} from "@/lib/axiom/water-ripple";

export const RIVER_RIPPLE_BADGE = "ACTIVE INTERACTION: RIVER RIPPLE.";

const COLS = 192;
const ROWS = 108;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uCover;
uniform sampler2D uHeight;
uniform sampler2D uDissolve;
uniform vec2 uTexel;
uniform vec2 uSceneFit;
uniform vec2 uCoverFit;
uniform float uStrength;
uniform float uHasCover;
vec2 fitted(vec2 uv, vec2 fit) {
  return clamp((uv - 0.5) * fit + 0.5, 0.001, 0.999);
}
void main() {
  float hL = texture2D(uHeight, vUv - vec2(uTexel.x, 0.0)).r;
  float hR = texture2D(uHeight, vUv + vec2(uTexel.x, 0.0)).r;
  float hU = texture2D(uHeight, vUv - vec2(0.0, uTexel.y)).r;
  float hD = texture2D(uHeight, vUv + vec2(0.0, uTexel.y)).r;
  float h = texture2D(uHeight, vUv).r;
  vec2 grad = vec2(hR - hL, hD - hU);
  vec2 warped = clamp(vUv + grad * uStrength, 0.0, 1.0);
  vec3 base = texture2D(uScene, fitted(warped, uSceneFit)).rgb;
  vec3 skin = texture2D(uCover, fitted(warped + grad * uStrength * 0.35, uCoverFit)).rgb;
  float gone = texture2D(uDissolve, vUv).r;
  float live = smoothstep(0.08, 0.55, abs(h - 0.5) * 2.0);
  float alpha = uHasCover * (1.0 - gone) * (1.0 - live * 0.9);
  vec3 color = mix(base, skin, alpha);
  float crest = smoothstep(0.54, 0.68, h);
  color += vec3(0.176, 0.831, 0.749) * crest * 0.28;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
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

function glowSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(45, 212, 191, 0.95)");
  glow.addColorStop(0.4, "rgba(45, 212, 191, 0.35)");
  glow.addColorStop(1, "rgba(45, 212, 191, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return sprite;
}

function coverFit(canvasW: number, canvasH: number, imageW: number, imageH: number) {
  if (canvasW < 1 || canvasH < 1 || imageW < 1 || imageH < 1) return [1, 1] as const;
  const canvasAspect = canvasW / canvasH;
  const imageAspect = imageW / imageH;
  if (canvasAspect > imageAspect) return [1, imageAspect / canvasAspect] as const;
  return [canvasAspect / imageAspect, 1] as const;
}

export function WaterRippleHero({
  baseVideoSrc = "/media/heroes/river-hawk-base.mp4",
  poster = "/media/heroes/river-hawk-base.jpg",
  coverImageSrc = "/media/heroes/river-hawk-cover.jpg",
  badgeText = RIVER_RIPPLE_BADGE,
  heading = "River Hawk Guides",
  subheading = "Drag across the water. Ripples spread through the current.",
  className,
}: {
  baseVideoSrc?: string;
  poster?: string;
  coverImageSrc?: string;
  badgeText?: string;
  heading?: string;
  subheading?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const moteRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = glRef.current;
    const motes = moteRef.current;
    const video = videoRef.current;
    if (!root || !canvas || !motes || !video) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    const moteCtx = motes.getContext("2d");
    if (!gl || !moteCtx) {
      canvas.style.display = "none";
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      canvas.style.display = "none";
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.style.display = "none";
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const sceneTex = gl.createTexture();
    const coverTex = gl.createTexture();
    const heightTex = gl.createTexture();
    const dissolveTex = gl.createTexture();
    const clampLinear = () => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    const bindScene = (source: TexImageSource) => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      clampLinear();
    };
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, heightTex);
    clampLinear();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, coverTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    clampLinear();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, dissolveTex);
    clampLinear();
    gl.activeTexture(gl.TEXTURE0);

    const uScene = gl.getUniformLocation(program, "uScene");
    const uCover = gl.getUniformLocation(program, "uCover");
    const uHeight = gl.getUniformLocation(program, "uHeight");
    const uDissolve = gl.getUniformLocation(program, "uDissolve");
    const uTexel = gl.getUniformLocation(program, "uTexel");
    const uSceneFit = gl.getUniformLocation(program, "uSceneFit");
    const uCoverFit = gl.getUniformLocation(program, "uCoverFit");
    const uStrength = gl.getUniformLocation(program, "uStrength");
    const uHasCover = gl.getUniformLocation(program, "uHasCover");
    gl.uniform1i(uScene, 0);
    gl.uniform1i(uCover, 2);
    gl.uniform1i(uHeight, 1);
    gl.uniform1i(uDissolve, 3);
    gl.uniform2f(uTexel, 1 / COLS, 1 / ROWS);
    gl.uniform2f(uSceneFit, 1, 1);
    gl.uniform2f(uCoverFit, 1, 1);
    gl.uniform1f(uHasCover, 0);

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprite = glowSprite();
    const curr = new Float32Array(COLS * ROWS);
    const prev = new Float32Array(COLS * ROWS);
    const next = new Float32Array(COLS * ROWS);
    const bytes = new Uint8Array(COLS * ROWS);
    bytes.fill(128);
    const mask = new Float32Array(COLS * ROWS);
    const maskBytes = new Uint8Array(COLS * ROWS);
    const specks: Speck[] = [];
    const posterImage = new Image();
    posterImage.src = poster;
    const coverImage = new Image();
    coverImage.src = coverImageSrc;
    let coverReady = false;
    let frame = 0;
    let running = true;
    let drawing = false;
    let width = 2;
    let height = 2;
    let last = { x: 0, y: 0 };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const nextW = Math.max(2, Math.floor(rect.width * dpr));
      const nextH = Math.max(2, Math.floor(rect.height * dpr));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      canvas.width = width;
      canvas.height = height;
      motes.width = width;
      motes.height = height;
      gl.viewport(0, 0, width, height);
    };

    const screenToSim = (x: number, y: number) => ({
      x: (x / width) * (COLS - 1),
      y: (y / height) * (ROWS - 1),
    });

    const splashAt = (x: number, y: number, dx: number, dy: number) => {
      if (reduceQuery.matches || specks.length > 110) return;
      specks.push(spawnSplash(x, y, dx, dy, Math.random));
    };

    const rippleAt = (x: number, y: number, dx: number, dy: number, amount: number) => {
      if (reduceQuery.matches) return;
      const sim = screenToSim(x, y);
      wake(curr, COLS, ROWS, sim.x, sim.y, dx, dy, amount);
      erodeCover(mask, COLS, ROWS, sim.x, sim.y, 4.2, 0.55);
    };

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((event.clientX - rect.left) / rect.width) * width,
        y: ((event.clientY - rect.top) / rect.height) * height,
      };
    };

    const onDown = (event: PointerEvent) => {
      const point = local(event);
      if (!point) return;
      drawing = true;
      last = point;
      canvas.setPointerCapture(event.pointerId);
      rippleAt(point.x, point.y, 0, -1, 1.2);
      for (let n = 0; n < 5; n += 1) splashAt(point.x, point.y, Math.random() - 0.5, -1);
    };
    const onMove = (event: PointerEvent) => {
      if (!drawing) return;
      const point = local(event);
      if (!point) return;
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dist = Math.hypot(dx, dy) || 1;
      const rapid = dist > 22;
      const steps = Math.max(1, Math.ceil(dist / 14));
      for (let i = 1; i <= steps; i += 1) {
        const x = last.x + (dx * i) / steps;
        const y = last.y + (dy * i) / steps;
        rippleAt(x, y, dx, dy, 0.78);
        if (rapid && i % 2 === 0) splashAt(x, y, dx, dy);
      }
      last = point;
    };
    const onUp = () => {
      drawing = false;
    };

    const hold = () => {
      if (reduceQuery.matches) video.pause();
    };
    video.addEventListener("loadeddata", hold);
    reduceQuery.addEventListener("change", hold);
    void video.play().catch(() => undefined);

    const tick = () => {
      if (!running) return;
      frame = requestAnimationFrame(tick);
      if (document.visibilityState !== "visible") return;
      if (!reduceQuery.matches) {
        stepHeight(curr, prev, next, COLS, ROWS);
        prev.set(curr);
        curr.set(next);
        washCover(curr, mask);
      }
      encodeHeight(curr, bytes);
      encodeMask(mask, maskBytes);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, heightTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, COLS, ROWS, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, dissolveTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, COLS, ROWS, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, maskBytes);
      gl.activeTexture(gl.TEXTURE0);
      if (video.readyState >= 2 && video.videoWidth > 0) {
        bindScene(video);
        const fit = coverFit(width, height, video.videoWidth, video.videoHeight);
        gl.uniform2f(uSceneFit, fit[0], fit[1]);
      } else if (posterImage.complete && posterImage.naturalWidth > 0) {
        bindScene(posterImage);
        const fit = coverFit(width, height, posterImage.naturalWidth, posterImage.naturalHeight);
        gl.uniform2f(uSceneFit, fit[0], fit[1]);
      }
      if (!coverReady && coverImage.complete && coverImage.naturalWidth > 0) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, coverTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, coverImage);
        clampLinear();
        coverReady = true;
        gl.uniform1f(uHasCover, 1);
        gl.activeTexture(gl.TEXTURE0);
      }
      if (coverReady) {
        const fit = coverFit(width, height, coverImage.naturalWidth, coverImage.naturalHeight);
        gl.uniform2f(uCoverFit, fit[0], fit[1]);
      }
      gl.uniform1f(uStrength, reduceQuery.matches ? 0 : 0.55);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      moteCtx.clearRect(0, 0, width, height);
      if (specks.length === 0) return;
      moteCtx.globalCompositeOperation = "lighter";
      for (let i = specks.length - 1; i >= 0; i -= 1) {
        const current = specks[i];
        if (!current) continue;
        const moved = advanceSplash(current, 1 / 60);
        if (!moved) {
          specks.splice(i, 1);
          continue;
        }
        specks[i] = moved;
        moteCtx.globalAlpha = Math.max(0, moved.life / 0.85);
        moteCtx.drawImage(sprite, moved.x - moved.size, moved.y - moved.size, moved.size * 2, moved.size * 2);
      }
      moteCtx.globalAlpha = 1;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      video.removeEventListener("loadeddata", hold);
      reduceQuery.removeEventListener("change", hold);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.deleteTexture(sceneTex);
      gl.deleteTexture(coverTex);
      gl.deleteTexture(heightTex);
      gl.deleteTexture(dissolveTex);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [baseVideoSrc, coverImageSrc, poster]);

  return (
    <div ref={rootRef} className={cn("swipe-reveal water-ripple", className)}>
      <video
        ref={videoRef}
        className="swipe-reveal-video"
        src={baseVideoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <canvas ref={glRef} className="water-ripple-surface" aria-label="Drag across the river to disturb the water" />
      <canvas ref={moteRef} className="swipe-reveal-motes" aria-hidden />
      <div className="swipe-reveal-copy">
        <h2>{heading}</h2>
        <p>{subheading}</p>
      </div>
      <p className="swipe-reveal-badge">{badgeText}</p>
    </div>
  );
}
