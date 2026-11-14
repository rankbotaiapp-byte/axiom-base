import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Holographic glass lens that refracts the hero loop around the cursor.
 * Faceted (voronoi) crystal normals bend the video, split it into thin-film colour,
 * and leave a soft iridescent sheen across the rest of the frame.
 * With no playable video it renders the sheen + facets alone, so the layer never goes blank.
 */

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVideo;
uniform float uHasVideo;
uniform vec2 uRes;
uniform vec2 uVideoSize;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uTime;
uniform float uIntensity;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Voronoi: x = distance to nearest cell centre, y = edge distance, zw = cell id.
vec4 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  float md = 8.0; vec2 mr = vec2(0.0); vec2 mc = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash2(n + g);
    o = 0.5 + 0.5 * sin(uTime * 0.35 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mc = n + g; }
  }
  float me = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash2(floor(p) + g);
    o = 0.5 + 0.5 * sin(uTime * 0.35 + 6.2831 * o);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) me = min(me, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec4(sqrt(md), me, mc);
}

// object-fit: cover for the video texture.
vec2 coverUv(vec2 uv) {
  float sr = uRes.x / max(uRes.y, 1.0);
  float vr = uVideoSize.x / max(uVideoSize.y, 1.0);
  vec2 s = sr > vr ? vec2(1.0, vr / sr) : vec2(sr / vr, 1.0);
  return (uv - 0.5) * s + 0.5;
}

