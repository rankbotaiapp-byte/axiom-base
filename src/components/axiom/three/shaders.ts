/* GLSL for the Axiom stage. Kept as plain strings so there's no loader config. */

const COMMON = /* glsl */ `
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0., -1./3., 2./3., -1.);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6. * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c){
  vec3 p = abs(fract(c.xxx + vec3(0., 2./3., 1./3.)) * 6. - 3.);
  return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
`;

/* ------------------------------ CHARACTER ------------------------------ */

export const characterVertex = /* glsl */ `
uniform float uDepth;
varying vec2 vUv;
varying float vBulge;
void main(){
  vUv = uv;
  vec3 p = position;
  // Pseudo-3D: bulge the body forward so tilt reveals curvature (helmet + torso ellipses).
  vec2 h = (uv - vec2(0.51, 0.70)) / vec2(0.26, 0.20);
  vec2 b = (uv - vec2(0.51, 0.45)) / vec2(0.30, 0.22);
  float bulge = max(1. - dot(h,h), 0.) * 1.0 + max(1. - dot(b,b), 0.) * 0.8;
  bulge = pow(clamp(bulge, 0., 1.2), 0.7);
  p.z += bulge * uDepth;
  vBulge = bulge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}
`;

export const characterFragment = /* glsl */ `
${COMMON}
uniform sampler2D uMap;
uniform float uTime;
uniform float uAspect;
uniform float uFeather;
uniform float uArmorShift;
uniform float uArmorSpeed;
uniform vec3  uSheen;
uniform vec2  uVisorC;      // uv
uniform vec2  uVisorR;      // uv half-size
uniform vec2  uEyeL;        // uv
uniform vec2  uEyeR;        // uv
uniform float uEyeRadius;   // image-height units
uniform vec3  uEyeColor;
uniform vec2  uLook;        // -1..1
uniform vec2  uBlink;       // per eye 0 open .. 1 closed
uniform float uLidTop;
uniform float uLidBottom;
uniform float uLidAngle;
uniform vec2  uEyeScale;
uniform vec2  uBrowLift;
uniform float uBrowTilt;
uniform float uPupil;
uniform float uHover;
uniform float uBoost;
varying vec2 vUv;
varying float vBulge;

float sdRing(vec2 p, float r, float w){ return smoothstep(w, w*0.35, abs(length(p) - r)); }

// One LED eye in eye-radius units. side = -1 left, +1 right.
float drawEye(vec2 p, float blink, float side, out float glow){
  float topK = max(uLidTop, blink * 0.93);
  float botK = max(uLidBottom, blink * 0.93);
  float topEdge = mix(1.15, -0.05, topK) + uLidAngle * p.x * side * 0.9;
  float botEdge = mix(-1.15, 0.05, botK);
  float vis = smoothstep(0.0, 0.07, topEdge - p.y) * smoothstep(0.0, 0.07, p.y - botEdge);

  float r = length(p);
  float ring  = sdRing(p, 0.82, 0.17);
  vec2 pc = p - uLook * 0.28;
  float pupil = smoothstep(0.40 * uPupil, 0.30 * uPupil, length(pc));
  float spark = smoothstep(0.13, 0.06, length(pc - vec2(0.16, 0.18)));
  pupil = max(pupil - spark, 0.0) * 0.85;
  float inside = smoothstep(1.02, 0.95, r);

  // top lid line (blink / sleepy / focused)
  float lid = smoothstep(0.11, 0.03, abs(p.y - topEdge)) * inside * step(0.04, topK);
  float eye = max(max(ring, pupil) * vis, lid);

  // brow
  vec2 pb = p - vec2(0.0, 1.62 + (side < 0. ? uBrowLift.x : uBrowLift.y));
  float a = uBrowTilt * side;
  pb = mat2(cos(a), -sin(a), sin(a), cos(a)) * pb;
  float brow = smoothstep(0.12, 0.04, abs(pb.y + 0.12 * pb.x * pb.x)) * smoothstep(0.9, 0.7, abs(pb.x));
  eye = max(eye, brow);

  glow = exp(-abs(r - 0.82) * 3.5) * vis * 0.5 + brow * 0.3;
  return eye;
}

void main(){
  vec4 tex = texture2D(uMap, vUv);
  vec3 col = tex.rgb;
  vec2 q = vec2(vUv.x * uAspect, vUv.y);

  /* --- color-shifting armor: only copper/bronze pixels --- */
  vec3 hsv = rgb2hsv(col);
  float hueBand = (1. - smoothstep(0.09, 0.13, hsv.x)) + smoothstep(0.95, 0.99, hsv.x);
  float copper = clamp(hueBand, 0., 1.) * smoothstep(0.35, 0.6, hsv.y) * smoothstep(0.18, 0.4, hsv.z);
  float wave = sin(uTime * uArmorSpeed + vUv.y * 7.0 - vUv.x * 3.0) * 0.5 + 0.5;
  vec3 shifted = hsv2rgb(vec3(fract(hsv.x + (wave - 0.5) * 0.10 + 0.98), hsv.y * (0.95 + 0.1 * wave), hsv.z * (1.0 + 0.18 * wave)));
  col = mix(col, shifted, copper * uArmorShift);
  float sheen = pow(max(0., sin((vUv.x * 0.6 + vUv.y) * 9.0 - uTime * uArmorSpeed * 1.7)), 14.0);
  col += copper * sheen * 0.35 * uArmorShift * uSheen * (0.6 + 0.4 * vBulge);
  // booster bounce light on lower body
  col += copper * uBoost * 0.08 * vec3(0.3, 0.9, 1.0) * smoothstep(0.55, 0.3, vUv.y);

  /* --- visor: wipe baked-in eyes, then draw the live LED face --- */
  vec2 vd = abs(vUv - uVisorC) / uVisorR;
  float sq = pow(pow(vd.x, 4.0) + pow(vd.y, 4.0), 0.25);
  float visor = smoothstep(1.0, 0.86, sq);
  vec3 glass = vec3(0.012, 0.022, 0.03) + vec3(0.0, 0.03, 0.04) * (1.0 - vd.y);
  // glossy reflection arc
  float refl = smoothstep(0.08, 0.0, abs(length((vUv - uVisorC) / uVisorR - vec2(0.15, -0.35)) - 1.05)) * smoothstep(0.2, -0.6, (vUv.x - uVisorC.x) / uVisorR.x);
  glass += refl * 0.10;
  col = mix(col, glass, visor);

  float led = 0.55 + 0.45 * smoothstep(0.55, 0.15, length(fract(q * 230.0) - 0.5));
  float scan = 0.88 + 0.12 * sin(q.y * 1400.0 - uTime * 6.0);
  float flick = 0.94 + 0.06 * noise(vec2(uTime * 9.0, 0.0));
  vec2 look = uLook * vec2(0.012, 0.008);

  vec2 cl = vec2(uEyeL.x * uAspect, uEyeL.y) + look;
  vec2 cr = vec2(uEyeR.x * uAspect, uEyeR.y) + look;
  float gL, gR;
  float eL = drawEye((q - cl) / (uEyeRadius * uEyeScale.x), uBlink.x, -1.0, gL);
  float eR = drawEye((q - cr) / (uEyeRadius * uEyeScale.y), uBlink.y,  1.0, gR);
  float face = max(eL, eR) * led * scan * flick;
  float halo = (gL + gR) * (0.6 + 0.4 * uHover);
  col += visor * (uEyeColor * face * 1.6 + uEyeColor * halo * 0.35);

  /* --- soft frame so the JPG background dissolves into the particle field --- */
  float alpha = tex.a;
  if (uFeather > 0.001) {
    vec2 c = (vUv - vec2(0.5, 0.52)) / vec2(0.5, 0.5);
    float e = pow(pow(abs(c.x), 2.6) + pow(abs(c.y), 2.6), 1.0 / 2.6);
    alpha *= 1.0 - smoothstep(1.0 - uFeather, 1.0, e);
    // fade dim starfield pixels outside the body faster than the robot itself
    float body = smoothstep(1.0, 0.55, length((vUv - vec2(0.51, 0.52)) / vec2(0.34, 0.40)));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    alpha *= mix(smoothstep(0.02, 0.25, lum) * 0.85 + 0.15, 1.0, max(body, visor));
  }
  gl_FragColor = vec4(col, alpha);
}
`;

