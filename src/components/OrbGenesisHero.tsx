import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  EquirectangularReflectionMapping,
  HalfFloatType,
  Mesh,
  MeshPhysicalMaterial,
  NoColorSpace,
  PMREMGenerator,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  morphProfileFromPrompt,
  morphProfileIndex,
  parseMorphDuration,
  type MorphProfile,
} from "@/lib/axiom/hero-brand";

type OrbUniforms = {
  uTime: { value: number };
  uMorph: { value: number };
  uProfile: { value: number };
  uWhirl: { value: number };
  uEtch: { value: Texture | null };
};

const ORB_HDR = "/textures/space_hdr.hdr";

const VERT_HEAD = `
uniform float uTime;
uniform float uMorph;
uniform float uProfile;
uniform float uWhirl;
uniform sampler2D uEtch;
varying vec3 vOrbPos;
float orbHash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float orbNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = orbHash(i);
  float n100 = orbHash(i + vec3(1.0, 0.0, 0.0));
  float n010 = orbHash(i + vec3(0.0, 1.0, 0.0));
  float n110 = orbHash(i + vec3(1.0, 1.0, 0.0));
  float n001 = orbHash(i + vec3(0.0, 0.0, 1.0));
  float n101 = orbHash(i + vec3(1.0, 0.0, 1.0));
  float n011 = orbHash(i + vec3(0.0, 1.0, 1.0));
  float n111 = orbHash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}
vec3 orbTarget(vec3 p, float profile) {
  float y = p.y;
  vec3 vessel = p;
  float pinch = 1.0 - 0.42 * smoothstep(-0.15, 0.35, y) * (1.0 - smoothstep(0.35, 0.85, y));
  float lip = 1.0 + 0.28 * smoothstep(0.72, 1.0, y);
  float base = 1.0 + 0.18 * smoothstep(-0.2, -0.85, y);
  vessel.xz *= pinch * lip * base;
  vessel.y *= 1.35;
  vec3 skull = p * vec3(1.0, 0.92, 0.78);
  float eyeL = smoothstep(0.22, 0.0, length(p - vec3(-0.28, 0.18, 0.72)));
  float eyeR = smoothstep(0.22, 0.0, length(p - vec3(0.28, 0.18, 0.72)));
  skull -= normalize(p + vec3(0.001)) * (eyeL + eyeR) * 0.35;
  float jaw = smoothstep(-0.05, -0.55, p.y);
  skull.x *= 1.0 - jaw * 0.22;
  vec3 logo = p;
  logo.z *= 0.28;
  float ring = smoothstep(0.12, 0.0, abs(length(p.xy) - 0.62));
  logo.z += ring * 0.22;
  vec3 shaped = p;
  shaped = mix(shaped, vessel, step(0.5, profile) * (1.0 - step(1.5, profile)));
  shaped = mix(shaped, skull, step(1.5, profile) * (1.0 - step(2.5, profile)));
  shaped = mix(shaped, logo, step(2.5, profile));
  return shaped;
}
`;

const VERT_BODY = `
#include <begin_vertex>
vec3 shaped = orbTarget(position, uProfile);
float ripple = orbNoise(position * 3.4 + vec3(uTime * 0.35)) - 0.5;
float pulse = sin(uTime * 1.4) * 0.028;
float fluid = sin(uMorph * 3.14159);
transformed = mix(transformed, shaped, smoothstep(0.0, 1.0, uMorph));
transformed += normalize(normal) * (ripple * 0.085 * (1.0 - uMorph * 0.55) + pulse + fluid * 0.11);
float etch = texture2D(uEtch, uv).r;
transformed += normalize(normal) * (etch - 0.5) * uMorph * 0.16;
float ang = uWhirl * (1.0 - min(length(position.xy), 1.0));
float cs = cos(ang);
float sn = sin(ang);
transformed.xz = mat2(cs, -sn, sn, cs) * transformed.xz;
vOrbPos = transformed;
`;

const NORMAL_BODY = `
#include <beginnormal_vertex>
objectNormal = normalize(mix(objectNormal, orbTarget(position, uProfile), uMorph * 0.7));
vec3 whirlP = normalize(position);
objectNormal = normalize(objectNormal + vec3(-whirlP.y, whirlP.x, 0.0) * uWhirl * 0.48);
`;

