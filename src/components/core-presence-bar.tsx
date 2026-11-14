import { Button } from "@/components/ui/button";
import { CORE_STATES, type CoreStateId } from "@/lib/axiom/core-presence";

const LABELS: Record<CoreStateId, { short: string; name: string }> = {
  water: { short: "Water", name: "Flowing water" },
  goop: { short: "Viscous", name: "Goopy viscous" },
  metal: { short: "Metal", name: "Liquid metallic" },
  fog: { short: "Fog", name: "Powdery fog" },
};

export function CorePresenceBar({
  state,
  portal,
  onState,
  onPortal,
  onFresh,
}: {
  state: CoreStateId;
  portal: "orbit" | "inside";
  onState: (state: CoreStateId) => void;
  onPortal: (portal: "orbit" | "inside") => void;
  onFresh?: () => void;
}) {
  return (
    <div className="core-bar">
      <div className="core-chips" role="group" aria-label="Core material">
        {CORE_STATES.map((id) => (
          <button
            key={id}
            type="button"
            className={state === id ? "core-chip is-on" : "core-chip"}
            aria-pressed={state === id}
            aria-label={LABELS[id].name}
            onClick={() => onState(id)}
          >
            {LABELS[id].short}
          </button>
        ))}
      </div>
      <Button className="min-h-11" variant="accent" size="sm" onClick={() => onPortal(portal === "inside" ? "orbit" : "inside")}>
        {portal === "inside" ? "Back to orbit" : "Step inside"}
      </Button>
      {onFresh ? (
        <button type="button" className="core-chip" onClick={onFresh}>
          Fresh type
        </button>
      ) : null}
    </div>
  );
}
