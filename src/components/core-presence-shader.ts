/** Sphere shell. The filmed frame is the body; the field only bends its pixels. */
export const CORE_PRESENCE_VERT = `
uniform float uTime;
uniform float uDisplace;
uniform float uFog;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 n = normalize(normal);
  float blob = sin(position.x * 3.1 + uTime * 0.55) * cos(position.z * 2.7 - uTime * 0.42);
  float wave = sin(position.y * 5.5 + uTime * 1.35);
  float powder = sin(position.x * 8.0 + uTime * 0.8) * sin(position.y * 7.0 - uTime * 0.7);
  vec3 displaced = position + n * (uDisplace * (0.7 * blob + 0.3 * wave) + uFog * powder * 0.1);
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const CORE_PRESENCE_FRAG = `
uniform sampler2D uVideo;
uniform sampler2D uField;
uniform sampler2D uText;
uniform vec4 uCover;
uniform vec2 uResolution;
uniform float uHasFilm;
uniform float uBreak;
uniform float uHasText;
uniform float uWarp;
uniform float uRoughness;
uniform float uMetal;
uniform float uFog;
uniform float uFlow;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vWorld;

const vec3 cyanDye = vec3(0.0, 0.953, 1.0);
const vec3 goldDye = vec3(1.0, 0.718, 0.0);

void main() {
  vec2 screen = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);
  vec4 field = texture2D(uField, screen);
  vec2 vel = (field.rg - vec2(0.50196)) * 12.75;
  vec2 drift = vec2(sin(uTime * 0.35), cos(uTime * 0.22)) * uFlow * 0.012;
  vec2 filmUv = vec2(screen.x * uCover.x + uCover.z, screen.y * uCover.y + uCover.w) - vel * uWarp + drift;
  vec3 film = texture2D(uVideo, filmUv).rgb * uHasFilm;

  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(n, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, 2.4);
  vec3 dye = cyanDye * field.b + goldDye * field.a;
  vec3 metalTint = film * vec3(0.74, 0.8, 0.84) + fresnel * mix(cyanDye, goldDye, 0.4);
  vec3 body = mix(film, metalTint, uMetal);
  body += dye * (uHasFilm > 0.5 ? 0.85 : 1.0);
  body += cyanDye * fresnel * (1.0 - uMetal) * (1.0 - uFog) * 0.4;

  vec3 lightDir = normalize(vec3(sin(uTime * 0.4), 0.55, cos(uTime * 0.4)));
  float gloss = mix(64.0, 5.0, uRoughness);
  float spec = pow(max(dot(n, normalize(lightDir + viewDir)), 0.0), gloss);
  body += vec3(0.82, 0.94, 1.0) * spec * (1.0 - uFog) * mix(0.28, 0.85, max(uMetal, 0.2));

  float shear = 0.16 + uBreak * 0.7;
  vec3 ink = vec3(0.0);
  float smear = 0.0;
  for (int i = 0; i < 6; i++) {
    float t = float(i) / 5.0;
    vec2 sampleUv = screen - vel * shear * t;
    vec4 glyph = texture2D(uText, vec2(sampleUv.x, 1.0 - sampleUv.y));
    float fall = mix(1.0, 1.0 - t, uBreak);
    smear += glyph.a * fall;
    ink += glyph.rgb * glyph.a * fall;
  }
  smear = clamp(smear / 6.0, 0.0, 1.0) * uHasText;
  float textAlpha = smear * (1.0 - uBreak);
  body += ink * smear * uBreak * (1.0 - uBreak);
  body = mix(body, ink, textAlpha);

  float grain = fract(sin(dot(screen, vec2(127.1, 311.7)) + vWorld.x * 48.0) * 43758.5453);
  vec3 powder = mix(vec3(0.78, 0.8, 0.82), goldDye, grain * 0.4);
  body = mix(body, powder * 0.5 + film * 0.22 + dye, uFog);
  float alpha = mix(1.0, 0.42 + grain * 0.45, uFog);
  float limb = smoothstep(0.02, 0.16, ndv);
  gl_FragColor = vec4(body, limb * alpha);
}
`;
