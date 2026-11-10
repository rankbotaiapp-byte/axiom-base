/**
 * GLSL for the APEX hero stage. All passes are GLSL ES 1.0 so they compile on
 * every WebGL2 implementation (and the RawShaderMaterial path skips Three's
 * colour-space injection, which is what keeps the obsidian blacks pitch black).
 */

export const fullscreenVertex = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Pass 1 — crop window + cover + headline inpaint + loop crossfade + colour grade.
 *   uCrop     (x, y, w, h)  source px window that isolates car + exhaust
 *   uWindow   (ox, oy, fx, fy) normalised sub-window of the crop (cover + parallax + zoom)
 *   uInpaint  (x, y, w, h)  source px rect of baked-in text, filled by inverse-distance interpolation
 */
export const videoGradeFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform sampler2D uVideoA;
uniform sampler2D uVideoB;
uniform float uMix;
uniform vec2 uSourceSize;
uniform vec4 uCrop;
uniform vec4 uWindow;
uniform vec4 uInpaint;
uniform float uBlack;
uniform float uFlameHue;
uniform float uExposure;
uniform float uSharpen;

vec3 sampleSrc(vec2 px) {
  vec2 st = vec2(px.x / uSourceSize.x, 1.0 - px.y / uSourceSize.y);
  return mix(texture2D(uVideoA, st).rgb, texture2D(uVideoB, st).rgb, uMix);
}

vec3 hueRotate(vec3 c, float a) {
  // YIQ rotation keeps luminance (white-hot flame cores stay white).
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * c;
  float s = sin(a);
  float co = cos(a);
  yiq.yz = mat2(co, s, -s, co) * yiq.yz;
  return toRGB * yiq;
}

void main() {
  vec2 c = uWindow.xy + vec2(vUv.x, 1.0 - vUv.y) * uWindow.zw;
  vec2 px = uCrop.xy + c * uCrop.zw;

  vec3 col = sampleSrc(px);

  // Inpaint the baked-in headline (same idea as ffmpeg delogo, on the GPU).
  vec4 r = uInpaint;
  float dl = px.x - r.x;
  float dr = r.x + r.z - px.x;
  float dt = px.y - r.y;
  float db = r.y + r.w - px.y;
  float inside = min(min(dl, dr), min(dt, db));
  float inpaintMask = 0.0;
  if (inside > -12.0) {
    vec3 top = sampleSrc(vec2(px.x, r.y - 2.0));
    vec3 bottom = sampleSrc(vec2(px.x, r.y + r.w + 2.0));
    vec3 left = sampleSrc(vec2(r.x - 2.0, px.y));
    vec3 right = sampleSrc(vec2(r.x + r.z + 2.0, px.y));
    float wt = 1.0 / max(dt, 1.0);
    float wb = 1.0 / max(db, 1.0);
    float wl = 0.15 / max(dl, 1.0);
    float wr = 0.15 / max(dr, 1.0);
    vec3 fill = (top * wt + bottom * wb + left * wl + right * wr) / (wt + wb + wl + wr);
    inpaintMask = clamp((inside + 4.0) / 5.0, 0.0, 1.0);
    col = mix(col, fill, inpaintMask);
    // Keep the sharpen kernel from re-reading the raw headline pixels around the patch.
    inpaintMask = clamp((inside + 12.0) / 8.0, 0.0, 1.0);
  }

  // Upscale recovery: unsharp mask at source-pixel scale (the master is 752 px wide).
  if (uSharpen > 0.0 && inpaintMask < 1.0) {
    vec3 n = sampleSrc(px + vec2(1.0, 0.0)) + sampleSrc(px - vec2(1.0, 0.0))
           + sampleSrc(px + vec2(0.0, 1.0)) + sampleSrc(px - vec2(0.0, 1.0));
    col = clamp(col + (col * 4.0 - n) * uSharpen * 0.25 * (1.0 - inpaintMask), 0.0, 1.0);
  }

  // Undo browser "video wash": crush lifted blacks back to true black.
  col = max(col - uBlack, 0.0) / (1.0 - uBlack);

  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float flame = smoothstep(0.3, 0.7, lum) * smoothstep(0.015, 0.12, col.b - col.r);
  if (abs(uFlameHue) > 0.001) {
    vec3 rotated = hueRotate(col, uFlameHue);
    col = mix(col, max(rotated, 0.0), flame);
  }

  // Filmic S-curve + controlled saturation.
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.32);
  float l2 = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l2), col, 1.12);

  // Feather the crop edges into the obsidian black (no hard frame when "contain" bands show).
  float edge = smoothstep(0.0, 0.07, c.x) * smoothstep(1.0, 0.93, c.x)
             * smoothstep(0.0, 0.09, c.y) * smoothstep(1.0, 0.9, c.y);
  col *= edge;

  gl_FragColor = vec4(clamp(col * uExposure, 0.0, 1.0), 1.0);
}
`;

/** Pass 2 — bright-pass that targets cyan/blue highlights (exhaust) with reduced weight on others. */
export const brightPassFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uTexel;
uniform float uThreshold;

vec3 extract(vec2 uv) {
  vec3 c = texture2D(uScene, uv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float cyan = smoothstep(0.01, 0.16, c.b - c.r);
  float weight = smoothstep(uThreshold, uThreshold + 0.3, lum) * mix(0.22, 1.0, cyan);
  return c * weight;
}

void main() {
  vec2 o = uTexel * 0.5;
  vec3 c = extract(vUv + vec2(-o.x, -o.y)) + extract(vUv + vec2(o.x, -o.y))
         + extract(vUv + vec2(-o.x, o.y)) + extract(vUv + vec2(o.x, o.y));
  gl_FragColor = vec4(c * 0.25, 1.0);
}
`;

