/** Samples the filmed orb, shoves its UVs by the velocity field, and shears glyph ink into the dye. */
export const CORE_SPHERE_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const CORE_SPHERE_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uVideo;
uniform sampler2D uField;
uniform sampler2D uText;
uniform vec4 uCover;
uniform float uHasFilm;
uniform float uBreak;
uniform float uHasText;

const vec3 cyanDye = vec3(0.0, 0.953, 1.0);
const vec3 goldDye = vec3(1.0, 0.718, 0.0);

void main() {
  vec4 field = texture2D(uField, vUv);
  vec2 vel = (field.rg - vec2(0.50196)) * 12.75;
  vec2 filmUv = vec2(vUv.x * uCover.x + uCover.z, vUv.y * uCover.y + uCover.w) - vel * 0.035;
  vec3 film = texture2D(uVideo, filmUv).rgb * uHasFilm;
  float cyan = field.b;
  float gold = field.a;
  vec3 dye = cyanDye * cyan + goldDye * gold;
  float shear = 0.16 + uBreak * 0.7;
  vec3 ink = vec3(0.0);
  float smear = 0.0;
  for (int i = 0; i < 6; i++) {
    float t = float(i) / 5.0;
    vec2 sampleUv = vUv - vel * shear * t;
    vec4 glyph = texture2D(uText, sampleUv);
    float fall = mix(1.0, 1.0 - t, uBreak);
    smear += glyph.a * fall;
    ink += glyph.rgb * glyph.a * fall;
  }
  smear = clamp(smear / 6.0, 0.0, 1.0) * uHasText;
  float textAlpha = smear * (1.0 - uBreak);
  vec3 color = film + dye * (uHasFilm > 0.5 ? 0.85 : 1.0);
  color += ink * smear * uBreak * (1.0 - uBreak);
  color = mix(color, ink, textAlpha);
  float rad = length(vUv * 2.0 - 1.0);
  float mask = (1.0 - smoothstep(0.9, 1.0, rad)) * max(uHasFilm, clamp(cyan + gold + smear, 0.0, 1.0));
  gl_FragColor = vec4(color, mask);
}
`;