const FRAG_HEAD = `
uniform float uTime;
uniform float uMorph;
uniform float uWhirl;
varying vec3 vOrbPos;
float orbFragHash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float orbFragNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = orbFragHash(i);
  float n100 = orbFragHash(i + vec3(1.0, 0.0, 0.0));
  float n010 = orbFragHash(i + vec3(0.0, 1.0, 0.0));
  float n110 = orbFragHash(i + vec3(1.0, 1.0, 0.0));
  float n001 = orbFragHash(i + vec3(0.0, 0.0, 1.0));
  float n101 = orbFragHash(i + vec3(1.0, 0.0, 1.0));
  float n011 = orbFragHash(i + vec3(0.0, 1.0, 1.0));
  float n111 = orbFragHash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}
`;

const NORMAL_FRAG = `
#include <normal_fragment_begin>
vec3 fluidP = normalize(vOrbPos);
float coarse = orbFragNoise(fluidP * 6.5 + vec3(uTime * 0.42, uWhirl, 0.0));
float fine = orbFragNoise(fluidP * 14.0 - vec3(0.0, uTime * 0.75, uWhirl));
vec3 curl = vec3(-fluidP.y, fluidP.x, fluidP.z * 0.2) * uWhirl * 0.7;
normal = normalize(normal + curl + fluidP * ((coarse - 0.5) * 0.46 + (fine - 0.5) * 0.22));
`;

const FRAG_BODY = `
#include <opaque_fragment>
const float ORB_IOR = 1.58;
float f0 = pow((ORB_IOR - 1.0) / (ORB_IOR + 1.0), 2.0);
float facing = clamp(abs(normalize(vOrbPos).z), 0.0, 1.0);
float rimA = pow(1.0 - facing, 1.25);
float rimB = pow(1.0 - facing, 2.15);
float rimC = pow(1.0 - facing, 3.45);
float schlick = f0 + (1.0 - f0) * rimA;
float spin = 0.7 + abs(uWhirl) * 0.9;
vec3 fringe = vec3(rimA * 1.05, rimB * 0.62, rimC * 1.25) * spin;
float caustic = pow(0.5 + 0.5 * sin(vOrbPos.x * 18.0 + vOrbPos.y * 14.0 + uTime * 1.7 + uWhirl * 5.0), 3.0);
float spark = pow(max(dot(normalize(normal), normalize(vec3(0.32, 0.84, 0.42))), 0.0), 56.0);
gl_FragColor.r = mix(gl_FragColor.r, gl_FragColor.g, rimA * 0.22 * spin);
gl_FragColor.g = mix(gl_FragColor.g, gl_FragColor.b, rimB * 0.16 * spin);
gl_FragColor.b = mix(gl_FragColor.b, gl_FragColor.r, rimC * 0.28 * spin);
gl_FragColor.rgb += vec3(0.82, 0.94, 1.0) * caustic * 0.2 * (1.0 - uMorph * 0.25);
gl_FragColor.rgb += fringe * 0.32;
gl_FragColor.rgb += vec3(1.0, 0.98, 0.94) * spark * schlick * (1.35 + abs(uWhirl));
`;

const SHELL_VERT = `
varying vec3 vShellN;
varying vec3 vShellV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vShellN = normalize(normalMatrix * normal);
  vShellV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const SHELL_FRAG = `
