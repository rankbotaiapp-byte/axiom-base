import * as THREE from "three";
import { particleFragment, particleVertex } from "./shaders";

export type ParticleMode = 0 | 1 | 2;

interface LayerSpec {
  mode: ParticleMode;
  count: number;
  size: number;
  opacity: number;
  colorA: [number, number, number];
  colorB: [number, number, number];
  /** Spawn volume (ignored for embers, which are emitted from the exhaust). */
  bounds: { x: number; y: number; zMin: number; zMax: number };
}

const LAYERS: LayerSpec[] = [
  {
    mode: 0,
    count: 1600,
    size: 2.2,
    opacity: 0.55,
    colorA: [0.55, 0.72, 1.0],
    colorB: [0.75, 0.95, 1.0],
    bounds: { x: 26, y: 15, zMin: -30, zMax: -4 },
  },
  {
    mode: 1,
    count: 720,
    size: 3.4,
    opacity: 0.95,
    colorA: [0.55, 0.97, 1.0],
    colorB: [0.12, 0.32, 1.0],
    bounds: { x: 0, y: 0, zMin: 0, zMax: 0 },
  },
  {
    mode: 2,
    count: 34,
    size: 26,
    opacity: 0.16,
    colorA: [0.13, 0.83, 0.93],
    colorB: [0.39, 0.4, 0.95],
    bounds: { x: 7, y: 4.2, zMin: 4, zMax: 7.2 },
  },
];

export interface ParticleField {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
  setUniform: <K extends keyof ParticleUniformValues>(key: K, value: ParticleUniformValues[K]) => void;
  dispose: () => void;
}

export interface ParticleUniformValues {
  uTime: number;
  uSurge: number;
  uSwirl: number;
  uPixelRatio: number;
  uLean: THREE.Vector2;
  uEmitA: THREE.Vector3;
  uEmitB: THREE.Vector3;
}

/** Builds the far / mid / near particle layers. Motion is fully GPU-driven. */
export function createParticleField(scale: number, pixelRatio: number): ParticleField {
  const group = new THREE.Group();
  const materials: THREE.ShaderMaterial[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  const shared = {
    uTime: { value: 0 },
    uSurge: { value: 0 },
    uSwirl: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uLean: { value: new THREE.Vector2() },
    uEmitA: { value: new THREE.Vector3(1, -1, 0) },
    uEmitB: { value: new THREE.Vector3(3, -1, 0) },
  };

  for (const layer of LAYERS) {
    const count = Math.max(8, Math.round(layer.count * scale));
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * layer.bounds.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * layer.bounds.y;
      positions[i * 3 + 2] = layer.bounds.zMin + Math.random() * (layer.bounds.zMax - layer.bounds.zMin);
      for (let s = 0; s < 4; s++) seeds[i * 4 + s] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    // Embers move far from their stored positions — never frustum-cull them.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      defines: { MODE: layer.mode },
      uniforms: {
        ...shared,
        uSize: { value: layer.size },
        uOpacity: { value: layer.opacity },
        uColorA: { value: new THREE.Color(...layer.colorA) },
        uColorB: { value: new THREE.Color(...layer.colorB) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = layer.mode;
    group.add(points);
    materials.push(material);
    geometries.push(geometry);
  }

  return {
    group,
    materials,
    setUniform(key, value) {
      const uniform = shared[key] as { value: unknown };
      uniform.value = value;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
