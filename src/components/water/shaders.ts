// GLSL ES 1.00 (WebGL1) — runs on every phone, including older iOS Safari.

export const MAX_RIPPLES = 24;
export const MAX_DROPS = 28;

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

#define MAX_RIPPLES ${MAX_RIPPLES}
#define MAX_DROPS ${MAX_DROPS}

varying vec2 vUv;

uniform sampler2D uVideo;
uniform vec2  uRes;        // canvas size in px
uniform vec2  uVideoRes;   // intrinsic video size in px
uniform float uTime;       // seconds
uniform float uHasVideo;   // 0 until first frame uploaded

// ripple: x, y (0-1, y up), startTime, strength
uniform vec4 uRipples[MAX_RIPPLES];
// drop:   x, y (0-1, y up), radius (fraction of min side), birthTime
uniform vec4 uDrops[MAX_DROPS];
// drop extra: lifetime, slide speed, seed, unused
uniform vec4 uDropsB[MAX_DROPS];

// ---------- helpers ----------

// object-fit: cover, done in the shader so the refraction maps 1:1 to the video
vec2 coverUv(vec2 uv) {
  float sr = uRes.x / uRes.y;
  float vr = uVideoRes.x / max(uVideoRes.y, 1.0);
  vec2 scale = vec2(1.0);
  if (sr > vr) { scale.y = vr / sr; } else { scale.x = sr / vr; }
  vec2 c = (uv - 0.5) * scale + 0.5;
  return vec2(c.x, 1.0 - c.y); // video textures are top-down
}

vec3 sampleVideo(vec2 uv) {
  vec3 fallback = vec3(0.01, 0.05, 0.06);
  vec3 v = texture2D(uVideo, coverUv(clamp(uv, 0.001, 0.999))).rgb;
  return mix(fallback, v, uHasVideo);
}

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vec2 uv = vUv;
  float minSide = min(uRes.x, uRes.y);
  vec2 aspect = uRes / minSide;            // aspect-correct space
  vec2 p = uv * aspect;

  // ================= 1. Ripple shockwaves (height-field normals) =================
  vec2 offset = vec2(0.0);
  float rippleLight = 0.0;

  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float t = uTime - r.z;
    if (t < 0.0 || t > 3.2) continue;

    vec2  c    = r.xy * aspect;
    vec2  dir  = p - c;
    float d    = length(dir);
    float front = t * 0.42;               // wave front radius
    float x    = d - front;

    // damped wave packet travelling outward; trailing rings behind the front
    float env  = exp(-x * x * 140.0) + 0.55 * exp(-max(-x, 0.0) * 9.0) * step(x, 0.0);
    float fade = exp(-t * 1.35) * smoothstep(0.0, 0.05, t);
    float slope = cos(x * 70.0) * env * fade * r.w;   // derivative of sin -> surface slope

    vec2 n = d > 1e-4 ? dir / d : vec2(0.0);
    offset += n * slope * 0.028;
    rippleLight += slope;
  }

  // ================= 2. Droplets on the lens =================
  vec2 dropUv = uv + offset;
  vec3 col = sampleVideo(dropUv);

  // fake chromatic split on strong ripple slopes
  float ca = clamp(abs(rippleLight), 0.0, 1.0) * 0.004;
  if (ca > 0.0001) {
    col.r = sampleVideo(dropUv + offset * 0.6 + vec2(ca, 0.0)).r;
    col.b = sampleVideo(dropUv - offset * 0.6 - vec2(ca, 0.0)).b;
  }

  float shade = 1.0;

  for (int i = 0; i < MAX_DROPS; i++) {
    vec4 dA = uDrops[i];
    if (dA.z <= 0.0) continue;
    vec4 dB = uDropsB[i];
    float age = uTime - dA.w;
    float life = dB.x;
    if (age < 0.0 || age > life) continue;

    // grows on impact, slides down slowly, evaporates at end of life
    float grow   = smoothstep(0.0, 0.12, age);
    float shrink = 1.0 - smoothstep(life * 0.75, life, age);
    float rad    = dA.z * grow * mix(0.35, 1.0, shrink);

    vec2 c = dA.xy;
    c.y -= dB.y * max(age - 0.6, 0.0) * max(age - 0.6, 0.0) * 0.02; // gravity creep
    c.x += sin(age * 1.7 + dB.z * 6.28) * 0.0015;                    // wobble
    c *= aspect;

    // slightly egg-shaped: heavier at the bottom
    vec2 q = p - c;
    q.y *= q.y < 0.0 ? 0.86 : 1.08;
    float d = length(q) / max(rad, 1e-4);
    if (d > 1.25) continue;

    // contact shadow / meniscus ring just outside the drop
    float ring = smoothstep(1.25, 1.0, d) * (1.0 - smoothstep(0.95, 1.0, d));
    shade *= 1.0 - ring * 0.22;

    if (d < 1.0) {
      // hemisphere normal
      vec2 nxy = q / max(rad, 1e-4);
      float nz = sqrt(max(1.0 - dot(nxy, nxy), 0.0));
      vec3 N = normalize(vec3(nxy, nz));

      // a water drop is a tiny fisheye lens: inverted, magnified view of the scene
      vec2 lensUv = (c - nxy * rad * 3.2 * (0.55 + 0.45 * nz)) / aspect;
      vec3 refr;
      refr.r = sampleVideo(lensUv + N.xy * 0.004).r;
      refr.g = sampleVideo(lensUv).g;
      refr.b = sampleVideo(lensUv - N.xy * 0.004).b;

      // edge darkening (fresnel / total internal reflection at the rim)
      float fres = pow(1.0 - nz, 3.5);
      refr = refr * mix(1.18, 0.5, fres) + vec3(0.03, 0.06, 0.07); // water is brighter than what it refracts

      // specular highlight + soft rim glint
      vec3 L = normalize(vec3(-0.45, 0.6, 0.85));
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float spec = pow(max(dot(N, H), 0.0), 90.0) * 1.6;
      float rim  = smoothstep(0.75, 0.98, d) * smoothstep(1.0, 0.96, d) * max(dot(nxy, vec2(0.6, -0.8)), 0.0);
      refr += vec3(spec) + vec3(0.55, 0.95, 1.0) * rim * 0.35;

      float aa = 1.0 - smoothstep(0.96, 1.0, d);   // antialiased edge
      col = mix(col, refr, aa);
    }
  }

  col *= shade;

  // ripple caustic lighting: crests catch a cool teal light
  col += vec3(0.35, 0.95, 1.0) * max(rippleLight, 0.0) * 0.12;
  col -= vec3(0.10) * max(-rippleLight, 0.0) * 0.12;

  // subtle vignette for UI contrast
  float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.62, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;