vec3 film(float t) {
  // Thin-film iridescence tuned to the cyan / magenta / white of the brand shards.
  return 0.55 + 0.45 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float speed = clamp(length(uVel) * 1.4, 0.0, 1.0);

  float radius = mix(0.26, 0.34, speed);
  float d = distance(p, m);
  float lens = smoothstep(radius, radius * 0.25, d);

  vec4 v = voronoi(p * 6.0 + uVel * 2.0);
  vec2 cellDir = normalize(hash2(v.zw) - 0.5 + 1e-4);
  vec2 radial = (p - m) / max(d, 1e-3);
  vec2 normal = normalize(cellDir * 0.65 + radial * 0.35 + uVel * 0.6);
  float facetEdge = 1.0 - smoothstep(0.0, 0.035, v.y);

  float bend = lens * (0.035 + 0.05 * speed) * uIntensity;
  vec2 offs = normal * bend;
  vec2 uv = vUv;

  vec3 col = vec3(0.0);
  if (uHasVideo > 0.5) {
    float r = texture2D(uVideo, coverUv(uv - offs * 1.25)).r;
    float g = texture2D(uVideo, coverUv(uv - offs)).g;
    float b = texture2D(uVideo, coverUv(uv - offs * 0.75)).b;
    col = vec3(r, g, b);
  }

  float fres = pow(1.0 - lens, 2.0) * lens * 4.0;
  vec3 irid = film(dot(normal, vec2(0.7, 0.3)) * 0.8 + uTime * 0.05 + d * 2.0);
  float caustic = pow(max(0.0, 1.0 - v.x * 1.6), 6.0) * lens;

  col = mix(col, col * 0.75 + irid * 0.45, lens * 0.55);
  col += irid * (facetEdge * lens * 0.55 + fres * 0.35 + caustic * 0.4);

  // Sheen everywhere else: faint diagonal band that tracks the cursor.
  float band = smoothstep(0.08, 0.0, abs((vUv.x - vUv.y) - (uMouse.x - uMouse.y) * 0.8 + sin(uTime * 0.2) * 0.1));
  vec3 sheen = irid * band * 0.09 + irid * facetEdge * 0.035;

  float alpha = uHasVideo > 0.5 ? lens * 0.92 : lens * 0.55;
  alpha = max(alpha, max(band * 0.09, facetEdge * 0.04));
  gl_FragColor = vec4(col + sheen * (1.0 - lens), alpha * uIntensity);
}
`;

type PointerState = { x: number; y: number; vx: number; vy: number; lastMove: number };

function Lens({
  video,
  pointer,
  intensity,
}: {
  video: RefObject<HTMLVideoElement | null>;
  pointer: RefObject<PointerState>;
  intensity: number;
}) {
  const { size, gl } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const smooth = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0, k: intensity });
  const uniforms = useMemo(
    () => ({
      uVideo: { value: null as THREE.Texture | null },
      uHasVideo: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uVideoSize: { value: new THREE.Vector2(16, 9) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uVel: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Bind the existing hero <video> as a texture once it can decode frames; drop it if it errors.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let tex: THREE.VideoTexture | null = null;
    const attach = () => {
      if (tex || el.readyState < 2 || !el.videoWidth) return;
      tex = new THREE.VideoTexture(el);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      uniforms.uVideo.value = tex;
      uniforms.uVideoSize.value.set(el.videoWidth, el.videoHeight);
      uniforms.uHasVideo.value = 1;
    };
    const detach = () => {
      uniforms.uHasVideo.value = 0;
      uniforms.uVideo.value = null;
      tex?.dispose();
      tex = null;
    };
    attach();
    el.addEventListener("loadeddata", attach);
    el.addEventListener("playing", attach);
    el.addEventListener("error", detach);
    el.addEventListener("emptied", detach);
    return () => {
      el.removeEventListener("loadeddata", attach);
      el.removeEventListener("playing", attach);
      el.removeEventListener("error", detach);
      el.removeEventListener("emptied", detach);
      detach();
    };
  }, [video, uniforms]);

  useEffect(() => {
    gl.setClearColor(0x000000, 0);
  }, [gl]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30);
    const P = pointer.current;
    const S = smooth.current;
    const t = state.clock.elapsedTime;
    // Idle autopilot (touch devices, or the cursor left): the lens drifts on a slow lissajous.
    const idle = performance.now() - P.lastMove > 2600;
    const tx = idle ? 0.5 + Math.sin(t * 0.31) * 0.28 : P.x;
    const ty = idle ? 0.5 + Math.sin(t * 0.23 + 1.3) * 0.22 : P.y;
    const k = 1 - Math.exp(-dt * 9);
    S.x += (tx - S.x) * k;
    S.y += (ty - S.y) * k;
    S.vx += (P.vx - S.vx) * k;
    S.vy += (P.vy - S.vy) * k;
    P.vx *= Math.exp(-dt * 6);
    P.vy *= Math.exp(-dt * 6);
    S.k += (intensity - S.k) * (1 - Math.exp(-dt * 4));

    uniforms.uTime.value = t;
    uniforms.uMouse.value.set(S.x, S.y);
    uniforms.uVel.value.set(THREE.MathUtils.clamp(S.vx, -1, 1), THREE.MathUtils.clamp(S.vy, -1, 1));
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uIntensity.value = S.k;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function HoloGlassScene({
  video,
  host,
  intensity,
  running,
}: {
  video: RefObject<HTMLVideoElement | null>;
  host: RefObject<HTMLElement | null>;
  intensity: number;
  running: boolean;
}) {
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, vx: 0, vy: 0, lastMove: 0 });

  // Track the cursor on the media host (events bubble up from the tap target above the canvas).
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let last = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      const now = performance.now();
      const dt = Math.max(16, now - last.t) / 1000;
      const P = pointer.current;
      if (last.t) {
        P.vx = THREE.MathUtils.clamp((x - last.x) / dt, -3, 3) * 0.35;
        P.vy = THREE.MathUtils.clamp((y - last.y) / dt, -3, 3) * 0.35;
      }
      P.x = x;
      P.y = y;
      P.lastMove = now;
      last = { x, y, t: now };
    };
    const onLeave = () => {
      pointer.current.lastMove = 0;
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [host]);

  return (
    <Canvas
      className="holo-glass-canvas"
      orthographic
      dpr={[1, 1.5]}
      frameloop={running ? "always" : "never"}
      gl={{ alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Lens video={video} pointer={pointer} intensity={intensity} />
    </Canvas>
  );
}
