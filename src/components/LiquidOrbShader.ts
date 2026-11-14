import { Color, MeshPhysicalMaterial, Vector3, type WebGLProgramParametersWithUniforms } from "three";
import { applyDissolve, DISSOLVE_PRELUDE } from "./OrbDissolveShader.ts";

/** Glass surface and the four neon bands that travel across it. */
export const LIQUID_SURFACE = {
  transmission: 0.95,
  roughness: 0.05,
  thickness: 2.5,
  ior: 1.62,
  iridescence: 1,
  iridescenceIOR: 1.3,
} as const;

export const SPECTRUM = {
  cyan: "#00f3ff",
  violet: "#7000ff",
  magenta: "#ff007f",
  gold: "#ffb700",
} as const;

export type LiquidUniforms = {
  uTime: { value: number };
  uHit: { value: Vector3 };
  uPull: { value: number };
  uForce: { value: Vector3 };
  uOpen: { value: number };
  uVoice: { value: number };
  uListen: { value: number };
  dissolveProgress: { value: number };
  uWave0: { value: Vector3 };
  uWave1: { value: Vector3 };
  uWave2: { value: Vector3 };
  uWaveAge: { value: Vector3 };
};

const SIMPLEX = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const LIQUID = `
uniform float uTime;
uniform vec3 uHit;
uniform float uPull;
uniform vec3 uForce;
uniform float uOpen;
uniform float uVoice;
uniform float uListen;
uniform vec3 uWave0;
uniform vec3 uWave1;
uniform vec3 uWave2;
uniform vec3 uWaveAge;
varying float vRipple;
varying float vPlasma;
varying float vShade;
varying float vFront;

float liquidRing(vec3 n, vec3 origin, float age){
  if(age<0.0) return 0.0;
  float radius=age*1.7;
  float band=exp(-pow((distance(n,origin)-radius)*16.0,2.0));
  return band*(1.0-clamp(age/1.25,0.0,1.0));
}

float liquidRipple(vec3 n){
  return liquidRing(n,uWave0,uWaveAge.x)+liquidRing(n,uWave1,uWaveAge.y)+liquidRing(n,uWave2,uWaveAge.z);
}

float liquidField(vec3 n){
  float phase=uTime*0.35;
  float angle=phase*0.8;
  vec3 spun=vec3(n.x*cos(angle)-n.z*sin(angle), n.y, n.x*sin(angle)+n.z*cos(angle));
  float organic=snoise(n*1.55+vec3(0.0, phase, phase*0.45));
  float lobe=snoise(spun*2.35+vec3(phase*0.2));
  float crystal=pow(abs(n.x),6.0)+pow(abs(n.y),6.0)+pow(abs(n.z),6.0);
  float blend=0.5+0.5*sin(phase*0.65);
  float body=mix(organic, lobe+(crystal-0.55)*0.8, blend)*0.3;
  float fine=snoise(spun*5.2+vec3(uTime*0.5))*0.04;
  float d=distance(n,uHit);
  float bell=exp(-d*d*12.0);
  float thread=0.45+0.55*snoise(vec3(n.xy*7.0, uTime*1.1));
  float drive=clamp(uListen*(0.2+uVoice*1.45),0.0,1.5);
  body*=(1.0+drive*1.35);
  float pulse=snoise(n*(2.2+drive*2.0)+vec3(uTime*(0.7+drive*1.6)))*0.14*drive;
  float goop=bell*thread*max(uPull, drive*0.85)*0.85;
  float drip=bell*clamp(-n.y,0.0,1.0)*max(uPull, drive)*0.35;
  return body+fine+pulse+goop+drip+liquidRipple(n)*0.16;
}

vec3 liquidDisplace(vec3 p){
  vec3 n=normalize(p);
  float drive=clamp(uListen*(0.2+uVoice*1.45),0.0,1.5);
  vec3 outward=n*(length(p)+liquidField(n)+drive*0.08);
  vec3 force=normalize(uForce+vec3(0.0001));
  vec3 strand=normalize(mix(uHit, uHit+force, clamp(max(uPull, drive),0.0,1.0))-n+vec3(0.0001));
  float bell=exp(-dot(n-uHit,n-uHit)*12.0)*max(uPull, drive*0.85);
  vec3 drip=vec3(0.0, -bell*clamp(-n.y+0.15,0.0,1.0)*0.45, 0.0);
  vec3 peelDir=normalize(vec3(force.xy, 0.25));
  float facing=clamp(dot(n, peelDir), 0.0, 1.0);
  vec3 peel=(n*0.72+peelDir)*facing*uOpen*0.95;
  return outward+strand*bell*0.78+drip+peel;
}

vec3 liquidNormal(vec3 p){
  vec3 n=normalize(p);
  vec3 up=abs(n.y)>0.98?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
  vec3 tangent=normalize(cross(n,up));
  vec3 bitangent=normalize(cross(n,tangent));
  float eps=0.02;
  vec3 p0=liquidDisplace(p);
  vec3 p1=liquidDisplace(normalize(p+tangent*eps));
  vec3 p2=liquidDisplace(normalize(p+bitangent*eps));
  return normalize(cross(p1-p0,p2-p0));
}
`;

