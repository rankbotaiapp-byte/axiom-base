/**
 * WebGL freeze-pan overlay for the underwater leopard cinematic.
 *
 * The HTML video stays the quality source. On freeze we pause that element,
 * bake its frame into an environment map (so ice refracts the subject), and
 * orbit a field of refractive shards + water particles 360° around it.
 */

import * as THREE from "three";
import { freezeOverlayAmount, freezePanOrbit } from "./freeze-pan-orbit.ts";

export type FreezePanHandle = {
  start: () => void;
  stop: () => void;
  triggerFreeze: () => void;
  resize: () => void;
  dispose: () => void;
  isFreezing: () => boolean;
};

export type FreezePanOptions = {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  orbitSeconds?: number;
  reduceMotion?: boolean;
};

function makeParticleTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.35, "rgba(190,236,255,0.55)");
    g.addColorStop(1, "rgba(190,236,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function iceMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d7f4ff"),
    metalness: 0.02,
    roughness: 0.08,
    transmission: 0.88,
    thickness: 0.7,
    ior: 1.31,
    transparent: true,
    opacity: 0,
    envMapIntensity: 1.55,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    specularIntensity: 1,
    specularColor: new THREE.Color("#ecfbff"),
    attenuationColor: new THREE.Color("#9fd8f2"),
    attenuationDistance: 2.4,
    depthWrite: false,
  });
}

type Shard = {
  base: THREE.Vector3;
  spin: THREE.Vector3;
  scale: THREE.Vector3;
  phase: number;
};

function seedShards(count: number): Shard[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const ring = 1.05 + (i % 9) * 0.22;
    const y = ((i % 7) - 3) * 0.28;
    return {
      base: new THREE.Vector3(Math.cos(a) * ring, y, Math.sin(a) * ring * 0.72),
      spin: new THREE.Vector3(0.35 + (i % 3) * 0.22, 0.5 + (i % 4) * 0.18, 0.28 + (i % 5) * 0.12),
      scale: new THREE.Vector3(0.28 + (i % 5) * 0.1, 0.55 + (i % 4) * 0.16, 0.22 + (i % 6) * 0.08),
      phase: i * 0.41,
    };
  });
}

