"use client";

import type { StudioFxLevels, StudioFxToggles, StudioPipelineStage } from "@/lib/axiom/studio-fx";
import { StudioFxOverlay } from "./StudioFxOverlay";

const STAGES: { id: StudioPipelineStage; label: string; detail: string }[] = [
  { id: "raw", label: "01 Raw", detail: "Ingest" },
  { id: "branded", label: "02 Branded", detail: "Studio FX" },
  { id: "autopilot", label: "03 Autopilot", detail: "Video loop" },
];

type Props = {
  stage: StudioPipelineStage;
  onChange: (stage: StudioPipelineStage) => void;
  rawUrl: string;
  brandedUrl: string;
  videoUrl: string;
  toggles?: StudioFxToggles;
  levels?: StudioFxLevels;
};

export function StudioPipelineSlider({
  stage,
  onChange,
  rawUrl,
  brandedUrl,
  videoUrl,
  toggles,
  levels,
}: Props) {
  const index = stage === "raw" ? 0 : stage === "branded" ? 1 : 2;
  const setIndex = (next: number) => onChange(next <= 0 ? "raw" : next === 1 ? "branded" : "autopilot");

  return (
    <div className="ax-pipeline">
      <div className="ax-pipeline__nodes">
        {STAGES.map((item) => (
          <button key={item.id} type="button" data-on={item.id === stage} onClick={() => onChange(item.id)}>
            <strong>{item.label}</strong>
            <em>{item.detail}</em>
          </button>
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={index}
        aria-label="Pipeline stage"
        onChange={(e) => setIndex(Number(e.target.value))}
      />
      <div className="ax-pipeline__stage">
        {stage === "autopilot" ? (
          <video key={videoUrl} src={videoUrl} poster={brandedUrl || rawUrl} autoPlay muted loop playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stage === "raw" ? rawUrl : brandedUrl || rawUrl} alt={stage} />
        )}
        {stage === "branded" && toggles && levels ? <StudioFxOverlay toggles={toggles} levels={levels} /> : null}
        <span className="ax-cap">Pipeline · {stage}</span>
      </div>
    </div>
  );
}
