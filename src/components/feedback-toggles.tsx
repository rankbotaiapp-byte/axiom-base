import { useEffect, useState } from "react";
import { readFeedback, writeFeedback, type FeedbackPrefs } from "@/lib/axiom/feedback";

export function FeedbackToggles({ scope }: { scope: "shop" | "master" }) {
  const [prefs, setPrefs] = useState<FeedbackPrefs>({ neon: true, haptics: true });

  useEffect(() => {
    const sync = () => setPrefs(readFeedback(scope));
    sync();
    window.addEventListener("axiom-feedback", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("axiom-feedback", sync);
      window.removeEventListener("storage", sync);
    };
  }, [scope]);

  function update(patch: Partial<FeedbackPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    writeFeedback(scope, next);
  }

  return (
    <div className="grid gap-3">
      <Toggle
        label="Neon flash"
        hint="Pulse the screen edge when a lead or confirmation arrives."
        on={prefs.neon}
        onChange={(neon) => update({ neon })}
      />
      <Toggle
        label="Haptic pulse"
        hint="Vibrate this device for incoming leads and outgoing confirms."
        on={prefs.haptics}
        onChange={(haptics) => update({ haptics })}
      />
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-sm text-muted">{hint}</span>
      </span>
      <span className={`shrink-0 text-sm ${on ? "text-fg" : "text-faint"}`}>{on ? "On" : "Off"}</span>
    </button>
  );
}
