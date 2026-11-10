/**
 * Freeze-Orbit engine — imperative three.js, loaded lazily by <CinematicHero/>.
 *
 * What it does
 *  1. Watches the native <video>. Just before `freezeAt` it speed-ramps the clip
 *     down (bullet-time), then pauses on the exact frame.
 *  2. Uploads that paused frame to a subdivided plane framed pixel-for-pixel like
 *     the CSS `object-fit: cover` video, so the hand-off is invisible.
 *  3. Pushes the plane into relief (subject + floor come toward camera), swings the
 *     camera around the subject, and spins a field of refractive ice shards and
 *     frozen water droplets a full 360° around it — shards refract the frozen frame,
 *     catch moving lights, and (high tier) get real depth of field.
 *  4. Returns the camera to the exact rest pose, drops the canvas and resumes the
 *     native video — the original footage is never re-encoded or filtered.
 *
 * The <video> element is the only thing on screen outside the freeze window, so
 * playback quality is untouched and the GPU idles between freezes.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { budgets, type HeroTier, type TierBudget } from "./tier";

export interface FreezeOrbitOptions {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  tier: Exclude<HeroTier, "off">;
  freezeAt: number;
  rampIn: number;
  freezeDuration: number;
  videoAspect: number;
  subject: { x: number; y: number; rx: number; ry: number };
  orbitArc: number;
  orbitClip?: string | null;
  freezeLoops?: number;
  onPhase?: (phase: "playing" | "ramping" | "frozen" | "releasing") => void;
}

export interface FreezeOrbitHandle {
  setActive(active: boolean): void;
  /** Trigger the freeze immediately (e.g. from a button or for QA). Returns false until warm. */
  freezeNow(): boolean;
  dispose(): void;
}

