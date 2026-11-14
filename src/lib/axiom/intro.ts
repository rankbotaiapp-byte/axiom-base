export const PRESENTATION_STYLES = [
  { id: "cinematic-pan", label: "Cinematic Pan" },
  { id: "hud-lock", label: "HUD Tactical Lock-In" },
  { id: "split-velocity", label: "Split-Screen Velocity" },
  { id: "orbital-pulse", label: "Orbital Ambient Pulse" },
] as const;

export type PresentationStyle = (typeof PRESENTATION_STYLES)[number]["id"];

export type IntroPreset =
  | "kenburns"
  | "zoomin"
  | "zoomout"
  | "panlr"
  | "pantd"
  | "fade"
  | "none"
  | PresentationStyle;

export const INTRO_PRESETS: { id: IntroPreset; label: string }[] = [
  { id: "kenburns", label: "Ken Burns (Scale + Pan Inward)" },
  { id: "zoomin", label: "Zoom In Only" },
  { id: "zoomout", label: "Zoom Out Only" },
  { id: "panlr", label: "Pan Left-to-Right" },
  { id: "pantd", label: "Pan Top-Down" },
  { id: "fade", label: "Fade In + Subtle Scale" },
  { id: "none", label: "None (Static)" },
];

export const INTRO_FX_KEY = "axiom:intro-fx";
export const INTRO_FX_EVENT = "axiom:intro-fx";

export function isPresentationStyle(value: string): value is PresentationStyle {
  return PRESENTATION_STYLES.some((style) => style.id === value);
}

export function parseIntroPreset(raw: unknown): IntroPreset {
  const v = typeof raw === "string" ? raw.toLowerCase() : "";
  if (isPresentationStyle(v)) return v;
  if (INTRO_PRESETS.some((p) => p.id === v)) return v as IntroPreset;
  return "kenburns";
}

/** The dashboard selector shows the four presentation styles. Older presets stay stored until one is chosen. */
export function presentationForIntro(preset: IntroPreset): PresentationStyle {
  if (isPresentationStyle(preset)) return preset;
  if (preset === "panlr" || preset === "pantd" || preset === "kenburns") return "cinematic-pan";
  if (preset === "zoomin" || preset === "zoomout") return "hud-lock";
  if (preset === "fade" || preset === "none") return "orbital-pulse";
  return "split-velocity";
}

export function readIntroFx(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(INTRO_FX_KEY) !== "off";
}

export function writeIntroFx(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTRO_FX_KEY, on ? "on" : "off");
  window.dispatchEvent(new Event(INTRO_FX_EVENT));
}

export function introDurationSec(speed: number) {
  const s = Math.min(100, Math.max(1, speed));
  return 3 + ((100 - s) / 100) * 9;
}

/**
 * Pixel travel at the end of a hero scroll.
 * The blurred plate is slowest, the sharp film a little faster, motes and light
 * farther still, and the title travels the opposite way.
 * Intensity 0 keeps every layer still. Speed, already stored per shop, only leans on that distance.
 */
export function parallaxTravel(intensity: number, speed = 40) {
  const depth = Math.min(100, Math.max(0, intensity)) / 100;
  if (depth === 0) {
    return { plate: 0, background: 0, particles: 0, wash: 0, light: 0, foreground: 0 };
  }
  const pace = 0.85 + 0.3 * (Math.min(100, Math.max(1, speed)) / 100);
  return {
    plate: Math.round((8 + 20 * depth) * pace),
    background: Math.round((16 + 36 * depth) * pace),
    particles: Math.round((28 + 62 * depth) * pace),
    wash: Math.round((36 + 78 * depth) * pace),
    light: Math.round((48 + 96 * depth) * pace),
    foreground: -Math.round((24 + 70 * depth) * pace),
  };
}

/**
 * Loop rate while the hero crosses the viewport. 1 at rest and once the hero
 * has left, so a film off-screen is not still being scrubbed.
 */
export function heroPlaybackRate(progress: number, intensity: number) {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0.04 || p >= 0.96) return 1;
  const depth = Math.min(100, Math.max(0, intensity)) / 100;
  return 1 + 0.18 * depth * Math.sin(p * Math.PI);
}

export function cameraMotion(preset: IntroPreset, intensity: number) {
  const i = Math.min(100, Math.max(0, intensity)) / 100;
  // Scale stays at or above 1 so object-cover fills the viewport while the camera moves.
  const fit = 1 + 0.12 * i;
  const pan = 3.5 * i;

  switch (preset) {
    case "kenburns":
      return {
        initial: { scale: fit, x: `${-pan * 0.4}%`, y: `${-pan * 0.2}%`, opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "zoomin":
      return {
        initial: { scale: fit, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "zoomout":
      return {
        initial: { scale: 1, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: fit, x: "0%", y: "0%", opacity: 1 },
      };
    case "panlr":
      return {
        initial: { scale: fit, x: `${-pan}%`, y: "0%", opacity: 1 },
        animate: { scale: fit, x: `${pan}%`, y: "0%", opacity: 1 },
      };
    case "pantd":
      return {
        initial: { scale: fit, x: "0%", y: `${-pan}%`, opacity: 1 },
        animate: { scale: fit, x: "0%", y: `${pan}%`, opacity: 1 },
      };
    case "fade":
      return {
        initial: { scale: fit, x: "0%", y: "0%", opacity: 0 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "cinematic-pan":
      return {
        initial: { scale: fit, x: `${-pan * 1.8}%`, y: "0%", opacity: 1 },
        animate: { scale: fit, x: `${pan * 1.8}%`, y: "0%", opacity: 1 },
      };
    case "hud-lock":
      return {
        initial: { scale: fit + 0.08, x: `${pan}%`, y: `${-pan * 0.45}%`, opacity: 0.35 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "split-velocity":
      return {
        initial: { scale: fit, x: `${-pan * 2.4}%`, y: `${pan * 0.2}%`, opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "orbital-pulse":
      return {
        initial: { scale: 1, x: `${pan}%`, y: `${-pan}%`, opacity: 0.8 },
        animate: { scale: fit, x: `${-pan * 0.4}%`, y: `${pan * 0.4}%`, opacity: 1 },
      };
    default:
      return {
        initial: { scale: 1, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
  }
}
