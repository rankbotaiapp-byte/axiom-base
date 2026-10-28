import { CRAFT_LOOP_SECONDS, type CraftKind } from "@/lib/axiom/studio-craft";

function Scene({ kind }: { kind: CraftKind }) {
  if (kind === "saw") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <rect x="28" y="118" width="264" height="34" rx="4" className="craft-wood" />
        <rect x="48" y="132" width="190" height="3" className="craft-run craft-saw-kerf" />
        <g className="craft-run craft-saw-blade">
          <path d="M0 8 H78 L90 20 H78 L66 32 H0 Z" />
          <path d="M8 8 V32 M20 8 V32 M32 8 V32 M44 8 V32 M56 8 V32" className="craft-teeth" />
        </g>
        <circle cx="70" cy="108" r="3" className="craft-run craft-dust" />
        <circle cx="150" cy="100" r="2.5" className="craft-run craft-dust is-late" />
        <circle cx="210" cy="112" r="2" className="craft-run craft-dust is-later" />
      </svg>
    );
  }
  if (kind === "wash") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <rect x="24" y="36" width="272" height="108" rx="8" className="craft-wall" />
        <rect x="24" y="36" width="272" height="108" rx="8" className="craft-run craft-grime" />
        <g className="craft-run craft-fan">
          <path d="M54 96 H250" />
          <path d="M54 96 L230 62" />
          <path d="M54 96 L230 130" />
          <path d="M54 96 L200 48" />
          <path d="M54 96 L200 144" />
        </g>
        <circle cx="42" cy="96" r="10" className="craft-nozzle" />
      </svg>
    );
  }
  if (kind === "blade") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <rect x="20" y="108" width="280" height="40" className="craft-grass" />
        <g className="craft-run craft-mower">
          <path d="M160 96 L248 78 L160 96 L72 114" />
          <circle cx="160" cy="96" r="8" />
        </g>
      </svg>
    );
  }
  if (kind === "shear") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <path d="M150 36 C150 36 168 90 150 150" className="craft-hair" />
        <g className="craft-run craft-shear-a">
          <path d="M70 70 H190" />
        </g>
        <g className="craft-run craft-shear-b">
          <path d="M70 110 H190" />
        </g>
      </svg>
    );
  }
  if (kind === "needle") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <path d="M70 120 H250" className="craft-run craft-ink-line" />
        <g className="craft-run craft-needle">
          <rect x="0" y="0" width="54" height="28" rx="6" />
          <path d="M54 14 H92" />
        </g>
      </svg>
    );
  }
  if (kind === "shutter") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <circle cx="160" cy="90" r="54" className="craft-lens" />
        <g className="craft-run craft-spin">
          <path d="M160 90 L160 42 A48 48 0 0 1 206 66 Z" />
          <path d="M160 90 L206 114 A48 48 0 0 1 160 138 Z" />
          <path d="M160 90 L114 114 A48 48 0 0 1 114 66 Z" />
        </g>
        <circle cx="160" cy="90" r="10" className="craft-run craft-flash" />
      </svg>
    );
  }
  if (kind === "leash") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <g className="craft-run craft-leash">
          <path d="M70 40 Q160 20 230 100" />
          <circle cx="230" cy="108" r="16" />
        </g>
        <ellipse cx="120" cy="140" rx="18" ry="10" className="craft-run craft-paw" />
      </svg>
    );
  }
  if (kind === "string") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <path d="M40 90 H280" className="craft-run craft-string" />
        <path d="M150 70 L168 96 L150 110 Z" className="craft-run craft-pick" />
      </svg>
    );
  }
  if (kind === "flame") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <rect x="40" y="112" width="240" height="16" rx="3" className="craft-griddle" />
        <path d="M90 112 C90 112 78 70 100 48 C108 78 120 78 110 112 Z" className="craft-run craft-flame" />
        <path d="M150 112 C150 112 136 60 164 40 C172 74 188 74 170 112 Z" className="craft-run craft-flame is-late" />
        <path d="M214 112 C214 112 204 76 222 58 C230 82 242 82 230 112 Z" className="craft-run craft-flame is-later" />
      </svg>
    );
  }
  if (kind === "key") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <circle cx="168" cy="90" r="28" className="craft-lock" />
        <g className="craft-run craft-key">
          <circle cx="0" cy="0" r="12" />
          <path d="M12 0 H70 L70 12 H54 L54 0 L42 0 L42 10 H30 L30 0" />
        </g>
      </svg>
    );
  }
  if (kind === "bow") {
    return (
      <svg viewBox="0 0 320 180" className="craft-svg">
        <path d="M210 30 Q120 90 210 150" className="craft-bow" />
        <path d="M210 36 V144" className="craft-run craft-bow-string" />
        <path d="M250 90 H300" className="craft-run craft-arrow" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 180" className="craft-svg">
      <circle cx="160" cy="90" r="18" className="craft-run craft-pulse" />
      <circle cx="160" cy="90" r="36" className="craft-run craft-pulse is-late" />
      <circle cx="160" cy="90" r="54" className="craft-run craft-pulse is-later" />
    </svg>
  );
}

/** The looping proof of work drawn inside a service button. */
export function CraftLoop({ kind }: { kind: CraftKind }) {
  return (
    <div
      className="craft-loop"
      data-kind={kind}
      data-loop={`${CRAFT_LOOP_SECONDS}s`}
      style={{ ["--craft-seconds" as string]: `${CRAFT_LOOP_SECONDS}s` }}
      aria-hidden
    >
      <Scene kind={kind} />
    </div>
  );
}
