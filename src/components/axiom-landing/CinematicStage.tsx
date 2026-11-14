import type { ReactNode } from "react";

export function CinematicBuffer() {
  return <div className="am-stack-buffer" aria-hidden="true" />;
}

export function CinematicStage({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`am-stage ${className}`.trim()}>
      {children}
    </section>
  );
}
