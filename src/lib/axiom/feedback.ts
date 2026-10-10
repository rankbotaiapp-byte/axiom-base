export type FeedbackPrefs = {
  neon: boolean;
  haptics: boolean;
};

const DEFAULTS: FeedbackPrefs = { neon: true, haptics: true };

function key(scope: "shop" | "master") {
  return `axiom:feedback:${scope}`;
}

export function readFeedback(scope: "shop" | "master"): FeedbackPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(key(scope));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<FeedbackPrefs>;
    return {
      neon: parsed.neon !== false,
      haptics: parsed.haptics !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

export function writeFeedback(scope: "shop" | "master", next: FeedbackPrefs) {
  window.localStorage.setItem(key(scope), JSON.stringify(next));
  window.dispatchEvent(new Event("axiom-feedback"));
}

export function pulseHaptic(kind: "incoming" | "confirm") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(kind === "incoming" ? [28, 36, 28, 36, 90] : [18, 24, 18]);
}
