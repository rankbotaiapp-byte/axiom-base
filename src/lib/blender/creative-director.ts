import { AXIOM_HUD_CRIMSON, AXIOM_HUD_CYAN, AXIOM_VISUAL_LOCK, withAxiomVisualLock } from "../axiom/visual-design.ts";
import { blenderEffectForNiche, blenderEffectLabel, type BlenderEffect } from "./effects.ts";

export type BlenderShot = {
  effect: BlenderEffect;
  viscosity: number;
  gravity: number;
  cyanEnergy: number;
  crimsonHeat: number;
  smokeDensity: number;
  plateEtch: boolean;
  keyLight: number;
  rimLight: number;
  prompt: string;
};

export type DirectorInput = {
  businessName: string;
  niche?: string | null;
  logoGeometry?: string | null;
  seed?: number;
};

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function heuristicDirector(input: DirectorInput): BlenderShot {
  const effect = blenderEffectForNiche(input.niche, input.seed ?? 0);
  const name = (input.businessName || "Local shop").replace(/\s+/g, " ").trim().slice(0, 48);
  const etch = Boolean(input.logoGeometry && input.logoGeometry.length > 8);
  const viscosity = effect === "hydro-splash" ? 0.18 : effect === "frost-crystals" ? 0.72 : 0.08;
  const gravity = effect === "hydro-splash" ? -9.2 : effect === "frost-crystals" ? -3.4 : -6.1;
  const shot: BlenderShot = {
    effect,
    viscosity,
    gravity,
    cyanEnergy: 0.86,
    crimsonHeat: effect === "embers-sparks" ? 0.7 : 0.28,
    smokeDensity: 0.45,
    plateEtch: etch,
    keyLight: 1.15,
    rimLight: 2.4,
    prompt: "",
  };
  shot.prompt = withAxiomVisualLock(
    [
      `${blenderEffectLabel(effect)} master scene for ${name}.`,
      `Laser-etch the tenant mark into a brushed obsidian and glass plate.`,
      `HUD cyan ${AXIOM_HUD_CYAN}, crimson ${AXIOM_HUD_CRIMSON}, volumetric smoke, tactical corner crosshairs.`,
      `Physics: viscosity ${viscosity}, gravity ${gravity}. ${AXIOM_VISUAL_LOCK}`,
    ].join(" "),
  );
  return shot;
}

export function parseDirectorShot(raw: unknown, fallback: BlenderShot): BlenderShot {
  if (!raw || typeof raw !== "object") return fallback;
  const rec = raw as Record<string, unknown>;
  const effect =
    rec.effect === "hydro-splash" || rec.effect === "frost-crystals" || rec.effect === "embers-sparks"
      ? rec.effect
      : fallback.effect;
  return {
    effect,
    viscosity: clamp(Number(rec.viscosity), 0.02, 1.2),
    gravity: clamp(Number(rec.gravity), -12, -0.5),
    cyanEnergy: clamp(Number(rec.cyanEnergy), 0.2, 1),
    crimsonHeat: clamp(Number(rec.crimsonHeat), 0.05, 1),
    smokeDensity: clamp(Number(rec.smokeDensity), 0.05, 1),
    plateEtch: rec.plateEtch !== false,
    keyLight: clamp(Number(rec.keyLight), 0.4, 3),
    rimLight: clamp(Number(rec.rimLight), 0.4, 4),
    prompt: withAxiomVisualLock(typeof rec.prompt === "string" && rec.prompt.trim() ? rec.prompt : fallback.prompt),
  };
}

/** Claude Creative Director brief — executed with grok-4.5 (xAI) when the key is present. */
export async function directBlenderScene(input: DirectorInput): Promise<BlenderShot> {
  const fallback = heuristicDirector(input);
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) return fallback;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "You are Axiom's Claude Creative Director. Return JSON only with keys effect (hydro-splash|frost-crystals|embers-sparks), viscosity, gravity, cyanEnergy, crimsonHeat, smokeDensity, plateEtch, keyLight, rimLight, prompt. Enforce Cyber-Obsidian HUD, #00f2fe, logo etched into metal or glass. No markdown.",
          },
          {
            role: "user",
            content: JSON.stringify({
              businessName: input.businessName,
              niche: input.niche,
              logoGeometry: Boolean(input.logoGeometry),
              lock: AXIOM_VISUAL_LOCK,
              preferredEffect: fallback.effect,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()) as unknown;
    return parseDirectorShot(json, fallback);
  } catch {
    return fallback;
  }
}
