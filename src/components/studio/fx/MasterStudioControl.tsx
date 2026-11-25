"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AssetPool,
  MasterAdminSelect,
  PacificStamp,
  StudioActionStack,
  StudioDeckFrame,
  StudioNavRail,
  StudioParameterPanel,
  StudioSplitMonitor,
  TenantOversight,
  type StudioNavId,
} from "./StudioChrome";
import {
  type StudioAssetSlot,
  type StudioFxState,
  type StudioGlobalLibrary,
  type StudioTradeCategory,
  useStudioFx,
  useStudioGlobal,
  useStudioSaveQueue,
} from "@/lib/axiom/studio-fx";

const TRADES: StudioTradeCategory[] = [
  "mechanics",
  "barbers",
  "detailers",
  "tattoo",
  "plumbers",
  "muscle",
  "towing",
];

export function MasterStudioControl() {
  const [nav, setNav] = useState<StudioNavId>("control");
  const [slug, setSlug] = useState("default");
  const { state, setState, save, saving, error } = useStudioFx(slug);
  const global = useStudioGlobal();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { queueSave, cancelQueued } = useStudioSaveQueue(async (next) => {
    try {
      await save(next);
      setStatus("Live frame updated.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  });

  function patch(recipe: (current: StudioFxState) => StudioFxState) {
    const next = recipe(state);
    setState(next);
    queueSave(next);
  }

  async function run(kind: "still" | "video") {
    cancelQueued();
    setBusy(kind);
    setStatus(kind === "still" ? "Generating branded asset…" : "Rendering autopilot loop…");
    const tenant = global.library.tenants.find((row) => row.slug === state.slug);
    try {
      const res = await fetch(kind === "still" ? "/api/studio/still" : "/api/studio/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug: state.slug,
          niche: tenant?.niche || "contractor",
          shopName: tenant?.name || "Axiom",
          prompt: kind === "still" ? global.library.promptTuning.stillPrompt : global.library.promptTuning.videoPrompt,
        }),
      });
      const json = (await res.json()) as { imageUrl?: string; url?: string; videoUrl?: string; error?: string };
      const image = json.imageUrl || json.url;
      const video = json.videoUrl;
      const next: StudioFxState = {
        ...state,
        promptTuning: global.library.promptTuning,
        brandedUrl: kind === "still" && image ? image : state.brandedUrl,
        autopilotVideoUrl: kind === "video" && video ? video : state.autopilotVideoUrl,
        activeStage: kind === "still" ? "branded" : "autopilot",
        scrubMatrix:
          kind === "still" && image
            ? [state.rawUrl, image, image, state.scrubMatrix[3] || image, state.scrubMatrix[4] || image, image]
            : state.scrubMatrix,
      };
      await save(next, kind === "still" ? "Branded still" : "Autopilot loop");
      if (!res.ok && !image && !video) {
        setStatus(json.error ? `${json.error} The FX grade is live on the public frame.` : "FX grade published.");
      } else {
        setStatus(kind === "still" ? "Branded still saved to app_settings." : "Autopilot loop published.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBusy(null);
    }
  }

  function usePlate(asset: StudioAssetSlot) {
    cancelQueued();
    const next: StudioFxState = {
      ...state,
      rawUrl: asset.thumbUrl,
      activeStage: "raw",
      scrubMatrix: [asset.thumbUrl, ...state.scrubMatrix.slice(1)],
    };
    setState(next);
    void save(next, "Raw plate")
      .then(() => setStatus(`${asset.label} is the raw plate.`))
      .catch((err: unknown) => setStatus(err instanceof Error ? err.message : "Save failed"));
  }

  const options = [
    { slug: "default", name: "Master Admin" },
    ...global.library.tenants.filter((row) => row.slug !== "default").map((row) => ({ slug: row.slug, name: row.name })),
  ];

  return (
    <StudioDeckFrame>
      <div className="ax-grid">
        <StudioNavRail active={nav} onChange={setNav} />
        <StudioActionStack
          onGenerate={() => void run("still")}
          onRender={() => void run("video")}
          busy={busy}
          jobs={global.library.queueJobs}
        />
        <main className="ax-stage">
          <div className="ax-stage__head">
            <div>
              <p className="ax-kicker">New Era Apps · Gear Guardian</p>
              <h1>Hero Studio</h1>
            </div>
            <p>{saving || global.saving ? "Saving…" : status || error || global.error || "Realtime → app_settings"}</p>
          </div>

          {nav === "control" ? (
            <>
              <StudioSplitMonitor
                beforeUrl={state.rawUrl}
                afterUrl={state.brandedUrl}
                toggles={state.toggles}
                levels={state.levels}
                tag={state.slug}
              />
              <StudioParameterPanel toggles={state.toggles} levels={state.levels} onPatch={patch} />
            </>
          ) : null}

          {nav === "library" ? (
            <LibraryEditor
              library={global.library}
              onChange={global.setLibrary}
              saving={global.saving}
              onSave={() =>
                void global
                  .save(global.library)
                  .then(() => setStatus("Global asset library saved."))
                  .catch((err: unknown) => setStatus(err instanceof Error ? err.message : "Save failed"))
              }
            />
          ) : null}

          {nav === "tenants" ? <TenantOversight tenants={global.library.tenants} /> : null}

          {nav === "prompts" ? (
            <PromptEditor
              library={global.library}
              onChange={global.setLibrary}
              saving={global.saving}
              onSave={() =>
                void global
                  .save(global.library)
                  .then(() => setStatus("AI tuning saved. The next render uses these prompts."))
                  .catch((err: unknown) => setStatus(err instanceof Error ? err.message : "Save failed"))
              }
            />
          ) : null}

          {nav === "settings" ? (
            <section className="ax-glass ax-params">
              <p className="ax-kicker">Deck settings</p>
              <p className="ax-note">Tenant frames live at axiom_studio_fx:&lt;slug&gt;. The asset pool lives at axiom_studio_global.</p>
              <p className="ax-note">Uploads land in the app-uploads bucket. Public pages subscribe over Supabase Realtime.</p>
              <p className="ax-note">
                Active frame <strong>{state.slug}</strong> · updated {new Date(state.updatedAt).toLocaleString()}
              </p>
              <div className="ax-row-actions" style={{ marginTop: 12 }}>
                <Link className="ax-ghost" href={state.slug === "default" ? "/axiom" : `/${state.slug}`}>
                  Open public frame
                </Link>
                <Link className="ax-ghost ax-ghost--quiet" href="/admin">
                  Master dashboard
                </Link>
              </div>
            </section>
          ) : null}
        </main>
        <aside className="ax-side">
          <MasterAdminSelect value={slug} options={options} onChange={setSlug} />
          <AssetPool assets={global.library.assets} onPick={usePlate} />
          <TenantOversight tenants={global.library.tenants} />
          <PacificStamp />
        </aside>
      </div>
    </StudioDeckFrame>
  );
}

function LibraryEditor({
  library,
  onChange,
  saving,
  onSave,
}: {
  library: StudioGlobalLibrary;
  onChange: (next: StudioGlobalLibrary) => void;
  saving: boolean;
  onSave: () => void;
}) {
  function update(id: string, patch: Partial<StudioAssetSlot>) {
    onChange({
      ...library,
      assets: library.assets.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)),
    });
  }

  return (
    <section>
      <div className="ax-library">
        {library.assets.map((asset) => (
          <article key={asset.id} className="ax-glass">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.thumbUrl} alt="" />
            <input className="ax-field" value={asset.label} aria-label="Plate name" onChange={(e) => update(asset.id, { label: e.target.value })} />
            <select
              className="ax-field"
              value={asset.trade}
              aria-label="Trade"
              onChange={(e) => update(asset.id, { trade: e.target.value as StudioTradeCategory })}
            >
              {TRADES.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
            <input className="ax-field" value={asset.thumbUrl} aria-label="Image URL" onChange={(e) => update(asset.id, { thumbUrl: e.target.value })} />
            <button
              type="button"
              className="ax-ghost ax-ghost--quiet"
              onClick={() => onChange({ ...library, assets: library.assets.filter((item) => item.id !== asset.id) })}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
      <div className="ax-row-actions" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="ax-ghost ax-ghost--quiet"
          onClick={() =>
            onChange({
              ...library,
              assets: [
                ...library.assets,
                { id: `plate-${Date.now()}`, label: "New plate", trade: "mechanics", thumbUrl: library.assets[0]?.thumbUrl || "/textures/car-driving-night.png" },
              ],
            })
          }
        >
          Add plate
        </button>
        <button type="button" className="ax-ghost" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "Save library"}
        </button>
      </div>
    </section>
  );
}

function PromptEditor({
  library,
  onChange,
  saving,
  onSave,
}: {
  library: StudioGlobalLibrary;
  onChange: (next: StudioGlobalLibrary) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const fields = [
    ["stillPrompt", "Still / branded asset"],
    ["videoPrompt", "Autopilot video"],
    ["negativePrompt", "Negative"],
  ] as const;

  return (
    <section className="ax-glass ax-params" style={{ display: "grid", gap: 12 }}>
      <p className="ax-kicker">Global prompt and AI tuning</p>
      {fields.map(([key, label]) => (
        <label key={key}>
          <span className="ax-dim">{label}</span>
          <textarea
            className="ax-area"
            style={{ marginTop: 6 }}
            rows={key === "negativePrompt" ? 2 : 3}
            value={library.promptTuning[key]}
            onChange={(e) =>
              onChange({ ...library, promptTuning: { ...library.promptTuning, [key]: e.target.value } })
            }
          />
        </label>
      ))}
      <CopperStrength
        value={library.promptTuning.strength}
        onChange={(strength) => onChange({ ...library, promptTuning: { ...library.promptTuning, strength } })}
      />
      <button type="button" className="ax-ghost" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save AI tuning"}
      </button>
    </section>
  );
}

function CopperStrength({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className="ax-slider">
      <span className="ax-slider__label">Strength {Math.round(value * 100)}%</span>
      <input type="range" min={0.2} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default MasterStudioControl;
