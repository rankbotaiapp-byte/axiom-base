"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AxiomMark,
  PacificStamp,
  StudioActionStack,
  StudioDeckFrame,
  StudioParameterPanel,
  StudioSplitMonitor,
} from "./StudioChrome";
import { StudioPipelineSlider } from "./StudioPipelineSlider";
import {
  useStudioFx,
  useStudioGlobal,
  useStudioSaveQueue,
  type StudioFxState,
} from "@/lib/axiom/studio-fx";

type Props = {
  shopSlug: string;
  shopName?: string;
  niche?: string;
  readonly?: boolean;
  initial?: StudioFxState;
};

export function TenantStudioDesk({
  shopSlug,
  shopName = shopSlug,
  niche = "contractor",
  readonly = false,
  initial,
}: Props) {
  const { state, setState, save, saving, error } = useStudioFx(shopSlug, initial);
  const global = useStudioGlobal();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [hot, setHot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prompts = global.library.promptTuning;

  const { queueSave, cancelQueued } = useStudioSaveQueue(async (next) => {
    try {
      await save(next);
      setStatus("Live frame updated.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  });

  const patch = useCallback(
    (recipe: (current: StudioFxState) => StudioFxState) => {
      if (readonly) return;
      const next = recipe(state);
      setState(next);
      queueSave(next);
    },
    [queueSave, readonly, setState, state],
  );

  async function onUpload(file: File) {
    if (readonly) return;
    cancelQueued();
    setBusy("upload");
    setStatus("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("slug", shopSlug);
      const res = await fetch("/api/studio/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed");
      const next: StudioFxState = {
        ...state,
        rawUrl: json.url,
        activeStage: "raw",
        scrubMatrix: [json.url, ...state.scrubMatrix.slice(1)],
      };
      setState(next);
      await save(next, "Raw ingest");
      setStep(2);
      setStatus("Raw photo is in app-uploads.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function run(kind: "still" | "video") {
    if (readonly) return;
    cancelQueued();
    setBusy(kind);
    setStatus(kind === "still" ? "Generating branded asset…" : "Rendering autopilot loop…");
    try {
      const res = await fetch(kind === "still" ? "/api/studio/still" : "/api/studio/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          niche,
          shopName,
          prompt: kind === "still" ? prompts.stillPrompt : prompts.videoPrompt,
        }),
      });
      const json = (await res.json()) as { imageUrl?: string; url?: string; videoUrl?: string; error?: string };
      const image = json.imageUrl || json.url;
      const video = json.videoUrl;
      const next: StudioFxState = {
        ...state,
        promptTuning: prompts,
        brandedUrl: kind === "still" && image ? image : state.brandedUrl || state.rawUrl,
        autopilotVideoUrl: kind === "video" && video ? video : state.autopilotVideoUrl,
        activeStage: kind === "still" ? "branded" : "autopilot",
        scrubMatrix:
          kind === "still"
            ? [state.rawUrl, image || state.brandedUrl, image || state.brandedUrl, image || state.brandedUrl, image || state.brandedUrl, image || state.brandedUrl]
            : state.scrubMatrix,
      };
      setState(next);
      await save(next, kind === "still" ? "Branded still" : "Autopilot loop");
      setStep(3);
      if (!res.ok && !image && !video) {
        setStatus(json.error ? `${json.error} FX grade is on the public frame.` : "FX grade published.");
      } else {
        setStatus(kind === "still" ? "Branded still saved to app_settings." : "Autopilot loop published.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBusy(null);
    }
  }

  const fxLabels: Record<keyof StudioFxState["toggles"], string> = {
    axiomBadge: "Axiom badge",
    neonGlow: "Neon glow",
    copperWrap: "Copper wrap",
    hudFrame: "HUD frame",
    cinematicSmoke: "Cinematic smoke",
    wetMud: "Mud / rain",
    snowEmber: "Snow / ember",
  };
  const activeFx = (Object.keys(state.toggles) as (keyof StudioFxState["toggles"])[]).filter((key) => state.toggles[key]);

  return (
    <StudioDeckFrame>
      <div className="ax-grid">
        <nav className="ax-rail" aria-label="Studio steps">
          <AxiomMark />
          {([1, 2, 3] as const).map((n) => (
            <button key={n} type="button" className="ax-step" data-on={step === n} onClick={() => setStep(n)}>
              0{n} {n === 1 ? "Raw" : n === 2 ? "FX" : "Render"}
            </button>
          ))}
          <Link href={`/${shopSlug}`} className="ax-link">
            Public
          </Link>
        </nav>

        <StudioActionStack
          onGenerate={() => void run("still")}
          onRender={() => void run("video")}
          busy={busy}
          disabled={readonly}
          jobs={global.library.queueJobs.filter((job) => job.slug === shopSlug).slice(0, 4)}
        />

        <main className="ax-stage">
          <div className="ax-stage__head">
            <div>
              <p className="ax-kicker">{shopName}</p>
              <h1>Hero Studio</h1>
            </div>
            <p>{saving ? "Saving…" : status || error || `/${shopSlug}`}</p>
          </div>

          <StudioSplitMonitor
            beforeUrl={state.rawUrl}
            afterUrl={state.brandedUrl}
            toggles={state.toggles}
            levels={state.levels}
            tag={shopSlug}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 ? (
                <div
                  className="ax-drop"
                  data-hot={hot}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHot(true);
                  }}
                  onDragLeave={() => setHot(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHot(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void onUpload(file);
                  }}
                >
                  <p className="ax-kicker">Step 1 · Raw ingest</p>
                  <p>Drop a phone photo — truck, bay, chair, snapshot — or pick a file. It uploads to app-uploads.</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUpload(file);
                    }}
                  />
                  <button type="button" className="ax-file" disabled={readonly || busy === "upload"} onClick={() => inputRef.current?.click()}>
                    {busy === "upload" ? "Uploading…" : "Select file"}
                  </button>
                </div>
              ) : null}

              {step === 2 ? (
                <StudioParameterPanel toggles={state.toggles} levels={state.levels} disabled={readonly} onPatch={patch} />
              ) : null}

              {step === 3 ? (
                <div style={{ marginTop: 12 }}>
                  <StudioPipelineSlider
                    stage={state.activeStage}
                    onChange={(activeStage) => patch((current) => ({ ...current, activeStage }))}
                    rawUrl={state.rawUrl}
                    brandedUrl={state.brandedUrl}
                    videoUrl={state.autopilotVideoUrl}
                    toggles={state.toggles}
                    levels={state.levels}
                  />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {readonly ? <p className="ax-note">Showcase preview is read-only.</p> : null}
          {status || error ? (
            <p className="ax-note" data-bad={Boolean(error)}>
              {error || status}
            </p>
          ) : null}
        </main>

        <aside className="ax-side">
          <section className="ax-glass ax-queue">
            <h2>FX stack</h2>
            <ul>
              {activeFx.length === 0 ? <li className="ax-dim">All effects off</li> : null}
              {activeFx.map((key) => (
                <li key={key} className="ax-dim">
                  ● {fxLabels[key]}
                </li>
              ))}
            </ul>
          </section>
          <section className="ax-glass ax-queue">
            <h2>Publish target</h2>
            <p>
              Slider after-state writes to <span style={{ color: "#00ffcc" }}>app_settings</span> for /{shopSlug}.
            </p>
            <Link href={`/${shopSlug}`} className="ax-link">
              Open the public frame
            </Link>
          </section>
          <PacificStamp />
        </aside>
      </div>
    </StudioDeckFrame>
  );
}

export default TenantStudioDesk;
