/** Cyber-Obsidian HUD lock prepended to every Imagine / animator / stamp prompt. */

export const AXIOM_HUD_CYAN = "#00f2fe";
export const AXIOM_HUD_OBSIDIAN = "#030712";
export const AXIOM_HUD_CRIMSON = "#ff2a3d";

export const AXIOM_VISUAL_LOCK =
  "Cyber-Obsidian HUD: brushed-metal obsidian, neon cyan #00f2fe, crimson edge glow, volumetric smoke, tactical corner crosshairs, holographic plates, tenant brand on real surfaces. Never generic stock.";

export function withAxiomVisualLock(prompt: string): string {
  const body = prompt.replace(/\s+/g, " ").trim();
  if (!body) return AXIOM_VISUAL_LOCK;
  if (body.includes("#00f2fe") && /crosshair/i.test(body)) return body;
  return `${AXIOM_VISUAL_LOCK} ${body}`;
}
