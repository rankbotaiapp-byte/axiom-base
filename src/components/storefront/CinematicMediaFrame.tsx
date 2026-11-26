import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./cinematic-media-frame.css";

type CinematicMediaFrameProps = {
  children: ReactNode;
  cinemaGrade?: boolean;
  className?: string;
};

export function CinematicMediaFrame({
  children,
  cinemaGrade = true,
  className,
}: CinematicMediaFrameProps) {
  return (
    <div className={cn("cmf-frame", className)}>
      <div className={cinemaGrade ? "cmf-media cmf-media--grade" : "cmf-media"}>{children}</div>
      {cinemaGrade ? (
        <div className="cmf-overlays" aria-hidden>
          <span className="cmf-vignette" />
          <span className="cmf-rim" />
          <span className="cmf-corner cmf-corner-tl" />
          <span className="cmf-corner cmf-corner-tr" />
          <span className="cmf-corner cmf-corner-bl" />
          <span className="cmf-corner cmf-corner-br" />
          <span className="cmf-grain" />
          <span className="cmf-specular" />
        </div>
      ) : null}
    </div>
  );
}