export function createLiquidUniforms(): LiquidUniforms {
  return {
    uTime: { value: 0 },
    uHit: { value: new Vector3(0, 0, 1) },
    uPull: { value: 0 },
    uForce: { value: new Vector3(0, -0.2, 0.4) },
    uOpen: { value: 0 },
    uVoice: { value: 0 },
    uListen: { value: 0 },
    dissolveProgress: { value: 0 },
    uWave0: { value: new Vector3(0, 0, 1) },
    uWave1: { value: new Vector3(0, 1, 0) },
    uWave2: { value: new Vector3(1, 0, 0) },
    uWaveAge: { value: new Vector3(-1, -1, -1) },
  };
}

/** Inject the liquid field into Three's physical shader before includes are resolved. */
export function applyLiquidShader(vertex: string, fragment: string): { vertex: string; fragment: string } {
  if (!vertex.includes("#include <begin_vertex>") || !vertex.includes("#include <beginnormal_vertex>")) {
    throw new Error("Liquid shader hooks missing");
  }
  if (!fragment.includes("#include <emissivemap_fragment>")) {
    throw new Error("Liquid ripple hook missing");
  }
  const spectrum = [
    "uniform float uTime;",
    "varying float vRipple;",
    "varying float vPlasma;",
    "varying float vShade;",
    "vec3 spectrumShift(float plasma){",
    "  vec3 cyan=vec3(0.0,0.953,1.0);",
    "  vec3 violet=vec3(0.439,0.0,1.0);",
    "  vec3 magenta=vec3(1.0,0.0,0.498);",
    "  vec3 gold=vec3(1.0,0.718,0.0);",
    "  float t=fract(vShade+uTime*0.18+plasma*0.12);",
    "  if(t<0.33) return mix(cyan,violet,t/0.33);",
    "  if(t<0.66) return mix(violet,magenta,(t-0.33)/0.33);",
    "  return mix(magenta,gold,(t-0.66)/0.34);",
    "}",
  ].join("\n");
  const colored = fragment
    .replace("void main() {", `${spectrum}\n${DISSOLVE_PRELUDE}\nvoid main() {`)
    .replace(
      "#include <color_fragment>",
      "#include <color_fragment>\n\tdiffuseColor.rgb = mix(diffuseColor.rgb, spectrumShift(vPlasma), 0.78);",
    )
    .replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += spectrumShift(vPlasma) * (0.34 + vRipple);",
    );
  return {
    vertex: vertex
      .replace("void main() {", `${SIMPLEX}\n${LIQUID}\nvoid main() {`)
      .replace("#include <beginnormal_vertex>", "vec3 objectNormal = liquidNormal(position);")
      .replace(
        "#include <begin_vertex>",
        "vec3 transformed = liquidDisplace(position);\n\tvec3 liquidN = normalize(position);\n\tvRipple = liquidRipple(liquidN);\n\tvPlasma = snoise(liquidN * 2.4 + vec3(uTime * 0.55));\n\tvShade = atan(liquidN.y, liquidN.x) * 0.15915 + 0.5;\n\tvFront = liquidN.z;",
      ),
    fragment: applyDissolve(colored),
  };
}

export function createLiquidMaterial(uniforms: LiquidUniforms): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({
    transmission: LIQUID_SURFACE.transmission,
    roughness: LIQUID_SURFACE.roughness,
    thickness: LIQUID_SURFACE.thickness,
    ior: LIQUID_SURFACE.ior,
    iridescence: LIQUID_SURFACE.iridescence,
    iridescenceIOR: LIQUID_SURFACE.iridescenceIOR,
    iridescenceThicknessRange: [80, 520],
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    metalness: 0.08,
    color: new Color("#e7fbff"),
    attenuationColor: new Color("#d7f7ff"),
    attenuationDistance: 1.6,
  });
  material.customProgramCacheKey = () => "axiom-liquid-orb-4";
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    const next = applyLiquidShader(shader.vertexShader, shader.fragmentShader);
    shader.vertexShader = next.vertex;
    shader.fragmentShader = next.fragment;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uHit = uniforms.uHit;
    shader.uniforms.uPull = uniforms.uPull;
    shader.uniforms.uForce = uniforms.uForce;
    shader.uniforms.uOpen = uniforms.uOpen;
    shader.uniforms.uVoice = uniforms.uVoice;
    shader.uniforms.uListen = uniforms.uListen;
    shader.uniforms.dissolveProgress = uniforms.dissolveProgress;
    shader.uniforms.uWave0 = uniforms.uWave0;
    shader.uniforms.uWave1 = uniforms.uWave1;
    shader.uniforms.uWave2 = uniforms.uWave2;
    shader.uniforms.uWaveAge = uniforms.uWaveAge;
  };
  return material;
}