/* ------------------------------ BOOSTERS ------------------------------ */

export const boosterVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;

export const boosterFragment = /* glsl */ `
${COMMON}
uniform float uTime;
uniform float uIntensity;
uniform float uPulse;
uniform float uSeed;
uniform float uLength;
uniform vec3 uCore;
uniform vec3 uGlow;
uniform vec3 uFlare;
varying vec2 vUv;
void main(){
  // nozzle sits at (0.5, 0.78) of this quad; plume goes down.
  vec2 p = vUv - vec2(0.5, 0.78);
  float t = uTime;
  float pulse = 0.78 + 0.22 * sin(t * uPulse * 6.2831 + uSeed * 3.0) + 0.12 * (noise(vec2(t * 14.0, uSeed)) - 0.5);

  float down = max(-p.y, 0.0) / (0.75 * uLength);
  float width = 0.035 + down * 0.22;
  float n = fbm(vec2(p.x * 9.0, p.y * 5.0 + t * 7.0 + uSeed));
  float plume = exp(-pow(p.x / width, 2.0) * (1.4 - n * 0.6)) * exp(-down * 2.4) * step(p.y, 0.02);
  float core  = exp(-dot(p / vec2(0.05, 0.035), p / vec2(0.05, 0.035)));
  float bloom = exp(-length(p) * 7.0);
  float streak = exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 5.0);
  float vstreak = exp(-abs(p.x) * 70.0) * exp(-abs(p.y + 0.02) * 6.0) * 0.5;
  // crimson tail at the plume's end, cyan near the nozzle
  float tail = plume * smoothstep(0.15, 0.8, down);

  vec3 col = uCore * core * 2.2
           + uGlow * (bloom * 0.9 + plume * 0.9 + streak * 0.8 + vstreak)
           + uFlare * tail * 0.9;
  col *= pulse * uIntensity;
  float a = clamp(max(max(core, bloom), max(plume, streak)) * pulse * uIntensity, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

/* ------------------------------ PARTICLES ------------------------------ */

export const particleVertex = /* glsl */ `
${COMMON}
attribute vec4 aSeed;
uniform float uTime;
uniform float uSpeed;
uniform float uTurb;
uniform float uSize;
uniform float uBoost;
uniform float uPixelRatio;
uniform vec2  uMouse;
uniform float uMouseActive;
uniform float uMouseR;
uniform float uMouseF;
uniform float uAspect;
uniform vec3  uBox;
uniform vec3  uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float spd = uSpeed * (0.35 + aSeed.z) * (1.0 + uBoost * 1.8);
  vec3 p = position;
  p.y = mod(p.y + uBox.y * 0.5 + uTime * spd, uBox.y) - uBox.y * 0.5;
  // turbulence: layered sin + noise sway that grows as particles rise
  float sway = noise(vec2(p.y * 0.35 + aSeed.x * 10.0, uTime * 0.25)) - 0.5;
  p.x += (sin(uTime * 0.6 + aSeed.w * 6.28 + p.y * 0.8) * 0.25 + sway * 1.6) * uTurb * (1.0 + uBoost);
  p.z += cos(uTime * 0.5 + aSeed.y * 6.28 + p.y * 0.6) * 0.3 * uTurb;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uMouse; d.x *= uAspect;
  float dist = length(d);
  float push = smoothstep(uMouseR, 0.0, dist) * uMouseF * uMouseActive;
  mv.xy += normalize(d + 1e-5) * push * (-mv.z) * 0.18;
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + aSeed.x * 3.0) + aSeed.y * 40.0);
  float sz = uSize * (0.6 + pow(aSeed.w, 3.0) * 3.2) * (1.0 + uBoost * 0.6) * (1.0 + push * 1.5);
  gl_PointSize = sz * uPixelRatio * (30.0 / -mv.z);

  float k = aSeed.y;
  vColor = k < 0.45 ? uC0 : k < 0.7 ? uC1 : k < 0.88 ? uC2 : uC3;
  vColor += push * 0.6;
  float edge = 1.0 - smoothstep(0.38, 0.5, abs(p.y / uBox.y));
  vAlpha = twinkle * edge * (0.55 + uBoost * 0.45);
}
`;

export const particleFragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float a = pow(core, 1.8) * vAlpha * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * (0.6 + core), a);
}
`;
