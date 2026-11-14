/** Front-hemisphere melt. 0.3 is a partial reveal, not a vanished orb. */
export const DISSOLVE_LIMIT = 0.3;

export const DISSOLVE_PRELUDE = `
uniform float dissolveProgress;
varying float vFront;
float dissolveGrain;
float dissolveMelt;
`;

export const DISSOLVE_COLOR = `
dissolveGrain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
dissolveMelt = clamp(vFront, 0.0, 1.0) * dissolveProgress * 1.15;
if (dissolveGrain < dissolveMelt && vFront > 0.2) discard;
diffuseColor.a *= mix(1.0, 0.42, clamp(vFront * dissolveProgress / 0.3, 0.0, 1.0));
`;

export const DISSOLVE_GLOW = `
totalEmissiveRadiance += vec3(0.55, 0.95, 1.0) * (1.0 - smoothstep(0.0, 0.08, abs(dissolveGrain - dissolveMelt))) * clamp(vFront, 0.0, 1.0) * dissolveProgress * 5.0;
`;

export function applyDissolve(fragment: string): string {
  if (!fragment.includes("#include <color_fragment>") || !fragment.includes("#include <emissivemap_fragment>")) {
    throw new Error("Dissolve hooks missing");
  }
  return fragment
    .replace("#include <color_fragment>", `#include <color_fragment>\n${DISSOLVE_COLOR}`)
    .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${DISSOLVE_GLOW}`);
}