/** Pass 3 — separable 9-tap Gaussian using linear-sampling offsets (5 fetches). */
export const blurFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uInput;
uniform vec2 uDirection;

void main() {
  vec3 c = texture2D(uInput, vUv).rgb * 0.2270270270;
  vec2 o1 = uDirection * 1.3846153846;
  vec2 o2 = uDirection * 3.2307692308;
  c += texture2D(uInput, vUv + o1).rgb * 0.3162162162;
  c += texture2D(uInput, vUv - o1).rgb * 0.3162162162;
  c += texture2D(uInput, vUv + o2).rgb * 0.0702702703;
  c += texture2D(uInput, vUv - o2).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`;

/** Pass 4 — composite: scene + bloom, launch flash, chromatic shake, vignette, grain. */
export const compositeFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uShake;
uniform float uFlash;
uniform float uTime;
uniform vec2 uResolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec2 jitter = vec2(sin(uTime * 83.0), cos(uTime * 71.0)) * 0.006 * uShake;
  uv += jitter;

  float ca = 0.0035 * uShake;
  vec3 scene;
  scene.r = texture2D(uScene, uv + vec2(ca, 0.0)).r;
  scene.g = texture2D(uScene, uv).g;
  scene.b = texture2D(uScene, uv - vec2(ca, 0.0)).b;

  vec3 bloom = texture2D(uBloom, uv).rgb;
  vec3 col = scene + bloom * uBloomStrength;

  // Launch flash — cyan pressure wave weighted toward the exhaust side.
  col += vec3(0.05, 0.45, 0.6) * uFlash * smoothstep(0.0, 1.0, uv.x) * 0.35;

  vec2 q = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float vig = smoothstep(1.25, 0.25, length(q * vec2(0.85, 1.1)));
  col *= mix(0.38, 1.0, vig);

  col += (hash(uv * uResolution + fract(uTime) * 100.0) - 0.5) * 0.018;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Particles                                                            */
/* ------------------------------------------------------------------ */

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uSurge;
uniform float uSwirl;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uLean;
uniform vec3 uEmitA;
uniform vec3 uEmitB;

attribute vec4 aSeed;
varying float vAlpha;
varying float vMix;

vec2 rot(vec2 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, s, -s, c) * p;
}

void main() {
  vec3 p = position;
  float size = uSize;
  float t = uTime;

#if MODE == 0
  // Far field: drifting dust / stars.
  float depth = clamp((p.z + 30.0) / 26.0, 0.0, 1.0);
  p.x += sin(t * 0.07 * (0.5 + aSeed.x) + aSeed.y * 6.2831) * 0.8;
  p.y += cos(t * 0.05 * (0.5 + aSeed.z) + aSeed.w * 6.2831) * 0.6;
  p.xy = rot(p.xy, uSwirl * 0.05 * (0.4 + depth) + t * 0.004);
  p.z += uSurge * (2.0 + aSeed.x * 8.0);
  float twinkle = 0.55 + 0.45 * sin(t * (0.6 + aSeed.z * 2.0) + aSeed.x * 40.0);
  vAlpha = (0.25 + 0.75 * aSeed.w) * twinkle * (1.0 + uSurge * 1.2);
  vMix = aSeed.y;
  size *= 0.5 + aSeed.z;
#elif MODE == 1
  // Mid field: blue plasma embers shed by the exhaust.
  float speed = (0.16 + aSeed.y * 0.22) * (1.0 + uSurge * 2.6);
  float life = fract(aSeed.x + t * speed);
  vec3 origin = aSeed.z < 0.5 ? uEmitA : uEmitB;
  float r2 = fract(aSeed.z * 7.131);
  vec3 dir = vec3(0.8 + aSeed.w * 1.5, 0.45 + aSeed.y * 1.4, (r2 * 2.0 - 1.0) * 0.8);
  p = origin + dir * life * (1.4 + uSurge * 2.4);
  p.x += sin(life * 9.0 + aSeed.x * 40.0) * 0.2 * life;
  p.y += cos(life * 7.0 + aSeed.w * 30.0) * 0.16 * life;
  p.xy = origin.xy + rot(p.xy - origin.xy, uSwirl * 0.22 * life);
  p.xy += uLean * life * 0.7;
  vAlpha = sin(life * 3.14159) * (0.55 + 0.45 * aSeed.w) * (1.0 + uSurge * 1.6);
  vMix = life;
  size *= (1.0 - life * 0.6) * (0.6 + aSeed.y);
#else
  // Near field: out-of-focus bokeh.
  p.x += sin(t * 0.05 + aSeed.x * 6.2831) * 0.6;
  p.y += cos(t * 0.04 + aSeed.y * 6.2831) * 0.4;
  p.xy = rot(p.xy, uSwirl * 0.03);
  vAlpha = (0.5 + 0.5 * sin(t * 0.3 + aSeed.z * 6.2831)) * (1.0 + uSurge * 0.8);
  vMix = aSeed.w;
  size *= 0.6 + aSeed.y * 0.8;
#endif

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(size * uPixelRatio * (10.0 / max(-mv.z, 0.1)), 256.0);
}
`;

export const particleFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vAlpha;
varying float vMix;

void main() {
  float d = length(gl_PointCoord - 0.5);
#if MODE == 2
  float disc = smoothstep(0.5, 0.4, d);
  float rim = smoothstep(0.38, 0.46, d) * smoothstep(0.5, 0.46, d);
  float a = disc * 0.55 + rim * 0.45;
#else
  float a = smoothstep(0.5, 0.0, d);
  a += smoothstep(0.16, 0.0, d) * 0.8;
#endif
  vec3 color = mix(uColorA, uColorB, vMix);
  float alpha = a * vAlpha * uOpacity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
