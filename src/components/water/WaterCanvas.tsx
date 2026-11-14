import { useEffect, useRef, type RefObject } from "react";
import {
  FRAGMENT_SHADER,
  MAX_DROPS,
  MAX_RIPPLES,
  VERTEX_SHADER,
} from "./shaders";

type Props = {
  /** The <video> element rendered underneath. Its frames become the shader texture. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Average seconds between droplets landing on the lens. */
  dropInterval?: number;
  /** Cap device pixel ratio for mobile GPU budget. */
  maxDpr?: number;
  /** When false, tear down the GL loop immediately (CTA exit / route change). */
  active?: boolean;
};

export default function WaterCanvas({
  videoRef,
  dropInterval = 1.1,
  maxDpr = 1.75,
  active = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !active) {
      if (canvas) canvas.style.opacity = "0";
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    // No WebGL -> leave canvas hidden; the plain <video> underneath is the fallback.
    if (!gl) return;

    // ---------- program ----------
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // full-screen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // video texture (NPOT-safe settings for WebGL1)
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([2, 12, 14]));

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uVideoRes = u("uVideoRes");
    const uTime = u("uTime");
    const uHasVideo = u("uHasVideo");
    const uRipples = u("uRipples");
    const uDrops = u("uDrops");
    const uDropsB = u("uDropsB");
    gl.uniform1i(u("uVideo"), 0);

    // ---------- state ----------
    const ripples = new Float32Array(MAX_RIPPLES * 4);
    const drops = new Float32Array(MAX_DROPS * 4);
    const dropsB = new Float32Array(MAX_DROPS * 4);
    let rippleIdx = 0;
    let dropIdx = 0;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;

    const addRipple = (x: number, y: number, strength: number) => {
      const o = rippleIdx * 4;
      ripples[o] = x;
      ripples[o + 1] = y;
      ripples[o + 2] = now();
      ripples[o + 3] = strength;
      rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const addDrop = () => {
      const x = 0.05 + Math.random() * 0.9;
      const y = 0.08 + Math.random() * 0.88;
      const big = Math.random() < 0.18;
      const radius = big ? 0.035 + Math.random() * 0.025 : 0.012 + Math.random() * 0.02;
      const o = dropIdx * 4;
      drops[o] = x;
      drops[o + 1] = y;
      drops[o + 2] = radius;
      drops[o + 3] = now();
      dropsB[o] = 6 + Math.random() * 7;                 // lifetime (s)
      dropsB[o + 1] = big ? 0.6 + Math.random() : Math.random() * 0.25; // slide speed
      dropsB[o + 2] = Math.random();                     // seed
      dropIdx = (dropIdx + 1) % MAX_DROPS;
      addRipple(x, y, big ? 0.45 : 0.22);                // impact splash
    };

    // ---------- sizing ----------
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ---------- input: tap = shockwave, drag/swipe = wake trail ----------
    let down = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    const toUv = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height] as const;
    };
    const onDown = (e: PointerEvent) => {
      if (video.paused) video.play().catch(() => {}); // iOS low-power autoplay unlock
      down = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      const [x, y] = toUv(e);
      addRipple(x, y, 1.0);
    };
    const onMove = (e: PointerEvent) => {
      const isMouseHover = e.pointerType === "mouse" && !down;
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      const dt = performance.now() - lastT;
      // drag = strong wake; plain mouse hover = faint wake so desktop feels alive
      const minDist = isMouseHover ? 90 : 38;
      if (dist < minDist || dt < 40) return;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      const [x, y] = toUv(e);
      addRipple(x, y, isMouseHover ? 0.18 : 0.5);
    };
    const onUp = () => (down = false);

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });

    // ---------- video frame pump ----------
    let hasVideo = 0;
    let frameDirty = true;
    // requestVideoFrameCallback: upload only when a new frame exists (saves GPU bandwidth)
    const videoEl = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const hasRVFC = typeof videoEl.requestVideoFrameCallback === "function";
    let rvfcHandle = 0;
    const onVideoFrame = () => {
      frameDirty = true;
      rvfcHandle = videoEl.requestVideoFrameCallback?.(onVideoFrame) ?? 0;
    };
    if (hasRVFC) rvfcHandle = videoEl.requestVideoFrameCallback?.(onVideoFrame) ?? 0;

    const uploadFrame = () => {
      if (video.readyState < 2) return;
      if (hasRVFC && !frameDirty && hasVideo) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        hasVideo = 1;
        frameDirty = false;
        canvas.style.opacity = "1";
      } catch {
        /* cross-origin or not-ready frame: keep last frame */
      }
    };

    // ---------- loop ----------
    let raf = 0;
    let nextDrop = 0.4;
    const loop = () => {
      const t = now();
      if (!reduceMotion && t > nextDrop) {
        addDrop();
        nextDrop = t + dropInterval * (0.35 + Math.random() * 1.3);
      }
      uploadFrame();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uVideoRes, video.videoWidth || 1280, video.videoHeight || 720);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uHasVideo, hasVideo);
      gl.uniform4fv(uRipples, ripples);
      gl.uniform4fv(uDrops, drops);
      gl.uniform4fv(uDropsB, dropsB);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      canvas.style.opacity = "0"; // reveal plain video underneath
    };
    canvas.addEventListener("webglcontextlost", onLost);

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (hasRVFC && rvfcHandle) videoEl.cancelVideoFrameCallback?.(rvfcHandle);
      try {
        const lose = (gl.getExtension("WEBGL_lose_context") as { loseContext?: () => void } | null)?.loseContext;
        lose?.();
      } catch {
        /* ignore */
      }
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      canvas.style.opacity = "0";
    };
  }, [videoRef, dropInterval, maxDpr, active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-0 transition-opacity duration-700"
    />
  );
}