const BG = new THREE.Color("#03060b");
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const reliefVertex = /* glsl */ `
  uniform sampler2D map;
  uniform float uFreeze;
  uniform float uDepth;
  uniform vec4 uSubject; // x, y, rx, ry (uv space)
  varying vec2 vUv;
  varying float vDepth;

  float subjectMask(vec2 uv) {
    vec2 d = (uv - uSubject.xy) / uSubject.zw;
    return exp(-dot(d, d) * 1.6);
  }

  void main() {
    vUv = uv;
    vec2 cuv = clamp(uv, 0.0, 1.0);
    float lum = dot(texture2D(map, cuv).rgb, vec3(0.299, 0.587, 0.114));
    float s = subjectMask(cuv);
    float ground = smoothstep(0.38, 0.0, cuv.y) * 0.32;
    float d = s * (0.72 + 0.28 * lum) + ground;
    vDepth = d;
    vec3 p = position;
    p.z += d * uDepth * uFreeze;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const reliefFragment = /* glsl */ `
  uniform sampler2D map;
  uniform float uFreeze;
  uniform vec3 uBg;
  uniform float uChill;
  varying vec2 vUv;
  varying float vDepth;

  vec2 mirrorUv(vec2 uv) { vec2 t = mod(uv, 2.0); return 1.0 - abs(t - 1.0); }

  void main() {
    vec3 col = texture2D(map, mirrorUv(vUv)).rgb;
    vec2 e = min(vUv, 1.0 - vUv);
    float outside = clamp(-min(e.x, e.y) / 0.3, 0.0, 1.0);
    bool isOut = min(e.x, e.y) < 0.0;
    if (isOut) col = mix(col * 0.35, uBg, 0.35 + 0.65 * outside);

    // Frozen grade: a touch cooler + subtle vignette, only while frozen.
    vec2 c = vUv - 0.5;
    float vig = smoothstep(0.35, 0.85, length(c * vec2(1.2, 1.0)));
    col *= 1.0 - uFreeze * 0.28 * vig;
    col = mix(col, col * vec3(0.92, 1.0, 1.08), uFreeze * uChill);
    // Rim of frost on the raised subject
    col += uFreeze * uChill * 0.06 * smoothstep(0.35, 0.9, vDepth) * vec3(0.6, 0.85, 1.0);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const dropletVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uFreeze;
  uniform float uPR;
  uniform float uSpin;
  uniform vec3 uCenter;
  varying float vAlpha;
  varying float vTw;
  void main() {
    vec3 p = position;
    // Rotate the whole droplet cloud with the shard ring (360° over the freeze)
    float a = uSpin * (0.6 + 0.4 * fract(aSeed * 7.13));
    vec3 q = p - uCenter;
    q.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * q.xz;
    p = q + uCenter;
    p.y += sin(uTime * 0.6 + aSeed * 40.0) * 0.015;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = mix(1.4, 4.2, fract(aSeed * 13.7));
    gl_PointSize = size * uPR * (3.0 / -mv.z) * uFreeze;
    vAlpha = uFreeze * mix(0.35, 0.95, fract(aSeed * 3.1));
    vTw = 0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 90.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const dropletFragment = /* glsl */ `
  varying float vAlpha;
  varying float vTw;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float core = smoothstep(0.5, 0.0, r);
    float spark = smoothstep(0.06, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y))
                + smoothstep(0.06, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x));
    float a = (core * core + spark * 0.35 * vTw) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(0.78, 0.92, 1.0) * (0.7 + 0.6 * vTw), a);
  }
`;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function makeShardGeometry(seed: number) {
  const base =
    seed % 3 === 0
      ? new THREE.OctahedronGeometry(1, 0)
      : seed % 3 === 1
        ? new THREE.TetrahedronGeometry(1, 0)
        : new THREE.IcosahedronGeometry(1, 0);
  const g = base.index ? base.toNonIndexed() : base;
  if (g !== base) base.dispose();
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  // Deterministic jitter so identical vertices move together (keeps the shard closed).
  const key = (x: number, y: number, z: number) => `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
  const offsets = new Map<string, THREE.Vector3>();
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5;
  for (let i = 0; i < pos.count; i++) {
    const k = key(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (!offsets.has(k)) offsets.set(k, new THREE.Vector3(rnd() * 0.5, rnd() * 0.5, rnd() * 0.5));
    const o = offsets.get(k)!;
    pos.setXYZ(i, pos.getX(i) + o.x, pos.getY(i) * 1.9 + o.y, pos.getZ(i) * 0.55 + o.z);
  }
  g.computeVertexNormals();
  return g;
}

interface ShardState {
  radius: number;
  angle: number;
  height: number;
  zBias: number;
  speed: number;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
  spin0: number;
  scale: THREE.Vector3;
  delay: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export function createFreezeOrbit(opts: FreezeOrbitOptions): FreezeOrbitHandle {
  const { canvas, video } = opts;
  const budget: TierBudget = { ...budgets[opts.tier] };
  const freezeLoops = opts.freezeLoops ?? Infinity;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: opts.tier !== "low",
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // keep footage pixels exact
  renderer.setClearColor(BG, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.pixelRatio));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 60);

  // --- Frozen frame (relief plane) -----------------------------------------
  const W = 2 * opts.videoAspect;
  const H = 2;
  const EXT = 1.6; // geometry extends past the frame; the overflow is a dimmed mirror
  const frameTex = new THREE.VideoTexture(video);
  frameTex.colorSpace = THREE.SRGBColorSpace;
  frameTex.minFilter = THREE.LinearFilter;
  frameTex.magFilter = THREE.LinearFilter;
  frameTex.generateMipmaps = false;

  let clipVideo: HTMLVideoElement | null = null;
  let clipTex: THREE.VideoTexture | null = null;
  if (opts.orbitClip) {
    clipVideo = document.createElement("video");
    clipVideo.src = opts.orbitClip;
    clipVideo.muted = true;
    clipVideo.playsInline = true;
    clipVideo.preload = "auto";
    clipTex = new THREE.VideoTexture(clipVideo);
    clipTex.colorSpace = THREE.SRGBColorSpace;
  }

  const [segX, segY] = budget.segments;
  const planeGeo = new THREE.PlaneGeometry(W * EXT, H * EXT, Math.round(segX * EXT), Math.round(segY * EXT));
  // Remap UVs so [0,1] is exactly the original frame and the overflow goes negative / >1.
  {
    const uv = planeGeo.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - 0.5) * EXT + 0.5, (uv.getY(i) - 0.5) * EXT + 0.5);
    }
  }
  const reliefUniforms = {
    map: { value: frameTex as THREE.Texture },
    uFreeze: { value: 0 },
    uDepth: { value: opts.orbitClip ? 0 : 0.62 },
    uSubject: { value: new THREE.Vector4(opts.subject.x, opts.subject.y, opts.subject.rx, opts.subject.ry) },
    uBg: { value: BG.clone() },
    uChill: { value: 1 },
  };
  const relief = new THREE.Mesh(
    planeGeo,
    new THREE.ShaderMaterial({
      uniforms: reliefUniforms,
      vertexShader: reliefVertex,
      fragmentShader: reliefFragment,
      toneMapped: false,
    }),
  );
  scene.add(relief);

  const subjectWorld = new THREE.Vector3((opts.subject.x - 0.5) * W, (opts.subject.y - 0.5) * H, 0);
  const pivot = subjectWorld.clone().setZ(0.62 * 0.5);

  // --- Lights (moving, so reflections sweep across the ice) ------------------
  const key = new THREE.DirectionalLight(0xdff4ff, 2.2);
  key.position.set(1.5, 2.5, 3);
  const ember = new THREE.PointLight(0xff8a3d, 6, 6, 1.6);
  ember.position.set(-1.6, -0.9, 1.4);
  const ice = new THREE.PointLight(0x5fd8ff, 8, 7, 1.4);
  scene.add(key, ember, ice);

  // --- Ice shards ------------------------------------------------------------
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.035,
    ior: 1.31, // water ice
    thickness: 0.35,
    transmission: budget.transmission ? 1 : 0,
    transparent: !budget.transmission,
    opacity: budget.transmission ? 1 : 0.42,
    attenuationColor: new THREE.Color("#bfe8ff"),
    attenuationDistance: 1.2,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
    envMapIntensity: budget.transmission ? 1.4 : 2.2,
    dispersion: budget.transmission ? 0.35 : 0,
    side: THREE.FrontSide,
  });

  const variants = 3;
  const perVariant = Math.ceil(budget.shards / variants);
  const shardMeshes: THREE.InstancedMesh[] = [];
  const shardStates: ShardState[][] = [];
  let rs = 1337;
  const rand = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
  for (let v = 0; v < variants; v++) {
    const geo = makeShardGeometry(v + 1);
    const mesh = new THREE.InstancedMesh(geo, shardMat, perVariant);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const states: ShardState[] = [];
    for (let i = 0; i < perVariant; i++) {
      const big = rand() < 0.12;
      const sz = big ? 0.07 + rand() * 0.07 : 0.015 + rand() * 0.04;
      states.push({
        radius: 0.35 + Math.pow(rand(), 0.7) * 1.9,
        angle: rand() * Math.PI * 2,
        height: (rand() - 0.45) * 1.7,
        zBias: (rand() - 0.3) * 0.5,
        speed: 0.6 + rand() * 0.8,
        spinAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spinSpeed: (rand() - 0.5) * 2.4,
        spin0: rand() * Math.PI * 2,
        scale: new THREE.Vector3(sz * (0.7 + rand() * 0.6), sz * (0.8 + rand() * 0.9), sz * (0.6 + rand() * 0.6)),
        delay: rand() * 0.12,
      });
    }
    shardMeshes.push(mesh);
    shardStates.push(states);
    scene.add(mesh);
  }

  // --- Frozen water droplets -------------------------------------------------
  const dropCount = budget.particles;
  const dropPos = new Float32Array(dropCount * 3);
  const dropSeed = new Float32Array(dropCount);
  for (let i = 0; i < dropCount; i++) {
    const r = 0.2 + Math.pow(rand(), 0.6) * 2.6;
    const a = rand() * Math.PI * 2;
    dropPos[i * 3] = pivot.x + Math.cos(a) * r * 1.2;
    dropPos[i * 3 + 1] = pivot.y + (rand() - 0.5) * 2.2;
    dropPos[i * 3 + 2] = pivot.z + Math.sin(a) * r * 0.7 + 0.2;
    dropSeed[i] = rand();
  }
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
  dropGeo.setAttribute("aSeed", new THREE.BufferAttribute(dropSeed, 1));
  const dropUniforms = {
    uTime: { value: 0 },
    uFreeze: { value: 0 },
    uPR: { value: renderer.getPixelRatio() },
    uSpin: { value: 0 },
    uCenter: { value: pivot.clone() },
  };
  const droplets = new THREE.Points(
    dropGeo,
    new THREE.ShaderMaterial({
      uniforms: dropUniforms,
      vertexShader: dropletVertex,
      fragmentShader: dropletFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  droplets.frustumCulled = false;
  scene.add(droplets);

  // --- Post (high tier): real depth of field ---------------------------------
  let composer: EffectComposer | null = null;
  let bokeh: BokehPass | null = null;
  const setupComposer = () => {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0, maxblur: 0.0045 });
    composer.addPass(bokeh);
    composer.addPass(new OutputPass());
  };
  if (budget.bokeh) setupComposer();

  // --- Framing ---------------------------------------------------------------
  let restDist = 5;
  const restPos = new THREE.Vector3();
  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // Match CSS object-fit: cover, centred.
    restDist = camera.aspect > opts.videoAspect ? W / (2 * t * camera.aspect) : H / (2 * t);
    restPos.set(0, 0, restDist);
    camera.updateProjectionMatrix();
    if (state === "idle") placeCamera(0, 0, 1, 0);
  };

  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const sph = new THREE.Spherical();
  const placeCamera = (theta: number, phi: number, dolly: number, lookBlend: number) => {
    tmpPos.copy(restPos).sub(pivot);
    sph.setFromVector3(tmpPos);
    sph.theta += theta;
    sph.phi -= phi;
    sph.radius *= dolly;
    tmpPos.setFromSpherical(sph).add(pivot);
    camera.position.copy(tmpPos);
    tmpLook.set(0, 0, 0).lerp(pivot, lookBlend);
    camera.lookAt(tmpLook);
  };

  // --- Shard animation ---------------------------------------------------------
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const updateShards = (t: number, intro: number, outro: number, ring: number) => {
    for (let v = 0; v < shardMeshes.length; v++) {
      const mesh = shardMeshes[v];
      const states = shardStates[v];
      for (let i = 0; i < mesh.count; i++) {
        const st = states[i];
        const inT = easeOutExpo(clamp01((intro - st.delay) / (1 - st.delay)));
        const burst = 1 + outro * outro * 2.8;
        const r = st.radius * (0.15 + 0.85 * inT) * burst;
        const a = st.angle + ring * st.speed;
        p3.set(
          pivot.x + Math.cos(a) * r * 1.15,
          pivot.y + st.height * (0.3 + 0.7 * inT) + Math.sin(t * 0.7 + st.angle) * 0.02,
          pivot.z + Math.sin(a) * r * 0.75 + st.zBias,
        );
        q.setFromAxisAngle(st.spinAxis, st.spin0 + t * st.spinSpeed);
        const k = inT * (1 - outro);
        s3.copy(st.scale).multiplyScalar(Math.max(0.0001, k));
        m4.compose(p3, q, s3);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  };

  // --- Interaction: drag/tilt to steer the orbit while frozen ---------------
  let steerTarget = 0;
  let steer = 0;
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    steerTarget = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
  };
  const onLeave = () => (steerTarget = 0);
  canvas.addEventListener("pointermove", onPointer, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });

  // --- State machine -----------------------------------------------------------
  type State = "idle" | "frozen";
  let state: State = "idle";
  let active = true;
  let raf = 0;
  let loops = 0;
  let frozenThisLoop = false;
  let lastTime = 0;
  let elapsed = 0; // freeze clock — advanced by clamped frame deltas so hitches never skip the shot
  let slowFrames = 0;
  let sampled = 0;
  let lastFrameTs = 0;
  let resumeTimer: number | undefined;

  const setRate = (r: number) => {
    try {
      video.playbackRate = r;
    } catch {
      /* some browsers clamp/throw below 0.5 — ignore */
    }
  };

  const showCanvas = (on: boolean) => {
    canvas.style.opacity = on ? "1" : "0";
    canvas.style.pointerEvents = on ? "auto" : "none";
  };

  const beginFreeze = () => {
    if (state === "frozen") return;
    video.pause();
    setRate(1);
    frameTex.needsUpdate = true;
    if (clipVideo && clipTex) {
      reliefUniforms.map.value = clipTex;
      clipVideo.currentTime = 0;
      void clipVideo.play().catch(() => {});
    }
    state = "frozen";
    frozenThisLoop = true;
    elapsed = 0;
    lastFrameTs = 0;
    renderer.setClearColor(BG, 1);
    opts.onPhase?.("frozen");
    // Render the first frame before revealing so the cut is seamless.
    renderFrame(0);
    showCanvas(true);
  };

  const endFreeze = () => {
    state = "idle";
    reliefUniforms.uFreeze.value = 0;
    dropUniforms.uFreeze.value = 0;
    placeCamera(0, 0, 1, 0);
    showCanvas(false);
    renderer.setClearColor(BG, 0);
    if (clipVideo) {
      clipVideo.pause();
      reliefUniforms.map.value = frameTex;
    }
    opts.onPhase?.("releasing");
    setRate(0.5);
    void video.play().catch(() => {});
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      setRate(1);
      opts.onPhase?.("playing");
    }, 420);
  };

  const renderFrame = (elapsed: number) => {
    const p = clamp01(elapsed / opts.freezeDuration);
    const intro = smooth(0, 0.12, p);
    const outro = smooth(0.86, 1, p);
    const amt = intro * (1 - outro);
    const qo = clamp01((p - 0.05) / 0.86);
    const qe = easeInOut(qo);

    steer += (steerTarget - steer) * 0.06;
    const theta = (opts.orbitArc * Math.sin(qe * Math.PI * 2) + steer) * amt;
    const phi = 0.13 * Math.sin(qo * Math.PI) * amt;
    const dolly = 1 - 0.16 * Math.sin(qo * Math.PI) * amt;
    placeCamera(theta, phi, dolly, amt);

    const ring = easeInOut(p) * Math.PI * 2; // full 360° of the shard field
    reliefUniforms.uFreeze.value = amt;
    dropUniforms.uFreeze.value = amt;
    dropUniforms.uSpin.value = ring;
    dropUniforms.uTime.value = elapsed;
    updateShards(elapsed, clamp01(p / 0.14), outro, ring);

    // Sweep the lights + environment so reflections travel across the ice.
    scene.environmentRotation.y = ring * 0.5;
    ice.position.set(pivot.x + Math.cos(ring * 1.3) * 1.6, pivot.y + 0.6, pivot.z + Math.sin(ring * 1.3) * 1.6 + 0.8);
    ember.intensity = 6 * amt;
    ice.intensity = 8 * amt;

    if (composer && bokeh) {
      const u = (bokeh as unknown as { uniforms: Record<string, { value: number }> }).uniforms;
      // Depth pass sees the flat plane, so focus on the subject's plane position.
      u["focus"].value = camera.position.distanceTo(subjectWorld);
      u["aperture"].value = 0.0018 * amt;
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };

  const degrade = () => {
    if (composer) {
      composer.dispose();
      composer = null;
      bokeh = null;
    }
    for (const m of shardMeshes) m.count = Math.max(8, Math.floor(m.count * 0.5));
    renderer.setPixelRatio(1);
    dropUniforms.uPR.value = 1;
    resize();
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (!active) return;

    if (state === "idle") {
      const t = video.currentTime;
      if (t + 0.5 < lastTime) {
        loops++;
        frozenThisLoop = false;
        setRate(1);
      }
      lastTime = t;
      if (!warm || frozenThisLoop || loops >= freezeLoops || video.paused) return;
      const until = opts.freezeAt - t;
      if (until <= 0 && until > -0.4) {
        beginFreeze();
      } else if (until > 0 && until < opts.rampIn) {
        // Bullet-time ramp: 1x → 0.25x as we approach the freeze frame.
        setRate(0.25 + 0.75 * (until / opts.rampIn));
        opts.onPhase?.("ramping");
      }
      return;
    }

    // Frozen: render + adaptive quality guard.
    if (lastFrameTs) {
      const dt = now - lastFrameTs;
      elapsed += Math.min(dt, 50) / 1000;
      if (sampled < 45) {
        sampled++;
        if (dt > 30) slowFrames++;
        if (sampled === 45 && slowFrames > 18) degrade();
      }
    }
    lastFrameTs = now;
    if (elapsed >= opts.freezeDuration) {
      elapsed = 0;
      lastFrameTs = 0;
      endFreeze();
      return;
    }
    renderFrame(elapsed);
  };

  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();
  showCanvas(false);

  // Warm-up: compile every program (transmission, bokeh, droplets) while the canvas
  // is invisible, so the first freeze starts on a hot pipeline instead of stalling.
  let warm = false;
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      renderFrame(opts.freezeDuration * 0.4);
      renderer.setClearColor(BG, 0);
      renderer.clear();
      placeCamera(0, 0, 1, 0);
      warm = true;
    });
  raf = requestAnimationFrame(tick);

  return {
    setActive(next) {
      active = next;
      if (!next && state === "frozen") endFreeze();
    },
    freezeNow() {
      if (state !== "idle" || !warm) return false;
      beginFreeze();
      return true;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      setRate(1);
      composer?.dispose();
      for (const m of shardMeshes) {
        m.geometry.dispose();
        m.dispose();
      }
      shardMat.dispose();
      planeGeo.dispose();
      (relief.material as THREE.Material).dispose();
      dropGeo.dispose();
      (droplets.material as THREE.Material).dispose();
      frameTex.dispose();
      clipTex?.dispose();
      clipVideo?.removeAttribute("src");
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
