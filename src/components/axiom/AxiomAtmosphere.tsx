import "./axiom.css";

/** Edge-to-edge cyan and gold wash. Fades into obsidian. No frame. */
export function AxiomTopGlow() {
  return (
    <div aria-hidden className="ax-aurora pointer-events-none w-full">
      <span className="ax-aurora-cyan" />
      <span className="ax-aurora-amber" />
      <span className="ax-aurora-magenta" />
    </div>
  );
}

/** Speck field for the full page. Sits behind copy and ignores the pointer. */
export function AxiomPageSpecks() {
  return <div aria-hidden className="ax-specks pointer-events-none" />;
}