export function createFreezePanScene(opts: FreezePanOptions): FreezePanHandle {
  const orbitSeconds = Math.max(2.6, opts.orbitSeconds ?? 4.2);
  const reduceMotion = Boolean(opts.reduceMotion);
  const { canvas, video } = opts;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.08, 80);
  camera.position.set(0, 0.18, 5.55);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xc8eeff, 2.6);
  key.position.set(3.2, 4.4, 2.6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6ec8ff, 0.7);
  fill.position.set(-3.6, 0.8, -2.2);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x6a90a8, 0.28));
  const rim = new THREE.PointLight(0xb8f4ff, 1.8, 16);
  rim.position.set(0.4, 0.7, 2.8);
  scene.add(rim);
  const caustic = new THREE.PointLight(0x7ad7ff, 1.1, 12);
  caustic.position.set(-1.4, -0.4, 1.6);
  scene.add(caustic);

  const root = new THREE.Group();
  scene.add(root);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = 1280;
  frameCanvas.height = 720;
  const frameCtx = frameCanvas.getContext("2d", { alpha: false });
  const frameTex = new THREE.CanvasTexture(frameCanvas);
  frameTex.colorSpace = THREE.SRGBColorSpace;
  frameTex.minFilter = THREE.LinearFilter;
  frameTex.magFilter = THREE.LinearFilter;
  frameTex.generateMipmaps = false;

  const tetraGeo = new THREE.TetrahedronGeometry(0.38, 0);
  tetraGeo.scale(1, 1.7, 0.52);
  tetraGeo.computeVertexNormals();
  const icoGeo = new THREE.IcosahedronGeometry(0.26, 0);
  icoGeo.computeVertexNormals();

  const iceA = iceMaterial();
  const iceB = iceMaterial();
  const SHARD_A = reduceMotion ? 10 : 36;
  const SHARD_B = reduceMotion ? 8 : 28;
  const meshA = new THREE.InstancedMesh(tetraGeo, iceA, SHARD_A);
  const meshB = new THREE.InstancedMesh(icoGeo, iceB, SHARD_B);
  meshA.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshB.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshA.frustumCulled = false;
  meshB.frustumCulled = false;
  root.add(meshA, meshB);

  const shardsA = seedShards(SHARD_A);
  const shardsB = seedShards(SHARD_B).map((s, i) => {
    s.base.multiplyScalar(1.18);
    s.base.y += ((i % 3) - 1) * 0.15;
    return s;
  });

  const PARTICLE_COUNT = reduceMotion ? 48 : 220;
  const particlePos = new Float32Array(PARTICLE_COUNT * 3);
  const particlePhase = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.6 + Math.random() * 3.4;
    particlePos[i * 3] = Math.cos(a) * r;
    particlePos[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
    particlePos[i * 3 + 2] = Math.sin(a) * r * 0.7;
    particlePhase[i] = Math.random() * Math.PI * 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
  const particleTex = makeParticleTexture();
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      map: particleTex,
      color: new THREE.Color("#e7f8ff"),
      size: 0.11,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  root.add(particles);

  const dummy = new THREE.Object3D();
  let raf = 0;
  let running = false;
  let freezing = false;
  let freezeT = 0;
  let last = 0;
  let envTarget: THREE.WebGLRenderTarget | null = null;

  function sampleFrame() {
    if (!frameCtx) return;
    try {
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      if (vw > 0 && vh > 0) {
        frameCanvas.width = vw;
        frameCanvas.height = vh;
        frameCtx.drawImage(video, 0, 0, vw, vh);
        frameTex.needsUpdate = true;
      }
    } catch {
      /* CORS / decode races — keep prior frame */
    }
  }

  function bakeEnv() {
    const envScene = new THREE.Scene();
    envScene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(6, 24, 16),
        new THREE.MeshBasicMaterial({ map: frameTex, side: THREE.BackSide }),
      ),
    );
    const pmrem = new THREE.PMREMGenerator(renderer);
    const next = pmrem.fromScene(envScene, 0.06);
    iceA.envMap = next.texture;
    iceB.envMap = next.texture;
    iceA.needsUpdate = true;
    iceB.needsUpdate = true;
    envTarget?.dispose();
    envTarget = next;
    pmrem.dispose();
    envScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | undefined;
      mat?.dispose();
    });
  }

  function resize() {
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || canvas.clientWidth || 640;
    const h = parent?.clientHeight || canvas.clientHeight || 360;
    const width = Math.max(1, Math.floor(w));
    const height = Math.max(1, Math.floor(h));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function setOverlayVisible(amount: number) {
    const a = Math.min(1, Math.max(0, amount));
    (particles.material as THREE.PointsMaterial).opacity = a * 0.9;
    iceA.opacity = a * 0.92;
    iceB.opacity = a * 0.88;
  }

  function writeShards(list: Shard[], mesh: THREE.InstancedMesh, t: number, grow: number) {
    for (let i = 0; i < list.length; i += 1) {
      const s = list[i]!;
      const bob = Math.sin(t * 1.35 + s.phase) * 0.1;
      dummy.position.set(s.base.x, s.base.y + bob, s.base.z);
      dummy.rotation.set(t * s.spin.x + s.phase, t * s.spin.y, t * s.spin.z);
      dummy.scale.set(s.scale.x * grow, s.scale.y * grow, s.scale.z * grow);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function resetCamera() {
    camera.position.set(0, 0.18, 5.55);
    camera.lookAt(0, 0, 0);
  }

  function tick(now: number) {
    if (!running) return;
    raf = window.requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    if (!freezing) {
      renderer.clear();
      return;
    }

    freezeT += dt;
    const u = Math.min(1, freezeT / orbitSeconds);
    const orbit = freezePanOrbit(u);
    camera.position.set(orbit.x, orbit.y, orbit.z);
    camera.lookAt(0, 0, 0);

    const overlay = freezeOverlayAmount(u);
    setOverlayVisible(overlay);

    const grow = 0.45 + overlay * 0.7;
    writeShards(shardsA, meshA, freezeT, grow);
    writeShards(shardsB, meshB, freezeT, grow * 0.92);

    const pos = particleGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const ix = i * 3;
      arr[ix + 1] = arr[ix + 1]! + Math.sin(freezeT * 1.15 + particlePhase[i]!) * 0.0024;
      arr[ix] = arr[ix]! + Math.cos(freezeT * 0.65 + particlePhase[i]!) * 0.0016;
    }
    pos.needsUpdate = true;

    rim.intensity = 1.15 + Math.sin(freezeT * 3.1) * 0.5;
    caustic.intensity = 0.85 + Math.sin(freezeT * 2.2 + 1.1) * 0.4;
    caustic.position.x = Math.sin(freezeT * 0.7) * 1.6;

    renderer.render(scene, camera);

    if (u >= 1) {
      freezing = false;
      freezeT = 0;
      setOverlayVisible(0);
      resetCamera();
      renderer.clear();
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      void video.play().catch(() => undefined);
    }
  }

  function start() {
    resize();
  }

  function stop() {
    running = false;
    freezing = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    setOverlayVisible(0);
    renderer.clear();
  }

  function triggerFreeze() {
    if (reduceMotion || freezing) return;
    sampleFrame();
    bakeEnv();
    try {
      video.pause();
    } catch {
      /* ignore */
    }
    freezing = true;
    freezeT = 0;
    if (!running) {
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(tick);
    }
  }

  function dispose() {
    stop();
    tetraGeo.dispose();
    icoGeo.dispose();
    iceA.dispose();
    iceB.dispose();
    particleGeo.dispose();
    (particles.material as THREE.PointsMaterial).dispose();
    particleTex.dispose();
    frameTex.dispose();
    envTarget?.dispose();
    envTarget = null;
    renderer.dispose();
  }

  resize();
  return {
    start,
    stop,
    triggerFreeze,
    resize,
    dispose,
    isFreezing: () => freezing,
  };
}
