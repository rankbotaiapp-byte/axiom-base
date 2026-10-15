export type IntroPreset =
  | "kenburns"
  | "zoomin"
  | "zoomout"
  | "panlr"
  | "pantd"
  | "fade"
  | "none";

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

export function parseIntroPreset(raw: unknown): IntroPreset {
  const v = typeof raw === "string" ? raw.toLowerCase() : "";
  if (INTRO_PRESETS.some((p) => p.id === v)) return v as IntroPreset;
  return "kenburns";
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
  // Motion stays inside the frame. Scale never passes 1, so object-contain
  // keeps the whole film visible on a phone and on a desktop.
  const fit = 1 - 0.12 * i;
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
    default:
      return {
        initial: { scale: 1, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
  }
}
