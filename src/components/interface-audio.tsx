import { useEffect, useSyncExternalStore } from "react";
import {
  playUiClick,
  playUiHover,
  readStoredUiAudio,
  setUiAudio,
  subscribeUiAudio,
  uiAudioEnabled,
} from "@/lib/ui-audio";
import {
  axiomTactile,
  brushIntensityFromVelocity,
  isTactileFilmTarget,
  panFromClientX,
  type TactileCue,
} from "@/lib/axiom/tactile-engine";

const PRESS_MS = 140;

function interactiveTarget(event: Event) {
  const node = event.target;
  if (!(node instanceof Element)) return null;
  const el = node.closest("button, a, [role='button'], .lift-card, .glass-btn");
  if (!(el instanceof HTMLElement)) return null;
  if (el.closest("[data-audio-toggle], .founder-intro-audio")) return null;
  if (el.matches(":disabled") || el.getAttribute("aria-disabled") === "true") return null;
  return el;
}

export function InterfaceAudio() {
  const enabled = useSyncExternalStore(subscribeUiAudio, uiAudioEnabled, () => false);

  useEffect(() => {
    axiomTactile.primeOnGesture();
    if (readStoredUiAudio()) void setUiAudio(true);
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    let lastHover = 0;

    let lastX = 0;
    let lastT = 0;

    const onDown = (event: PointerEvent) => {
      axiomTactile.primeOnGesture();
      const el = interactiveTarget(event);
      if (!el) return;
      el.classList.add("ui-press");
      window.setTimeout(() => el.classList.remove("ui-press"), PRESS_MS);
      if (uiAudioEnabled()) playUiClick();
    };

    const onFilmMove = (event: PointerEvent) => {
      if (!isTactileFilmTarget(event.target)) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const speed = Math.abs(event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastT = now;
      axiomTactile.triggerVideoBrushBy(brushIntensityFromVelocity(speed), panFromClientX(event.clientX));
    };

    const onTactileCue = (event: Event) => {
      const cue = (event as CustomEvent<{ cue?: TactileCue }>).detail?.cue;
      if (cue) axiomTactile.dispatchCue(cue);
    };

    const onOver = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType === "touch") return;
      const el = interactiveTarget(event);
      if (!el) return;
      const from = event.relatedTarget;
      if (from instanceof Node && el.contains(from)) return;
      const now = performance.now();
      if (now - lastHover < 90) return;
      lastHover = now;
      if (uiAudioEnabled()) playUiHover();
    };

    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointermove", onFilmMove, { passive: true });
    window.addEventListener("axiom-tactile", onTactileCue);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointermove", onFilmMove);
      window.removeEventListener("axiom-tactile", onTactileCue);
    };
  }, []);

  return (
    <button
      type="button"
      data-audio-toggle=""
      className="audio-toggle text-xs font-medium tracking-[0.14em] uppercase"
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        void setUiAudio(next).then(() => {
          if (next) playUiClick();
        });
      }}
    >
      <span
        className={enabled ? "telemetry-live" : "size-2 shrink-0 rounded-full bg-faint"}
        aria-hidden
      />
      Sound {enabled ? "on" : "off"}
    </button>
  );
}
