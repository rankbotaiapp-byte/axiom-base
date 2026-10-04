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

export function parseIntroPreset(raw: string | null | undefined): IntroPreset {
  const v = (raw ?? "").toLowerCase();
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

export function cameraMotion(preset: IntroPreset, intensity: number) {
  const i = Math.min(100, Math.max(0, intensity)) / 100;
  const zoom = 1 + 0.18 * i;
  const pan = 5.5 * i;

  switch (preset) {
    case "kenburns":
      return {
        initial: { scale: 1.02, x: `${-pan}%`, y: `${-pan * 0.35}%`, opacity: 1 },
        animate: { scale: zoom, x: `${pan * 0.7}%`, y: `${pan * 0.25}%`, opacity: 1 },
      };
    case "zoomin":
      return {
        initial: { scale: 1, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: zoom, x: "0%", y: "0%", opacity: 1 },
      };
    case "zoomout":
      return {
        initial: { scale: zoom, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    case "panlr":
      return {
        initial: { scale: 1 + 0.1 * i, x: `${-pan}%`, y: "0%", opacity: 1 },
        animate: { scale: 1 + 0.1 * i, x: `${pan}%`, y: "0%", opacity: 1 },
      };
    case "pantd":
      return {
        initial: { scale: 1 + 0.1 * i, x: "0%", y: `${-pan}%`, opacity: 1 },
        animate: { scale: 1 + 0.1 * i, x: "0%", y: `${pan}%`, opacity: 1 },
      };
    case "fade":
      return {
        initial: { scale: 1 + 0.08 * i, x: "0%", y: "0%", opacity: 0 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
    default:
      return {
        initial: { scale: 1, x: "0%", y: "0%", opacity: 1 },
        animate: { scale: 1, x: "0%", y: "0%", opacity: 1 },
      };
  }
}