varying vec3 vShellN;
varying vec3 vShellV;
void main() {
  float rimA = pow(1.0 - abs(dot(normalize(vShellN), normalize(vShellV))), 1.4);
  float rimB = pow(1.0 - abs(dot(normalize(vShellN), normalize(vShellV))), 2.8);
  float rimC = pow(1.0 - abs(dot(normalize(vShellN), normalize(vShellV))), 4.2);
  vec3 glow = vec3(rimA * 0.55, rimB * 0.85, rimC);
  gl_FragColor = vec4(glow, max(rimA, rimC) * 0.42);
}
`;

const DROP_VERT = `
attribute float aSize;
uniform float uWhirl;
void main() {
  vec3 p = position;
  float ang = uWhirl * 0.85;
  float cs = cos(ang);
  float sn = sin(ang);
  p.xz = mat2(cs, -sn, sn, cs) * p.xz;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * 220.0 / max(0.25, -mv.z);
}
`;

const DROP_FRAG = `
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  if (d > 1.0) discard;
  float core = pow(1.0 - d, 1.7);
  gl_FragColor = vec4(0.9, 0.97, 1.0, core * 0.8);
}
`;

const GLASS = new Color("#e7eef6");
const GLASS_TINT = new Color("#8ec9de");
const SPECULAR = new Color("#f7fbff");
const STUDIO_KEY = new Color("#f4f1ea");
const STUDIO_RIM = new Color("#b7d7ff");

function patchOrbMaterial(material: MeshPhysicalMaterial, uniforms: OrbUniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uMorph = uniforms.uMorph;
    shader.uniforms.uProfile = uniforms.uProfile;
    shader.uniforms.uWhirl = uniforms.uWhirl;
    shader.uniforms.uEtch = uniforms.uEtch;
    shader.vertexShader = VERT_HEAD + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", NORMAL_BODY);
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", VERT_BODY);
    shader.fragmentShader = FRAG_HEAD + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", NORMAL_FRAG);
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", FRAG_BODY);
  };
  material.customProgramCacheKey = () => "orb-genesis-v2";
  material.needsUpdate = true;
}

function etchTexture(name: string, tagline: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not etch the orb");
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#f4f4f4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 58px serif";
  ctx.fillText(name || "Axiom", 256, 230, 460);
  ctx.fillStyle = "#cfcfcf";
  ctx.font = "26px sans-serif";
  if (tagline) ctx.fillText(tagline, 256, 300, 440);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function starTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not build the star field");
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#141824");
  sky.addColorStop(1, "#05060a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);
  const key = ctx.createRadialGradient(140, 48, 8, 150, 70, 120);
  key.addColorStop(0, "rgba(255, 250, 240, 0.95)");
  key.addColorStop(1, "rgba(255, 250, 240, 0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, 512, 256);
  const rim = ctx.createRadialGradient(430, 140, 6, 430, 150, 100);
  rim.addColorStop(0, "rgba(170, 214, 255, 0.8)");
  rim.addColorStop(1, "rgba(170, 214, 255, 0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 180; i += 1) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 256;
    const r = 0.4 + (i % 5) * 0.35;
    ctx.fillStyle = i % 7 === 0 ? "#d7e7ff" : "#f4f1ea";
    ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new CanvasTexture(canvas);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function useSpaceEnvironment(gl: WebGLRenderer) {
  const [map, setMap] = useState<Texture | null>(null);
  useEffect(() => {
    let dead = false;
    const pmrem = new PMREMGenerator(gl);
    const finish = (source: Texture) => {
      const env = pmrem.fromEquirectangular(source).texture;
      source.dispose();
      pmrem.dispose();
      if (dead) env.dispose();
      else setMap(env);
    };
    const loader = new RGBELoader();
    void loader
      .loadAsync(ORB_HDR)
      .then((hdr) => {
        if (dead) {
          hdr.dispose();
          pmrem.dispose();
          return;
        }
        hdr.mapping = EquirectangularReflectionMapping;
        finish(hdr);
      })
      .catch(() => {
        if (dead) {
          pmrem.dispose();
          return;
        }
        finish(starTexture());
      });
    return () => {
      dead = true;
    };
  }, [gl]);
  useEffect(() => () => map?.dispose(), [map]);
  return map;
}

function ProductPlate({ url }: { url: string }) {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: Texture | null = null;
    new TextureLoader().load(url, (next) => {
      next.colorSpace = SRGBColorSpace;
      loaded = next;
      if (alive) setTex(next);
      else next.dispose();
    });
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [url]);
  if (!tex) return null;
  return (
    <mesh position={[0, 0, -0.55]}>
      <planeGeometry args={[2.8, 3.4]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function OrbMesh({
  profile,
  duration,
  name,
  tagline,
  plateUrl,
  reduced,
}: {
  profile: MorphProfile;
  duration: number;
  name: string;
  tagline: string;
  plateUrl: string;
  reduced: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const env = useSpaceEnvironment(gl);
  const mesh = useRef<Mesh>(null);
  const morph = useRef(0);
  const pointer = useRef(0);
  const lastX = useRef<number | null>(null);
  const uniforms = useMemo<OrbUniforms>(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uProfile: { value: morphProfileIndex(profile) },
      uWhirl: { value: 0 },
      uEtch: { value: null },
    }),
    [profile],
  );
  const material = useMemo(() => {
    const mat = new MeshPhysicalMaterial({
      color: GLASS,
      metalness: 0.04,
      roughness: 0.03,
      transmission: 1,
      thickness: 2.2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 1,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [100, 440],
      specularIntensity: 1.7,
      specularColor: SPECULAR,
      envMapIntensity: 2.7,
      attenuationColor: GLASS_TINT,
      attenuationDistance: 1.25,
    });
    mat.ior = 1.58;
    mat.dispersion = 1.2;
    patchOrbMaterial(mat, uniforms);
    return mat;
  }, [uniforms]);
  const shell = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  const droplets = useMemo(() => {
    const count = 96;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const theta = (i * 2.399) % (Math.PI * 2);
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const radius = 1.22 + (i % 7) * 0.07;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      sizes[i] = i % 4 === 0 ? 0.045 : 0.016 + (i % 3) * 0.006;
    }
    const mat = new ShaderMaterial({
      uniforms: { uWhirl: uniforms.uWhirl },
      vertexShader: DROP_VERT,
      fragmentShader: DROP_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { positions, sizes, mat };
  }, [uniforms]);

  useEffect(() => {
    uniforms.uProfile.value = morphProfileIndex(profile);
    morph.current = 0;
  }, [profile, uniforms]);

  useEffect(() => {
    const tex = etchTexture(name, tagline);
    uniforms.uEtch.value = tex;
    return () => tex.dispose();
  }, [name, tagline, uniforms]);

  useEffect(
    () => () => {
      material.dispose();
      shell.dispose();
      droplets.mat.dispose();
    },
    [material, shell, droplets],
  );

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    const span = reduced ? 0.28 : duration;
    morph.current = Math.min(1, morph.current + step / span);
    uniforms.uMorph.value = morph.current;
    uniforms.uTime.value += step;
    pointer.current *= Math.exp(-step * 1.7);
    uniforms.uWhirl.value = pointer.current;
  });

  return (
    <>
      {env ? <StarEnvironment map={env} /> : null}
      {plateUrl ? <ProductPlate url={plateUrl} /> : null}
      <GlowPass />
      <ambientLight intensity={0.22} />
      <spotLight position={[2.6, 3.4, 3.2]} angle={0.42} penumbra={0.55} intensity={12} color={STUDIO_KEY} />
      <directionalLight position={[-3.6, 0.6, -2.2]} intensity={1.6} color={STUDIO_RIM} />
      <mesh material={shell} scale={1.12}>
        <icosahedronGeometry args={[1.05, 4]} />
      </mesh>
      <points material={droplets.mat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[droplets.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[droplets.sizes, 1]} />
        </bufferGeometry>
      </points>
      <mesh
        ref={mesh}
        material={material}
        onPointerMove={(event) => {
          const dx = lastX.current == null ? 0 : event.clientX - lastX.current;
          lastX.current = event.clientX;
          pointer.current = Math.max(-1.5, Math.min(1.5, pointer.current + dx * 0.02));
        }}
        onPointerLeave={() => {
          lastX.current = null;
        }}
      >
        <icosahedronGeometry args={[1.05, 5]} />
      </mesh>
    </>
  );
}

function GlowPass() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);

  useLayoutEffect(() => {
    if (size.width < 2 || size.height < 2) return;
    const effect = new EffectComposer(
      gl,
      new WebGLRenderTarget(Math.max(2, size.width), Math.max(2, size.height), {
        type: HalfFloatType,
        format: RGBAFormat,
      }),
    );
    effect.addPass(new RenderPass(scene, camera));
    effect.addPass(new UnrealBloomPass(new Vector2(size.width, size.height), 0.32, 0.46, 0.78));
    effect.addPass(new OutputPass());
    effect.setSize(size.width, size.height);
    composer.current = effect;
    return () => {
      composer.current = null;
      effect.dispose();
    };
  }, [gl, scene, camera, size.height, size.width]);

  useFrame(() => {
    if (composer.current) composer.current.render();
    else gl.render(scene, camera);
  }, 1);

  return null;
}

function StarEnvironment({ map }: { map: Texture }) {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const previous = scene.environment;
    scene.environment = map;
    return () => {
      scene.environment = previous;
    };
  }, [map, scene]);
  return null;
}

export function OrbGenesisHero({
  prompt = "",
  durationSec = 4.5,
  name = "",
  tagline = "",
  plateUrl = "",
}: {
  prompt?: string;
  durationSec?: number;
  name?: string;
  tagline?: string;
  plateUrl?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(true);
  const reduce = useReducedMotion();
  const profile = morphProfileFromPrompt(prompt);
  const duration = parseMorphDuration(durationSec);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const watcher = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  return (
    <div
      ref={root}
      className="hero-orb-stage"
      data-orb={live ? "live" : "rest"}
      data-profile={profile}
      data-morph={live ? "on" : "off"}
    >
      {live ? (
        <Canvas
          camera={{ position: [0, 0.05, 3.15], fov: 35 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <OrbMesh
            profile={profile}
            duration={duration}
            name={name}
            tagline={tagline}
            plateUrl={plateUrl}
            reduced={Boolean(reduce)}
          />
        </Canvas>
      ) : null}
    </div>
  );
}
