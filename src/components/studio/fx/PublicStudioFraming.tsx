"use client";

import Link from "next/link";
import { StudioHoverScrubMatrix } from "./StudioHoverScrubMatrix";
import { StudioPipelineSlider } from "./StudioPipelineSlider";
import { StudioSplitMonitor } from "./StudioChrome";
import { useStudioFx, type StudioFxState } from "@/lib/axiom/studio-fx";
import "./studio-deck.css";

type Props = {
  slug: string;
  initial?: StudioFxState;
  studioHref?: string;
  className?: string;
  /** hero = full first screen. embed = drop into an existing hero column. */
  variant?: "hero" | "embed";
};

/**
 * Public studio framing. Images and video follow Supabase Realtime on `app_settings`.
 */
export function PublicStudioFraming({
  slug,
  initial,
  studioHref,
  className = "",
  variant = "hero",
}: Props) {
  const { state, setState } = useStudioFx(slug, initial);
  const href = studioHref || `/${slug}/admin/studio`;
  const monitor = (
    <StudioSplitMonitor
      beforeUrl={state.rawUrl}
      afterUrl={state.brandedUrl}
      toggles={state.toggles}
      levels={state.levels}
    />
  );
  const tools = (
    <div className="ax-public__pair">
      <div>
        <p className="ax-kicker" style={{ marginBottom: 8 }}>
          6-stage hover-scrub
        </p>
        <StudioHoverScrubMatrix frames={state.scrubMatrix} toggles={state.toggles} levels={state.levels} />
      </div>
      <div>
        <p className="ax-kicker" style={{ marginBottom: 8 }}>
          3-stage pipeline
        </p>
        <StudioPipelineSlider
          stage={state.activeStage}
          onChange={(activeStage) => setState((current) => ({ ...current, activeStage }))}
          rawUrl={state.rawUrl}
          brandedUrl={state.brandedUrl}
          videoUrl={state.autopilotVideoUrl}
          toggles={state.toggles}
          levels={state.levels}
        />
      </div>
    </div>
  );

  if (variant === "embed") {
    return (
      <div className={`ax-public ax-public--embed ${className}`} data-axiom-studio-framing="">
        {monitor}
        {tools}
        <Link href={href} className="ax-open">
          Studio
        </Link>
      </div>
    );
  }

  return (
    <section className={`ax-public ax-public--hero ${className}`} data-axiom-studio-framing="">
      <div className="ax-public__layout">
        <div className="ax-public__hero">
          <div className="ax-public__copy">
            <p className="ax-kicker">Axiom Studio · Live framing</p>
            <h2>Raw snapshot. Branded still. Autopilot loop.</h2>
            <p>
              Hover the six stages. Drag the pipeline from raw to branded to video. Publishes from the studio
              land here through app_settings — no redeploy.
            </p>
        <Link href={href} className="ax-open">
          Studio
        </Link>
          </div>
          {monitor}
        </div>
        {tools}
      </div>
    </section>
  );
}

export default PublicStudioFraming;
